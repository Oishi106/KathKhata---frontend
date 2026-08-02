import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "KathKhata AI",
  description: "AI-powered business management for sawmill owners"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
