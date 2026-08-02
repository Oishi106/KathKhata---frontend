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
import type { Expense } from "@/types";

const sample: Expense[] = [
  { _id: "1", category: "salary", amount: 25000, description: "Monthly worker salary", date: new Date().toISOString() },
  { _id: "2", category: "fuel", amount: 3200, description: "Diesel for machine", date: new Date().toISOString() }
];

const categoryLabels: Record<string, string> = {
  salary: "Salary",
  electricity: "Electricity",
  transport: "Transport",
  machine_repair: "Machine Repair",
  fuel: "Fuel",
  miscellaneous: "Miscellaneous"
};

export default function ExpensesPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("nav");
  const lang = locale === "bn" ? "bn" : "en";

  const { data } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get<{ data: Expense[] }>("/expenses")).data.data,
    placeholderData: sample
  });

  const columns: Column<Expense>[] = [
    { header: "Category", accessor: (r) => categoryLabels[r.category] },
    { header: "Amount", accessor: (r) => formatCurrency(r.amount, lang) },
    { header: "Description", accessor: (r) => r.description ?? "-" },
    { header: "Date", accessor: (r) => formatDate(r.date, lang) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("expenses")}</h1>
        <Button>
          <Plus className="h-5 w-5" /> Add Expense
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={data ?? []} />
      </Card>
    </div>
  );
}
