"use client";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";

const sample: Sale[] = [
  {
    _id: "1",
    productName: "Wooden Door",
    customerName: "Nasrin Furniture",
    quantity: 4,
    unitPrice: 8500,
    totalRevenue: 34000,
    costOfGoods: 22000,
    profit: 12000,
    date: new Date().toISOString()
  }
];

export default function SalesPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("nav");
  const lang = locale === "bn" ? "bn" : "en";

  const { data } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await api.get<{ data: Sale[] }>("/sales")).data.data,
    placeholderData: sample
  });

  const columns: Column<Sale>[] = [
    { header: "Product", accessor: (r) => <span className="font-medium">{r.productName}</span> },
    { header: "Customer", accessor: (r) => r.customerName ?? "-" },
    { header: "Qty", accessor: (r) => r.quantity },
    { header: "Revenue", accessor: (r) => formatCurrency(r.totalRevenue, lang) },
    { header: "Profit", accessor: (r) => <span className="text-forest-600 font-semibold">{formatCurrency(r.profit, lang)}</span> },
    { header: "Date", accessor: (r) => formatDate(r.date, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("sales")}</h1>
        <Button>
          <Plus className="h-5 w-5" /> Record Sale
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}
