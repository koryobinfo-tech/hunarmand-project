"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("ADMIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().toUpperCase() !== "ADMIN") {
      setError("Логин нодуруст аст.");
      return;
    }
    try {
      const data = await login("ADMIN", password);
      if (data.role !== "admin") {
        logout();
        setError("Ин ҳисоб админ нест. Дастрасӣ танҳо барои соҳиби сомона.");
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#120d2b] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 text-navy shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-ruby">Дастрасии махсус</p>
        <h1 className="mt-2 text-2xl font-bold">Панели админи Hunarmand</h1>
        <p className="mt-2 text-sm text-gray-500">Танҳо соҳиби сомона ворид шуда метавонад.</p>
        <label className="mt-6 mb-1 block text-sm">Логин</label>
        <input
          className="input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="mt-3 mb-1 block text-sm">Парол</label>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="btn-teal mt-5 w-full py-3">Даромад ба панели админ</button>
      </form>
    </div>
  );
}
