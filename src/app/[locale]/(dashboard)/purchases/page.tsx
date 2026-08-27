"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Download, ShoppingCart, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { VoiceEntryButton } from "@/components/shared/VoiceEntryButton";
import type { VoiceFieldSpec } from "@/hooks/useVoiceEntry";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase, Supplier } from "@/types";

const emptyForm = {
  supplier: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  invoiceNumber: "",
  woodType: "",
  totalCFT: "",
  purchasePrice: "",
  transportCost: "",
  loadingCost: "",
  unloadingCost: "",
  otherExpenses: "",
  paidAmount: "",
  paymentMethod: "",
  notes: ""
};

const purchaseVoiceFields: VoiceFieldSpec[] = [
  { name: "supplierName", type: "string", description: "সরবরাহকারীর নাম" },
  { name: "woodType", type: "string", description: "কাঠের ধরন (যেমন গামারি, মেহগনি, সেগুন)" },
  { name: "totalCFT", type: "number", description: "মোট সিএফটি", keywords: ["সিএফটি", "ঘনফুট"] },
  {
    name: "purchasePrice",
    type: "number",
    description: "কাঠের মূল্য টাকায়",
    keywords: ["দাম", "মূল্য", "টাকায়", "কিনেছি", "কিনলাম"]
  },
  { name: "transportCost", type: "number", description: "পরিবহন খরচ", keywords: ["পরিবহন", "গাড়িভাড়া", "ভাড়া"] },
  { name: "loadingCost", type: "number", description: "লোডিং খরচ", keywords: ["লোডিং", "তোলা"] },
  { name: "unloadingCost", type: "number", description: "আনলোডিং খরচ", keywords: ["আনলোডিং", "নামানো"] },
  { name: "otherExpenses", type: "number", description: "অন্যান্য খরচ", keywords: ["অন্যান্য", "বাড়তি"] },
  {
    name: "paidAmount",
    type: "number",
    description: "পরিশোধিত পরিমাণ",
    keywords: ["পরিশোধ", "দিয়েছি", "দিছি", "জমা"]
  },
  { name: "notes", type: "string", description: "কোনো বাড়তি মন্তব্য" }
];

