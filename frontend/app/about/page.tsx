"use client";

import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";

type Page = { title: string; body: string; extra?: { team?: { name: string; role: string }[] } | string };

export default function AboutPage() {
  const [page, setPage] = useState<Page>({
    title: "Миссия ва дастаи мо",
    body: "Мо кӯшиш мекунем, ки ҳунармандони тоҷикро бо харидорон пайваст кунем.",
    extra: { team: [] },
  });

  useEffect(() => {
    api.get<Page>("/pages/about").then((p) => {
      const extra = typeof p.extra === "string" ? JSON.parse(p.extra) : p.extra;
      setPage({ ...p, extra });
    }).catch(() => undefined);
  }, []);

  const team = page.extra && typeof page.extra === "object" ? page.extra.team || [] : [];

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="card-shell p-8">
          <h1 className="text-3xl font-semibold">{page.title}</h1>
          <p className="mt-4 max-w-2xl whitespace-pre-wrap text-gray-700">{page.body}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {team.map((p) => (
              <div key={p.name} className="rounded-xl bg-cream p-4 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-navy" />
                <div className="mt-2 font-medium">{p.name}</div>
                <div className="text-sm text-gray-500">{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
