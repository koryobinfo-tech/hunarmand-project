"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";

type Custom = {
  id: string;
  title: string;
  status: string;
  seller_name?: string;
  buyer_name?: string;
};

const STATUS: Record<string, string> = {
  requested: "дархост",
  accepted: "қабул",
  in_progress: "дар кор",
  completed: "анҷом",
};

export default function CustomOrdersPage() {
  const { auth, ready } = useAuth();
  const [orders, setOrders] = useState<Custom[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return;
    api
      .get<Custom[]>("/custom-orders")
      .then(setOrders)
      .catch((e) => setError((e as Error).message));
  }, [auth]);

  if (!ready) {
    return (
      <div>
        <Header />
        <p className="p-10">Боргирӣ...</p>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="page-bg">
        <Header />
        <p className="p-10">
          Лутфан{" "}
          <Link href={`/login?next=${encodeURIComponent("/custom-orders")}`} className="text-teal">
            ворид шавед
          </Link>{" "}
          то фармоишҳои махсусро бинед. Ё{" "}
          <Link href="/custom-orders/new" className="text-teal">
            дархости нав
          </Link>{" "}
          диҳед.
        </p>
      </div>
    );
  }

  return (
    <DashboardShell role={auth.role === "artisan" ? "artisan" : "buyer"}>
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Фармоишҳои махсус</h1>
        {auth.role !== "artisan" && (
          <Link href="/custom-orders/new" className="btn-teal px-4 py-2 text-sm">
            Дархости нав
          </Link>
        )}
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/custom-orders/${o.id}`} className="block rounded-xl border p-4">
            <div className="font-medium">{o.title}</div>
            <div className="text-sm text-gray-500">
              {auth.role === "artisan" ? o.buyer_name : o.seller_name} · {STATUS[o.status] || o.status}
            </div>
          </Link>
        ))}
        {orders.length === 0 && !error && <p className="text-sm text-gray-500">Ҳанӯз фармоиши махсус нест.</p>}
      </div>
    </DashboardShell>
  );
}
