"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { formatTajikPhoneInput, isTajikPhone } from "@/lib/phone";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файл хонда нашуд"));
    reader.readAsDataURL(file);
  });
}

export default function EditProfilePage() {
  const { auth, profile, ready, refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name_or_company: "",
    phone: "+992",
    bio: "",
    craft: "",
    workshop_address: "",
    residential_address: "",
    avatar_image: "",
  });

  useEffect(() => {
    if (ready && !auth) router.push("/login");
    if (auth?.role === "buyer") router.push("/profile");
  }, [auth, ready, router]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name_or_company: profile.full_name_or_company || "",
      phone: profile.phone || "+992",
      bio: profile.bio || "",
      craft: profile.craft || "",
      workshop_address: profile.workshop_address || "",
      residential_address: profile.residential_address || "",
      avatar_image: profile.avatar_image || "",
    });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    if (!isTajikPhone(form.phone)) {
      setError("Рақами телефонро дар формати +992XXXXXXXXX ворид кунед.");
      return;
    }
    setBusy(true);
    try {
      await api.put("/auth/me", form);
      await refresh();
      setSaved("Маълумот ба базаи доимӣ сабт шуд ва пас аз навсозии саҳифа низ боқӣ мемонад.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const role = auth?.role === "admin" ? "admin" : "artisan";

  return (
    <DashboardShell role={role}>
      <h1 className="mb-2 text-2xl font-semibold">Редактировать профил</h1>
      <p className="mb-6 text-sm text-gray-500">Ном, акс, тавсиф ва рақами тамос дар базаи PostgreSQL нигоҳ дошта мешаванд.</p>
      <form onSubmit={save} className="grid max-w-3xl gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={form.avatar_image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"}
            alt=""
            className="h-28 w-28 rounded-full object-cover ring-4 ring-teal/20"
          />
          <label className="rounded-2xl border border-dashed border-teal/40 bg-cream/70 p-4 text-sm">
            <span className="mb-2 block font-semibold">Акси профил</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setForm((f) => ({ ...f, avatar_image: await fileToDataUrl(file) }));
              }}
            />
          </label>
        </div>
        <input
          className="input"
          placeholder="Ном ё номи ширкат"
          value={form.full_name_or_company}
          onChange={(e) => setForm({ ...form, full_name_or_company: e.target.value })}
        />
        <label className="grid gap-1">
          <span className="text-sm font-semibold">Рақами тамос</span>
          <input
            className="input"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatTajikPhoneInput(e.target.value) })}
          />
        </label>
        <input
          className="input"
          placeholder="Намуди ҳунар / вазифа"
          value={form.craft}
          onChange={(e) => setForm({ ...form, craft: e.target.value })}
        />
        <textarea
          className="input min-h-28"
          placeholder="Тавсиф"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <input
          className="input"
          placeholder="Суроғаи устохона / коргоҳ"
          value={form.workshop_address}
          onChange={(e) => setForm({ ...form, workshop_address: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-teal">{saved}</p>}
        <button disabled={busy} className="btn-teal py-3">
          {busy ? "Сабт..." : "Нигоҳ доштан ба база"}
        </button>
      </form>
    </DashboardShell>
  );
}
