import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "wood" | "forest" | "cream";
}

export function StatCard({ label, value, icon: Icon, trend, accent = "wood" }: StatCardProps) {
  const accentBg = {
    wood: "bg-wood-100 text-wood-700 dark:bg-wood-700 dark:text-wood-100",
    forest: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
    cream: "bg-cream-100 text-wood-700"
  };

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-wood-500 dark:text-wood-300 mb-1">{label}</p>
        <p className="stat-number text-wood-900 dark:text-cream-50">{value}</p>
        {trend && (
          <span className={cn("text-xs font-medium mt-1 inline-block", trend.positive ? "text-forest-600" : "text-red-500")}>
            {trend.value}
          </span>
        )}
      </div>
      <div className={cn("rounded-xl p-3", accentBg[accent])}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
