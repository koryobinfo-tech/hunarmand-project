"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { Category, api } from "@/lib/api";
import { formatUsdFromSomoni } from "@/lib/currency";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файл хонда нашуд"));
    reader.readAsDataURL(file);
  });
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState("");
  const [videoData, setVideoData] = useState("");
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    price: 100,
    stock: 1,
  });

  useEffect(() => {
    api.get<Category[]>("/categories").then((c) => {
      setCategories(c);
      if (c[0]) setForm((f) => ({ ...f, category_id: c[0].id }));
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", {
        ...form,
        images: imageData ? [imageData] : [],
        videos: videoData ? [videoData] : [],
      });
      router.push("/dashboard/products");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <DashboardShell role="artisan">
      <h1 className="mb-5 text-2xl font-semibold">Иловаи маҳсулоти нав</h1>
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
          <input className="input" type="number" min={0} step="0.01" placeholder="Нарх бо сомонӣ" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <span className="text-sm font-semibold text-teal">≈ {formatUsdFromSomoni(form.price)} доллар</span>
        </label>
        <input className="input" type="number" placeholder="Захира" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-3xl border border-dashed border-teal/40 bg-cream/70 p-4">
            <span className="block text-sm font-semibold text-navy">Боргирии расми маҳсулот</span>
            <span className="mb-3 block text-xs text-gray-500">PNG, JPG ё WebP-ро интихоб кунед.</span>
            <input
              className="block w-full text-sm"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setImageData(await fileToDataUrl(file));
              }}
            />
            {imageData && <img src={imageData} alt="Пешнамоиши расм" className="mt-3 h-40 w-full rounded-2xl object-cover" />}
          </label>
          <label className="rounded-3xl border border-dashed border-ruby/40 bg-white p-4">
            <span className="block text-sm font-semibold text-navy">Боргирии видеои маҳсулот</span>
            <span className="mb-3 block text-xs text-gray-500">Видео барои намоиши кори ҳунармандӣ.</span>
            <input
              className="block w-full text-sm"
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setVideoData(await fileToDataUrl(file));
              }}
            />
            {videoData && <video src={videoData} controls className="mt-3 h-40 w-full rounded-2xl bg-black object-cover" />}
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан</button>
      </form>
    </DashboardShell>
  );
}
