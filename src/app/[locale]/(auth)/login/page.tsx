"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("auth");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, password });
      setAuth(data.data.user, data.data.accessToken);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-1">{t("login")}</h1>
      <p className="text-wood-500 dark:text-wood-300 mb-6">কাঠখাতা</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t("phone")}</label>
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
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("password")}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-12"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Link href={`/${locale}/forgot-password`} className="text-sm font-medium text-forest-600 hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("loginButton")}
        </Button>

        <p className="text-center text-sm text-wood-500 dark:text-wood-300">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/register`} className="font-medium text-forest-600 hover:underline">
            {t("register")}
          </Link>
        </p>
      </form>
    </div>
  );
}