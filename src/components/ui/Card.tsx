import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-wood-900 dark:text-cream-50">{title}</h3>
        {subtitle && <p className="text-sm text-wood-500 dark:text-wood-300 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
