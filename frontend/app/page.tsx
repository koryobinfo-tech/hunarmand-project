"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Category, Product, api } from "@/lib/api";

type Artisan = { id: string; full_name_or_company: string; craft?: string; avatar_image?: string; workshop_address?: string };

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);

  useEffect(() => {
    api.get<Product[]>("/products").then(setProducts).catch(() => setProducts([]));
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
    api.get<Artisan[]>("/artisans").then(setArtisans).catch(() => setArtisans([]));
  }, []);

  const featured = products.slice(0, 8);
  const featureCards = [
    ["01", "Каталог", "Ҳазорҳо маҳсулоти дастӣ аз шаҳрҳои Тоҷикистон", "/catalog", "grad-ruby"],
    ["02", "Фармоиш", "Намуна бор кунед — ҳунарманд медӯзад ё мекананд", "/custom-orders/new", "grad-gold"],
    ["03", "Харита", "Устохонаҳоро дар харита пайдо кунед", "/map", "grad-green"],
    ["04", "AI фарҳангӣ", "Шарҳи нақш, нигоҳубин ва тавсияи мол", "/ai", "grad-blue"],
  ];
  const categoryBars = ["grad-ruby", "grad-green", "grad-blue", "grad-gold", "grad-mix", "grad-ruby"];

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="card-shell premium-card overflow-hidden">
          <div className="relative h-[380px] md:h-[480px]">
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c184e1dde?w=1600"
              alt="Hunarmand"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-ruby/40 to-teal/30" />
            <div className="absolute inset-0 flex flex-col items-start justify-center px-8 text-white md:px-16">
              <span className="rounded-full bg-gradient-to-r from-saffron to-rose px-3 py-1 text-xs font-semibold tracking-wide text-navy">B2C · C2C · фармоиши махсус · AI</span>
              <h1 className="mt-4 text-4xl font-bold md:text-6xl">Hunarmand</h1>
              <p className="mt-3 max-w-xl text-lg text-white/90">
                Бозори онлайни ҳунарҳои мардумӣ: харид мустақиман аз устод, фармоиши инфиродӣ, харитаи устохонаҳо ва роҳбалади фарҳангӣ.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/catalog" className="btn-teal px-6 py-3">
                  Кушодани каталог
                </Link>
                <Link href="/custom-orders/new" className="btn-gold px-6 py-3">
                  Фармоиши махсус
                </Link>
                <Link href="/ai" className="rounded-lg bg-gradient-to-r from-violet to-azure px-6 py-3 font-semibold">
                  Пурсидан аз AI
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {featureCards.map(([n, t, d, h, g]) => (
            <Link key={n} href={h} className="card-shell overflow-hidden p-5 transition hover:-translate-y-0.5">
              <div className={`h-1.5 w-16 rounded-full ${g}`} />
              <div className="mt-3 text-xs font-bold text-gold">{n}</div>
              <div className="mt-2 font-semibold">{t}</div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </Link>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="section-title mb-4 text-2xl font-semibold">Категорияҳо</h2>
          <div className="accent-bar mb-5 max-w-xs" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {categories.map((c, i) => (
              <Link key={c.id} href={`/catalog/${c.slug}`} className="card-shell overflow-hidden text-center transition hover:shadow-xl">
                <div className={`h-1.5 ${categoryBars[i % categoryBars.length]}`} />
                {c.icon_image ? <img src={c.icon_image} alt="" className="h-28 w-full object-cover" /> : <div className="h-28 bg-sand" />}
                <div className="p-3 text-sm font-medium">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title text-2xl font-semibold">Маҳсулоти интихобшуда</h2>
            <Link href="/catalog" className="text-sm font-semibold text-ruby">
              Ҳама каталог →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title text-2xl font-semibold">Ҳунармандони платформа</h2>
            <Link href="/map" className="text-sm font-semibold text-emerald">
              Харита →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {artisans.map((a) => (
              <Link key={a.id} href={`/artisans/${a.id}`} className="card-shell p-4 text-center">
                <img src={a.avatar_image} alt="" className="mx-auto h-16 w-16 rounded-full object-cover ring-4 ring-amber" />
                <div className="mt-2 text-sm font-semibold">{a.full_name_or_company}</div>
                <div className="text-xs text-ruby">{a.craft}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
