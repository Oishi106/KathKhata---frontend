# KathKhata AI — Frontend

Bilingual (Bangla/English) frontend for KathKhata AI, an AI-powered
business management system for sawmill owners in Bangladesh.

## Tech Stack
Next.js 15 (App Router), TypeScript, Tailwind CSS, next-intl (i18n),
TanStack Query, Zustand, React Hook Form + Zod, Recharts, Framer Motion,
Lucide Icons.

## Getting Started

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev                   # http://localhost:3000
```

Visiting `/` redirects to `/bn` (default locale). Switch languages with
the selector in the top navbar — `/bn/...` and `/en/...` routes are both
fully translated.

## Structure

- `src/app/[locale]/(auth)/...` — login, OTP, forgot/reset password
- `src/app/[locale]/(dashboard)/...` — dashboard, wood inventory, cutting
  orders, cost calculator, expenses, sales, reports, AI assistant, settings
- `src/components/ui` — Button, Card, StatCard (design system primitives)
- `src/components/layout` — Sidebar, Navbar, LanguageSwitcher, ThemeToggle
- `src/components/shared` — DataTable, StatusBadge, QueryProvider
- `src/i18n/locales/{bn,en}.json` — all UI copy, fully translatable
- `src/lib/api.ts` — axios client with refresh-token handling
- `src/store/authStore.ts` — Zustand auth state (persisted)

## Design

Wood-inspired palette (cream/wood/forest) defined in `tailwind.config.js`,
large touch targets and readable typography throughout for first-time
computer users, light/dark mode via a `dark` class toggle.
