"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Product, api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.get<Product[]>("/products"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function remove(id: string) {
    if (!confirm("Маҳсулот нест карда шавад?")) return;
    await api.del(`/products/${id}`);
    setMsg("Нест карда шуд.");
    await load();
  }

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Маҳсулотҳо</h1>
        <Link href="/admin/products/new" className="btn-teal px-4 py-2 text-sm">
          Илова кардан
        </Link>
      </div>
      {msg && <p className="mb-3 text-sm text-amber">{msg}</p>}
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-navy">
            <img src={p.images?.[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-500">{formatMoney(p.price)} · {p.category_name}</div>
            </div>
            <Link href={`/admin/products/${p.id}`} className="rounded-lg bg-navy px-3 py-2 text-sm text-white">
              Редактировать
            </Link>
            <button onClick={() => remove(p.id)} className="text-sm text-red-600">
              Нест
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/70">Ҳанӯз маҳсулот нест. Илова кунед.</p>}
      </div>
    </AdminShell>
  );
}
