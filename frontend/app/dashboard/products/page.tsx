"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

export default function SellerProductsPage() {
  const { auth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  async function load() {
    if (!auth) return;
    const list = await api.get<Product[]>(`/products?seller_id=${auth.user_id}`);
    setProducts(list);
  }

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, [auth]);

  async function remove(id: string) {
    await api.del(`/products/${id}`);
    await load();
  }

  return (
    <DashboardShell role="artisan">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Илова / Таҳрири маҳсулот</h1>
        <Link href="/dashboard/products/new" className="btn-teal px-4 py-2 text-sm">
          Маҳсулоти нав
        </Link>
      </div>
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
            <img src={p.images?.[0]} className="h-16 w-16 rounded object-cover" alt="" />
            <div className="flex-1">
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-500">{formatMoney(p.price)} · захира {p.stock}</div>
              {p.videos?.[0] && <div className="mt-1 text-xs font-semibold text-ruby">Видео илова шудааст</div>}
            </div>
            <button onClick={() => remove(p.id)} className="text-sm text-red-600">
              Нест кардан
            </button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
