"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Warehouse,
  Scissors,
  Calculator,
  Receipt,
  TrendingUp,
  FileBarChart,
  Bot,
  Settings,
  TreePine,
  LogOut,
  Truck,
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const items = [
    { href: `/${locale}/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/wood-inventory`, label: t("woodInventory"), icon: Warehouse },
    { href: `/${locale}/suppliers`, label: t("suppliers") ?? "সরবরাহকারী", icon: Truck },
    { href: `/${locale}/purchases`, label: t("purchases") ?? "ক্রয়", icon: ShoppingCart },
    { href: `/${locale}/cutting-orders`, label: t("cuttingOrders"), icon: Scissors },
    { href: `/${locale}/product-cost-calculator`, label: t("costCalculator"), icon: Calculator },
    { href: `/${locale}/expenses`, label: t("expenses"), icon: Receipt },
    { href: `/${locale}/sales`, label: t("sales"), icon: TrendingUp },
    { href: `/${locale}/reports`, label: t("reports"), icon: FileBarChart },
    { href: `/${locale}/ai-assistant`, label: t("aiAssistant"), icon: Bot },
    { href: `/${locale}/settings`, label: t("settings"), icon: Settings }
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // even if the API call fails, still clear local auth state
    } finally {
      clearAuth();
      toast.success("Logged out");
      router.push(`/${locale}/login`);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-wood-100 dark:border-wood-700 bg-white dark:bg-wood-800 h-screen sticky top-0 py-6">
      <div className="flex items-center gap-2 px-6 mb-8">
        <div className="rounded-xl bg-forest-600 p-2">
          <TreePine className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-lg text-wood-900 dark:text-cream-50">খাতখাতা</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                active
                  ? "bg-forest-600 text-white shadow-soft"
                  : "text-wood-600 dark:text-wood-200 hover:bg-wood-100 dark:hover:bg-wood-700"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-3 border-t border-wood-100 dark:border-wood-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}