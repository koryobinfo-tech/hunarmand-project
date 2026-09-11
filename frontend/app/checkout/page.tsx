"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatSomoni, formatUsdFromSomoni } from "@/lib/currency";

type CartItem = { id: string; quantity: number; product: Product };

export default function CheckoutPage() {
  const { auth, profile, ready } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [method, setMethod] = useState("national_card");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.passport_address) setAddress(profile.passport_address);
    if (!auth) return;
    api
      .get<CartItem[]>("/cart")
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [auth, profile]);

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  async function pay() {
    setError("");
    if (!auth) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (!address.trim()) {
      setError("Суроғаи таҳвилро нависед.");
      return;
    }
    if (items.length === 0) {
      setError("Сабади харид холӣ аст.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/checkout", { payment_method: method, shipping_address: address.trim() });
      router.push("/checkout/success");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-2">
        <div className="card-shell p-6">
          <h1 className="mb-4 text-2xl font-semibold">Раванди пардохт ва таҳвил</h1>
          {ready && !auth && (
            <p className="mb-4 text-sm">
              <Link href={`/login?next=${encodeURIComponent("/checkout")}`} className="text-teal">
                Ворид шавед
              </Link>{" "}
              то пардохт кунед.
            </p>
          )}
          <label className="mb-1 block text-sm">Суроғаи таҳвил</label>
          <input className="input mb-4" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            {[
              ["national_card", "Корти Миллӣ"],
              ["visa", "Visa / Mastercard"],
              ["wallet", "Ҳамёни электронӣ"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`rounded-xl border p-4 text-left ${method === id ? "border-teal bg-cream" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button type="button" disabled={busy} onClick={pay} className="btn-teal mt-6 w-full py-3">
            {busy ? "Пардохт..." : "Тасдиқ ва пардохт"}
          </button>
          <p className="mt-2 text-xs text-gray-500">Ин демо-пардохт аст (Stripe/провайдери маҳаллӣ баъдтар пайваст мешавад).</p>
        </div>
        <div className="card-shell p-6">
          <h2 className="mb-3 font-semibold">Хулосаи пардохт</h2>
          {items.length === 0 && <p className="text-sm text-gray-500">Сабад холӣ аст.</p>}
          {items.map((i) => (
            <div key={i.id} className="flex justify-between py-2 text-sm">
              <span>
                {i.product.title} × {i.quantity}
              </span>
              <span className="text-right">
                <span className="block font-semibold">{formatSomoni(i.product.price * i.quantity)}</span>
                <span className="block text-xs text-teal">≈ {formatUsdFromSomoni(i.product.price * i.quantity)}</span>
              </span>
            </div>
          ))}
          <div className="mt-4 text-xl font-semibold">
            Ҷамъ: {formatSomoni(total)}
            <div className="text-sm text-teal">≈ {formatUsdFromSomoni(total)}</div>
          </div>
          <Link href="/cart" className="mt-3 inline-block text-sm text-teal">
            Бозгашт ба сабад
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
