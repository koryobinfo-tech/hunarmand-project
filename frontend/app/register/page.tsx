"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { api, setStoredAuth, AuthUser } from "@/lib/api";
import { formatTajikPhoneInput, hasLetterAndNumber, isTajikPhone } from "@/lib/phone";

export default function RegisterPage() {
  const [role, setRole] = useState<"buyer" | "artisan">("buyer");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name_or_company: "",
    phone: "+992",
    password: "",
    passport_number: "",
    inn_number: "",
    birth_date: "1995-01-01",
    passport_address: "",
    residential_address: "",
    workshop_address: "",
    tax_registration_number: "",
    craft: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isTajikPhone(form.phone)) {
      setError("Рақами телефонро дар формати +992XXXXXXXXX ворид кунед.");
      return;
    }
    if (!hasLetterAndNumber(form.password)) {
      setError("Рамз бояд ҳам ҳарф ва ҳам рақам дошта бошад.");
      return;
    }
    try {
      const data = await api.post<AuthUser>("/auth/register", { ...form, role });
      setStoredAuth(data);
      window.location.href = data.role === "artisan" ? "/dashboard" : "/profile";
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <form onSubmit={onSubmit} className="card-shell overflow-hidden md:grid md:grid-cols-2">
          <div
            className="hidden bg-cover bg-center md:block"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1590736969955-71cc94901354?w=800)" }}
          />
          <div className="p-6">
            <h1 className="mb-4 text-2xl font-semibold">
              {role === "buyer" ? "Бақайдгирии харидор" : "Бақайдгирии ҳунарманд"}
            </h1>
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={() => setRole("buyer")} className={`rounded-full px-4 py-1 text-sm ${role === "buyer" ? "bg-teal text-white" : "bg-sand"}`}>
                Харидор
              </button>
              <button type="button" onClick={() => setRole("artisan")} className={`rounded-full px-4 py-1 text-sm ${role === "artisan" ? "bg-teal text-white" : "bg-sand"}`}>
                Ҳунарманд
              </button>
            </div>
            <div className="grid gap-3">
              <input className="input" placeholder="Ному насаб ё номи ширкат" value={form.full_name_or_company} onChange={(e) => set("full_name_or_company", e.target.value)} />
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-navy">Рақами телефони мобилӣ</span>
                <input className="input" inputMode="tel" placeholder="+992XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", formatTajikPhoneInput(e.target.value))} />
                <span className="text-xs text-gray-500">Аввал +992, баъд 9 рақами мобилӣ.</span>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-navy">Рамз</span>
                <input className="input" type="password" placeholder="Мисол: password123" value={form.password} onChange={(e) => set("password", e.target.value)} />
                <span className="text-xs text-gray-500">Рамз бояд ҳам ҳарф ва ҳам рақам дошта бошад.</span>
              </label>
              <input className="input" placeholder="Рақами шиноснома" value={form.passport_number} onChange={(e) => set("passport_number", e.target.value)} />
              <input className="input" placeholder="Рақами РМА (ИНН)" value={form.inn_number} onChange={(e) => set("inn_number", e.target.value)} />
              <input className="input" type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
              {role === "buyer" ? (
                <input className="input" placeholder="Суроға аз рӯи шиноснома" value={form.passport_address} onChange={(e) => set("passport_address", e.target.value)} />
              ) : (
                <>
                  <input className="input" placeholder="Суроғаи ҷои зист" value={form.residential_address} onChange={(e) => set("residential_address", e.target.value)} />
                  <input className="input" placeholder="Суроғаи устохона" value={form.workshop_address} onChange={(e) => set("workshop_address", e.target.value)} />
                  <input className="input" placeholder="Рақами қайди андоз (ихтиёрӣ)" value={form.tax_registration_number} onChange={(e) => set("tax_registration_number", e.target.value)} />
                  <input className="input" placeholder="Намуди ҳунар" value={form.craft} onChange={(e) => set("craft", e.target.value)} />
                </>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button className="btn-teal mt-5 w-full py-3">Бақайдгирӣ</button>
          </div>
        </form>
      </main>
    </div>
  );
}
