import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { _id: string }>({
  columns,
  data,
  emptyLabel = "No data available"
}: {
  columns: Column<T>[];
  data: T[];
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return <div className="py-12 text-center text-wood-400">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto -mx-5 md:-mx-6">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-wood-100 dark:border-wood-700">
            {columns.map((col, i) => (
              <th key={i} className="px-5 md:px-6 py-3 text-sm font-semibold text-wood-500 dark:text-wood-300 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row._id} className="border-b border-wood-50 dark:border-wood-700/50 hover:bg-wood-50 dark:hover:bg-wood-700/30">
              {columns.map((col, i) => (
                <td key={i} className={cn("px-5 md:px-6 py-4 text-base text-wood-800 dark:text-cream-100", col.className)}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
