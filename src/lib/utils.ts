import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale: "bn" | "en" = "bn") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(value: number, locale: "bn" | "en" = "bn") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD").format(value);
}

export function formatDate(date: string | Date, locale: "bn" | "en" = "bn") {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}
