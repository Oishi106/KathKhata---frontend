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
        language === "bn" ? "ভয়েস থেকে ফর্ম পূরণ হয়েছে, একবার যাচাই করুন" : "Form filled from voice, please review"
      );
      onResult(result, rawText);
    },
    onError: (message) => toast.error(message)
  });

  if (!isSupported) return null;

  return (
    <div className="flex flex-col items-start gap-2">
      {!reviewText && (
        <button
          type="button"
          onClick={isListening ? stop : start}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isListening
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse"
              : isProcessing
                ? "bg-wood-100 text-wood-500 dark:bg-wood-700 dark:text-wood-300 cursor-wait"
                : "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200 hover:bg-forest-200 dark:hover:bg-forest-700"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === "bn" ? "বিশ্লেষণ হচ্ছে..." : "Analyzing..."}
            </>
          ) : isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              {language === "bn" ? "থামান" : "Stop"}
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              {label ?? (language === "bn" ? "বলে পূরণ করুন" : "Fill by voice")}
            </>
          )}
        </button>
      )}

      {isListening && transcript && (
        <p className="text-xs text-wood-500 dark:text-wood-400 italic max-w-md">"{transcript}"</p>
      )}

      {/* কথা বলা শেষে — টেক্সট যাচাই ও সংশোধনের বক্স */}
      {reviewText !== null && (
        <div className="w-full max-w-md rounded-xl border border-wood-200 dark:border-wood-700 bg-white dark:bg-wood-800 p-3 space-y-2">
          <p className="text-xs text-wood-500 dark:text-wood-400">
            {language === "bn"
              ? "যা শোনা গেছে — ভুল থাকলে ঠিক করে নিন:"
              : "Here's what was heard — edit if needed:"}
          </p>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={2}
            className="input-field text-sm w-full resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => confirmAndAnalyze(reviewText)}
              disabled={isProcessing}
              className="flex items-center gap-1 rounded-lg bg-forest-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-forest-700 disabled:opacity-60"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {language === "bn" ? "বিশ্লেষণ করুন" : "Analyze"}
            </button>
            <button
              type="button"
              onClick={discardReview}
              disabled={isProcessing}
              className="flex items-center gap-1 rounded-lg bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-wood-300 px-3 py-1.5 text-xs font-medium hover:bg-wood-200 dark:hover:bg-wood-600"
            >
              <X className="h-3.5 w-3.5" />
              {language === "bn" ? "বাতিল" : "Discard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}