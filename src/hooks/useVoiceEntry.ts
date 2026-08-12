"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type VoiceFieldType = "string" | "number" | "date";

export interface VoiceFieldSpec {
  name: string;
  type: VoiceFieldType;
  description: string;
  keywords?: string[]; // শুধু number ফিল্ডের জন্য — regex দিয়ে স্থানীয়ভাবে বের করতে ব্যবহার হয়
}

type ParsedResult = Record<string, string | number | null>;

interface UseVoiceEntryOptions {
  fields: VoiceFieldSpec[];
  language?: "bn" | "en";
  onResult: (result: ParsedResult, rawText: string) => void;
  onError?: (message: string) => void;
}

interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [key: number]: { [key: number]: SpeechRecognitionResultLike }; length: number };
}

export function useVoiceEntry({ fields, language = "bn", onResult, onError }: UseVoiceEntryOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState(""); // শোনার সময় লাইভ দেখানোর জন্য
  const [reviewText, setReviewText] = useState<string | null>(null); // থামার পর সংশোধনের জন্য (null = review mode বন্ধ)
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    setIsSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  const processTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);
      try {
        const res = await api.post<{ data: ParsedResult }>("/ai/voice-parse", {
          text,
          language,
          fields
        });
        onResult(res.data.data, text);
        setReviewText(null); // সফল হলে review বক্স বন্ধ
      } catch (err: any) {
        onError?.(err?.response?.data?.message ?? "ভয়েস বিশ্লেষণ ব্যর্থ হয়েছে");
      } finally {
        setIsProcessing(false);
      }
    },
    [fields, language, onResult, onError]
  );

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না, Chrome ব্যবহার করুন");
      return;
    }

    manualStopRef.current = false;
    setReviewText(null);

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    recognition.lang = language === "bn" ? "bn-BD" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = true; // ছোট বিরতিতে থামবে না, ব্যবহারকারী নিজে থামানো পর্যন্ত চলবে
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      // "no-speech" প্রায়ই স্বাভাবিক বিরতির সময় আসে, সেটাকে fatal error হিসেবে না দেখিয়ে
      // continuous mode-এ ব্রাউজার নিজে থেকেই আবার চেষ্টা করে; শুধু আসল error দেখাই
      if (event?.error && event.error !== "no-speech") {
        setIsListening(false);
        onError?.("মাইক্রোফোন শোনায় সমস্যা হয়েছে, আবার চেষ্টা করুন");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript((finalText) => {
        if (finalText.trim()) {
          setReviewText(finalText); // সরাসরি backend-এ না পাঠিয়ে review-এর জন্য দেখাও
        }
        return finalText;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, onError]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const confirmAndAnalyze = useCallback(
    (editedText: string) => {
      processTranscript(editedText);
    },
    [processTranscript]
  );

  const discardReview = useCallback(() => {
    setReviewText(null);
    setTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    reviewText,
    setReviewText,
    start,
    stop,
    confirmAndAnalyze,
    discardReview
  };
}