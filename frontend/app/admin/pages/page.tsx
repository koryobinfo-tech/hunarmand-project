"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Team = { name: string; role: string };
type Page = { slug: string; title: string; body: string; extra?: { team?: Team[] } };

export default function AdminPagesPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [team, setTeam] = useState<Team[]>([{ name: "", role: "" }]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get<Page>("/pages/about").then((p) => {
      setTitle(p.title);
      setBody(p.body);
      setTeam(p.extra?.team?.length ? p.extra.team : [{ name: "", role: "" }]);
    }).catch(() => undefined);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api.put("/pages/about", { title, body, extra: { team: team.filter((t) => t.name.trim()) } });
    setMsg("Саҳифаи «Дар бораи мо» сабт шуд ва дар сомона мемонад.");
  }

  return (
    <AdminShell>
      <h1 className="mb-5 text-2xl font-bold">Саҳифаҳо</h1>
      <form onSubmit={save} className="grid max-w-3xl gap-3 rounded-2xl bg-white p-5 text-navy">
        <h2 className="font-semibold">Редактировать: Дар бораи мо</h2>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input min-h-32" value={body} onChange={(e) => setBody(e.target.value)} />
        <p className="text-sm font-semibold">Даста</p>
        {team.map((t, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-2">
            <input className="input" placeholder="Ном" value={t.name} onChange={(e) => setTeam(team.map((x, n) => n === i ? { ...x, name: e.target.value } : x))} />
            <input className="input" placeholder="Вазифа" value={t.role} onChange={(e) => setTeam(team.map((x, n) => n === i ? { ...x, role: e.target.value } : x))} />
          </div>
        ))}
        <button type="button" className="text-left text-sm text-teal" onClick={() => setTeam([...team, { name: "", role: "" }])}>+ Иловаи аъзо</button>
        {msg && <p className="text-sm text-teal">{msg}</p>}
        <button className="btn-teal py-3">Нигоҳ доштан</button>
      </form>
    </AdminShell>
  );
}
