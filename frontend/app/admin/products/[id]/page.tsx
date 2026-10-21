"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { Category, Product, api } from "@/lib/api";
import { fileToCompressedDataUrl } from "@/lib/media";

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState("");
  const [form, setForm] = useState({ category_id: "", title: "", description: "", price: 0, stock: 0, region: "", material: "" });

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories);
    api.get<Product>(`/products/${id}`).then((p) => {
      setForm({ category_id: p.category_id, title: p.title, description: p.description, price: p.price, stock: p.stock, region: p.region || "", material: p.material || "" });
      setImageData(p.images?.[0] || "");
    });
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/products/${id}`, { ...form, images: imageData ? [imageData] : [], videos: [] });
      router.push("/admin/products");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Редактировать маҳсулот</h1>
      <form onSubmit={onSubmit} className="grid max-w-2xl gap-3 rounded-2xl bg-white p-5 text-navy">
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Минтақа" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        <input className="input" placeholder="Мавод" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
        <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImageData(await fileToCompressedDataUrl(f)); }} />
        {imageData && <img src={imageData} alt="" className="h-40 rounded-xl object-cover" />}
        {error && <p className="text-red-600">{error}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан</button>
      </form>
    </AdminShell>
  );
}
