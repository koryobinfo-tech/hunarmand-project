"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Row = {
  id: string;
  role: string;
  full_name_or_company: string;
  phone: string;
  craft?: string;
  bio?: string;
  workshop_address?: string;
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setItems(await api.get<Row[]>("/admin/users"));
  }
  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    await api.put(`/admin/users/${edit.id}`, edit);
    setEdit(null);
    setMsg("Профил навсозӣ шуд.");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Корбар нест шавад?")) return;
    await api.del(`/admin/users/${id}`);
    await load();
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Корбарон</h1>
      {msg && <p className="mb-3 text-amber">{msg}</p>}
      {edit && (
        <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl bg-white p-5 text-navy">
          <h2 className="font-semibold">Редактировать: {edit.full_name_or_company}</h2>
          <input className="input" value={edit.full_name_or_company} onChange={(e) => setEdit({ ...edit, full_name_or_company: e.target.value })} />
          <input className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
          <select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
            <option value="buyer">Харидор</option>
            <option value="artisan">Ҳунарманд</option>
            <option value="admin">Админ</option>
          </select>
          <input className="input" placeholder="Ҳунар / вазифа" value={edit.craft || ""} onChange={(e) => setEdit({ ...edit, craft: e.target.value })} />
          <textarea className="input" placeholder="Тавсиф" value={edit.bio || ""} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-teal px-4 py-2">Нигоҳ доштан</button>
            <button type="button" className="rounded-xl bg-sand px-4 py-2" onClick={() => setEdit(null)}>Бекор</button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {items.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-navy">
            <div>
              <div className="font-semibold">{u.full_name_or_company} · {u.role}</div>
              <div className="text-sm text-gray-500">{u.phone}</div>
            </div>
            <div className="flex gap-3">
              <button className="text-sm font-semibold text-teal" onClick={() => setEdit(u)}>Редактировать</button>
              <button className="text-sm text-red-600" onClick={() => remove(u.id)}>Нест</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
