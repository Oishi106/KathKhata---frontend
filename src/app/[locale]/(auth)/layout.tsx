import { TreePine } from "lucide-react";
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
          <div className="rounded-xl bg-forest-600 p-2">
            <TreePine className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-lg text-wood-900 dark:text-cream-50">KathKhata AI</span>
        </div>
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
