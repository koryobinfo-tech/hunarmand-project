"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { Category, api } from "@/lib/api";
import { formatUsdFromSomoni } from "@/lib/currency";
import { fileToCompressedDataUrl } from "@/lib/media";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState("");
  const [form, setForm] = useState({ category_id: "", title: "", description: "", price: 100, stock: 1 });

  useEffect(() => {
    api.get<Category[]>("/categories").then((c) => {
      setCategories(c);
      if (c[0]) setForm((f) => ({ ...f, category_id: c[0].id }));
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/products", { ...form, images: imageData ? [imageData] : [], videos: [] });
      router.push("/admin/products");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Иловаи маҳсулот</h1>
      <form onSubmit={onSubmit} className="grid max-w-2xl gap-3 rounded-2xl bg-white p-5 text-navy">
        <input className="input" placeholder="Номи маҳсулот" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea className="input min-h-24" placeholder="Тавсиф" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <p className="text-sm text-teal">≈ {formatUsdFromSomoni(form.price)}</p>
        <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImageData(await fileToCompressedDataUrl(f)); }} />
        {imageData && <img src={imageData} alt="" className="h-40 rounded-xl object-cover" />}
        {error && <p className="text-red-600">{error}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан</button>
      </form>
    </AdminShell>
  );
}
