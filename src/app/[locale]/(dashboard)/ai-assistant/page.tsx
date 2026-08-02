"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bot, Send, Mic, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggested = [
  "What was my profit this month?",
  "Which wood stock is running low?",
  "How can I reduce expenses?",
  "What might next month's sales look like?"
];

export default function AiAssistantPage() {
  const t = useTranslations("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/ask", { conversationId, message: text });
      setConversationId(data.data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-xl bg-forest-600 p-2.5">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
          <p className="text-sm text-wood-500 dark:text-wood-300">Ask anything about your sawmill business</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto card mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Bot className="h-12 w-12 text-forest-300 mb-3" />
            <p className="text-wood-500 dark:text-wood-300 mb-6">{t("suggestedQuestions")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              {suggested.map((q) => (
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
        <button type="button" className="rounded-xl p-3 bg-wood-100 dark:bg-wood-700 text-wood-500 hover:bg-wood-200">
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field flex-1"
          placeholder={t("placeholder")}
        />
        <Button type="submit" loading={loading} disabled={!input.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
