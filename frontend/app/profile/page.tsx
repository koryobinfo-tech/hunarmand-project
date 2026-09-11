"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { auth, profile, ready, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name_or_company: "",
    passport_address: "",
    avatar_image: "",
  });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (ready && !auth) router.push("/login");
    if (auth?.role === "artisan") router.push("/dashboard");
  }, [auth, ready, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name_or_company: profile.full_name_or_company,
        passport_address: profile.passport_address || "",
        avatar_image: profile.avatar_image || "",
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api.put("/auth/me", form);
    await refresh();
    setSaved("Нигоҳ дошта шуд");
  }

  if (!profile) return null;

  return (
    <DashboardShell role="buyer">
      <h1 className="mb-6 text-2xl font-semibold">Профили харидор</h1>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center gap-3">
          <img src={form.avatar_image || profile.avatar_image} alt="" className="h-28 w-28 rounded-full object-cover" />
        </div>
        <div className="grid gap-3">
          <input className="input" value={form.full_name_or_company} onChange={(e) => setForm({ ...form, full_name_or_company: e.target.value })} />
          <input className="input" value={profile.phone} disabled />
          <input className="input" value={profile.inn_number} disabled />
          <input className="input" value={profile.birth_date} disabled />
          <input className="input" placeholder="Суроға" value={form.passport_address} onChange={(e) => setForm({ ...form, passport_address: e.target.value })} />
        </div>
        <button className="btn-teal md:col-span-2 py-3">Нигоҳ доштан</button>
        {saved && <p className="text-teal">{saved}</p>}
      </form>
    </DashboardShell>
  );
}
