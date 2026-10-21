import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Панели админ — Hunarmand",
  description: "Даромади махсуси соҳиби сомонаи Hunarmand.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
