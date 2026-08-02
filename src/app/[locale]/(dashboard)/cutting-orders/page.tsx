"use client";

import { useParams } from "next/navigation";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { CuttingOrder } from "@/types";

const sample: CuttingOrder[] = [
  {
    _id: "1",
    customerName: "Anwar Hossain",
    woodType: "Segun (Teak)",
    length: 96,
    width: 12,
    thickness: 2,
    quantity: 10,
    cft: 16,
    estimatedCost: 9600,
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

export default function CuttingOrdersPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("cuttingOrders");
  const lang = locale === "bn" ? "bn" : "en";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ length: 0, width: 0, thickness: 0, quantity: 1, ratePerCFT: 60 });

  const { data } = useQuery({
    queryKey: ["cutting-orders"],
    queryFn: async () => (await api.get<{ data: CuttingOrder[] }>("/cutting-orders")).data.data,
    placeholderData: sample
  });

  const cftPreview = useMemo(() => {
    const cft = (form.length * form.width * form.thickness * form.quantity) / 144;
    return { cft: Number(cft.toFixed(2)), cost: Number((cft * form.ratePerCFT).toFixed(2)) };
  }, [form]);

  const columns: Column<CuttingOrder>[] = [
    { header: t("customerName"), accessor: (r) => <span className="font-medium">{r.customerName}</span> },
    { header: "Wood", accessor: (r) => r.woodType },
    { header: "CFT", accessor: (r) => r.cft },
    { header: t("estimatedCost"), accessor: (r) => formatCurrency(r.estimatedCost, lang) },
    { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-5 w-5" /> {t("createOrder")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("createOrder")} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("length")} (in)</label>
              <input
                type="number"
                className="input-field"
                onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("width")} (in)</label>
              <input
                type="number"
                className="input-field"
                onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("thickness")} (in)</label>
              <input
                type="number"
                className="input-field"
                onChange={(e) => setForm((f) => ({ ...f, thickness: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("quantity")}</label>
              <input
                type="number"
                className="input-field"
                defaultValue={1}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 flex items-center justify-between">
            <span className="text-sm text-wood-600 dark:text-wood-300">Auto CFT Preview</span>
            <span className="text-lg font-bold text-forest-700 dark:text-forest-300">
              {cftPreview.cft} CFT — {formatCurrency(cftPreview.cost, lang)}
            </span>
          </div>

          <div className="mt-5 flex gap-3">
            <Button>{t("createOrder")}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}
