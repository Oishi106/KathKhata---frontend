"use client";

import { useParams } from "next/navigation";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WoodInventoryItem } from "@/types";

const sample: WoodInventoryItem[] = [
  {
    _id: "1",
    woodType: "Segun (Teak)",
    supplier: "Rahman Traders",
    purchaseDate: new Date().toISOString(),
    purchasePrice: 45000,
    transportCost: 2500,
    totalCFT: 120,
    availableCFT: 85,
    location: "Yard A",
    status: "in_stock",
    createdAt: new Date().toISOString()
  },
  {
    _id: "2",
    woodType: "Mehogoni",
    supplier: "Karim Wood Supply",
    purchaseDate: new Date().toISOString(),
    purchasePrice: 32000,
    transportCost: 1800,
    totalCFT: 90,
    availableCFT: 12,
    location: "Yard B",
    status: "low_stock",
    createdAt: new Date().toISOString()
  }
];

export default function WoodInventoryPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("woodInventory");
  const lang = locale === "bn" ? "bn" : "en";
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["wood-inventory", search],
    queryFn: async () =>
      (await api.get<{ data: WoodInventoryItem[] }>("/wood-inventory", { params: { search } })).data.data,
    placeholderData: sample
  });

  const columns: Column<WoodInventoryItem>[] = [
    { header: t("woodType"), accessor: (r) => <span className="font-medium">{r.woodType}</span> },
    { header: t("supplier"), accessor: (r) => r.supplier ?? "-" },
    { header: t("availableCFT"), accessor: (r) => `${r.availableCFT} / ${r.totalCFT}` },
    { header: t("purchasePrice"), accessor: (r) => formatCurrency(r.purchasePrice, lang) },
    { header: t("location"), accessor: (r) => r.location ?? "-" },
    { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
    { header: "Date", accessor: (r) => formatDate(r.purchaseDate, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <Button>
          <Plus className="h-5 w-5" /> {t("addWood")}
        </Button>
      </div>

      <Card>
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
            placeholder="Search wood, supplier, location..."
          />
        </div>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}
