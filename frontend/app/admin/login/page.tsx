"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLoginPage() {
  const { login, logout, auth, ready } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("ADMIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && auth?.role === "admin") router.replace("/admin");
  }, [auth, ready, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (username.trim().toUpperCase() !== "ADMIN") {
        setError("Логин нодуруст аст. Логини шумо: ADMIN");
        return;
      }
      const data = await login("ADMIN", password);
      if (data.role !== "admin") {
        logout();
        setError("Ин ҳисоб админ нест. Дастрасӣ танҳо барои соҳиби сомона.");
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message || "Логин ё парол нодуруст аст.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#120d2b] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-ruby/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-teal/25 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-saffron via-ruby to-teal text-2xl font-bold ring-2 ring-amber">
            H
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber">Hunarmand</p>
          <h1 className="mt-2 text-3xl font-bold">Панели админ</h1>
          <p className="mt-2 text-sm text-white/70">Равзанаи махсуси соҳиби сомона. Аз ин ҷо ҳамаи қисмҳоро идора мекунед.</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8 text-navy shadow-2xl">
          <label className="mb-1 block text-sm font-medium">Логин</label>
          <input
            className="input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="mt-4 mb-1 block text-sm font-medium">Парол</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароли админро нависед"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="btn-teal mt-5 w-full py-3 disabled:opacity-60" disabled={busy}>
            {busy ? "Санҷиш..." : "Даромад ба панели админ"}
          </button>
          <div className="mt-5 rounded-2xl bg-[#120d2b] px-4 py-3 text-sm text-white">
            <p className="text-[11px] uppercase tracking-widest text-amber">Маълумоти воридшавии шумо</p>
            <p className="mt-2">
              Логин: <span className="font-bold">ADMIN</span>
            </p>
            <p>
              Парол: <span className="font-bold">123456</span>
            </p>
          </div>
          <Link href="/" className="mt-4 block text-center text-sm text-gray-500 hover:text-navy">
            Бозгашт ба сомона
          </Link>
        </form>
      </div>
    </div>
  );
}
