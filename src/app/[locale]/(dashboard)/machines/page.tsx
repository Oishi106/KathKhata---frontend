"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Wrench, Cog, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { VoiceEntryButton } from "@/components/shared/VoiceEntryButton";
import type { VoiceFieldSpec } from "@/hooks/useVoiceEntry";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Machine } from "@/types";

const emptyForm = {
  name: "",
  type: "",
  modelNumber: "",
  purchaseDate: "",
  purchasePrice: "",
  location: "",
  notes: ""
};

const emptyMaintenanceForm = {
  type: "routine" as "routine" | "repair",
  cost: "",
  description: "",
  performedBy: "",
  nextMaintenanceDate: ""
};

const machineVoiceFields: VoiceFieldSpec[] = [
  { name: "name", type: "string", description: "মেশিনের নাম" },
  { name: "type", type: "string", description: "মেশিনের ধরন (যেমন করাত মেশিন, প্লানার)" },
  { name: "modelNumber", type: "string", description: "মডেল নম্বর (থাকলে)" },
  { name: "purchasePrice", type: "number", description: "ক্রয় মূল্য টাকায়", keywords: ["দাম", "মূল্য", "টাকায়", "কিনেছি"] },
  { name: "location", type: "string", description: "মেশিন কোথায় রাখা আছে" }
];

const maintenanceVoiceFields: VoiceFieldSpec[] = [
  { name: "cost", type: "number", description: "মেরামত/সার্ভিসিং খরচ টাকায়", keywords: ["খরচ", "টাকা", "দিয়েছি"] },
  { name: "performedBy", type: "string", description: "কে মেরামত করেছে (মিস্ত্রি/দোকানের নাম)" },
  { name: "description", type: "string", description: "কী মেরামত করা হয়েছে তার বিবরণ" }
];

