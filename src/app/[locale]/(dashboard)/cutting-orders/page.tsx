"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CuttingOrder } from "@/types";

const emptyForm = {
  customerName: "",
  woodType: "",
  cft: "",
  ratePerCFT: "",
  date: new Date().toISOString().slice(0, 10)
};

const statusOptions = [
  { value: "pending", label: "চলমান" },
  { value: "in_progress", label: "কাজ চলছে" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "cancelled", label: "বাতিল" }
];

export default function CuttingOrdersPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("cuttingOrders");
  const tc = useTranslations("common");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["cutting-orders"],
    queryFn: async () => (await api.get<{ data: CuttingOrder[] }>("/cutting-orders")).data.data
  });

  const estimatedCost = (Number(form.cft) || 0) * (Number(form.ratePerCFT) || 0);

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/cutting-orders", {
        customerName: form.customerName,
        woodType: form.woodType || "N/A",
        length: Number(form.cft) * 144,
        width: 1,
        thickness: 1,
        quantity: 1,
        ratePerCFT: Number(form.ratePerCFT) || 0
      }),
    onSuccess: () => {
      toast.success("Cutting order created");
      queryClient.invalidateQueries({ queryKey: ["cutting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to create order");
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/cutting-orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["cutting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    }
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const columns: Column<CuttingOrder>[] = [
    { header: t("customerName"), accessor: (r) => <span className="font-medium">{r.customerName}</span> },
    { header: "CFT", accessor: (r) => r.cft },
    { header: t("estimatedCost"), accessor: (r) => formatCurrency(r.estimatedCost, lang) },
    {
      header: tc("status"),
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.status} />
          <select
            value={r.status}
            onChange={(e) => statusMutation.mutate({ id: r._id, status: e.target.value })}
            disabled={statusMutation.isPending}
            className="text-xs rounded-lg border border-wood-200 dark:border-wood-600 bg-white dark:bg-wood-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    },
    { header: tc("date"), accessor: (r) => formatDate(r.createdAt, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : t("createOrder")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("createOrder")} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{t("customerName")}</label>
              <input
                required
                className="input-field"
                value={form.customerName}
                onChange={update("customerName")}
                placeholder="যেমন: আনোয়ার হোসেন"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">কাঠের ধরন</label>
              <input
                className="input-field"
                value={form.woodType}
                onChange={update("woodType")}
                placeholder="যেমন: সেগুন"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CFT</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                className="input-field"
                value={form.cft}
                onChange={update("cft")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">প্রতি CFT দর (৳)</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.ratePerCFT}
                onChange={update("ratePerCFT")}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 flex items-center justify-between">
              <span className="text-sm text-wood-600 dark:text-wood-300">আনুমানিক খরচ</span>
              <span className="text-lg font-bold text-forest-700 dark:text-forest-300">
                {formatCurrency(estimatedCost, lang)}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={createMutation.isPending}>
                {t("createOrder")}
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