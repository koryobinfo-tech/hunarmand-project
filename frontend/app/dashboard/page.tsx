"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

export default function DashboardPage() {
  const { auth, profile, ready } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, custom_orders: 0, orders: 0, revenue: 0, low_stock: 0 });
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (ready && !auth) router.push("/login");
    if (auth?.role === "buyer") router.push("/profile");
  }, [auth, ready, router]);

  useEffect(() => {
    if (!auth) return;
    api.get<typeof stats>("/dashboard/stats").then(setStats).catch(() => undefined);
    api.get<Product[]>(`/products?seller_id=${auth.user_id}`).then(setProducts).catch(() => []);
  }, [auth]);

  return (
    <DashboardShell role="artisan">
      <h1 className="mb-6 text-2xl font-semibold">Коргоҳи ман (Dashboard)</h1>
      <p className="mb-4 text-sm text-gray-500">{profile?.craft} · {profile?.workshop_address}</p>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Омори фурӯш", formatMoney(stats.revenue)],
          ["Маҳсулотҳо", String(stats.products)],
          ["Фармоишҳо", String(stats.orders)],
          ["Фармоиши махсус", String(stats.custom_orders)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-cream p-4">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="mt-2 text-2xl font-semibold text-navy">{v}</div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 mb-3 font-semibold">Маҳсулоти шумо</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border">
            <img src={p.images?.[0]} className="h-24 w-full object-cover" alt="" />
            <div className="p-2 text-sm">
              {p.title}
              <div className="text-teal">{formatMoney(p.price)}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
