"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ruler,
  Circle,
  Square,
  Plus,
  Trash2,
  Download,
  Lock,
  Unlock,
  Search,
  BookOpen,
  Mic,
  MicOff,
  PenLine,
  X,
  Check,
  Sparkles
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toInches, breakdownFromInches, type LengthUnit } from "@/lib/unitConversion";
import type { Measurement, MeasurementItem } from "@/types";

type Mode = "round_log" | "size_cut";
type InputMethod = "manual" | "voice";

interface DimensionField {
  value: string;
  unit: LengthUnit;
}

const emptyField = (): DimensionField => ({ value: "", unit: "feet" });

interface ReviewRow {
  lengthFeet: number;
  lengthInch: number;
  girthInch: number;
  quantity: number;
}
interface ReviewBlock {
  customerName: string;
  rows: ReviewRow[];
}

export default function WoodMeasurementPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("woodMeasurement");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("round_log");
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual");
  const [customerName, setCustomerName] = useState("");

  const [girth, setGirth] = useState<DimensionField>(emptyField());
  const [length, setLength] = useState<DimensionField>(emptyField());
  const [width, setWidth] = useState<DimensionField>(emptyField());
  const [thickness, setThickness] = useState<DimensionField>(emptyField());
  const [quantity, setQuantity] = useState("1");

  const [historySearch, setHistorySearch] = useState("");
  const [closingGroupId, setClosingGroupId] = useState<string | null>(null);
  const [closeRate, setCloseRate] = useState("");
  const [closePaid, setClosePaid] = useState("");
  
  const [dailyBookDate, setDailyBookDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: dailyBook } = useQuery({
    queryKey: ["measurement-daily-book", dailyBookDate],
    queryFn: async () => (await api.get("/wood-measurement/daily-book", { params: { date: dailyBookDate } })).data.data
  });

  const downloadDailyBook = async (date: string) => {
    const res = await api.get("/wood-measurement/daily-book/pdf", { params: { date }, responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-book-${date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- voice ----
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const [transcript, setTranscript] = useState("");
  const [reviewBlocks, setReviewBlocks] = useState<ReviewBlock[] | null>(null);
  const [lastResultGroupId, setLastResultGroupId] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "bn-BD";

    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText.trim()) setTranscript((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
    };
    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else setIsListening(false);
    };
    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      recognition.abort();
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error(lang === "bn" ? "আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না।" : "Voice input not supported in this browser.");
      return;
    }
    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const parseMutation = useMutation({
    mutationFn: async () => api.post("/wood-measurement/voice-parse", { transcript }),
    onSuccess: (res: any) => {
      const { blocks, warnings } = res.data.data;
      if (warnings?.length) warnings.forEach((w: string) => toast.warning(w));
      if (!blocks || blocks.length === 0) return;
      setReviewBlocks(
        blocks.map((b: any) => ({
          customerName: b.customerName,
          rows: b.rows.map((r: any) => ({
            lengthFeet: r.lengthFeet ?? 0,
            lengthInch: r.lengthInch ?? 0,
            girthInch: r.girthInch ?? 0,
            quantity: r.quantity ?? 1
          }))
        }))
      );
    },
    onError: () => toast.error(lang === "bn" ? "ভয়েস থেকে মাপ বোঝা যায়নি। আবার বলুন অথবা নিজে লিখুন।" : "Couldn't understand the voice input.")
  });

  // ---- queries ----
  const { data: openGroups } = useQuery({
    queryKey: ["measurement-open-groups"],
    queryFn: async () => (await api.get<{ data: Measurement[] }>("/wood-measurement/groups/open")).data.data
  });

  const { data: history } = useQuery({
    queryKey: ["measurement-history", historySearch],
    queryFn: async () =>
      (await api.get<{ data: Measurement[] }>("/wood-measurement/history", { params: { search: historySearch } })).data.data
  });

  const lastResultGroup = useMemo(
    () => openGroups?.find((g) => g._id === lastResultGroupId) ?? null,
    [openGroups, lastResultGroupId]
  );

  // ---- manual live preview ----
  const girthInches = toInches(Number(girth.value) || 0, girth.unit);
  const lengthInches = toInches(Number(length.value) || 0, length.unit);
  const widthInches = toInches(Number(width.value) || 0, width.unit);
  const thicknessInches = toInches(Number(thickness.value) || 0, thickness.unit);

  const preview = useMemo(() => {
    const q = Number(quantity) || 0;
    if (mode === "round_log") {
      const lengthFeet = lengthInches / 12;
      const cft = ((lengthFeet * girthInches * girthInches) / 2304) * q;
      return Math.round(cft * 100) / 100;
    }
    return Math.round(((lengthInches * widthInches * thicknessInches * q) / 1728) * 100) / 100;
  }, [mode, girthInches, lengthInches, widthInches, thicknessInches, quantity]);

  const resetInputs = () => {
    setGirth(emptyField());
    setLength(emptyField());
    setWidth(emptyField());
    setThickness(emptyField());
    setQuantity("1");
  };

  const addManualMutation = useMutation({
    mutationFn: async () => {
      if (!customerName.trim()) throw new Error("NO_CUSTOMER");
      const { data: groupRes } = await api.post("/wood-measurement/groups", { customerName: customerName.trim() });
      const groupId = groupRes.data._id;

      const payload =
        mode === "round_log"
          ? {
              mode: "round_log",
              girth: Math.round(girthInches * 100) / 100,
              girthUnit: "inch",
              length: Math.round((lengthInches / 12) * 100) / 100,
              quantity: Number(quantity)
            }
          : {
              mode: "size_cut",
              length: Math.round(lengthInches * 100) / 100,
              width: Math.round(widthInches * 100) / 100,
              thickness: Math.round(thicknessInches * 100) / 100,
              quantity: Number(quantity)
            };

      const res = await api.post(`/wood-measurement/groups/${groupId}/items`, payload);
      return { groupId, res };
    },
    onSuccess: ({ groupId }) => {
      toast.success(t("itemAdded") ?? "যোগ হয়েছে");
      setLastResultGroupId(groupId);
      queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] });
      resetInputs();
    },
    onError: (err: any) => {
      if (err?.message === "NO_CUSTOMER") toast.error(t("enterCustomerFirst") ?? "প্রথমে গ্রাহকের নাম লিখুন");
      else toast.error(err?.response?.data?.message ?? "Failed to add item");
    }
  });

const confirmReviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewBlocks) return;

      // Validate every row has a girth before sending — round log requires it.
      for (const block of reviewBlocks) {
        for (const row of block.rows) {
          if (!row.girthInch || row.girthInch <= 0) {
            throw new Error("MISSING_GIRTH");
          }
        }
      }

      let lastGroupId: string | null = null;
      for (const block of reviewBlocks) {
        if (block.rows.length === 0) continue;
        const { data: groupRes } = await api.post("/wood-measurement/groups", { customerName: block.customerName });
        const groupId = groupRes.data._id;
        for (const row of block.rows) {
          const totalLengthInches = row.lengthFeet * 12 + row.lengthInch;
          await api.post(`/wood-measurement/groups/${groupId}/items`, {
            mode: "round_log",
            girth: row.girthInch,
            girthUnit: "inch",
            length: Math.round((totalLengthInches / 12) * 100) / 100,
            quantity: row.quantity
          });
        }
        lastGroupId = groupId;
      }
      return lastGroupId;
    },
    onSuccess: (groupId) => {
      toast.success(lang === "bn" ? "খাতায় সংরক্ষিত হয়েছে" : "Saved to notebook");
      if (groupId) setLastResultGroupId(groupId);
      setReviewBlocks(null);
      setTranscript("");
      queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] });
    },
    onError: (err: any) => {
      if (err?.message === "MISSING_GIRTH") {
        toast.error(
          lang === "bn"
            ? "প্রতিটা মাপের জন্য 'পরিধি(in)' ঘরে একটা মান দিন — এটা ছাড়া হিসাব করা যাবে না।"
            : "Please enter girth for every row — it's required."
        );
      } else {
        toast.error(lang === "bn" ? "সংরক্ষণ ব্যর্থ হয়েছে" : "Failed to save");
      }
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ groupId, itemId }: { groupId: string; itemId: string }) =>
      api.delete(`/wood-measurement/groups/${groupId}/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] })
  });

  const closeMutation = useMutation({
    mutationFn: async () =>
      api.post(`/wood-measurement/groups/${closingGroupId}/close`, {
        ratePerCFT: Number(closeRate) || 0,
        paidAmount: Number(closePaid) || 0
      }),
    onSuccess: () => {
      toast.success(t("closed") ?? "হিসাব শেষ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] });
      queryClient.invalidateQueries({ queryKey: ["measurement-history"] });
      setClosingGroupId(null);
      setCloseRate("");
      setClosePaid("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to close")
  });

  const reopenMutation = useMutation({
    mutationFn: async (groupId: string) => api.post(`/wood-measurement/groups/${groupId}/reopen`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] });
      queryClient.invalidateQueries({ queryKey: ["measurement-history"] });
    }
  });

  const downloadSlip = async (id: string, slipNumber: string) => {
    const res = await api.get(`/wood-measurement/${id}/slip`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `slip-${slipNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemLabel = (item: MeasurementItem) => {
    if (item.mode === "round_log") {
      const unitLabel = item.girthUnit === "inch" ? (lang === "bn" ? "ইঞ্চি" : "in") : lang === "bn" ? "ফুট" : "ft";
      return lang === "bn"
        ? `গোল কাঠ — পরিধি ${item.girth} ${unitLabel}, দৈর্ঘ্য ${item.length} ফুট, ${item.quantity}টি`
        : `Round log — girth ${item.girth} ${unitLabel}, length ${item.length} ft, qty ${item.quantity}`;
    }
    return lang === "bn"
      ? `সাইজ কাট — ${item.length}×${item.width}×${item.thickness} ইঞ্চি, ${item.quantity}টি`
      : `Size cut — ${item.length}×${item.width}×${item.thickness} in, qty ${item.quantity}`;
  };

  // ---- result card computations for the last-updated group ----
  const resultStats = useMemo(() => {
    if (!lastResultGroup) return null;
    const totalQty = lastResultGroup.items.reduce((s, it) => s + it.quantity, 0) || 1;
    const totalLengthInches = lastResultGroup.items.reduce((s, it) => {
      const lenInches = (it.length ?? 0) * 12; // stored length is always in feet
      return s + lenInches * it.quantity;
    }, 0);
    const avgLengthInches = totalLengthInches / totalQty;
    return {
      totalCFT: lastResultGroup.totalCFT,
      avg: breakdownFromInches(avgLengthInches),
      total: breakdownFromInches(totalLengthInches)
    };
  }, [lastResultGroup]);

  const lengthLabel = (b: ReturnType<typeof breakdownFromInches>) =>
    lang === "bn" ? `${b.feet} ফুট ${b.inches} ইঞ্চি ${b.points} পয়েন্ট` : `${b.feet} ft ${b.inches} in ${b.points} pt`;

  const unitOptions: { value: LengthUnit; label: string }[] = [
    { value: "feet", label: lang === "bn" ? "ফুট" : "Feet" },
    { value: "inch", label: lang === "bn" ? "ইঞ্চি" : "Inch" },
    { value: "cm", label: lang === "bn" ? "সেমি" : "Cm" },
    { value: "point", label: lang === "bn" ? "পয়েন্ট" : "Point" }
  ];

  const DimensionInput = ({
    label,
    field,
    setField
  }: {
    label: string;
    field: DimensionField;
    setField: (f: DimensionField) => void;
  }) => {
    const inches = toInches(Number(field.value) || 0, field.unit);
    const b = breakdownFromInches(inches);
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            className="input-field"
            value={field.value}
            onChange={(e) => setField({ ...field, value: e.target.value })}
          />
          <select
            className="input-field w-28 shrink-0"
            value={field.unit}
            onChange={(e) => setField({ ...field, unit: e.target.value as LengthUnit })}
          >
            {unitOptions.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        {Number(field.value) > 0 && (
          <p className="text-xs text-wood-400 mt-1">≈ {lengthLabel(b)} · {b.totalCm} cm</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 flex items-center gap-2">
          <Ruler className="h-6 w-6 text-forest-600" /> {t("title") ?? "কাঠের হিসাব"}
        </h1>
        <Link
          href={`/${locale}/wood-measurement/rules`}
          className="text-sm font-medium text-forest-600 hover:underline"
        >
          {lang === "bn" ? "⚙️ হিসাবের নিয়ম" : "⚙️ Calculation Rules"}
        </Link>
      </div>

      {/* ---- Calculator card ---- */}
      <Card>
        <CardHeader title={t("calculator") ?? "ক্যালকুলেটর"} />

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("round_log")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-colors",
              mode === "round_log" ? "bg-forest-600 text-white" : "bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-wood-200"
            )}
          >
            <Circle className="h-5 w-5" /> {t("roundLog") ?? "গোল কাঠ"}
          </button>
          <button
            onClick={() => setMode("size_cut")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-colors",
              mode === "size_cut" ? "bg-forest-600 text-white" : "bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-wood-200"
            )}
          >
            <Square className="h-5 w-5" /> {t("sizeCut") ?? "সাইজ কাট"}
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setInputMethod("voice")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-colors",
              inputMethod === "voice" ? "border-forest-600 text-forest-700 bg-forest-50 dark:bg-forest-900/30" : "border-wood-100 dark:border-wood-700 text-wood-500"
            )}
          >
            <Mic className="h-4 w-4" /> {lang === "bn" ? "🎤 AI দিয়ে মাপ দিন" : "🎤 Use AI Voice"}
          </button>
          <button
            onClick={() => setInputMethod("manual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-colors",
              inputMethod === "manual" ? "border-forest-600 text-forest-700 bg-forest-50 dark:bg-forest-900/30" : "border-wood-100 dark:border-wood-700 text-wood-500"
            )}
          >
            <PenLine className="h-4 w-4" /> {lang === "bn" ? "✍️ নিজে মাপ দিন" : "✍️ Manual Entry"}
          </button>
        </div>

        {inputMethod === "manual" ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("customerName") ?? "গ্রাহকের নাম"}</label>
              <input
                className="input-field text-lg"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={lang === "bn" ? "যেমন: রহিম" : "e.g. Rahim"}
              />
            </div>

            {mode === "round_log" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DimensionInput label={lang === "bn" ? "পরিধি" : "Girth"} field={girth} setField={setGirth} />
                <DimensionInput label={lang === "bn" ? "দৈর্ঘ্য" : "Length"} field={length} setField={setLength} />
                <div>
                  <label className="block text-sm font-medium mb-1">{t("quantity") ?? "পরিমাণ"}</label>
                  <input type="number" min={1} className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DimensionInput label={lang === "bn" ? "দৈর্ঘ্য" : "Length"} field={length} setField={setLength} />
                <DimensionInput label={lang === "bn" ? "প্রস্থ" : "Width"} field={width} setField={setWidth} />
                <DimensionInput label={lang === "bn" ? "পুরুত্ব" : "Thickness"} field={thickness} setField={setThickness} />
                <div>
                  <label className="block text-sm font-medium mb-1">{t("quantity") ?? "পরিমাণ"}</label>
                  <input type="number" min={1} className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-forest-50 dark:bg-forest-900/30 p-5 flex items-center justify-between">
              <span className="text-base text-wood-600 dark:text-wood-300">{t("cftPreview") ?? "সিএফটি"}</span>
              <span className="text-2xl font-bold text-forest-700 dark:text-forest-300">{preview.toFixed(2)}</span>
            </div>

            <Button className="w-full mt-4" size="lg" onClick={() => addManualMutation.mutate()} loading={addManualMutation.isPending}>
              <Plus className="h-5 w-5" /> {t("addToNotebook") ?? "খাতায় যোগ করুন"}
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <button
              onClick={toggleVoice}
              className={cn(
                "mx-auto h-24 w-24 rounded-full flex items-center justify-center transition-colors shadow-soft",
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-forest-600 text-white hover:bg-forest-700"
              )}
            >
              {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </button>
            <p className="mt-3 text-sm text-wood-500">
              {isListening
                ? lang === "bn" ? "শুনছি... আবার চাপুন থামাতে" : "Listening... tap to stop"
                : lang === "bn" ? "মাইকে চাপুন ও বলুন, যেমন: 'রহিমের কার্ড, দশ ফুট ছয় ইঞ্চির কাঠ দুইটা, রহিম শেষ'" : "Tap and speak naturally"}
            </p>

            {transcript && (
              <div className="mt-4 rounded-xl bg-wood-50 dark:bg-wood-700 p-4 text-left text-sm text-wood-700 dark:text-cream-100">
                {transcript}
              </div>
            )}

            <Button
              className="mt-4"
              onClick={() => parseMutation.mutate()}
              loading={parseMutation.isPending}
              disabled={!transcript.trim()}
            >
              <Sparkles className="h-4 w-4" /> {lang === "bn" ? "মাপ বুঝুন" : "Understand measurements"}
            </Button>
          </div>
        )}
      </Card>

      {/* ---- Result cards for the last action ---- */}
      {resultStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-forest-600 text-white border-none text-center">
            <p className="text-sm text-forest-100 mb-1">{lang === "bn" ? "মোট সেফটি" : "Total CFT"}</p>
            <p className="text-3xl font-bold">{resultStats.totalCFT.toFixed(2)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-wood-500 mb-1">{lang === "bn" ? "প্রতি টুকরায় গড় দৈর্ঘ্য" : "Avg length per piece"}</p>
            <p className="text-xl font-bold text-wood-900 dark:text-cream-50">{lengthLabel(resultStats.avg)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-wood-500 mb-1">{lang === "bn" ? "মোট দৈর্ঘ্য" : "Total length"}</p>
            <p className="text-xl font-bold text-wood-900 dark:text-cream-50">{lengthLabel(resultStats.total)}</p>
          </Card>
        </div>
      )}

      {/* ---- Notebook: open customer groups ---- */}
      <Card>
        <CardHeader title={t("notebook") ?? "চলমান হিসাব"} />
        {(!openGroups || openGroups.length === 0) && (
          <p className="text-wood-400 text-sm text-center py-8">{t("noOpenGroups") ?? "এখনো কোনো চলমান হিসাব নেই"}</p>
        )}
        <div className="space-y-4">
          {(openGroups ?? []).map((group) => (
            <div key={group._id} className="rounded-2xl border border-wood-100 dark:border-wood-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-wood-900 dark:text-cream-50">{group.customerName}</h3>
                  <p className="text-xs text-wood-400">{group.slipNumber}</p>
                </div>
                <span className="text-sm font-semibold text-forest-600">
                  {group.totalCFT.toFixed(2)} {lang === "bn" ? "সিএফটি" : "CFT"}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {group.items.map((item, i) => (
                  <div key={item._id} className="flex items-center justify-between text-sm py-1.5 border-b border-wood-50 dark:border-wood-700/50">
                    <span className="text-wood-700 dark:text-cream-100">
                      {i + 1}) {itemLabel(item)} → <strong>{item.cft.toFixed(2)}</strong>
                    </span>
                    <button onClick={() => removeItemMutation.mutate({ groupId: group._id, itemId: item._id })} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {closingGroupId === group._id ? (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <input
                    type="number"
                    placeholder={t("ratePerCFT") ?? "প্রতি সিএফটি দর"}
                    className="input-field"
                    value={closeRate}
                    onChange={(e) => setCloseRate(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t("paidAmount") ?? "পরিশোধিত"}
                    className="input-field"
                    value={closePaid}
                    onChange={(e) => setClosePaid(e.target.value)}
                  />
                  <Button className="col-span-2" onClick={() => closeMutation.mutate()} loading={closeMutation.isPending}>
                    <Lock className="h-4 w-4" /> {t("confirmClose") ?? "হিসাব শেষ করুন"}
                  </Button>
                  <Button variant="secondary" className="col-span-2" onClick={() => setClosingGroupId(null)}>
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => downloadSlip(group._id, group.slipNumber)}>
                    <Download className="h-4 w-4" /> {t("downloadSlip") ?? "স্লিপ"}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => setClosingGroupId(group._id)} disabled={group.items.length === 0}>
                    <Lock className="h-4 w-4" /> {t("closeAccount") ?? "হিসাব শেষ করুন"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ---- History ---- */}
      <Card>
        <CardHeader title={t("history") ?? "হিসাবের ইতিহাস"} />
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="input-field pl-12"
            placeholder={lang === "bn" ? "গ্রাহক বা স্লিপ নম্বর খুঁজুন..." : "Search customer or slip number..."}
          />
        </div>

        {(!history || history.length === 0) && (
          <p className="text-wood-400 text-sm text-center py-8 flex flex-col items-center gap-2">
            <BookOpen className="h-8 w-8 text-wood-200" />
            {t("noHistory") ?? "এখনো কোনো শেষ হওয়া হিসাব নেই"}
          </p>
        )}

        <div className="space-y-2">
          {(history ?? []).map((h) => (
            <div key={h._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-wood-100 dark:border-wood-700 px-4 py-3">
              <div>
                <p className="font-medium text-wood-800 dark:text-cream-100">{h.customerName}</p>
                <p className="text-xs text-wood-400">
                  {h.slipNumber} · {formatDate(h.createdAt, lang)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-forest-600">{formatCurrency(h.totalPrice, lang)}</span>
                <button onClick={() => downloadSlip(h._id, h.slipNumber)} className="text-forest-600 hover:underline text-xs flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> {t("downloadSlip") ?? "স্লিপ ডাউনলোড"}
                </button>
                <button onClick={() => reopenMutation.mutate(h._id)} className="text-wood-500 hover:underline text-xs flex items-center gap-1">
                  <Unlock className="h-3.5 w-3.5" /> {t("reopen") ?? "পুনরায় খুলুন"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Daily Measurement Book ---- */}
      <Card>
        <CardHeader title={lang === "bn" ? "দৈনিক মাপের বই" : "Daily Measurement Book"} />
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="date"
            className="input-field w-auto"
            value={dailyBookDate}
            onChange={(e) => setDailyBookDate(e.target.value)}
          />
          <Button variant="secondary" size="sm" onClick={() => downloadDailyBook(dailyBookDate)}>
            <Download className="h-4 w-4" /> {lang === "bn" ? "PDF ডাউনলোড" : "Download PDF"}
          </Button>
        </div>

        {(!dailyBook || dailyBook.records.length === 0) && (
          <p className="text-wood-400 text-sm text-center py-6">
            {lang === "bn" ? "এই দিনে কোনো হিসাব নেই" : "No records for this day"}
          </p>
        )}

        {dailyBook && dailyBook.records.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {dailyBook.records.map((g: any) => (
                <div key={g._id} className="rounded-xl border border-wood-100 dark:border-wood-700 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-wood-800 dark:text-cream-100">{g.customerName}</p>
                    <span className="text-sm font-semibold text-forest-600">{g.totalCFT.toFixed(2)} CFT</span>
                  </div>
                  <p className="text-xs text-wood-400">{g.slipNumber} · {g.status === "closed" ? (lang === "bn" ? "সম্পন্ন" : "Closed") : (lang === "bn" ? "চলমান" : "Open")}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 flex items-center justify-between">
              <span className="font-semibold text-wood-700 dark:text-wood-200">{lang === "bn" ? "সর্বমোট" : "Grand Total"}</span>
              <span className="text-lg font-bold text-forest-700 dark:text-forest-300">
                {dailyBook.grandTotalCFT.toFixed(2)} CFT — {formatCurrency(dailyBook.grandTotalPrice, lang)}
              </span>
            </div>
          </>
        )}
      </Card>
      
      {/* ---- Review Modal (voice results) ---- */}
      {reviewBlocks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-wood-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-wood-900 dark:text-cream-50">{lang === "bn" ? "AI বুঝেছে — যাচাই করুন" : "AI understood this — please review"}</h2>
              <button onClick={() => setReviewBlocks(null)} className="p-1 text-wood-400 hover:text-wood-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewBlocks.map((block, bi) => (
              <div key={bi} className="mb-4 rounded-xl border border-wood-100 dark:border-wood-700 p-3">
                <p className="font-bold text-forest-700 dark:text-forest-300 mb-2">{block.customerName}</p>
                {block.rows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-5 gap-1.5 items-center mb-2 text-xs">
                    <input
                      type="number"
                      className="input-field !py-1.5 !text-xs"
                      value={row.lengthFeet}
                      onChange={(e) => {
                        const updated = [...reviewBlocks];
                        updated[bi].rows[ri].lengthFeet = Number(e.target.value);
                        setReviewBlocks(updated);
                      }}
                      placeholder="ft"
                    />
                    <input
                      type="number"
                      className="input-field !py-1.5 !text-xs"
                      value={row.lengthInch}
                      onChange={(e) => {
                        const updated = [...reviewBlocks];
                        updated[bi].rows[ri].lengthInch = Number(e.target.value);
                        setReviewBlocks(updated);
                      }}
                      placeholder="in"
                    />
                    <input
                      type="number"
                      className="input-field !py-1.5 !text-xs"
                      value={row.girthInch}
                      onChange={(e) => {
                        const updated = [...reviewBlocks];
                        updated[bi].rows[ri].girthInch = Number(e.target.value);
                        setReviewBlocks(updated);
                      }}
                      placeholder="পরিধি(in)"
                    />
                    <input
                      type="number"
                      className="input-field !py-1.5 !text-xs"
                      value={row.quantity}
                      onChange={(e) => {
                        const updated = [...reviewBlocks];
                        updated[bi].rows[ri].quantity = Number(e.target.value);
                        setReviewBlocks(updated);
                      }}
                      placeholder="qty"
                    />
                    <button
                      onClick={() => {
                        const updated = [...reviewBlocks];
                        updated[bi].rows.splice(ri, 1);
                        setReviewBlocks(updated);
                      }}
                      className="text-red-400 hover:text-red-600 justify-self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-wood-400">ft / in / পরিধি(in) / qty</p>
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => confirmReviewMutation.mutate()} loading={confirmReviewMutation.isPending}>
                <Check className="h-4 w-4" /> {lang === "bn" ? "হিসাব করুন" : "Calculate"}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setReviewBlocks(null)}>
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </Button>    
            </div>
          </div>    
        </div>
      )}
    </div>
  );
}