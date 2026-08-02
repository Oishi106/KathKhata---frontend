"use client";

import { useParams } from "next/navigation";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

const fields = [
  "woodCost",
  "laborCost",
  "machineCost",
  "electricity",
  "polish",
  "packaging",
  "transport"
] as const;

export default function CostCalculatorPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("costCalculator");
  const lang = locale === "bn" ? "bn" : "en";
  const [values, setValues] = useState<Record<(typeof fields)[number], number>>({
    woodCost: 0,
    laborCost: 0,
    machineCost: 0,
    electricity: 0,
    polish: 0,
    packaging: 0,
    transport: 0
  });
  const [margin, setMargin] = useState(25);

  const result = useMemo(() => {
    const totalCost = Object.values(values).reduce((sum, v) => sum + v, 0);
    const suggestedSellingPrice = totalCost / (1 - margin / 100);
    const profit = suggestedSellingPrice - totalCost;
    return { totalCost, suggestedSellingPrice, profit, margin };
  }, [values, margin]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 flex items-center gap-2">
        <Calculator className="h-6 w-6 text-forest-600" /> {t("title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Cost inputs" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{t(field)}</label>
                <input
                  type="number"
                  className="input-field"
                  value={values[field] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field]: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Desired margin (%)</label>
            <input
              type="range"
              min={5}
              max={70}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-forest-600"
            />
            <span className="text-sm text-wood-500">{margin}%</span>
          </div>
        </Card>

        <Card className="bg-forest-600 text-white border-none h-fit">
          <h3 className="font-semibold text-lg mb-4">Result</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-forest-100">{t("totalCost")}</span>
              <span className="font-bold">{formatCurrency(result.totalCost, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-100">{t("sellingPrice")}</span>
              <span className="font-bold text-xl">{formatCurrency(result.suggestedSellingPrice, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-100">{t("profit")}</span>
              <span className="font-bold">{formatCurrency(result.profit, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-100">{t("margin")}</span>
              <span className="font-bold">{margin}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
