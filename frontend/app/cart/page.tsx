"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatMoney, formatSomoni, formatUsdFromSomoni } from "@/lib/currency";

type CartItem = { id: string; product_id: string; quantity: number; product: Product };

export default function CartPage() {
  const { auth, ready } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<CartItem[]>("/cart");
      setItems(data);
    } catch (e) {
      setItems([]);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth) load();
  }, [auth, load]);

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  async function change(item: CartItem, quantity: number) {
    setError("");
    try {
      await api.put(`/cart/${item.id}`, { product_id: item.product_id, quantity });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(item: CartItem) {
    setError("");
    try {
      await api.del(`/cart/${item.id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="card-shell p-6">
          <h1 className="mb-6 text-2xl font-semibold">Сабати хариди шумо</h1>
          {!ready && <p>Боргирӣ...</p>}
          {ready && !auth && (
            <p>
              Барои сабад{" "}
              <Link href={`/login?next=${encodeURIComponent("/cart")}`} className="text-teal">
                ворид шавед
              </Link>{" "}
              ҳамчун харидор.
            </p>
          )}
          {auth?.role === "artisan" && (
            <p className="text-sm text-gray-600">Сабад барои ҳисоби харидор аст. Бо рақами +992900000001 ворид шавед.</p>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {auth && auth.role !== "artisan" && loading && items.length === 0 && <p>Боргирӣ...</p>}
          {items.map((i) => (
            <div key={i.id} className="mb-3 grid grid-cols-[80px_1fr_auto_auto_auto] items-center gap-3 border-b py-3">
              <img src={i.product.images?.[0]} className="h-16 w-16 rounded object-cover" alt="" />
              <div>
                <Link href={`/products/${i.product.id}`} className="font-medium">
                  {i.product.title}
                </Link>
                <div className="text-sm text-gray-500">{formatMoney(i.product.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded border px-2" onClick={() => change(i, i.quantity - 1)}>
                  -
                </button>
                <span>{i.quantity}</span>
                <button type="button" className="rounded border px-2" onClick={() => change(i, i.quantity + 1)}>
                  +
                </button>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatSomoni(i.product.price * i.quantity)}</div>
                <div className="text-xs text-teal">≈ {formatUsdFromSomoni(i.product.price * i.quantity)}</div>
              </div>
              <button type="button" className="text-sm text-red-600" onClick={() => remove(i)}>
                Нест
              </button>
            </div>
          ))}
          {auth && !loading && items.length === 0 && !error && auth.role !== "artisan" && (
            <p className="text-sm text-gray-500">
              Сабад холӣ аст. Аз{" "}
              <Link href="/catalog" className="text-teal">
                каталог
              </Link>{" "}
              маҳсулот илова кунед.
            </p>
          )}
          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xl font-semibold">
                Ҷамъ: {formatSomoni(total)}
                <div className="text-sm text-teal">≈ {formatUsdFromSomoni(total)}</div>
              </div>
              <Link href="/checkout" className="btn-teal px-6 py-3">
                Гузаштан ба пардохт
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
