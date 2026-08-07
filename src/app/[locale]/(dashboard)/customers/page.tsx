"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Wallet, Users, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: ""
};

export default function CustomersPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("customers");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const { data } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () =>
      (await api.get<{ data: Customer[] }>("/customers", { params: { search } })).data.data
  });

  const { data: stats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: async () =>
      (
        await api.get<{ data: { totalCustomers: number; totalDue: number; totalAdvance: number } }>(
          "/customers/stats"
        )
      ).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/customers", form),
    onSuccess: () => {
      toast.success("Customer added");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to add customer")
  });

  const paymentMutation = useMutation({
    mutationFn: async () => api.post(`/customers/${payFor?._id}/payments`, { amount: Number(payAmount) }),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      setPayFor(null);
      setPayAmount("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record payment")
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const columns: Column<Customer>[] = [
    { header: t("name"), accessor: (r) => <span className="font-medium">{r.name}</span> },
    { header: t("phone"), accessor: (r) => r.phone },
    {
      header: t("totalDue"),
      accessor: (r) => (
        <span className={r.totalDue > 0 ? "text-red-600 font-semibold" : "text-forest-600"}>
          {formatCurrency(r.totalDue, lang)}
        </span>
      )
    },
    {
      header: t("advanceBalance"),
      accessor: (r) => (
        <span className={r.advanceBalance > 0 ? "text-forest-600 font-semibold" : "text-wood-400"}>
          {formatCurrency(r.advanceBalance, lang)}
        </span>
      )
    },
    {
      header: t("status"),
      accessor: (r) => (
        <span
          className={
            r.status === "active"
              ? "inline-block rounded-full px-3 py-1 text-xs font-semibold bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200"
              : "inline-block rounded-full px-3 py-1 text-xs font-semibold bg-wood-100 text-wood-600 dark:bg-wood-700 dark:text-wood-300"
          }
        >
          {r.status === "active" ? t("active") : t("inactive")}
        </span>
      )
    },
    {
      header: "",
      accessor: (r) => (
        <button
          onClick={() => setPayFor(r)}
          className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
        >
          <Wallet className="h-3.5 w-3.5" /> {t("recordPayment")}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : t("addCustomer")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("totalCustomers")} value={String(stats?.totalCustomers ?? 0)} icon={Users} accent="wood" />
        <StatCard label={t("totalDue")} value={formatCurrency(stats?.totalDue ?? 0, lang)} icon={Wallet} accent="forest" />
        <StatCard
          label={t("advanceBalance")}
          value={formatCurrency(stats?.totalAdvance ?? 0, lang)}
          icon={HandCoins}
          accent="wood"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("addCustomer")} />
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
              <label className="block text-sm font-medium mb-1">{t("email")}</label>
              <input type="email" className="input-field" value={form.email} onChange={update("email")} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{t("address")}</label>
              <input className="input-field" value={form.address} onChange={update("address")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">{t("notes")}</label>
              <input className="input-field" value={form.notes} onChange={update("notes")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={createMutation.isPending}>
                {t("addCustomer")}
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

      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm">
            <CardHeader title={`${t("recordPayment")} — ${payFor.name}`} />
            <p className="text-sm text-wood-500 mb-3">
              {t("totalDue")}: {formatCurrency(payFor.totalDue, lang)}
            </p>
            <input
              type="number"
              min={0}
              className="input-field mb-4"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
            />
            <div className="flex gap-2">
              <Button onClick={() => paymentMutation.mutate()} loading={paymentMutation.isPending} className="flex-1">
                {t("recordPayment")}
              </Button>
              <Button variant="secondary" onClick={() => setPayFor(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}