"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { BusinessSettings } from "@/types";

const emptyForm = {
  businessName: "",
  phone: "",
  address: "",
  currency: "",
  currencySymbol: "",
  timezone: "",
  invoicePrefix: "",
  invoiceStartingNumber: "",
  dateFormat: "DD/MM/YYYY" as "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
};

export default function BusinessSettingsPage() {
  const t = useTranslations("businessSettings");
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => (await api.get<{ data: BusinessSettings }>("/settings")).data.data
  });

  useEffect(() => {
    if (data) {
      setForm({
        businessName: data.businessName ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        currency: data.currency ?? "",
        currencySymbol: data.currencySymbol ?? "",
        timezone: data.timezone ?? "",
        invoicePrefix: data.invoicePrefix ?? "",
        invoiceStartingNumber: String(data.invoiceStartingNumber ?? 1),
        dateFormat: data.dateFormat ?? "DD/MM/YYYY"
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      api.patch("/settings", {
        businessName: form.businessName,
        phone: form.phone || undefined,
        address: form.address || undefined,
        currency: form.currency || undefined,
        currencySymbol: form.currencySymbol || undefined,
        timezone: form.timezone || undefined,
        invoicePrefix: form.invoicePrefix || undefined,
        invoiceStartingNumber: form.invoiceStartingNumber ? Number(form.invoiceStartingNumber) : undefined,
        dateFormat: form.dateFormat
      }),
    onSuccess: () => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to save settings")
  });

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("title")}</h1>

      <Card>
        <CardHeader title={t("title")} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{t("businessName")}</label>
            <input required className="input-field" value={form.businessName} onChange={update("businessName")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("phone")}</label>
            <input className="input-field" value={form.phone} onChange={update("phone")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("address")}</label>
            <input className="input-field" value={form.address} onChange={update("address")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("currency")}</label>
            <input className="input-field" value={form.currency} onChange={update("currency")} placeholder="BDT" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("currencySymbol")}</label>
            <input
              className="input-field"
              value={form.currencySymbol}
              onChange={update("currencySymbol")}
              placeholder="৳"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("timezone")}</label>
            <input
              className="input-field"
              value={form.timezone}
              onChange={update("timezone")}
              placeholder="Asia/Dhaka"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("dateFormat")}</label>
            <select className="input-field" value={form.dateFormat} onChange={update("dateFormat")}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("invoicePrefix")}</label>
            <input
              className="input-field"
              value={form.invoicePrefix}
              onChange={update("invoicePrefix")}
              placeholder="INV-"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("invoiceStartingNumber")}</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={form.invoiceStartingNumber}
              onChange={update("invoiceStartingNumber")}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" loading={updateMutation.isPending}>
              {t("save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}