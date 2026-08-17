"use client";

import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const clearCustomValidity = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { phone, token, newPassword });
      toast.success("Password reset successful. Please log in.");
      router.push(`/${locale}/login`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-1">{t("resetPassword")}</h1>
      <p className="text-wood-500 dark:text-wood-300 mb-6">{t("forgotPasswordSubtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t("resetCode")}</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="text"
              required
              maxLength={6}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                clearCustomValidity(e);
              }}
              onInvalid={(e) => {
                if (e.currentTarget.validity.valueMissing) {
                  e.currentTarget.setCustomValidity(t("fieldRequired"));
                }
              }}
              className="input-field pl-12 tracking-widest text-lg font-semibold"
              placeholder={t("resetCodePlaceholder")}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("newPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearCustomValidity(e);
              }}
              onInvalid={(e) => {
                if (e.currentTarget.validity.valueMissing) {
                  e.currentTarget.setCustomValidity(t("fieldRequired"));
                } else if (e.currentTarget.validity.tooShort) {
                  e.currentTarget.setCustomValidity(t("passwordMinLength"));
                }
              }}
              className="input-field pl-12"
              placeholder="••••••••"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("resetPasswordButton")}
        </Button>
      </form>
    </div>
  );
}