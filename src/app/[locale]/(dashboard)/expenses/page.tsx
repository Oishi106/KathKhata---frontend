"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { VoiceEntryButton } from "@/components/shared/VoiceEntryButton";
import type { VoiceFieldSpec } from "@/hooks/useVoiceEntry";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

const categoryLabels: Record<string, string> = {
  salary: "বেতন",
  electricity: "বিদ্যুৎ",
  transport: "পরিবহন",
  machine_repair: "মেশিন মেরামত",
  fuel: "জ্বালানি",
  miscellaneous: "বিবিধ"
};

// প্রতিটা ক্যাটাগরির জন্য সম্ভাব্য কথ্য প্রতিশব্দ — AI যা-ই বলুক, এই তালিকায় মিলিয়ে সঠিক enum বের করা হবে
const categorySynonyms: Record<string, string[]> = {
  salary: ["বেতন", "মাইনে", "সেলারি"],
  electricity: ["বিদ্যুৎ", "কারেন্ট", "ইলেকট্রিক", "লাইট বিল"],
  transport: ["পরিবহন", "ভাড়া", "গাড়িভাড়া", "যাতায়াত"],
  machine_repair: ["মেশিন", "মেরামত", "সারাই", "রিপেয়ার"],
  fuel: ["জ্বালানি", "তেল", "ডিজেল", "পেট্রোল", "গ্যাস"],
  miscellaneous: ["বিবিধ", "অন্যান্য"]
};

const emptyForm = {
  category: "miscellaneous",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10)
};

const expenseVoiceFields: VoiceFieldSpec[] = [
  {
    name: "category",
    type: "string",
    description: "খরচের ধরন — বেতন, বিদ্যুৎ, পরিবহন, মেশিন মেরামত, জ্বালানি, অথবা বিবিধ এর মধ্যে যেটা মানানসই"
  },
  { name: "amount", type: "number", description: "টাকার পরিমাণ", keywords: ["টাকা", "খরচ", "দিয়েছি", "দিছি"] },
  { name: "description", type: "string", description: "খরচের সংক্ষিপ্ত বিবরণ" }
];

function matchCategory(spokenText: string): string | null {
  const lower = spokenText.toLowerCase();
  for (const [key, synonyms] of Object.entries(categorySynonyms)) {
    if (synonyms.some((s) => lower.includes(s.toLowerCase()))) return key;
  }
  return null;
}

export default function ExpensesPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("nav");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get<{ data: Expense[] }>("/expenses")).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/expenses", {
        category: form.category,
        amount: Number(form.amount),
        description: form.description || undefined,
        date: form.date
      }),
    onSuccess: () => {
      toast.success("Expense recorded");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to record expense");
    }
  });

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleVoiceResult = (result: Record<string, string | number | null>) => {
    const matchedCategory = result.category ? matchCategory(String(result.category)) : null;

    setForm((f) => ({
      ...f,
      category: matchedCategory ?? f.category,
      amount: result.amount != null ? String(result.amount) : f.amount,
      description: result.description ? String(result.description) : f.description
    }));
    setShowForm(true);
  };

  const columns: Column<Expense>[] = [
    { header: "Category", accessor: (r) => categoryLabels[r.category] ?? r.category },
    { header: "Amount", accessor: (r) => formatCurrency(r.amount, lang) },
    { header: "Description", accessor: (r) => r.description ?? "-" },
    { header: "Date", accessor: (r) => formatDate(r.date, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("expenses")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <VoiceEntryButton fields={expenseVoiceFields} language={lang} onResult={handleVoiceResult} />
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? "Cancel" : "Add Expense"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Add Expense" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">খরচের ধরন</label>
              <select className="input-field" value={form.category} onChange={update("category")}>
                <option value="salary">বেতন</option>
                <option value="electricity">বিদ্যুৎ</option>
                <option value="transport">পরিবহন</option>
                <option value="machine_repair">মেশিন মেরামত</option>
                <option value="fuel">জ্বালানি</option>
                <option value="miscellaneous">বিবিধ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.amount}
                onChange={update("amount")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">তারিখ</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">বিবরণ (ঐচ্ছিক)</label>
              <input
                className="input-field"
                value={form.description}
                onChange={update("description")}
                placeholder="যেমন: এপ্রিল মাসের বেতন"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={createMutation.isPending}>
                Add Expense
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