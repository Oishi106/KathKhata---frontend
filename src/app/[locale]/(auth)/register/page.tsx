"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Phone, Lock, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("auth");
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    businessName: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", { ...form, language: locale });
      toast.success("Account created! Please verify the OTP.");
      router.push(`/${locale}/otp-verification?phone=${encodeURIComponent(form.phone)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-1">{t("register")}</h1>
      <p className="text-wood-500 dark:text-wood-300 mb-6">KathKhata AI</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t("name")}</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="text"
              required
              value={form.name}
              onChange={update("name")}
              className="input-field pl-12"
              placeholder={t("namePlaceholder")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("phone")}</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="tel"
              required
              value={form.phone}
              onChange={update("phone")}
              className="input-field pl-12"
              placeholder="01XXXXXXXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email (OTP পাঠানো হবে এখানে)</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="input-field pl-12"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("businessName")}</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-wood-300" />
            <input
              type="text"
              value={form.businessName}
              onChange={update("businessName")}
              className="input-field pl-12"
              placeholder={t("businessNamePlaceholder")}
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
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="input-field pl-12"
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("registerButton")}
        </Button>

        <p className="text-center text-sm text-wood-500 dark:text-wood-300">
          {t("haveAccount")}{" "}
          <Link href={`/${locale}/login`} className="font-medium text-forest-600 hover:underline">
            {t("login")}
          </Link>
        </p>
      </form>         
    </div>
  );
}