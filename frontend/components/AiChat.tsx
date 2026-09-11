"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";

export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  related?: { id: string; title: string; price: number; image?: string | null }[];
  suggestions?: string[];
  topic?: string;
};

type Topic = { id: string; title: string; prompt: string };

async function sendChat(message: string, imageUrl: string | null, history: ChatMsg[]) {
  return api.post<{
    reply: string;
    topic?: string;
    suggestions?: string[];
    related?: ChatMsg["related"];
  }>("/ai/chat", {
    message,
    image_url: imageUrl,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });
}

export function AiChat({ variant }: { variant: "widget" | "page" }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Салом! Ман Ёрирасони Фарҳангии Hunarmand ҳастам. Дар бораи нақшҳои чакан, кулолгарӣ, чӯбкорӣ, заргарӣ, нигоҳубини маҳсулот ё устохонаҳо пурсед. Сурати намунаро ҳам бор карда метавонед.",
      suggestions: ["Маънои нақшҳои чакан", "Кулолгарии Истаравшан", "Чӣ тавр чӯбро нигоҳ дорем?"],
    },
  ]);

  useEffect(() => {
    api.get<Topic[]>("/ai/topics").then(setTopics).catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function onFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function ask(text: string, image = preview) {
    const msg = text.trim();
    if (!msg && !image) return;
    const user: ChatMsg = { role: "user", content: msg || "Ин суратро шарҳ диҳед", image };
    const next = [...messages, user];
    setMessages(next);
    setInput("");
    setPreview("");
    setBusy(true);
    try {
      const res = await sendChat(user.content, image || null, next);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.reply,
          topic: res.topic,
          suggestions: res.suggestions,
          related: res.related,
        },
      ]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  const composer = (
    <div className="border-t bg-white p-3">
      {preview && (
        <div className="mb-2 flex items-center gap-2">
          <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <button type="button" className="text-xs text-red-600" onClick={() => setPreview("")}>
            Нест кардани сурат
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" className="rounded-xl bg-sand px-3" onClick={() => fileRef.current?.click()} title="Сурат">
          🖼
        </button>
        <input
          className="input text-sm"
          placeholder="Савол нависед..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask(input)}
        />
        <button disabled={busy} type="button" onClick={() => ask(input)} className="btn-teal px-4">
          {busy ? "..." : "➤"}
        </button>
      </div>
    </div>
  );

  const thread = (
    <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "ml-8" : "mr-4"}>
          <div className={m.role === "user" ? "rounded-2xl bg-gradient-to-r from-ruby to-saffron px-4 py-3 text-white" : "rounded-2xl bg-white px-4 py-3 shadow"}>
            {m.role === "assistant" && m.topic && <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-teal">{m.topic}</div>}
            {m.image && <img src={m.image} alt="" className="mb-2 max-h-40 rounded-lg object-cover" />}
            <p className="whitespace-pre-wrap leading-6">{m.content}</p>
          </div>
          {m.suggestions && m.suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {m.suggestions.map((s) => (
                <button key={s} type="button" className="rounded-full bg-gradient-to-r from-sand to-amber px-3 py-1 text-xs text-navy shadow" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {m.related && m.related.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {m.related.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="overflow-hidden rounded-xl bg-white shadow">
                  {p.image && <img src={p.image} alt="" className="h-20 w-full object-cover" />}
                  <div className="p-2">
                    <div className="truncate text-xs font-medium">{p.title}</div>
                    <div className="text-xs text-teal">{formatMoney(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      {busy && <div className="text-xs text-gray-500">Ёрирасон ҷавоб менависад...</div>}
    </div>
  );

  if (variant === "widget") {
    return (
      <div className="flex h-full flex-col bg-cream">
        {thread}
        {composer}
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-[240px_1fr]">
      <aside className="sidebar p-4 text-white">
        <div className="text-sm font-semibold">Мавзӯъҳо</div>
        <p className="mt-1 text-xs text-white/70">Роҳбалади фарҳанги тоҷик</p>
        <div className="mt-4 space-y-1">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => ask(t.prompt)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              {t.title}
            </button>
          ))}
        </div>
        <Link href="/map" className="mt-6 block rounded-lg bg-white/10 px-3 py-2 text-center text-sm">
          Харитаи устохонаҳо
        </Link>
        <Link href="/custom-orders/new" className="mt-2 block rounded-lg bg-gradient-to-r from-saffron to-terracotta px-3 py-2 text-center text-sm font-semibold text-navy">
          Фармоиши махсус
        </Link>
      </aside>
      <div className="flex min-h-[70vh] flex-col bg-cream">
        <div className="border-b bg-white px-5 py-3">
          <div className="font-semibold">Чат бо AI: Сӯҳбати фарҳангӣ</div>
          <div className="text-xs text-gray-500">Таҳлили сурат, шарҳи нақш ва тавсияи маҳсулот</div>
        </div>
        {thread}
        {composer}
      </div>
    </div>
  );
}
