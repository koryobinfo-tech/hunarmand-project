"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Row = { id: string; title: string; status: string; buyer_name?: string; seller_name?: string };

export default function AdminCustomOrdersPage() {
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    setItems(await api.get<Row[]>("/custom-orders"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function saveStatus(id: string, status: string) {
    await api.put(`/custom-orders/${id}`, { status });
    await load();
  }
  async function remove(id: string) {
    if (!confirm("Дархост нест шавад?")) return;
    await api.del(`/custom-orders/${id}`);
    await load();
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Фармоишҳои махсус</h1>
      <div className="space-y-2">
        {items.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-navy">
            <div>
              <div className="font-semibold">{o.title}</div>
              <div className="text-xs text-gray-500">{o.buyer_name} → {o.seller_name}</div>
            </div>
            <select className="input w-40" value={o.status} onChange={(e) => saveStatus(o.id, e.target.value)}>
              <option value="requested">дархост</option>
              <option value="accepted">қабул</option>
              <option value="in_progress">дар кор</option>
              <option value="completed">анҷом</option>
            </select>
            <button className="text-sm text-red-600" onClick={() => remove(o.id)}>Нест</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/70">Дархост нест.</p>}
      </div>
    </AdminShell>
  );
}
