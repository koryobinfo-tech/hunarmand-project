"use client";

import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";
import { ABOUT_BODY, ABOUT_TEAM, ABOUT_TITLE } from "@/lib/culture";

type Page = { title: string; body: string; extra?: { team?: { name: string; role: string }[] } | string };

export default function AboutPage() {
  const [page, setPage] = useState<Page>({
    title: ABOUT_TITLE,
    body: ABOUT_BODY,
    extra: { team: ABOUT_TEAM },
  });

  useEffect(() => {
    api
      .get<Page>("/pages/about")
      .then((p) => {
        const extra = typeof p.extra === "string" ? JSON.parse(p.extra) : p.extra;
        setPage({
          title: p.title || ABOUT_TITLE,
          body: p.body || ABOUT_BODY,
          extra: extra?.team?.length ? extra : { team: ABOUT_TEAM },
        });
      })
      .catch(() => undefined);
  }, []);

  const team = page.extra && typeof page.extra === "object" ? page.extra.team || ABOUT_TEAM : ABOUT_TEAM;

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="card-shell p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ruby">Hunarmand.tj</p>
          <h1 className="mt-2 text-3xl font-semibold">{page.title}</h1>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-8 text-gray-700">{page.body}</p>
          <h2 className="mt-10 text-xl font-semibold">Асосгузорони сомона</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {team.map((p) => (
              <div key={p.name} className="rounded-2xl bg-cream p-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-saffron via-ruby to-teal text-2xl font-bold text-white">
                  {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="mt-3 font-semibold">{p.name}</div>
                <div className="text-sm text-ruby">{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
