import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  in_stock: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
  low_stock: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  out_of_stock: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
  cancelled: "bg-wood-100 text-wood-600 dark:bg-wood-700 dark:text-wood-300"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize", styles[status] ?? styles.pending)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
