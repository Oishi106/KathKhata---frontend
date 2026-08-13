"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, CalendarCheck, Wallet, Users, UserCheck, FileText, History } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { VoiceEntryButton } from "@/components/shared/VoiceEntryButton";
import type { VoiceFieldSpec } from "@/hooks/useVoiceEntry";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Employee, Payroll } from "@/types";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  designation: "",
  salaryType: "monthly" as "daily" | "weekly" | "monthly",
  salaryAmount: "",
  overtimeRatePerHour: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  notes: ""
};

const emptyAttendanceForm = {
  date: new Date().toISOString().slice(0, 10),
  status: "present" as "present" | "absent" | "half_day" | "leave",
  overtimeHours: ""
};

const emptyPaymentForm = {
  type: "advance" as "advance" | "advance_repayment" | "bonus" | "deduction",
  amount: "",
  note: ""
};

const months = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

// enum-ভিত্তিক ফিল্ডের জন্য কথ্য প্রতিশব্দ তালিকা — AI যা বলুক, এখানে মিলিয়ে সঠিক value বের করা হবে
const salaryTypeSynonyms: Record<string, string[]> = {
  daily: ["দৈনিক", "প্রতিদিন", "রোজ"],
  weekly: ["সাপ্তাহিক", "সপ্তাহ"],
  monthly: ["মাসিক", "মাস"]
};

const attendanceStatusSynonyms: Record<string, string[]> = {
  present: ["উপস্থিত", "এসেছে", "কাজে আছে"],
  absent: ["অনুপস্থিত", "আসেনি", "কামাই"],
  half_day: ["অর্ধ দিবস", "অর্ধেক দিন", "হাফ ডে"],
  leave: ["ছুটি", "ছুটিতে"]
};

const paymentTypeSynonyms: Record<string, string[]> = {
  advance: ["অগ্রিম দিয়েছি", "অগ্রিম দিলাম", "অগ্রিম"],
  advance_repayment: ["অগ্রিম শোধ", "শোধ করেছে", "ফেরত দিয়েছে"],
  bonus: ["বোনাস", "বকশিশ", "ঈদ বোনাস"],
  deduction: ["কর্তন", "কেটেছি", "বাদ দিয়েছি"]
};

function matchEnum(spokenText: string, synonymMap: Record<string, string[]>): string | null {
  const lower = spokenText.toLowerCase();
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (synonyms.some((s) => lower.includes(s.toLowerCase()))) return key;
  }
  return null;
}

const employeeVoiceFields: VoiceFieldSpec[] = [
  { name: "name", type: "string", description: "কর্মচারীর নাম" },
  { name: "phone", type: "string", description: "ফোন নম্বর (১১ ডিজিট)" },
  { name: "designation", type: "string", description: "পদবি (যেমন হেড মিস্ত্রি, সহকারী)" },
  { name: "salaryType", type: "string", description: "বেতনের ধরন — দৈনিক, সাপ্তাহিক, নাকি মাসিক" },
  { name: "salaryAmount", type: "number", description: "বেতনের পরিমাণ", keywords: ["বেতন", "টাকা", "মাইনে"] },
  { name: "address", type: "string", description: "ঠিকানা" }
];

const attendanceVoiceFields: VoiceFieldSpec[] = [
  { name: "status", type: "string", description: "উপস্থিতি — উপস্থিত, অনুপস্থিত, অর্ধ দিবস, নাকি ছুটি" },
  { name: "overtimeHours", type: "number", description: "ওভারটাইম কত ঘণ্টা", keywords: ["ওভারটাইম", "ঘণ্টা", "অতিরিক্ত"] }
];

const paymentVoiceFields: VoiceFieldSpec[] = [
  { name: "type", type: "string", description: "লেনদেনের ধরন — অগ্রিম দিয়েছি, অগ্রিম শোধ, বোনাস, নাকি কর্তন" },
  { name: "amount", type: "number", description: "টাকার পরিমাণ", keywords: ["টাকা", "দিয়েছি", "দিছি"] },
  { name: "note", type: "string", description: "কোনো বাড়তি মন্তব্য" }
];

