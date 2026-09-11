"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { formatTajikPhoneInput, isTajikPhone } from "@/lib/phone";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  const [phone, setPhone] = useState("+992");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isTajikPhone(phone)) {
      setError("Рақами телефонро дар формати +992XXXXXXXXX ворид кунед.");
      return;
    }
    try {
      const data = await login(phone, password);
      if (next && next.startsWith("/")) {
        router.push(next);
        return;
      }
      router.push(data.role === "artisan" ? "/dashboard" : "/profile");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <form onSubmit={onSubmit} className="card-shell p-8">
          <h1 className="mb-6 text-center text-2xl font-semibold">Вуруд ба Hunarmand</h1>
          <label className="mb-1 block text-sm">Рақами телефон</label>
          <input className="input mb-2" inputMode="tel" placeholder="+992XXXXXXXXX" value={phone} onChange={(e) => setPhone(formatTajikPhoneInput(e.target.value))} />
          <p className="mb-4 text-xs text-gray-500">Бо рақаме ворид шавед, ки ҳангоми бақайдгирӣ истифода кардед.</p>
          <label className="mb-1 block text-sm">Рамз</label>
          <input className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button className="btn-teal w-full py-3">Даромад</button>
          <p className="mt-4 text-center text-sm">
            Ҳисоб надоред?{" "}
            <Link href="/register" className="text-teal">
              Бақайдгирӣ
            </Link>
          </p>
          <p className="mt-3 text-xs text-gray-500">Ҳар ҳисоб мувофиқи нақши бақайдгирифташуда ба қисми харидор ё фурӯшанда ворид мешавад.</p>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="page-bg">
          <Header />
          <p className="p-10">Боргирӣ...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
