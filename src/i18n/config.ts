export const locales = ["bn", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "bn";

export const localeNames: Record<Locale, string> = {
  bn: "বাংলা",
  en: "English"
};
