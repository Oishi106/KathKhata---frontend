"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (locale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex items-center gap-1 rounded-xl bg-wood-100 dark:bg-wood-700 p-1">
      <Globe className="h-4 w-4 text-wood-500 ml-2" />
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            currentLocale === locale
              ? "bg-white dark:bg-wood-800 text-forest-700 dark:text-forest-300 shadow-sm"
              : "text-wood-500 dark:text-wood-300"
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
