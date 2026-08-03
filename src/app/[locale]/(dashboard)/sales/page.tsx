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
import type { Sale } from "@/types";

const emptyForm = {
  productName: "",
  customerName: "",
  quantity: "1",
  unitPrice: "",
  costOfGoods: "",
  date: new Date().toISOString().slice(0, 10)
};

export default function SalesPage() {
  const { locale } = useParams<{ locale: string }>();
  const ts = useTranslations("sales");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await api.get<{ data: Sale[] }>("/sales")).data.data
  });

  const revenue = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);
  const profit = revenue - (Number(form.costOfGoods) || 0);

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/sales", {
        productName: form.productName,
        customerName: form.customerName || undefined,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        costOfGoods: Number(form.costOfGoods) || 0,
        date: form.date
      }),
    onSuccess: () => {
      toast.success("Sale recorded");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to record sale");
    }
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const columns: Column<Sale>[] = [
    { header: ts("product"), accessor: (r) => <span className="font-medium">{r.productName}</span> },
    { header: ts("customer"), accessor: (r) => r.customerName ?? "-" },
    { header: ts("qty"), accessor: (r) => r.quantity },
    { header: ts("revenue"), accessor: (r) => formatCurrency(r.totalRevenue, lang) },
    {
      header: ts("profit"),
      accessor: (r) => <span className="text-forest-600 font-semibold">{formatCurrency(r.profit, lang)}</span>
    },
    { header: ts("date"), accessor: (r) => formatDate(r.date, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{ts("title")}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : ts("recordSale")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={ts("recordSale")} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{ts("productName")}</label>
              <input
                required
                className="input-field"
                value={form.productName}
                onChange={update("productName")}
                placeholder="যেমন: কাঠের দরজা"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ts("customerOptional")}</label>
              <input className="input-field" value={form.customerName} onChange={update("customerName")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ts("date")}</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ts("qty")}</label>
              <input
                type="number"
                required
                min={1}
                className="input-field"
                value={form.quantity}
                onChange={update("quantity")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ts("unitPrice")}</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.unitPrice}
                onChange={update("unitPrice")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ts("costOfGoods")}</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.costOfGoods}
                onChange={update("costOfGoods")}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-wood-600 dark:text-wood-300">
                {ts("revenue")}: {formatCurrency(revenue, lang)}
              </span>
              <span className="text-lg font-bold text-forest-700 dark:text-forest-300">
                {ts("profit")}: {formatCurrency(profit, lang)}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={createMutation.isPending}>
                {ts("recordSale")}
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