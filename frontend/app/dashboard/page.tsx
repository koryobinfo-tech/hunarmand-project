"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Product, api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

export default function DashboardPage() {
  const { auth, profile, ready } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, custom_orders: 0, orders: 0, revenue: 0, low_stock: 0, users: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<{ id: string; role: string; full_name_or_company: string; phone: string }[]>([]);
  const [storage, setStorage] = useState<{ persistent?: boolean; database?: string; counts?: { users: number; products: number } } | null>(null);
  const role = auth?.role === "admin" ? "admin" : "artisan";

  useEffect(() => {
    if (ready && !auth) router.push("/login");
    if (auth?.role === "buyer") router.push("/profile");
  }, [auth, ready, router]);

  useEffect(() => {
    if (!auth) return;
    api.get<typeof stats>("/dashboard/stats").then(setStats).catch(() => undefined);
    api.get<typeof storage>("/storage").then(setStorage).catch(() => undefined);
    const qs = auth.role === "admin" ? "/products" : `/products?seller_id=${auth.user_id}`;
    api.get<Product[]>(qs).then(setProducts).catch(() => []);
    if (auth.role === "admin") {
      api.get<typeof users>("/admin/users").then(setUsers).catch(() => setUsers([]));
    }
  }, [auth]);

  return (
    <DashboardShell role={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{role === "admin" ? "Панели админ" : "Коргоҳи ман (Dashboard)"}</h1>
          <p className="mt-1 text-sm text-gray-500">{profile?.craft} · {profile?.workshop_address}</p>
        </div>
        <Link href="/dashboard/profile" className="btn-teal px-4 py-2 text-sm">
          Редактировать профил
        </Link>
      </div>
      <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${storage?.persistent ? "bg-teal/10 text-navy" : "bg-amber/40 text-navy"}`}>
        {storage?.persistent
          ? `Базаи доимӣ (${storage.database}): ${storage.counts?.users ?? 0} корбар, ${storage.counts?.products ?? 0} маҳсулот. Пас аз бозоғозии сервер маълумот боқӣ мемонад.`
          : "Базаи ҷорӣ SQLite аст ва дар Render муваққатӣ мешавад. DATABASE_URL-ро ба PostgreSQL пайваст кунед."}
      </div>
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
      {role === "admin" && (
        <>
          <h2 className="mt-8 mb-3 font-semibold">Корбарон ({stats.users || users.length})</h2>
          <div className="mb-6 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between rounded-xl border px-3 py-2 text-sm">
                <span>{u.full_name_or_company} · {u.role}</span>
                <span className="text-gray-500">{u.phone}</span>
              </div>
            ))}
          </div>
        </>
      )}
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
