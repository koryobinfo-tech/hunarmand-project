"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";

type Pin = {
  id: string;
  full_name_or_company: string;
  craft?: string;
  workshop_address?: string;
  workshop_lat?: number;
  workshop_lng?: number;
  avatar_image?: string;
  bio?: string;
};

export default function MapPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [active, setActive] = useState<Pin | null>(null);

  useEffect(() => {
    api.get<Pin[]>("/artisans/map").then((p) => {
      setPins(p);
      setActive(p[0] || null);
    });
  }, []);

  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="card-shell overflow-hidden">
          <h1 className="px-5 pt-5 text-2xl font-semibold">Харитаи ҳунармандон ва сайёҳӣ</h1>
          <div className="grid md:grid-cols-[220px_1fr]">
            <aside className="p-5 text-sm">
              <div className="font-semibold">Минтақа</div>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>Душанбе</li>
                <li>Хуҷанд</li>
                <li>Кӯлоб</li>
                <li>Хоруғ</li>
                <li>Истаравшан</li>
              </ul>
            </aside>
            <div className="relative m-4 min-h-[420px] overflow-hidden rounded-2xl bg-[#b9d4c4]">
              <svg viewBox="0 0 400 280" className="h-full w-full">
                <path
                  d="M40 90 L90 70 L150 50 L210 55 L280 80 L340 95 L355 130 L330 170 L300 210 L240 230 L180 240 L120 220 L70 180 L45 140 Z"
                  fill="#7fb39a"
                  stroke="#2f6d5b"
                />
                {pins.map((p, i) => {
                  const x = 70 + ((p.workshop_lng || 68) - 67) * 55;
                  const y = 230 - ((p.workshop_lat || 38) - 36.5) * 48;
                  return (
                    <g key={p.id} onClick={() => setActive(p)} className="cursor-pointer">
                      <circle cx={x} cy={y} r={active?.id === p.id ? 8 : 6} fill="#0b3a48" />
                      <text x={x + 10} y={y + 4} fontSize="10" fill="#0b3a48">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {active && (
                <div className="absolute right-4 top-4 w-64 rounded-xl bg-white p-4 shadow-lg">
                  <img src={active.avatar_image} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
                  <div className="mt-2 text-center font-semibold">{active.full_name_or_company}</div>
                  <div className="text-center text-sm text-gray-500">{active.craft}</div>
                  <div className="mt-2 text-xs text-gray-600">{active.workshop_address}</div>
                  <Link href={`/artisans/${active.id}`} className="btn-teal mt-3 block py-2 text-center text-sm">
                    Дидани устохона
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
