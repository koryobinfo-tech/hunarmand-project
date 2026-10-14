"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

const CARDS = [
  { href: "/admin/products", label: "Маҳсулотҳо", desc: "Илова, таҳрир ва нест кардани ҳунарҳо" },
  { href: "/admin/categories", label: "Категорияҳо", desc: "Идораи қисматҳои каталог" },
  { href: "/admin/users", label: "Корбарон", desc: "Ҳунармандон, харидорон ва нақшҳо" },
  { href: "/admin/blog", label: "Блог", desc: "Мақолаҳои фарҳангӣ" },
  { href: "/admin/pages", label: "Саҳифаҳо", desc: "Матни «Дар бораи мо» ва дигар саҳифаҳо" },
  { href: "/admin/orders", label: "Фармоишҳо", desc: "Харидҳои сомона" },
  { href: "/admin/custom-orders", label: "Фармоиши махсус", desc: "Дархостҳои инфиродӣ" },
  { href: "/admin/profile", label: "Профил", desc: "Ном, акс ва рақами админ" },
];

export default function AdminHomePage() {
  const [storage, setStorage] = useState<{ counts?: { users: number; products: number }; persistent?: boolean } | null>(null);
  useEffect(() => {
    api.get<typeof storage>("/storage").then(setStorage).catch(() => undefined);
  }, []);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Панели идоракунӣ</h1>
          <p className="mt-1 text-sm text-white/70">Ҳамаи қисмҳои сомона аз ин ҷо идора мешаванд.</p>
        </div>
        <Link href="/admin/products" className="btn-teal px-4 py-2 text-sm">
          Иловаи маҳсулот
        </Link>
      </div>
      <div className="mb-6 rounded-2xl bg-white/10 px-4 py-3 text-sm">
        База: {storage?.persistent ? "доимӣ" : "пайваст нашудааст"} · {storage?.counts?.products ?? 0} маҳсулот · {storage?.counts?.users ?? 0} корбар
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl bg-white p-5 text-navy shadow-xl transition hover:-translate-y-0.5">
            <div className="font-semibold">{c.label}</div>
            <p className="mt-2 text-sm text-gray-600">{c.desc}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-ruby">Редактировать →</span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
