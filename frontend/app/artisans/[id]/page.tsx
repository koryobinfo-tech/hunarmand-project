"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

type Detail = {
  id: string;
  full_name_or_company: string;
  craft?: string;
  bio?: string;
  workshop_address?: string;
  avatar_image?: string;
  products: { id: string; title: string; price: number; images: string[] }[];
};

export default function ArtisanPage() {
  const { id } = useParams<{ id: string }>();
  const [a, setA] = useState<Detail | null>(null);
  useEffect(() => {
    api.get<Detail>(`/artisans/${id}`).then(setA).catch(() => setA(null));
  }, [id]);
  if (!a) {
    return (
      <div>
        <Header />
        <p className="p-10">Боргирӣ...</p>
      </div>
    );
  }
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="card-shell p-6">
          <div className="flex items-center gap-4">
            <img src={a.avatar_image} className="h-20 w-20 rounded-full object-cover" alt="" />
            <div>
              <h1 className="text-2xl font-semibold">{a.full_name_or_company}</h1>
              <p className="text-teal">{a.craft}</p>
              <p className="text-sm text-gray-500">{a.workshop_address}</p>
            </div>
          </div>
          <p className="mt-4">{a.bio}</p>
          <a href={`/custom-orders/new?seller=${a.id}`} className="btn-teal mt-4 inline-block px-4 py-2">
            Фармоиши махсус
          </a>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {a.products.map((p) => (
              <a key={p.id} href={`/products/${p.id}`} className="overflow-hidden rounded-xl border">
                <img src={p.images?.[0]} className="h-28 w-full object-cover" alt="" />
                <div className="p-2 text-sm">
                  {p.title}
                  <div className="text-teal">{formatMoney(p.price)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
