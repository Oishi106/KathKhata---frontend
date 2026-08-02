"use client";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Coins, TrendingDown, TrendingUp, Warehouse, Clock, CheckCircle2, Bot } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardSummary } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("dashboard");
  const lang = locale === "bn" ? "bn" : "en";

  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<{ data: DashboardSummary }>("/dashboard/summary")).data.data,
    placeholderData: {
      todayRevenue: 12500,
      todayExpense: 4200,
      todayProfit: 8300,
      availableWoodCFT: 340,
      pendingOrders: 6,
      completedOrders: 24,
      monthlyProfit: 186000,
      lowStockAlerts: 2
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t("todayRevenue")} value={formatCurrency(data?.todayRevenue ?? 0, lang)} icon={Coins} accent="forest" />
        <StatCard label={t("todayExpense")} value={formatCurrency(data?.todayExpense ?? 0, lang)} icon={TrendingDown} accent="wood" />
        <StatCard label={t("todayProfit")} value={formatCurrency(data?.todayProfit ?? 0, lang)} icon={TrendingUp} accent="forest" />
        <StatCard label={t("availableWood")} value={formatNumber(data?.availableWoodCFT ?? 0, lang)} icon={Warehouse} accent="wood" />
        <StatCard label={t("pendingOrders")} value={formatNumber(data?.pendingOrders ?? 0, lang)} icon={Clock} accent="wood" />
        <StatCard label={t("completedOrders")} value={formatNumber(data?.completedOrders ?? 0, lang)} icon={CheckCircle2} accent="forest" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title={t("monthlyProfit")} subtitle={formatCurrency(data?.monthlyProfit ?? 0, lang)} />
          <div className="h-64 flex items-center justify-center text-wood-300 border border-dashed border-wood-200 dark:border-wood-600 rounded-xl">
            Revenue / Profit chart
          </div>
        </Card>

        <Card className="bg-forest-600 text-white border-none">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-white/20 p-2">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">AI Assistant</h3>
          </div>
          <p className="text-forest-50 text-sm mb-4">
            Ask about profit, expenses, or inventory — get instant answers about your sawmill.
          </p>
          <Link href={`/${locale}/ai-assistant`}>
            <Button variant="secondary" className="w-full bg-white text-forest-700 hover:bg-cream-100">
              Open AI Assistant
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader title={t("recentActivity")} />
        <div className="text-wood-400 text-sm">No recent activity yet.</div>
      </Card>
    </div>
  );
}
