"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

type Order = { id: string; total_price: number; status: string; created_at: string; items?: { title?: string }[] };

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);

  async function load() {
    setItems(await api.get<Order[]>("/orders"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function saveStatus(id: string, status: string) {
    await api.put(`/orders/${id}`, { status });
    await load();
  }
  async function remove(id: string) {
    if (!confirm("Фармоиш нест шавад?")) return;
    await api.del(`/orders/${id}`);
    await load();
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Фармоишҳо</h1>
      <div className="space-y-2">
        {items.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-navy">
            <div>
              <div className="font-semibold">{formatMoney(o.total_price)}</div>
              <div className="text-xs text-gray-500">{o.items?.map((i) => i.title).join(", ")}</div>
            </div>
            <select className="input w-40" value={o.status} onChange={(e) => saveStatus(o.id, e.target.value)}>
              <option value="pending">интизор</option>
              <option value="paid">пардохт</option>
              <option value="shipped">фиристода</option>
              <option value="delivered">расонида</option>
            </select>
            <button className="text-sm text-red-600" onClick={() => remove(o.id)}>Нест</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/70">Фармоиш нест.</p>}
      </div>
    </AdminShell>
  );
}
