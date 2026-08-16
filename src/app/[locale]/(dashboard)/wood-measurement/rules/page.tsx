"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings2, Plus, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Rule {
  _id: string;
  name: string;
  region: string;
  formulaType: "round_log_feet" | "round_log_inch" | "size_cut";
  unit: string;
  description?: string;
  version: number;
  status: "active" | "inactive";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const formulaLabels: Record<string, string> = {
  round_log_feet: "গোল কাঠ (ফুট) — (পরিধি² × দৈর্ঘ্য) / ১৬",
  round_log_inch: "গোল কাঠ (ইঞ্চি) — (দৈর্ঘ্য × পরিধি²) / ২৩০৪",
  size_cut: "সাইজ কাট — (দৈর্ঘ্য × প্রস্থ × পুরুত্ব × পরিমাণ) / ১৪৪"
};

const emptyForm = {
  name: "",
  region: "Custom",
  formulaType: "round_log_feet" as Rule["formulaType"],
  description: ""
};

export default function RuleManagementPage() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "bn" ? "bn" : "en";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: rules } = useQuery({
    queryKey: ["measurement-rules"],
    queryFn: async () => (await api.get<{ data: Rule[] }>("/wood-measurement/rules")).data.data
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/wood-measurement/rules", form),
    onSuccess: () => {
      toast.success(lang === "bn" ? "নিয়ম তৈরি হয়েছে" : "Rule created");
      queryClient.invalidateQueries({ queryKey: ["measurement-rules"] });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create rule")
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      api.patch(`/wood-measurement/rules/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["measurement-rules"] })
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-forest-600" /> {lang === "bn" ? "হিসাবের নিয়ম" : "Calculation Rules"}
        </h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showForm ? "Cancel" : lang === "bn" ? "নতুন নিয়ম" : "New Rule"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title={lang === "bn" ? "নতুন হিসাবের নিয়ম" : "New Calculation Rule"} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">{lang === "bn" ? "নিয়মের নাম" : "Rule Name"}</label>
              <input
                required
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={lang === "bn" ? "যেমন: যশোর গোল কাঠ" : "e.g. Jessore Round Log"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{lang === "bn" ? "অঞ্চল/প্রোফাইল" : "Region/Profile"}</label>
              <input
                className="input-field"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Keshabpur / Jessore / Khulna / Custom"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{lang === "bn" ? "সূত্রের ধরন" : "Formula Type"}</label>
              <select
                className="input-field"
                value={form.formulaType}
                onChange={(e) => setForm((f) => ({ ...f, formulaType: e.target.value as Rule["formulaType"] }))}
              >
                <option value="round_log_feet">{formulaLabels.round_log_feet}</option>
                <option value="round_log_inch">{formulaLabels.round_log_inch}</option>
                <option value="size_cut">{formulaLabels.size_cut}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{lang === "bn" ? "বিবরণ" : "Description"}</label>
              <input
                className="input-field"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={createMutation.isPending}>
                {lang === "bn" ? "নিয়ম তৈরি করুন" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title={lang === "bn" ? "সব নিয়ম" : "All Rules"} />
        <div className="space-y-3">
          {(rules ?? []).map((rule) => (
            <div key={rule._id} className="rounded-xl border border-wood-100 dark:border-wood-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-wood-900 dark:text-cream-50">{rule.name}</h3>
                    {rule.isDefault && (
                      <span className="text-[10px] bg-wood-100 dark:bg-wood-700 text-wood-500 px-2 py-0.5 rounded-full">
                        {lang === "bn" ? "ডিফল্ট" : "Default"}
                      </span>
                    )}
                    <span
                      className={
                        rule.status === "active"
                          ? "text-[10px] bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-200 px-2 py-0.5 rounded-full"
                          : "text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full"
                      }
                    >
                      {rule.status === "active" ? (lang === "bn" ? "সক্রিয়" : "Active") : lang === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-wood-500 mt-1">{rule.region} · v{rule.version}</p>
                  <p className="text-sm text-wood-600 dark:text-wood-300 mt-1">{formulaLabels[rule.formulaType]}</p>
                  {rule.description && <p className="text-xs text-wood-400 mt-1">{rule.description}</p>}
                  <p className="text-[11px] text-wood-300 mt-2">
                    {lang === "bn" ? "সর্বশেষ আপডেট" : "Last updated"}: {formatDate(rule.updatedAt, lang)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    toggleStatusMutation.mutate({ id: rule._id, status: rule.status === "active" ? "inactive" : "active" })
                  }
                  className="text-xs font-medium text-forest-600 hover:underline whitespace-nowrap"
                >
                  {rule.status === "active" ? (lang === "bn" ? "নিষ্ক্রিয় করুন" : "Deactivate") : lang === "bn" ? "সক্রিয় করুন" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}