import Image from "next/image";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default async function AuthLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-wood-900 flex flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="কাঠখাতা" width={60} height={60} className="rounded-full" />
          <span className="font-bold text-xl text-wood-900 dark:text-cream-50">কাঠখাতা</span>
        </div>
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}