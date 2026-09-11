"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStoredAuth, Product, api } from "@/lib/api";
import { formatSomoni, formatUsdFromSomoni } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const auth = getStoredAuth();
    if (!auth) {
      router.push(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await api.post("/cart", { product_id: product.id, quantity: 1 });
      router.push("/cart");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card-shell product-card overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-44 bg-sand">
          {img ? <img src={img} alt={product.title} className="h-44 w-full object-cover" /> : null}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ruby shadow">
            {product.category_name || "Hunarmand"}
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-gradient-to-r from-saffron to-terracotta px-2.5 py-1 text-[11px] font-bold text-navy">
            Захира: {product.stock}
          </span>
        </div>
        <div className="p-3">
          <div className="font-medium">{product.title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-gray-500">{product.seller_name || "Ҳунарманд"}</div>
          <div className="mt-2 text-sm price-tag">{formatSomoni(product.price)}</div>
          <div className="mt-1 text-xs font-semibold text-teal">≈ {formatUsdFromSomoni(product.price)}</div>
        </div>
      </Link>
      <div className="grid grid-cols-[1fr_auto] gap-2 px-3 pb-3">
        <button type="button" disabled={busy} onClick={addToCart} className="btn-teal py-2 text-sm">
          {busy ? "..." : "Ба сабад"}
        </button>
        <Link href={`/custom-orders/new?seller=${product.seller_id}`} className="rounded-xl bg-sand px-3 py-2 text-center text-sm font-semibold text-navy">
          ✦
        </Link>
        {msg && <p className="mt-1 text-xs text-red-600">{msg}</p>}
      </div>
    </article>
  );
}
