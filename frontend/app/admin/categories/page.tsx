"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Category, api } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ id: "", name: "", slug: "", description: "" });
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.get<Category[]>("/categories"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.id) await api.put(`/categories/${form.id}`, form);
    else await api.post("/categories", form);
    setForm({ id: "", name: "", slug: "", description: "" });
    setMsg("Сабт шуд.");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Категория нест шавад?")) return;
    await api.del(`/categories/${id}`);
    await load();
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Категорияҳо</h1>
      <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl bg-white p-5 text-navy md:grid-cols-2">
        <input className="input" placeholder="Ном" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
        <input className="input" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Тавсиф" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-teal py-2">{form.id ? "Нигоҳ доштани таҳрир" : "Илова кардан"}</button>
      </form>
      {msg && <p className="mb-3 text-amber">{msg}</p>}
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-navy">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-gray-500">{c.slug}</div>
            </div>
            <div className="flex gap-3">
              <button className="text-sm font-semibold text-teal" onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description || "" })}>
                Редактировать
              </button>
              <button className="text-sm text-red-600" onClick={() => remove(c.id)}>Нест</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
