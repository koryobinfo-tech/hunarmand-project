"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Footer, Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Category, Product, api } from "@/lib/api";

export default function CatalogClient() {
  const params = useParams<{ slug?: string }>();
  const search = useSearchParams();
  const slug = params?.slug;
  const q = search.get("q") || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(2000);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => []);
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (slug) qs.set("category", slug);
    if (q) qs.set("q", q);
    if (min) qs.set("min_price", String(min));
    if (max) qs.set("max_price", String(max));
    api.get<Product[]>(`/products?${qs.toString()}`).then(setProducts).catch(() => setProducts([]));
  }, [slug, q, min, max]);

  const title = useMemo(() => {
    const cat = categories.find((c) => c.slug === slug);
    if (cat) return `Саҳифаи ${cat.name}`;
    if (q) return `Ҷустуҷӯ: ${q}`;
    return "Каталоги маҳсулот";
  }, [categories, slug, q]);

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="card-shell h-fit p-4">
          <h3 className="font-semibold">Минтақа / Категория</h3>
          <div className="mt-3 space-y-2 text-sm">
            <a href="/catalog" className={!slug ? "text-teal" : ""}>
              Ҳама
            </a>
            {categories.map((c) => (
              <a key={c.id} href={`/catalog/${c.slug}`} className={`block ${slug === c.slug ? "text-teal" : ""}`}>
                {c.name}
              </a>
            ))}
          </div>
          <h3 className="mt-6 font-semibold">Нарх</h3>
          <div className="mt-2 flex gap-2">
            <input className="input" type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
            <input className="input" type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
          </div>
        </aside>
        <section className="card-shell p-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <span className="text-sm text-gray-500">{products.length} маҳсулот</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
