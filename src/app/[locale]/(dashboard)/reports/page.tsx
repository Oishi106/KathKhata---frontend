"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ranges = ["daily", "weekly", "monthly", "yearly"] as const;

export default function ReportsPage() {
  const t = useTranslations("nav");
  const [range, setRange] = useState<(typeof ranges)[number]>("monthly");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("reports")}</h1>

      <Card>
        <CardHeader
          title="Business report"
          action={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          }
        />

        <div className="flex gap-2 mb-6">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors",
                range === r
                  ? "bg-forest-600 text-white"
                  : "bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-wood-200"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Revenue", "Expense", "Profit", "Loss"].map((label) => (
            <div key={label} className="rounded-xl border border-wood-100 dark:border-wood-700 p-4">
              <p className="text-sm text-wood-500 dark:text-wood-300">{label}</p>
              <p className="text-xl font-bold text-wood-900 dark:text-cream-50 mt-1">—</p>
            </div>
          ))}
        </div>

        <div className="h-64 mt-6 flex items-center justify-center text-wood-300 border border-dashed border-wood-200 dark:border-wood-600 rounded-xl">
          {range.charAt(0).toUpperCase() + range.slice(1)} report chart
        </div>
      </Card>
    </div>
  );
}
