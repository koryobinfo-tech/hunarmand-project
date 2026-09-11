"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";

type Post = { id: string; title: string; excerpt: string; cover_image?: string };

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    api.get<Post[]>("/blog").then(setPosts).catch(() => setPosts([]));
  }, []);
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="card-shell p-6">
          <h1 className="mb-6 text-2xl font-semibold">Таърих ва анъанаҳо</h1>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} className="overflow-hidden rounded-xl border">
                <img src={p.cover_image} className="h-40 w-full object-cover" alt="" />
                <div className="p-3">
                  <div className="font-medium">{p.title}</div>
                  <p className="mt-1 text-sm text-gray-600">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
