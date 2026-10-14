"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { fileToCompressedDataUrl } from "@/lib/media";

type Post = { id: string; title: string; excerpt: string; body: string; cover_image?: string };

const empty = { id: "", title: "", excerpt: "", body: "", cover_image: "" };

export default function AdminBlogPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.get<Post[]>("/blog"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.id) await api.put(`/blog/${form.id}`, form);
    else await api.post("/blog", form);
    setForm(empty);
    setMsg("Мақола сабт шуд.");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Мақола нест шавад?")) return;
    await api.del(`/blog/${id}`);
    await load();
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Блог</h1>
      <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl bg-white p-5 text-navy">
        <input className="input" placeholder="Сарлавҳа" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="Хулоса" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea className="input min-h-32" placeholder="Матн" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, cover_image: await fileToCompressedDataUrl(f) }); }} />
        {form.cover_image && <img src={form.cover_image} alt="" className="h-32 rounded-xl object-cover" />}
        <button className="btn-teal py-2">{form.id ? "Нигоҳ доштани таҳрир" : "Иловаи мақола"}</button>
      </form>
      {msg && <p className="mb-3 text-amber">{msg}</p>}
      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-navy">
            <div className="font-semibold">{p.title}</div>
            <div className="flex gap-3">
              <button className="text-sm font-semibold text-teal" onClick={() => setForm({ ...p, cover_image: p.cover_image || "" })}>Редактировать</button>
              <button className="text-sm text-red-600" onClick={() => remove(p.id)}>Нест</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
