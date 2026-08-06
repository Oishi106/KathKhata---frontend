"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User, Plus, MessageSquare, Sparkles, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function AiAssistantPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("ai");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const shouldListenRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang === "bn" ? "bn-BD" : "en-US";

    recognition.onresult = (event: any) => {
      // Append only the newly finalized results from this event
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText.trim()) {
        setInput((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" fires often during pauses — ignore and keep listening
      if (event.error !== "no-speech") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    // If the browser auto-stops (some do after a timeout) but the user
    // hasn't manually turned it off, restart automatically.
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.abort();
    };
  }, [lang]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(
        lang === "bn"
          ? "আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। Chrome ব্যবহার করুন।"
          : "Your browser doesn't support voice input. Please use Chrome."
      );
      return;
    }
    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const { data: suggested } = useQuery({
    queryKey: ["ai-suggested-questions", lang],
    queryFn: async () =>
      (await api.get<{ data: string[] }>("/ai/suggested-questions", { params: { lang } })).data.data
  });

  const { data: insights } = useQuery({
    queryKey: ["ai-quick-insights"],
    queryFn: async () => (await api.get<{ data: string[] }>("/ai/quick-insights")).data.data
  });

  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () =>
      (await api.get<{ data: ConversationSummary[] }>("/ai/conversations")).data.data
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/conversations/${id}`);
      setConversationId(id);
      setMessages(data.data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      setShowHistory(false);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setShowHistory(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/ask", { conversationId, message: text });
      setConversationId(data.data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.data.reply }]);
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            lang === "bn"
              ? "দুঃখিত, উত্তর তৈরি করা যায়নি। আবার চেষ্টা করুন।"
              : "Sorry, I couldn't process that. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Recent conversations — desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 card !p-3">
        <Button size="sm" className="w-full mb-3" onClick={startNewChat}>
          <Plus className="h-4 w-4" /> {t("newChat") ?? "New chat"}
        </Button>
        <p className="text-xs font-semibold text-wood-400 px-1 mb-2">
          {t("recentConversations") ?? "Recent Conversations"}
        </p>
        <div className="flex-1 overflow-y-auto space-y-1">
          {(conversations ?? []).map((c) => (
            <button
              key={c._id}
              onClick={() => loadConversation(c._id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 hover:bg-wood-50 dark:hover:bg-wood-700",
                conversationId === c._id && "bg-forest-50 dark:bg-forest-900/30"
              )}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-wood-400" />
              <span className="truncate text-wood-700 dark:text-cream-100">{c.title}</span>
            </button>
          ))}
          {(conversations ?? []).length === 0 && (
            <p className="text-xs text-wood-300 px-2 py-4 text-center">
              {lang === "bn" ? "এখনো কোনো কথোপকথন নেই" : "No conversations yet"}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-forest-600 p-2.5">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
              <p className="text-sm text-wood-500 dark:text-wood-300">
                {lang === "bn"
                  ? "আপনার করাতকল ব্যবসা সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন"
                  : "Ask anything about your sawmill business"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="lg:hidden rounded-xl p-2.5 bg-wood-100 dark:bg-wood-700 text-wood-600"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        {insights && insights.length > 0 && messages.length === 0 && (
          <div className="mb-4 rounded-xl bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 p-4">
            <div className="flex items-center gap-2 mb-2 text-forest-700 dark:text-forest-300 font-semibold text-sm">
              <Sparkles className="h-4 w-4" />
              {lang === "bn" ? "দ্রুত ব্যবসায়িক ইনসাইট" : "Quick Business Insights"}
            </div>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li key={i} className="text-sm text-wood-700 dark:text-cream-100">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-y-auto card mb-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Bot className="h-12 w-12 text-forest-300 mb-3" />
              <p className="text-wood-500 dark:text-wood-300 mb-6">{t("suggestedQuestions")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {(suggested ?? []).map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left rounded-xl border border-wood-200 dark:border-wood-600 px-4 py-3 text-sm hover:bg-wood-50 dark:hover:bg-wood-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                  m.role === "user" ? "bg-wood-200 text-wood-700" : "bg-forest-600 text-white"
                )}
              >
                {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-base whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-forest-600 text-white rounded-tr-sm"
                    : "bg-wood-50 dark:bg-wood-700 text-wood-900 dark:text-cream-50 rounded-tl-sm"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={cn(
              "rounded-xl p-3 transition-colors shrink-0",
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-wood-100 dark:bg-wood-700 text-wood-500 hover:bg-wood-200 dark:hover:bg-wood-600"
            )}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field flex-1"
            placeholder={isListening ? (lang === "bn" ? "শুনছি..." : "Listening...") : t("placeholder")}
          />
          <Button type="submit" loading={loading} disabled={!input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Mobile history drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-wood-800 p-4 overflow-y-auto">
            <Button size="sm" className="w-full mb-3" onClick={startNewChat}>
              <Plus className="h-4 w-4" /> {t("newChat") ?? "New chat"}
            </Button>
            {(conversations ?? []).map((c) => (
              <button
                key={c._id}
                onClick={() => loadConversation(c._id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 hover:bg-wood-50 dark:hover:bg-wood-700"
              >
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-wood-400" />
                <span className="truncate text-wood-700 dark:text-cream-100">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}