"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatSomoni, formatUsdFromSomoni } from "@/lib/currency";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Product>(`/products/${id}`).then(setProduct).catch(() => setProduct(null));
  }, [id]);

  async function addCart() {
    setError("");
    if (!auth) {
      router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    try {
      await api.post("/cart", { product_id: id, quantity: qty });
      router.push("/cart");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!product) {
    return (
      <div>
        <Header />
        <p className="p-10">Боргирӣ...</p>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-2">
        <div className="card-shell overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} className="h-80 w-full object-cover" />
          ) : (
            <div className="grid h-80 place-items-center bg-sand text-sm text-gray-500">Расм илова нашудааст</div>
          )}
          {product.videos?.[0] && (
            <div className="border-t bg-navy p-3">
              <video src={product.videos[0]} controls className="h-56 w-full rounded-2xl bg-black object-cover" />
            </div>
          )}
        </div>
        <div className="card-shell p-6">
          <div className="text-sm text-teal">{product.category_name}</div>
          <h1 className="mt-1 text-3xl font-semibold">{product.title}</h1>
          <p className="mt-3 text-gray-600">{product.description}</p>
          <div className="mt-4 text-2xl font-bold text-teal">{formatSomoni(product.price)}</div>
          <div className="mt-1 text-sm font-semibold text-ruby">≈ {formatUsdFromSomoni(product.price)} доллар</div>
          <div className="mt-1 text-sm">Захира: {product.stock}</div>
          <div className="mt-2 text-sm">Ҳунарманд: {product.seller_name}</div>
          <div className="mt-5 flex items-center gap-3">
            <input className="input w-24" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            <button onClick={addCart} className="btn-teal px-6 py-2">
              Ба сабад
            </button>
            <a href={`/custom-orders/new?seller=${product.seller_id}`} className="text-sm text-teal">
              Фармоиши махсус
            </a>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
