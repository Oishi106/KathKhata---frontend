"use client";

import { Menu } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "@/store/authStore";

export function Navbar({ locale, onMenuClick }: { locale: string; onMenuClick?: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-wood-100 dark:border-wood-700 bg-white/90 dark:bg-wood-800/90 backdrop-blur px-4 md:px-8 py-4">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-wood-100 dark:hover:bg-wood-700">
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <ThemeToggle />
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 border-l border-wood-100 dark:border-wood-700">
          <div className="h-9 w-9 rounded-full bg-forest-600 text-white flex items-center justify-center font-semibold">
            {user?.name?.charAt(0) ?? "S"}
          </div>
          <span className="hidden md:block text-sm font-medium text-wood-700 dark:text-cream-100">
            {user?.businessName ?? user?.name ?? "Sawmill Owner"}
          </span>
        </div>
      </div>
    </header>
  );
}