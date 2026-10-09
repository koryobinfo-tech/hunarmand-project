"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Category, Product, api } from "@/lib/api";
import { formatUsdFromSomoni } from "@/lib/currency";
import { fileToCompressedDataUrl } from "@/lib/media";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [imageData, setImageData] = useState("");
  const [videoData, setVideoData] = useState("");
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    price: 0,
    stock: 0,
  });

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
    api.get<Product>(`/products/${id}`).then((p) => {
      setForm({
        category_id: p.category_id,
        title: p.title,
        description: p.description,
        price: p.price,
        stock: p.stock,
      });
      setImageData(p.images?.[0] || "");
      setVideoData(p.videos?.[0] || "");
    });
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      await api.put(`/products/${id}`, {
        ...form,
        images: imageData ? [imageData] : [],
        videos: videoData ? [videoData] : [],
      });
      setSaved("Маҳсулот ба базаи доимӣ навсозӣ шуд.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <DashboardShell role={auth?.role === "admin" ? "admin" : "artisan"}>
      <h1 className="mb-5 text-2xl font-semibold">Таҳрири маҳсулот</h1>
      <form onSubmit={onSubmit} className="grid max-w-3xl gap-4 rounded-3xl bg-white/80 p-5 shadow-xl shadow-teal/10 ring-1 ring-white/70">
        <input className="input" placeholder="Номи маҳсулот" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea className="input min-h-24" placeholder="Тавсиф" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-navy">Нарх (сомонӣ)</span>
          <input className="input" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <span className="text-sm font-semibold text-teal">≈ {formatUsdFromSomoni(form.price)} доллар</span>
        </label>
        <input className="input" type="number" placeholder="Захира" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-3xl border border-dashed border-teal/40 bg-cream/70 p-4">
            <span className="block text-sm font-semibold text-navy">Расми маҳсулот</span>
            <input
              className="block w-full text-sm"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setImageData(await fileToCompressedDataUrl(file));
              }}
            />
            {imageData && <img src={imageData} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />}
          </label>
          <label className="rounded-3xl border border-dashed border-ruby/40 bg-white p-4">
            <span className="block text-sm font-semibold text-navy">Видеои маҳсулот</span>
            <input
              className="block w-full text-sm"
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setVideoData(await fileToCompressedDataUrl(file));
              }}
            />
            {videoData && <video src={videoData} controls className="mt-3 h-40 w-full rounded-2xl bg-black object-cover" />}
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-teal">{saved}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан ба база</button>
        <button type="button" className="text-sm text-gray-500" onClick={() => router.push("/dashboard/products")}>
          Бозгашт
        </button>
      </form>
    </DashboardShell>
  );
}
