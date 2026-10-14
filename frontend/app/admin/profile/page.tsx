"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { fileToCompressedDataUrl } from "@/lib/media";

export default function AdminProfilePage() {
  const { profile, refresh } = useAuth();
  const [form, setForm] = useState({ full_name_or_company: "", phone: "ADMIN", bio: "", craft: "", avatar_image: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name_or_company: profile.full_name_or_company || "",
      phone: "ADMIN",
      bio: profile.bio || "",
      craft: profile.craft || "",
      avatar_image: profile.avatar_image || "",
    });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.put("/auth/me", form);
      await refresh();
      setMsg("Профили админ сабт шуд.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Редактировать профили админ</h1>
      <form onSubmit={save} className="grid max-w-xl gap-3 rounded-2xl bg-white p-5 text-navy">
        {form.avatar_image && <img src={form.avatar_image} alt="" className="h-24 w-24 rounded-full object-cover" />}
        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, avatar_image: await fileToCompressedDataUrl(f) }); }} />
        <input className="input" placeholder="Ном" value={form.full_name_or_company} onChange={(e) => setForm({ ...form, full_name_or_company: e.target.value })} />
        <input className="input bg-gray-100" value="ADMIN" disabled />
        <input className="input" placeholder="Вазифа" value={form.craft} onChange={(e) => setForm({ ...form, craft: e.target.value })} />
        <textarea className="input min-h-24" placeholder="Тавсиф" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        {error && <p className="text-red-600">{error}</p>}
        {msg && <p className="text-teal">{msg}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан</button>
      </form>
    </AdminShell>
  );
}
