"use client";


import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function OtpVerificationPage() {
  const { locale } = useParams<{ locale: string }>();

  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { phone, otp: otp.join("") });
      toast.success("Phone verified! Please log in.");
      router.push(`/${locale}/login`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card text-center">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50 mb-1">{t("otpTitle")}</h1>
      <p className="text-wood-500 dark:text-wood-300 mb-6">{t("otpSubtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              maxLength={1}
              className="w-12 h-14 text-center text-2xl font-bold input-field"
            />
          ))}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Verify
        </Button>
      </form>
    </div>
  );
}
