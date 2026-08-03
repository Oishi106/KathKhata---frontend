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

const emptyForm = {
  category: "miscellaneous",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10)
};

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
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : "Add Expense"}
        </Button>
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