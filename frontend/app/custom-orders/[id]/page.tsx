"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

type Custom = {
  id: string;
  title: string;
  description: string;
  status: string;
  agreed_price?: number | null;
  reference_image?: string;
  seller_id: string;
  buyer_id: string;
  seller_name?: string;
  buyer_name?: string;
};

type Msg = { id: string; sender_id: string; sender_name?: string; body: string };

const STATUS: Record<string, string> = {
  requested: "дархост шуд",
  accepted: "қабул шуд",
  in_progress: "дар кор",
  completed: "анҷом ёфт",
};

export default function CustomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { auth, ready } = useAuth();
  const [order, setOrder] = useState<Custom | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const o = await api.get<Custom>(`/custom-orders/${id}`);
    setOrder(o);
    const m = await api.get<Msg[]>(`/custom-orders/${id}/messages`);
    setMessages(m);
  }, [id]);

  useEffect(() => {
    if (!auth || !id) return;
    load().catch((e) => setError((e as Error).message));
  }, [auth, id, load]);

  async function send() {
    if (!body.trim() || !id) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/custom-orders/${id}/messages`, { body: body.trim() });
      setBody("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    setError("");
    try {
      await api.put(`/custom-orders/${id}`, { status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

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
          <Link href={`/login?next=${encodeURIComponent(`/custom-orders/${id}`)}`} className="text-teal">
            Ворид шавед
          </Link>{" "}
          то фармоишро бинед.
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <DashboardShell role={auth.role === "artisan" ? "artisan" : "buyer"}>
        <p className="text-red-600">{error}</p>
        <Link href="/custom-orders" className="mt-3 inline-block text-teal">
          Бозгашт
        </Link>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell role={auth.role === "artisan" ? "artisan" : "buyer"}>
        <p>Боргирӣ...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role={auth.role === "artisan" ? "artisan" : "buyer"}>
      <h1 className="mb-2 text-2xl font-semibold">Фармоиши махсус: тафсилот</h1>
      <p className="text-sm text-gray-500">
        {order.title} · {order.seller_name} · {STATUS[order.status] || order.status}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          {order.reference_image && <img src={order.reference_image} alt="" className="mb-3 h-48 w-full rounded-xl object-cover" />}
          <p className="whitespace-pre-wrap">{order.description}</p>
          <p className="mt-2 font-semibold">Нарх: {order.agreed_price ? formatMoney(order.agreed_price) : "музокирот"}</p>
          {auth.role === "artisan" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["accepted", "Қабул"],
                ["in_progress", "Дар кор"],
                ["completed", "Анҷом"],
              ].map(([s, label]) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className="rounded-full bg-sand px-3 py-1 text-sm">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex h-80 flex-col rounded-xl bg-cream p-3">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl px-3 py-2 text-sm ${m.sender_id === auth.user_id ? "ml-8 bg-teal text-white" : "mr-8 bg-white"}`}
              >
                <div className="text-xs opacity-70">{m.sender_name}</div>
                {m.body}
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-gray-500">Ҳанӯз паём нест.</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="input"
              value={body}
              placeholder="Паём нависед"
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button type="button" disabled={busy} onClick={send} className="btn-teal px-4">
              ➤
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
