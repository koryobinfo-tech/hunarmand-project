"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

type Order = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  items: { title?: string; quantity: number; unit_price: number }[];
};

export default function SellerOrdersPage() {
  const { auth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (auth) api.get<Order[]>("/orders").then(setOrders).catch(() => setOrders([]));
  }, [auth]);
  return (
    <DashboardShell role="artisan">
      <h1 className="mb-4 text-2xl font-semibold">Фармоишҳои гирифташуда</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border p-4">
            <div className="flex justify-between">
              <span>{new Date(o.created_at).toLocaleString()}</span>
              <span className="text-teal">{o.status}</span>
            </div>
            <div>{formatMoney(o.total_price)}</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