export default function PurchasesPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("purchases");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-all"],
    queryFn: async () =>
      (await api.get<{ data: Supplier[] }>("/suppliers", { params: { limit: 100 } })).data.data
  });

  const { data } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => (await api.get<{ data: Purchase[] }>("/purchases")).data.data
  });

  const stats = useMemo(() => {
    const list = data ?? [];
    const totalPurchases = list.length;
    const totalSpent = list.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalDue = list.reduce((sum, p) => sum + p.dueAmount, 0);
    return { totalPurchases, totalSpent, totalDue };
  }, [data]);

  const preview = useMemo(() => {
    const grandTotal =
      (Number(form.purchasePrice) || 0) +
      (Number(form.transportCost) || 0) +
      (Number(form.loadingCost) || 0) +
      (Number(form.unloadingCost) || 0) +
      (Number(form.otherExpenses) || 0);
    const due = Math.max(0, grandTotal - (Number(form.paidAmount) || 0));
    return { grandTotal, due };
  }, [form]);

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/purchases", {
        supplier: form.supplier,
        purchaseDate: form.purchaseDate,
        invoiceNumber: form.invoiceNumber || undefined,
        woodType: form.woodType,
        quantity: 1,
        totalCFT: Number(form.totalCFT),
        purchasePrice: Number(form.purchasePrice),
        transportCost: Number(form.transportCost) || 0,
        loadingCost: Number(form.loadingCost) || 0,
        unloadingCost: Number(form.unloadingCost) || 0,
        otherExpenses: Number(form.otherExpenses) || 0,
        paidAmount: Number(form.paidAmount) || 0,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined
      }),
    onSuccess: () => {
      toast.success("Purchase recorded — inventory & supplier due updated");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record purchase")
  });

 const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleVoiceResult = (result: Record<string, string | number | null>) => {
    let matchedSupplierId = "";
    if (result.supplierName && suppliers) {
      const spoken = String(result.supplierName).toLowerCase().trim();
      const match = suppliers.find(
        (s) => s.name.toLowerCase().includes(spoken) || spoken.includes(s.name.toLowerCase())
      );
      if (match) matchedSupplierId = match._id;
    }

    setForm((f) => ({
      ...f,
      supplier: matchedSupplierId || f.supplier,
      woodType: result.woodType ? String(result.woodType) : f.woodType,
      totalCFT: result.totalCFT != null ? String(result.totalCFT) : f.totalCFT,
      purchasePrice: result.purchasePrice != null ? String(result.purchasePrice) : f.purchasePrice,
      transportCost: result.transportCost != null ? String(result.transportCost) : f.transportCost,
      loadingCost: result.loadingCost != null ? String(result.loadingCost) : f.loadingCost,
      unloadingCost: result.unloadingCost != null ? String(result.unloadingCost) : f.unloadingCost,
      otherExpenses: result.otherExpenses != null ? String(result.otherExpenses) : f.otherExpenses,
      paidAmount: result.paidAmount != null ? String(result.paidAmount) : f.paidAmount,
      notes: result.notes ? String(result.notes) : f.notes
    }));

    setShowForm(true);
  };

  const downloadInvoice = async (id: string) => {
    try {
      const res = await api.get(`/purchases/${id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const columns: Column<Purchase>[] = [
    {
      header: t("supplier"),
      accessor: (r) => (
        <span className="font-medium">{typeof r.supplier === "object" ? r.supplier.name : "-"}</span>
      )
    },
    { header: t("woodType"), accessor: (r) => r.woodType },
    { header: t("totalCFT"), accessor: (r) => r.totalCFT.toFixed(2) },
    { header: t("grandTotal"), accessor: (r) => formatCurrency(r.grandTotal, lang) },
    {
      header: t("dueAmount"),
      accessor: (r) => (
        <span className={r.dueAmount > 0 ? "text-red-600 font-semibold" : "text-forest-600"}>
          {formatCurrency(r.dueAmount, lang)}
        </span>
      )
    },
    { header: t("purchaseDate"), accessor: (r) => formatDate(r.purchaseDate, lang) },
    {
      header: "",
      accessor: (r) => (
        <button
          onClick={() => downloadInvoice(r._id)}
          className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> {t("downloadInvoice")}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <VoiceEntryButton fields={purchaseVoiceFields} language={lang} onResult={handleVoiceResult} />
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? "Cancel" : t("addPurchase")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("title")} value={String(stats.totalPurchases)} icon={ShoppingCart} accent="wood" />
        <StatCard label={t("grandTotal")} value={formatCurrency(stats.totalSpent, lang)} icon={ShoppingCart} accent="forest" />
        <StatCard label={t("dueAmount")} value={formatCurrency(stats.totalDue, lang)} icon={Wallet} accent="wood" />
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("addPurchase")} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{t("supplier")}</label>
              <select required className="input-field" value={form.supplier} onChange={update("supplier")}>
                <option value="">{t("selectSupplier")}</option>
                {(suppliers ?? []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("purchaseDate")}</label>
              <input type="date" required className="input-field" value={form.purchaseDate} onChange={update("purchaseDate")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("invoiceNumber")}</label>
              <input className="input-field" value={form.invoiceNumber} onChange={update("invoiceNumber")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("woodType")}</label>
              <input required className="input-field" value={form.woodType} onChange={update("woodType")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("totalCFT")}</label>
              <input type="number" required min={0} step="0.01" className="input-field" value={form.totalCFT} onChange={update("totalCFT")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("purchasePrice")}</label>
              <input type="number" required min={0} className="input-field" value={form.purchasePrice} onChange={update("purchasePrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transportCost")}</label>
              <input type="number" min={0} className="input-field" value={form.transportCost} onChange={update("transportCost")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("loadingCost")}</label>
              <input type="number" min={0} className="input-field" value={form.loadingCost} onChange={update("loadingCost")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("unloadingCost")}</label>
              <input type="number" min={0} className="input-field" value={form.unloadingCost} onChange={update("unloadingCost")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("otherExpenses")}</label>
              <input type="number" min={0} className="input-field" value={form.otherExpenses} onChange={update("otherExpenses")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("paidAmount")}</label>
              <input type="number" min={0} className="input-field" value={form.paidAmount} onChange={update("paidAmount")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("paymentMethod")}</label>
              <input className="input-field" value={form.paymentMethod} onChange={update("paymentMethod")} placeholder="Cash / bKash / Bank" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium mb-1">{t("notes")}</label>
              <input className="input-field" value={form.notes} onChange={update("notes")} />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-wood-500">{t("grandTotal")}</p>
                <p className="text-lg font-bold text-forest-700 dark:text-forest-300">{formatCurrency(preview.grandTotal, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-wood-500">{t("dueAmount")}</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(preview.due, lang)}</p>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={createMutation.isPending}>
                {t("addPurchase")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}