export default function MachinesPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("machines");
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [maintenanceFor, setMaintenanceFor] = useState<Machine | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenanceForm);
  const [historyFor, setHistoryFor] = useState<Machine | null>(null);

  const { data } = useQuery({
    queryKey: ["machines", search],
    queryFn: async () =>
      (await api.get<{ data: Machine[] }>("/machines", { params: { search } })).data.data
  });

  const { data: stats } = useQuery({
    queryKey: ["machine-stats"],
    queryFn: async () =>
      (
        await api.get<{
          data: { totalMachines: number; operational: number; underMaintenance: number; outOfOrder: number; totalMaintenanceCost: number };
        }>("/machines/stats")
      ).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/machines", {
        name: form.name,
        type: form.type || undefined,
        modelNumber: form.modelNumber || undefined,
        purchaseDate: form.purchaseDate || undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        location: form.location || undefined,
        notes: form.notes || undefined
      }),
    onSuccess: () => {
      toast.success("Machine added");
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      queryClient.invalidateQueries({ queryKey: ["machine-stats"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to add machine")
  });

  const maintenanceMutation = useMutation({
    mutationFn: async () =>
      api.post(`/machines/${maintenanceFor?._id}/maintenance`, {
        type: maintenanceForm.type,
        cost: Number(maintenanceForm.cost),
        description: maintenanceForm.description || undefined,
        performedBy: maintenanceForm.performedBy || undefined,
        nextMaintenanceDate: maintenanceForm.nextMaintenanceDate || undefined
      }),
    onSuccess: () => {
      toast.success("Maintenance recorded");
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      queryClient.invalidateQueries({ queryKey: ["machine-stats"] });
      setMaintenanceFor(null);
      setMaintenanceForm(emptyMaintenanceForm);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record maintenance")
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Machine["status"] }) =>
      api.patch(`/machines/${id}`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      queryClient.invalidateQueries({ queryKey: ["machine-stats"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update status")
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateMaintenance =
    (key: keyof typeof maintenanceForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setMaintenanceForm((f) => ({ ...f, [key]: e.target.value }));

  const handleVoiceResult = (result: Record<string, string | number | null>) => {
    setForm((f) => ({
      ...f,
      name: result.name ? String(result.name) : f.name,
      type: result.type ? String(result.type) : f.type,
      modelNumber: result.modelNumber ? String(result.modelNumber) : f.modelNumber,
      purchasePrice: result.purchasePrice != null ? String(result.purchasePrice) : f.purchasePrice,
      location: result.location ? String(result.location) : f.location
    }));
    setShowForm(true);
  };

  const handleMaintenanceVoiceResult = (result: Record<string, string | number | null>) => {
    setMaintenanceForm((f) => ({
      ...f,
      cost: result.cost != null ? String(result.cost) : f.cost,
      performedBy: result.performedBy ? String(result.performedBy) : f.performedBy,
      description: result.description ? String(result.description) : f.description
    }));
  };

  const statusColors: Record<Machine["status"], string> = {
    operational: "bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200",
    under_maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    out_of_order: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  };

  const statusSelect = (machine: Machine) => (
    <select
      value={machine.status}
      onChange={(e) =>
        statusMutation.mutate({ id: machine._id, status: e.target.value as Machine["status"] })
      }
      className={`rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer ${statusColors[machine.status]}`}
    >
      <option value="operational">{t("operational")}</option>
      <option value="under_maintenance">{t("underMaintenance")}</option>
      <option value="out_of_order">{t("outOfOrder")}</option>
    </select>
  );

  const columns: Column<Machine>[] = [
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
    { header: t("type"), accessor: (r) => r.type ?? "-" },
    { header: t("modelNumber"), accessor: (r) => r.modelNumber ?? "-" },
    { header: t("status"), accessor: (r) => statusSelect(r) },
    {
      header: t("totalMaintenanceCost"),
      accessor: (r) => formatCurrency(r.totalMaintenanceCost, lang)
    },
    {
      header: t("lastMaintenanceDate"),
      accessor: (r) => (r.lastMaintenanceDate ? formatDate(r.lastMaintenanceDate, lang) : "-")
    },
    {
      header: "",
      accessor: (r) => (
        <button
          onClick={() => setMaintenanceFor(r)}
          className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline"
        >
          <Wrench className="h-3.5 w-3.5" /> {t("addMaintenance")}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <VoiceEntryButton fields={machineVoiceFields} language={lang} onResult={handleVoiceResult} />
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showForm ? "Cancel" : t("addMachine")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("totalMachines")} value={String(stats?.totalMachines ?? 0)} icon={Cog} accent="wood" />
        <StatCard label={t("operational")} value={String(stats?.operational ?? 0)} icon={CheckCircle2} accent="forest" />
        <StatCard label={t("underMaintenance")} value={String(stats?.underMaintenance ?? 0)} icon={Wrench} accent="wood" />
        <StatCard label={t("outOfOrder")} value={String(stats?.outOfOrder ?? 0)} icon={AlertTriangle} accent="wood" />
      </div>

      {showForm && (
        <Card>
          <CardHeader title={t("addMachine")} />
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
              <label className="block text-sm font-medium mb-1">{t("type")}</label>
              <input className="input-field" value={form.type} onChange={update("type")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("modelNumber")}</label>
              <input className="input-field" value={form.modelNumber} onChange={update("modelNumber")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("purchaseDate")}</label>
              <input type="date" className="input-field" value={form.purchaseDate} onChange={update("purchaseDate")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("purchasePrice")}</label>
              <input type="number" min={0} className="input-field" value={form.purchasePrice} onChange={update("purchasePrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("location")}</label>
              <input className="input-field" value={form.location} onChange={update("location")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">{t("notes")}</label>
              <input className="input-field" value={form.notes} onChange={update("notes")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={createMutation.isPending}>
                {t("addMachine")}
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

      {maintenanceFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md">
            <CardHeader title={`${t("addMaintenance")} — ${maintenanceFor.name}`} />
            <div className="mb-4">
              <VoiceEntryButton
                fields={maintenanceVoiceFields}
                language={lang}
                onResult={handleMaintenanceVoiceResult}
              />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                maintenanceMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">{t("maintenanceType")}</label>
                <select className="input-field" value={maintenanceForm.type} onChange={updateMaintenance("type")}>
                  <option value="routine">{t("routine")}</option>
                  <option value="repair">{t("repair")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("cost")}</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="input-field"
                  value={maintenanceForm.cost}
                  onChange={updateMaintenance("cost")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("performedBy")}</label>
                <input className="input-field" value={maintenanceForm.performedBy} onChange={updateMaintenance("performedBy")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("description")}</label>
                <input className="input-field" value={maintenanceForm.description} onChange={updateMaintenance("description")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("nextMaintenanceDate")}</label>
                <input
                  type="date"
                  className="input-field"
                  value={maintenanceForm.nextMaintenanceDate}
                  onChange={updateMaintenance("nextMaintenanceDate")}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={maintenanceMutation.isPending} className="flex-1">
                  {t("addMaintenance")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMaintenanceFor(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader title={`${t("title")} — ${historyFor.name}`} />
            {!historyFor.maintenanceHistory || historyFor.maintenanceHistory.length === 0 ? (
              <p className="text-sm text-wood-500 py-4">কোনো মেইনটেন্যান্স রেকর্ড নেই</p>
            ) : (
              <div className="space-y-3">
                {[...historyFor.maintenanceHistory]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-wood-100 dark:border-wood-700 p-4 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={
                              record.type === "repair"
                                ? "inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200"
                            }
                          >
                            {record.type === "repair" ? t("repair") : t("routine")}
                          </span>
                          <span className="text-xs text-wood-500">{formatDate(record.date, lang)}</span>
                        </div>
                        {record.performedBy && (
                          <p className="text-sm text-wood-600 dark:text-wood-300">
                            {t("performedBy")}: {record.performedBy}
                          </p>
                        )}
                        {record.description && (
                          <p className="text-sm text-wood-500 mt-1">{record.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-wood-900 dark:text-cream-50 whitespace-nowrap">
                        {formatCurrency(record.cost, lang)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setHistoryFor(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}