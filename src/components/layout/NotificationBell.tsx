"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, PackageX, AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "low_stock" | "out_of_stock" | "pending_order";
  createdAt: string;
  data: {
    woodType?: string;
    availableCFT?: number;
    customerName?: string;
  };
}

const iconFor = (type: NotificationItem["type"]) => {
  switch (type) {
    case "out_of_stock":
      return { Icon: PackageX, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" };
    case "low_stock":
      return { Icon: AlertTriangle, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200" };
    default:
      return { Icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" };
  }
};

export function NotificationBell() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("notifications");
  const lang = locale === "bn" ? "bn" : "en";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: NotificationItem[] }>("/notifications")).data.data,
    refetchInterval: 60000
  });

  const items = data ?? [];

  const messageFor = (item: NotificationItem) => {
    try {
      switch (item.type) {
        case "low_stock":
          return t("lowStock", { wood: item.data.woodType ?? "", cft: item.data.availableCFT ?? 0 });
        case "out_of_stock":
          return t("outOfStock", { wood: item.data.woodType ?? "" });
        case "pending_order":
          return t("pendingOrder", { customer: item.data.customerName ?? "" });
      }
    } catch {
      if (item.type === "low_stock") return `${item.data.woodType} — ${item.data.availableCFT} CFT`;
      if (item.type === "out_of_stock") return `${item.data.woodType} — out of stock`;
      return `${item.data.customerName} — pending order`;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl p-2.5 bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-cream-100 hover:bg-wood-200 dark:hover:bg-wood-600 relative"
      >
        <Bell className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white dark:bg-wood-800 shadow-card border border-wood-100 dark:border-wood-700 z-40">
            <div className="px-4 py-3 border-b border-wood-100 dark:border-wood-700 font-semibold text-wood-800 dark:text-cream-50">
              {t("title")}
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-wood-400">{t("empty")}</div>
            ) : (
              <div className="divide-y divide-wood-50 dark:divide-wood-700/50">
                {items.map((item) => {
                  const { Icon, color } = iconFor(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={cn("rounded-lg p-2 shrink-0", color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-wood-800 dark:text-cream-100">{messageFor(item)}</p>
                        <p className="text-xs text-wood-400 mt-0.5">{formatDate(item.createdAt, lang)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}