export default function EmployeesPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("employees");
  const tp = useTranslations("payroll");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [attendanceFor, setAttendanceFor] = useState<Employee | null>(null);
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendanceForm);

  const [paymentFor, setPaymentFor] = useState<Employee | null>(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const [payrollFor, setPayrollFor] = useState<Employee | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [activePayroll, setActivePayroll] = useState<Payroll | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [historyFor, setHistoryFor] = useState<Employee | null>(null);

  const { data } = useQuery({
    queryKey: ["employees", search],
    queryFn: async () =>
      (await api.get<{ data: Employee[] }>("/employees", { params: { search } })).data.data
  });

  const { data: stats } = useQuery({
    queryKey: ["employee-stats"],
    queryFn: async () =>
      (
        await api.get<{ data: { totalEmployees: number; active: number; inactive: number; totalAdvanceOutstanding: number } }>(
          "/employees/stats"
        )
      ).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/employees", {
        name: form.name,
        phone: form.phone,
        address: form.address || undefined,
        designation: form.designation || undefined,
        salaryType: form.salaryType,
        salaryAmount: Number(form.salaryAmount),
        overtimeRatePerHour: form.overtimeRatePerHour ? Number(form.overtimeRatePerHour) : undefined,
        joiningDate: form.joiningDate,
        notes: form.notes || undefined
      }),
    onSuccess: () => {
      toast.success("Employee added");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to add employee")
  });

  const attendanceMutation = useMutation({
    mutationFn: async () =>
      api.post(`/employees/${attendanceFor?._id}/attendance`, {
        date: attendanceForm.date,
        status: attendanceForm.status,
        overtimeHours: attendanceForm.overtimeHours ? Number(attendanceForm.overtimeHours) : 0
      }),
    onSuccess: () => {
      toast.success("Attendance recorded");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setAttendanceFor(null);
      setAttendanceForm(emptyAttendanceForm);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record attendance")
  });

  const paymentMutation = useMutation({
    mutationFn: async () =>
      api.post(`/employees/${paymentFor?._id}/payments`, {
        type: paymentForm.type,
        amount: Number(paymentForm.amount),
        note: paymentForm.note || undefined
      }),
    onSuccess: () => {
      toast.success("Transaction recorded");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setPaymentFor(null);
      setPaymentForm(emptyPaymentForm);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record transaction")
  });

  const generatePayrollMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ data: Payroll }>("/payroll/generate", {
          employee: payrollFor?._id,
          month: payrollMonth,
          year: payrollYear
        })
      ).data.data,
    onSuccess: (payroll) => {
      setActivePayroll(payroll);
      setAdjustAmount(String(payroll.manualAdjustment ?? 0));
      setAdjustNote(payroll.manualAdjustmentNote ?? "");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to generate payroll")
  });

  const adjustPayrollMutation = useMutation({
    mutationFn: async () =>
      (
        await api.patch<{ data: Payroll }>(`/payroll/${activePayroll?._id}/adjust`, {
          manualAdjustment: Number(adjustAmount) || 0,
          manualAdjustmentNote: adjustNote || undefined
        })
      ).data.data,
    onSuccess: (payroll) => {
      toast.success("Adjusted");
      setActivePayroll(payroll);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to adjust")
  });

  const confirmPayMutation = useMutation({
    mutationFn: async () =>
      (await api.post<{ data: Payroll }>(`/payroll/${activePayroll?._id}/confirm-pay`)).data.data,
    onSuccess: (payroll) => {
      toast.success("Salary paid");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setActivePayroll(payroll); // মডাল খোলা থাকবে, নতুন paid স্ট্যাটাস দিয়ে দেখাবে
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to confirm payment")
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleEmployeeVoiceResult = (result: Record<string, string | number | null>) => {
    const matchedSalaryType = result.salaryType ? matchEnum(String(result.salaryType), salaryTypeSynonyms) : null;

    setForm((f) => ({
      ...f,
      name: result.name ? String(result.name) : f.name,
      phone: result.phone ? String(result.phone) : f.phone,
      designation: result.designation ? String(result.designation) : f.designation,
      salaryType: (matchedSalaryType as typeof f.salaryType) ?? f.salaryType,
      salaryAmount: result.salaryAmount != null ? String(result.salaryAmount) : f.salaryAmount,
      address: result.address ? String(result.address) : f.address
    }));
    setShowForm(true);
  };

  const handleAttendanceVoiceResult = (result: Record<string, string | number | null>) => {
    const matchedStatus = result.status ? matchEnum(String(result.status), attendanceStatusSynonyms) : null;

    setAttendanceForm((f) => ({
      ...f,
      status: (matchedStatus as typeof f.status) ?? f.status,
      overtimeHours: result.overtimeHours != null ? String(result.overtimeHours) : f.overtimeHours
    }));
  };

  const handlePaymentVoiceResult = (result: Record<string, string | number | null>) => {
    const matchedType = result.type ? matchEnum(String(result.type), paymentTypeSynonyms) : null;

    setPaymentForm((f) => ({
      ...f,
      type: (matchedType as typeof f.type) ?? f.type,
      amount: result.amount != null ? String(result.amount) : f.amount,
      note: result.note ? String(result.note) : f.note
    }));
  };

  const columns: Column<Employee>[] = [
    {
      header: t("name"),
      accessor: (r) => (
        <button
          onClick={() => setHistoryFor(r)}
          className="font-medium text-forest-700 dark:text-forest-300 hover:underline"
        >
          {r.name}
        </button>
      )
    },
    { header: t("designation"), accessor: (r) => r.designation ?? "-" },
    {
      header: t("salaryType"),
      accessor: (r) => t(r.salaryType)
    },
    { header: t("salaryAmount"), accessor: (r) => formatCurrency(r.salaryAmount, lang) },

    {
      header: t("advanceBalance"),
      accessor: (r) => (
        <span className={r.advanceBalance > 0 ? "text-red-600 font-semibold" : "text-forest-600"}>
          {formatCurrency(r.advanceBalance, lang)}
        </span>
      )
    },
    {
      header: "",
      accessor: (r) => (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAttendanceFor(r)}
            className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
          >
            <CalendarCheck className="h-3.5 w-3.5" /> {t("markAttendance")}
          </button>
          <button
            onClick={() => setPaymentFor(r)}
            className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
          >
            <Wallet className="h-3.5 w-3.5" /> {t("recordPayment")}
          </button>
          <button
            onClick={() => {
              setPayrollFor(r);
              setActivePayroll(null);
            }}
            className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> {tp("title")}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <VoiceEntryButton fields={employeeVoiceFields} language={lang} onResult={handleEmployeeVoiceResult} />
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? "Cancel" : t("addEmployee")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("totalEmployees")} value={String(stats?.totalEmployees ?? 0)} icon={Users} accent="wood" />
        <StatCard label={t("active")} value={String(stats?.active ?? 0)} icon={UserCheck} accent="forest" />
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("addEmployee")} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{t("name")}</label>
              <input required className="input-field" value={form.name} onChange={update("name")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("phone")}</label>
              <input required className="input-field" value={form.phone} onChange={update("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("designation")}</label>
              <input className="input-field" value={form.designation} onChange={update("designation")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("salaryType")}</label>
              <select className="input-field" value={form.salaryType} onChange={update("salaryType")}>
                <option value="daily">{t("daily")}</option>
                <option value="weekly">{t("weekly")}</option>
                <option value="monthly">{t("monthly")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("salaryAmount")}</label>
              <input type="number" required min={0} className="input-field" value={form.salaryAmount} onChange={update("salaryAmount")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("overtimeRate")}</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.overtimeRatePerHour}
                onChange={update("overtimeRatePerHour")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("joiningDate")}</label>
              <input type="date" className="input-field" value={form.joiningDate} onChange={update("joiningDate")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("address")}</label>
              <input className="input-field" value={form.address} onChange={update("address")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("notes")}</label>
              <input className="input-field" value={form.notes} onChange={update("notes")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={createMutation.isPending}>
                {t("addEmployee")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <DataTable columns={columns} data={data ?? []} />
      </Card>

      {/* হাজিরা মডাল */}
      {attendanceFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm">
            <CardHeader title={`${t("markAttendance")} — ${attendanceFor.name}`} />
            <div className="mb-4">
              <VoiceEntryButton
                fields={attendanceVoiceFields}
                language={lang}
                onResult={handleAttendanceVoiceResult}
              />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                attendanceMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">{t("attendanceDate")}</label>
                <input
                  type="date"
                  className="input-field"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("attendanceStatus")}</label>
                <select
                  className="input-field"
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm((f) => ({ ...f, status: e.target.value as any }))}
                >
                  <option value="present">{t("present")}</option>
                  <option value="absent">{t("absent")}</option>
                  <option value="half_day">{t("halfDay")}</option>
                  <option value="leave">{t("leave")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("overtimeHours")}</label>
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={attendanceForm.overtimeHours}
                  onChange={(e) => setAttendanceForm((f) => ({ ...f, overtimeHours: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={attendanceMutation.isPending} className="flex-1">
                  {t("markAttendance")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setAttendanceFor(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* লেনদেন মডাল */}
      {paymentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm">
            <CardHeader title={`${t("recordPayment")} — ${paymentFor.name}`} />
            <div className="mb-4">
              <VoiceEntryButton fields={paymentVoiceFields} language={lang} onResult={handlePaymentVoiceResult} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                paymentMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">{t("paymentType")}</label>
                <select
                  className="input-field"
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, type: e.target.value as any }))}
                >
                  <option value="advance">{t("advance")}</option>
                  <option value="advance_repayment">{t("advanceRepayment")}</option>
                  <option value="bonus">{t("bonus")}</option>
                  <option value="deduction">{t("deduction")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("amount")}</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="input-field"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("note")}</label>
                <input
                  className="input-field"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={paymentMutation.isPending} className="flex-1">
                  {t("recordPayment")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPaymentFor(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* পে-রোল মডাল */}
      {payrollFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <CardHeader title={`${tp("title")} — ${payrollFor.name}`} />

            {!activePayroll ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{tp("selectMonth")}</label>
                    <select
                      className="input-field"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(Number(e.target.value))}
                    >
                      {months.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {lang === "bn" ? m : new Date(2000, idx, 1).toLocaleString("en", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tp("selectYear")}</label>
                    <input
                      type="number"
                      className="input-field"
                      value={payrollYear}
                      onChange={(e) => setPayrollYear(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => generatePayrollMutation.mutate()}
                  loading={generatePayrollMutation.isPending}
                  className="w-full"
                >
                  {tp("generatePayroll")}
                </Button>
                <Button variant="secondary" onClick={() => setPayrollFor(null)} className="w-full">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-wood-500">{tp("presentDays")}</span>
                    <span className="font-medium">{activePayroll.presentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">{tp("halfDays")}</span>
                    <span className="font-medium">{activePayroll.halfDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">{tp("absentDays")}</span>
                    <span className="font-medium">{activePayroll.absentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">{tp("leaveDays")}</span>
                    <span className="font-medium">{activePayroll.leaveDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">{tp("overtimeHours")}</span>
                    <span className="font-medium">{activePayroll.overtimeHours}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-wood-50 dark:bg-wood-900/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{tp("basePay")}</span>
                    <span>{formatCurrency(activePayroll.basePay, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tp("overtimePay")}</span>
                    <span>{formatCurrency(activePayroll.overtimePay, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tp("bonusTotal")}</span>
                    <span className="text-forest-600">+{formatCurrency(activePayroll.bonusTotal, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tp("deductionTotal")}</span>
                    <span className="text-red-600">-{formatCurrency(activePayroll.deductionTotal, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tp("advanceDeducted")}</span>
                    <span className="text-red-600">-{formatCurrency(activePayroll.advanceDeducted, lang)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-wood-200 dark:border-wood-700 pt-2">
                    <span>{tp("calculatedTotal")}</span>
                    <span>{formatCurrency(activePayroll.calculatedTotal, lang)}</span>
                  </div>
                </div>

                {activePayroll.status === "draft" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{tp("manualAdjustment")}</label>
                      <input
                        type="number"
                        className="input-field"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{tp("adjustmentNote")}</label>
                      <input className="input-field" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => adjustPayrollMutation.mutate()}
                      loading={adjustPayrollMutation.isPending}
                      className="w-full"
                    >
                      {tp("adjust")}
                    </Button>
                  </div>
                )}

                <div className="rounded-xl bg-forest-50 dark:bg-forest-900/30 p-4 flex justify-between items-center">
                  <span className="font-semibold">{tp("netPayable")}</span>
                  <span className="text-xl font-bold text-forest-700 dark:text-forest-300">
                    {formatCurrency(activePayroll.netPayable, lang)}
                  </span>
                </div>

                {activePayroll.status === "paid" ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full rounded-xl px-4 py-3 text-base font-medium bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300 cursor-not-allowed"
                    >
                      ✓ {tp("paid")}
                    </button>
                    <p className="text-center text-xs text-wood-500">
                      {activePayroll.paidDate ? formatDate(activePayroll.paidDate, lang) : ""}
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => confirmPayMutation.mutate()}
                    loading={confirmPayMutation.isPending}
                    className="w-full"
                  >
                    {tp("confirmPay")}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => {
                    setPayrollFor(null);
                    setActivePayroll(null);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ইতিহাস মডাল — হাজিরা + লেনদেন */}
      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <CardHeader title={`${t("viewHistory")} — ${historyFor.name}`} />

            <h3 className="text-sm font-semibold text-wood-700 dark:text-wood-300 mt-2 mb-3">
              {t("attendanceHistory")}
            </h3>
            {!historyFor.attendanceHistory || historyFor.attendanceHistory.length === 0 ? (
              <p className="text-sm text-wood-500 mb-4">কোনো হাজিরার রেকর্ড নেই</p>
            ) : (
              <div className="space-y-2 mb-6">
                {[...historyFor.attendanceHistory]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((r, idx) => {
                    const statusStyle: Record<string, string> = {
                      present: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
                      absent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                      half_day: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                      leave: "bg-wood-100 text-wood-600 dark:bg-wood-700 dark:text-wood-300"
                    };
                    const statusLabel: Record<string, string> = {
                      present: t("present"),
                      absent: t("absent"),
                      half_day: t("halfDay"),
                      leave: t("leave")
                    };
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-wood-100 dark:border-wood-700 px-3 py-2"
                      >
                        <span className="text-sm">{formatDate(r.date, lang)}</span>
                        <div className="flex items-center gap-2">
                          {r.overtimeHours > 0 && (
                            <span className="text-xs text-wood-500">OT: {r.overtimeHours}h</span>
                          )}
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status]}`}
                          >
                            {statusLabel[r.status]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <h3 className="text-sm font-semibold text-wood-700 dark:text-wood-300 mb-3">
              {t("paymentHistory")}
            </h3>
            {!historyFor.paymentHistory || historyFor.paymentHistory.length === 0 ? (
              <p className="text-sm text-wood-500 mb-4">কোনো লেনদেনের রেকর্ড নেই</p>
            ) : (
              <div className="space-y-2 mb-4">
                {[...historyFor.paymentHistory]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((r, idx) => {
                    const typeStyle: Record<string, string> = {
                      advance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                      bonus: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
                      salary: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                      deduction: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    };
                    const typeLabel: Record<string, string> = {
                      advance: t("advance"),
                      bonus: t("bonus"),
                      salary: "বেতন",
                      deduction: t("deduction")
                    };
                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-wood-100 dark:border-wood-700 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${typeStyle[r.type]}`}
                            >
                              {typeLabel[r.type]}
                            </span>
                            <span className="text-xs text-wood-500">{formatDate(r.date, lang)}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(r.amount, lang)}</span>
                        </div>
                        {r.note && <p className="text-xs text-wood-500 mt-1">{r.note}</p>}
                      </div>
                    );
                  })}
              </div>
            )}

            <Button variant="secondary" onClick={() => setHistoryFor(null)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}