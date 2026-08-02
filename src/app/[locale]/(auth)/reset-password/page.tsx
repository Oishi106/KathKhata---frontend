"use client";


import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { phone, token, newPassword });
      toast.success("Password reset. Please log in.");
      router.push(`/${locale}/login`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-6">{t("resetPassword")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="input-field"
          placeholder="Reset code"
        />
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field pl-12"
            placeholder={t("newPassword")}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("resetPassword")}
        </Button>
      </form>
    </div>
  );
}
