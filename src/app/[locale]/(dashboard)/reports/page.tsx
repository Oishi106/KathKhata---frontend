"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileSpreadsheet } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const ranges = [
  { key: "daily", days: 1 },
  { key: "weekly", days: 7 },
  { key: "monthly", days: 30 },
  { key: "yearly", days: 365 }
] as const;

interface ChartsResponse {
  revenueByDay: { _id: string; revenue: number; profit: number }[];
  expenseByDay: { _id: string; total: number }[];
}

const BRAND_GREEN = "FF2C8F4E";
const BRAND_WOOD = "FF402A18";
const BRAND_CREAM = "FFFBF3EA";
const WHITE = "FFFFFFFF";

export default function ReportsPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("nav");
  const tr = useTranslations("reports");
  const lang = locale === "bn" ? "bn" : "en";
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("monthly");
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const days = ranges.find((r) => r.key === range)!.days;

  const { data } = useQuery({
    queryKey: ["reports-charts", days],
    queryFn: async () =>
      (await api.get<{ data: ChartsResponse }>("/dashboard/charts", { params: { days } })).data.data
  });

  const merged = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { date: string; revenue: number; profit: number; expense: number }>();
    data.revenueByDay.forEach((d) => {
      map.set(d._id, { date: d._id, revenue: d.revenue, profit: d.profit, expense: 0 });
    });
    data.expenseByDay.forEach((d) => {
      const existing = map.get(d._id);
      if (existing) existing.expense = d.total;
      else map.set(d._id, { date: d._id, revenue: 0, profit: 0, expense: d.total });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const totals = useMemo(() => {
    const revenue = merged.reduce((s, r) => s + r.revenue, 0);
    const expense = merged.reduce((s, r) => s + r.expense, 0);
    const profit = revenue - expense;
    const loss = profit < 0 ? Math.abs(profit) : 0;
    return { revenue, expense, profit: Math.max(profit, 0), loss };
  }, [merged]);

  const toggleLine = (dataKey: string) => {
    setHiddenLines((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const exportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KathKhata AI";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Summary", {
      properties: { tabColor: { argb: BRAND_GREEN } }
    });

    summarySheet.mergeCells("A1:D1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = `KathKhata AI — Business Report (${range.toUpperCase()})`;
    titleCell.font = { bold: true, size: 16, color: { argb: WHITE } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_WOOD } };
    summarySheet.getRow(1).height = 32;

    summarySheet.addRow([]);

    const summaryHeaderRow = summarySheet.addRow(["Metric", "Amount (BDT)"]);
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    });

    const summaryRows = [
      ["আয় (Revenue)", totals.revenue],
      ["খরচ (Expense)", totals.expense],
      ["লাভ (Profit)", totals.profit],
      ["ক্ষতি (Loss)", totals.loss]
    ];

    summaryRows.forEach(([label, value], i) => {
      const row = summarySheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).numFmt = '"৳"#,##0.00';
      row.getCell(2).alignment = { horizontal: "right" };
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: i % 2 === 0 ? BRAND_CREAM : WHITE }
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0BD8F" } },
          bottom: { style: "thin", color: { argb: "FFE0BD8F" } },
          left: { style: "thin", color: { argb: "FFE0BD8F" } },
          right: { style: "thin", color: { argb: "FFE0BD8F" } }
        };
      });
    });

    summarySheet.getColumn(1).width = 24;
    summarySheet.getColumn(2).width = 22;

    const detailSheet = workbook.addWorksheet("Daily Breakdown", {
      properties: { tabColor: { argb: BRAND_WOOD } }
    });

    const headers = ["Date", "Revenue (৳)", "Expense (৳)", "Profit (৳)"];
    const headerRow = detailSheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    });
    detailSheet.getRow(1).height = 22;

    merged.forEach((r, i) => {
      const row = detailSheet.addRow([formatDate(r.date, lang), r.revenue, r.expense, r.profit]);
      row.getCell(1).alignment = { horizontal: "center" };
      [2, 3, 4].forEach((col) => {
        row.getCell(col).numFmt = '"৳"#,##0.00';
        row.getCell(col).alignment = { horizontal: "right" };
      });
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: i % 2 === 0 ? BRAND_CREAM : WHITE }
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0BD8F" } },
          bottom: { style: "thin", color: { argb: "FFE0BD8F" } },
          left: { style: "thin", color: { argb: "FFE0BD8F" } },
          right: { style: "thin", color: { argb: "FFE0BD8F" } }
        };
      });
    });

    detailSheet.getCell(`C${detailSheet.rowCount + 2}`).value = "Generated by KathKhata AI";
    detailSheet.getCell(`C${detailSheet.rowCount}`).font = { italic: true, color: { argb: "FF8A5F34" } };

    detailSheet.columns.forEach((col) => {
      col.width = 18;
    });
    detailSheet.autoFilter = { from: "A1", to: `D${headerRow.number}` };
    detailSheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kathkhata-report-${range}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 print:hidden">{t("reports")}</h1>

      <Card>
        <CardHeader
          title={tr("title")}
          action={
            <div className="flex gap-2 print:hidden">
              <Button variant="secondary" size="sm" onClick={exportPdf}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          }
        />

        <div className="flex gap-2 mb-6 print:hidden">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors",
                range === r.key
                  ? "bg-forest-600 text-white"
                  : "bg-wood-100 dark:bg-wood-700 text-wood-600 dark:text-wood-200"
              )}
            >
              {tr(r.key)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: tr("revenue"), value: totals.revenue },
            { label: tr("expense"), value: totals.expense },
            { label: tr("profit"), value: totals.profit },
            { label: tr("loss"), value: totals.loss }
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-wood-100 dark:border-wood-700 p-4">
              <p className="text-sm text-wood-500 dark:text-wood-300">{label}</p>
              <p className="text-xl font-bold text-wood-900 dark:text-cream-50 mt-1">
                {formatCurrency(value, lang)}
              </p>
            </div>
          ))}
        </div>

        <div className="h-72 mt-6">
          {merged.length === 0 ? (
            <div className="h-full flex items-center justify-center text-wood-300 border border-dashed border-wood-200 dark:border-wood-600 rounded-xl">
              {tr("noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ddc4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, lang)} />
                <Legend
                  onClick={(e) => toggleLine(e.dataKey as string)}
                  wrapperStyle={{ cursor: "pointer" }}
                  formatter={(value, entry: any) => (
                    <span style={{ opacity: hiddenLines[entry.dataKey] ? 0.4 : 1 }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2c8f4e"
                  strokeWidth={2}
                  name={tr("revenue")}
                  hide={hiddenLines["revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#a97a45"
                  strokeWidth={2}
                  name={tr("expense")}
                  hide={hiddenLines["expense"]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#402a18"
                  strokeWidth={2}
                  name={tr("profit")}
                  hide={hiddenLines["profit"]}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}