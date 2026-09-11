"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { formatUsdFromSomoni } from "@/lib/currency";

export type ArtisanOption = {
  id: string;
  full_name_or_company: string;
  craft?: string;
};

const CRAFTS = [
  { id: "chakan", title: "Фармоиши чакан / атлас" },
  { id: "woodwork", title: "Фармоиши чӯбкорӣ" },
  { id: "pottery", title: "Фармоиши кулолгарӣ" },
  { id: "jewelry", title: "Фармоиши заргарӣ" },
  { id: "other", title: "Дигар ҳунар" },
];

export function CustomOrderForm() {
  const search = useSearchParams();
  const router = useRouter();
  const { auth, ready } = useAuth();
  const [artisans, setArtisans] = useState<ArtisanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    seller_id: search.get("seller") || "",
    craft: search.get("craft") || "chakan",
    title: "",
    description: "",
    reference_image: "",
    agreed_price: "",
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get<ArtisanOption[]>("/artisans")
      .then((list) => {
        if (cancelled) return;
        setArtisans(list);
        setForm((f) => ({ ...f, seller_id: f.seller_id || list[0]?.id || "" }));
      })
      .catch(() => {
        if (!cancelled) setError("Рӯйхати ҳунармандон бор нашуд. API-ро санҷед.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setPreview(url);
      setForm((f) => ({ ...f, reference_image: url }));
    };
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!auth) {
      router.push(`/login?next=${encodeURIComponent("/custom-orders/new")}`);
      return;
    }
    if (auth.role === "artisan") {
      setError("Фармоиши махсусро харидор мефиристад. Бо ҳисоби харидор ворид шавед.");
      return;
    }
    if (!form.seller_id) {
      setError("Ҳунармандро интихоб кунед.");
      return;
    }
    if (!form.description.trim()) {
      setError("Андоза, ранг ва тавсифро нависед.");
      return;
    }
    const craftTitle = CRAFTS.find((c) => c.id === form.craft)?.title || "Фармоиши махсус";
    setBusy(true);
    try {
      const created = await api.post<{ id: string }>("/custom-orders", {
        seller_id: form.seller_id,
        title: form.title.trim() || craftTitle,
        description: form.description.trim(),
        reference_image: form.reference_image || null,
        agreed_price: form.agreed_price ? Number(form.agreed_price) : null,
      });
      router.push(`/custom-orders/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="page-bg">
        <Header />
        <p className="p-10">Боргирӣ...</p>
      </div>
    );
  }

  const formInner = (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Дархости фармоиши махсус</h1>
      <p className="mb-4 text-sm text-gray-500">
        Сурати намуна бор кунед ва андоза, ранг, намуди матоъ ё чӯбро тавсиф кунед. Ҳунарманд дархостро қабул мекунад ва паём менависад.
      </p>
      {!auth && (
        <p className="mb-4 rounded-lg bg-sand px-3 py-2 text-sm">
          Барои фиристодан{" "}
          <Link href={`/login?next=${encodeURIComponent("/custom-orders/new")}`} className="text-teal">
            ворид шавед
          </Link>{" "}
          ҳамчун харидор.
        </p>
      )}
      <form onSubmit={submit} className="grid gap-3">
        <label className="text-sm">Намуди ҳунар</label>
        <select className="input" value={form.craft} onChange={(e) => setForm({ ...form, craft: e.target.value })}>
          {CRAFTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="text-sm">Ҳунарманд</label>
        <select className="input" value={form.seller_id} onChange={(e) => setForm({ ...form, seller_id: e.target.value })}>
          {artisans.length === 0 && <option value="">Ҳунарманд нест</option>}
          {artisans.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name_or_company}
              {a.craft ? ` — ${a.craft}` : ""}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Номи фармоиш (ихтиёрӣ)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea
          className="input min-h-28"
          placeholder="Андоза, ранг, намуди матоъ/чӯб, муҳлат"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="text-sm">Сурати намуна</label>
        <input className="input" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        <input
          className="input"
          placeholder="ё URL-и сурат"
          value={preview.startsWith("data:") ? "" : form.reference_image}
          onChange={(e) => {
            setPreview(e.target.value);
            setForm({ ...form, reference_image: e.target.value });
          }}
        />
        {preview && <img src={preview} alt="Намуна" className="h-40 w-full rounded-xl object-cover" />}
        <input
          className="input"
          type="number"
          min={0}
          placeholder="Нархи пешниҳодӣ бо сомонӣ (ихтиёрӣ)"
          value={form.agreed_price}
          onChange={(e) => setForm({ ...form, agreed_price: e.target.value })}
        />
        {form.agreed_price && <p className="text-sm font-semibold text-teal">≈ {formatUsdFromSomoni(Number(form.agreed_price))} доллар</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-teal py-3">
          {busy ? "Ирсол..." : "Фиристодан"}
        </button>
      </form>
    </>
  );

  if (auth && auth.role !== "artisan") {
    return <DashboardShell role="buyer">{formInner}</DashboardShell>;
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="card-shell p-6">{formInner}</div>
      </main>
    </div>
  );
}
