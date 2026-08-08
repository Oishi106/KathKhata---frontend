"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  BookOpen
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Measurement, MeasurementItem } from "@/types";

type Mode = "round_log" | "size_cut";

export default function WoodMeasurementPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("woodMeasurement");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("round_log");
  const [customerName, setCustomerName] = useState("");
  const [girth, setGirth] = useState("");
  const [girthUnit, setGirthUnit] = useState<"feet" | "inch">("feet");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [historySearch, setHistorySearch] = useState("");
  const [closingGroupId, setClosingGroupId] = useState<string | null>(null);
  const [closeRate, setCloseRate] = useState("");
  const [closePaid, setClosePaid] = useState("");

  const { data: openGroups } = useQuery({
    queryKey: ["measurement-open-groups"],
    queryFn: async () => (await api.get<{ data: Measurement[] }>("/wood-measurement/groups/open")).data.data
  });

  const { data: history } = useQuery({
    queryKey: ["measurement-history", historySearch],
    queryFn: async () =>
      (
        await api.get<{ data: Measurement[] }>("/wood-measurement/history", {
          params: { search: historySearch }
        })
      ).data.data
  });

  const preview = useMemo(() => {
    if (mode === "round_log") {
      const g = Number(girth) || 0;
      const l = Number(length) || 0;
      const q = Number(quantity) || 0;
      const cft = girthUnit === "feet" ? ((g * g * l) / 16) * q : ((l * g * g) / 2304) * q;
      return Math.round(cft * 100) / 100;
    }
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const th = Number(thickness) || 0;
    const q = Number(quantity) || 0;
    return Math.round(((l * w * th * q) / 144) * 100) / 100;
  }, [mode, girth, girthUnit, length, width, thickness, quantity]);

  const resetItemInputs = () => {
    setGirth("");
    setLength("");
    setWidth("");
    setThickness("");
    setQuantity("1");
  };

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!customerName.trim()) throw new Error("NO_CUSTOMER");

      const { data: groupRes } = await api.post("/wood-measurement/groups", {
        customerName: customerName.trim()
      });
      const groupId = groupRes.data._id;

      const payload =
        mode === "round_log"
          ? {
              mode: "round_log",
              girth: Number(girth),
              girthUnit,
              length: Number(length),
              quantity: Number(quantity)
            }
          : {
              mode: "size_cut",
              length: Number(length),
              width: Number(width),
              thickness: Number(thickness),
              quantity: Number(quantity)
            };

      return api.post(`/wood-measurement/groups/${groupId}/items`, payload);
    },
    onSuccess: () => {
      toast.success(t("itemAdded") ?? "Item added");
      queryClient.invalidateQueries({ queryKey: ["measurement-open-groups"] });
      resetItemInputs();
    },
    onError: (err: any) => {
      if (err?.message === "NO_CUSTOMER") {
        toast.error(t("enterCustomerFirst") ?? "Enter a customer name first");
      } else {
        toast.error(err?.response?.data?.message ?? "Failed to add item");
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
      toast.success(t("closed") ?? "Measurement closed");
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
        ? `গোল কাঠ — বেয়ার ${item.girth} ${unitLabel}, আড়ে ${item.length} ফুট, ${item.quantity}টি`
        : `Round log — girth ${item.girth} ${unitLabel}, length ${item.length} ft, qty ${item.quantity}`;
    }
    return lang === "bn"
      ? `সাইজ কাট — ${item.length}×${item.width}×${item.thickness} ইঞ্চি, ${item.quantity}টি`
      : `Size cut — ${item.length}×${item.width}×${item.thickness} in, qty ${item.quantity}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 flex items-center gap-2">
        <Ruler className="h-6 w-6 text-forest-600" /> {t("title") ?? "কাঠের হিসাব"}
      </h1>

      {/* ---- Calculator card (always visible at top) ---- */}
      <Card>
        <CardHeader title={t("calculator") ?? "ক্যালকুলেটর"} />

        <div className="flex gap-2 mb-5">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("girth") ?? "বেয়ার"}</label>
              <input type="number" min={0} step="0.01" className="input-field" value={girth} onChange={(e) => setGirth(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("girthUnit") ?? "একক"}</label>
              <select className="input-field" value={girthUnit} onChange={(e) => setGirthUnit(e.target.value as "feet" | "inch")}>
                <option value="feet">{lang === "bn" ? "ফুট" : "Feet"}</option>
                <option value="inch">{lang === "bn" ? "ইঞ্চি" : "Inch"}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("length") ?? "আড়ে (ফুট)"}</label>
              <input type="number" min={0} step="0.01" className="input-field" value={length} onChange={(e) => setLength(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("quantity") ?? "পরিমাণ"}</label>
              <input type="number" min={1} className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("length") ?? "দৈর্ঘ্য (ইঞ্চি)"}</label>
              <input type="number" min={0} step="0.01" className="input-field" value={length} onChange={(e) => setLength(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("width") ?? "প্রস্থ (ইঞ্চি)"}</label>
              <input type="number" min={0} step="0.01" className="input-field" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("thickness") ?? "পুরুত্ব (ইঞ্চি)"}</label>
              <input type="number" min={0} step="0.01" className="input-field" value={thickness} onChange={(e) => setThickness(e.target.value)} />
            </div>
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

        <Button
          className="w-full mt-4"
          size="lg"
          onClick={() => addItemMutation.mutate()}
          loading={addItemMutation.isPending}
        >
          <Plus className="h-5 w-5" /> {t("addToNotebook") ?? "খাতায় যোগ করুন"}
        </Button>
      </Card>

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
                    <button
                      onClick={() => removeItemMutation.mutate({ groupId: group._id, itemId: item._id })}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
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
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setClosingGroupId(group._id)}
                  disabled={group.items.length === 0}
                >
                  <Lock className="h-4 w-4" /> {t("closeAccount") ?? "হিসাব শেষ করুন"}
                </Button>
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
            <div
              key={h._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-wood-100 dark:border-wood-700 px-4 py-3"
            >
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
    </div>
  );
}