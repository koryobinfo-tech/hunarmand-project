"use client";

import { Header, Footer } from "@/components/Header";
import { AiChat } from "@/components/AiChat";

export default function AiPage() {
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-ruby">Модули зеҳни сунъӣ</p>
          <h1 className="section-title text-3xl font-bold">Ёрирасони фарҳангӣ</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Шарҳи нақшҳои миллӣ, таърихи ҳунарҳо, нигоҳубини маҳсулот ва таҳлили сурати намуна — бо тавсияи мол аз каталоги Hunarmand.
          </p>
        </div>
        <AiChat variant="page" />
      </main>
      <Footer />
    </div>
  );
}
