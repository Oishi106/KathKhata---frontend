"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("auth");
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { phone });
      toast.success(t("forgotPasswordSubtitle"));
      router.push(`/${locale}/reset-password?phone=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-1">{t("forgotPasswordTitle")}</h1>
      <p className="text-wood-500 dark:text-wood-300 mb-6">{t("forgotPasswordSubtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field pl-12"
            placeholder="01XXXXXXXXX"
          />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("sendResetCode")}
        </Button>
      </form>
    </div>
  );
}