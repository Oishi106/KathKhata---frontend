"use client";

import { Mic, MicOff, Loader2, Check, X } from "lucide-react";
import { useVoiceEntry, type VoiceFieldSpec } from "@/hooks/useVoiceEntry";
import { toast } from "sonner";

interface VoiceEntryButtonProps {
  fields: VoiceFieldSpec[];
  language?: "bn" | "en";
  onResult: (result: Record<string, string | number | null>, rawText: string) => void;
  label?: string;
}

export function VoiceEntryButton({ fields, language = "bn", onResult, label }: VoiceEntryButtonProps) {
  const {
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
  } = useVoiceEntry({
    fields,
    language,
    onResult: (result, rawText) => {
      toast.success(
        language === "bn" ? "ফর্ম পূরণ হয়েছে, একবার দেখে নিন" : "Form filled from voice, please review"
      );
      onResult(result, rawText);
    },
    onError: (message) => toast.error(message)
  });

  if (!isSupported) return null;

  return (
    <div className="flex flex-col items-start gap-3 w-full sm:w-auto">
      {!reviewText && (
        <button
          type="button"
          onClick={isListening ? stop : start}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition-colors min-h-[52px] ${
            isListening
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse"
              : isProcessing
                ? "bg-wood-100 text-wood-500 dark:bg-wood-700 dark:text-wood-300 cursor-wait"
                : "bg-forest-600 text-white hover:bg-forest-700"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {language === "bn" ? "বোঝার চেষ্টা হচ্ছে..." : "Analyzing..."}
            </>
          ) : isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              {language === "bn" ? "থামান" : "Stop"}
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              {label ?? (language === "bn" ? "মুখে বলে দিন" : "Fill by voice")}
            </>
          )}
        </button>
      )}

      {isListening && (
        <div className="w-full sm:w-96 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {language === "bn" ? "শোনা হচ্ছে... এখন বলুন" : "Listening... speak now"}
            </p>
          </div>
          {transcript && (
            <p className="text-lg text-wood-800 dark:text-cream-100 leading-relaxed">{transcript}</p>
          )}
        </div>
      )}

      {/* কথা বলা শেষে — টেক্সট যাচাই ও সংশোধনের বক্স */}
      {reviewText !== null && (
        <div className="w-full sm:w-96 rounded-2xl border-2 border-forest-200 dark:border-forest-700 bg-forest-50 dark:bg-wood-800 p-4 space-y-3">
          <p className="text-base font-semibold text-wood-800 dark:text-cream-100">
            {language === "bn" ? "🎤 আপনি যা বলেছেন:" : "🎤 What you said:"}
          </p>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            className="w-full rounded-xl border-2 border-wood-200 dark:border-wood-600 bg-white dark:bg-wood-900 px-4 py-3 text-lg leading-relaxed text-wood-900 dark:text-cream-50 focus:border-forest-500 focus:outline-none resize-none"
          />
          <p className="text-sm text-wood-500 dark:text-wood-400">
            {language === "bn" ? "ভুল থাকলে এখানে ঠিক করে নিন" : "Edit if anything is wrong"}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => confirmAndAnalyze(reviewText)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-forest-600 text-white px-4 py-3 text-base font-semibold hover:bg-forest-700 disabled:opacity-60 min-h-[52px]"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {language === "bn" ? "ঠিক আছে, ফর্মে বসান" : "Confirm & Fill"}
            </button>
            <button
              type="button"
              onClick={discardReview}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-wood-700 border-2 border-wood-200 dark:border-wood-600 text-wood-600 dark:text-wood-300 px-4 py-3 text-base font-semibold hover:bg-wood-50 dark:hover:bg-wood-600 min-h-[52px]"
            >
              <X className="h-5 w-5" />
              {language === "bn" ? "বাদ দিন" : "Discard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}