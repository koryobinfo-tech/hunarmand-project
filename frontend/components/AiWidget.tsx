"use client";

import { useState } from "react";
import Link from "next/link";
import { AiChat } from "./AiChat";

export function AiWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ruby via-saffron to-teal text-xl font-bold text-white shadow-xl ring-4 ring-amber/50"
        aria-label="Ёрирасони фарҳангӣ"
      >
        AI
      </button>
      {open && (
        <div className="fixed bottom-22 right-5 z-40 flex h-[min(640px,80vh)] w-[min(94vw,420px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-navy via-ruby to-teal px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">Ёрирасони фарҳангӣ</div>
              <Link href="/ai" className="text-[11px] text-white/70 underline">
                Кушодани фазои пурра
              </Link>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Пӯшидан">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <AiChat variant="widget" />
          </div>
        </div>
      )}
    </>
  );
}
