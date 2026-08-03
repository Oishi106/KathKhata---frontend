"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Clock,
  CheckCircle2,
  Bot,
  ShoppingCart,
  Receipt,
  Scissors
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { DashboardSummary } from "@/types";
import Link from "next/link";

interface ChartsResponse {
  revenueByDay: { _id: string; revenue: number; profit: number }[];
  expenseByDay: { _id: string; total: number }[];
}

interface ActivityItem {
  type: "sale" | "expense" | "cutting_order";
  createdAt: string;
  data: any;
}

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("dashboard");
  const lang = locale === "bn" ? "bn" : "en";

  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<{ data: DashboardSummary }>("/dashboard/summary")).data.data
  });

  const { data: chartsData } = useQuery({
    queryKey: ["dashboard-charts", 30],
    queryFn: async () =>
      (await api.get<{ data: ChartsResponse }>("/dashboard/charts", { params: { days: 30 } })).data.data
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => (await api.get<{ data: ActivityItem[] }>("/dashboard/recent-activity")).data.data
  });

  const chartRows = useMemo(() => {
    if (!chartsData) return [];
    return chartsData.revenueByDay.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      profit: d.profit
    }));
  }, [chartsData]);

  const activityMeta = (item: ActivityItem) => {
    switch (item.type) {
      case "sale":
        return {
          icon: ShoppingCart,
          color: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
          text: `${item.data.productName} বিক্রি হয়েছে`,
          amount: formatCurrency(item.data.totalRevenue, lang)
        };
      case "expense":
        return {
          icon: Receipt,
          color: "bg-wood-100 text-wood-700 dark:bg-wood-700 dark:text-wood-100",
          text: `${item.data.category} খরচ`,
          amount: formatCurrency(item.data.amount, lang)
        };
      case "cutting_order":
        return {
          icon: Scissors,
          color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
          text: `${item.data.customerName} এর কাটিং অর্ডার`,
          amount: formatCurrency(item.data.estimatedCost, lang)
        };
    }
  };

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
          <div className="h-64">
            {chartRows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-wood-300 border border-dashed border-wood-200 dark:border-wood-600 rounded-xl">
                এখনো কোনো ডেটা নেই
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2c8f4e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2c8f4e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#402a18" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#402a18" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ddc4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, lang)} />
                  <Area type="monotone" dataKey="revenue" stroke="#2c8f4e" fill="url(#revenueFill)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#402a18" fill="url(#profitFill)" strokeWidth={2} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
        {!activity || activity.length === 0 ? (
          <div className="text-wood-400 text-sm">No recent activity yet.</div>
        ) : (
          <div className="divide-y divide-wood-50 dark:divide-wood-700/50">
            {activity.map((item, i) => {
              const meta = activityMeta(item);
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-wood-800 dark:text-cream-100">{meta.text}</p>
                      <p className="text-xs text-wood-400">{formatDate(item.createdAt, lang)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-wood-700 dark:text-cream-50">{meta.amount}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}