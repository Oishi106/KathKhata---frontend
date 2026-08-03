"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WoodInventoryItem } from "@/types";

const emptyForm = {
  woodType: "",
  supplier: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchasePrice: "",
  transportCost: "",
  totalCFT: "",
  availableCFT: "",
  location: "",
  notes: ""
};

export default function WoodInventoryPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("woodInventory");
  const tc = useTranslations("common");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["wood-inventory", search],
    queryFn: async () =>
      (await api.get<{ data: WoodInventoryItem[] }>("/wood-inventory", { params: { search } })).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/wood-inventory", {
        woodType: form.woodType,
        supplier: form.supplier || undefined,
        purchaseDate: form.purchaseDate,
        purchasePrice: Number(form.purchasePrice),
        transportCost: Number(form.transportCost) || 0,
        totalCFT: Number(form.totalCFT),
        availableCFT: Number(form.availableCFT),
        location: form.location || undefined,
        notes: form.notes || undefined
      }),
    onSuccess: () => {
      toast.success("Wood added to inventory");
      queryClient.invalidateQueries({ queryKey: ["wood-inventory"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to add wood");
    }
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const columns: Column<WoodInventoryItem>[] = [
    { header: t("woodType"), accessor: (r) => <span className="font-medium">{r.woodType}</span> },
    { header: t("supplier"), accessor: (r) => r.supplier ?? "-" },
    { header: t("availableCFT"), accessor: (r) => `${r.availableCFT} / ${r.totalCFT}` },
    { header: t("purchasePrice"), accessor: (r) => formatCurrency(r.purchasePrice, lang) },
    { header: t("location"), accessor: (r) => r.location ?? "-" },
    { header: t("status"), accessor: (r) => <StatusBadge status={r.status} /> },
    { header: t("date"), accessor: (r) => formatDate(r.purchaseDate, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : t("addWood")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("addWood")} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{t("woodType")}</label>
              <input required className="input-field" value={form.woodType} onChange={update("woodType")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("supplier")}</label>
              <input className="input-field" value={form.supplier} onChange={update("supplier")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("purchaseDate")}</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.purchaseDate}
                onChange={update("purchaseDate")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("purchasePrice")}</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.purchasePrice}
                onChange={update("purchasePrice")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transportCost")}</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.transportCost}
                onChange={update("transportCost")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("totalCFT")}</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.totalCFT}
                onChange={update("totalCFT")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("availableCFT")}</label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                value={form.availableCFT}
                onChange={update("availableCFT")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("location")}</label>
              <input className="input-field" value={form.location} onChange={update("location")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">{tc("notes")}</label>
              <input className="input-field" value={form.notes} onChange={update("notes")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={createMutation.isPending}>
                {t("addWood")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}