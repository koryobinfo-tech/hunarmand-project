"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Footer, Header } from "@/components/Header";
import { api } from "@/lib/api";

type Post = { id: string; title: string; body: string; cover_image?: string; created_at: string };

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    api.get<Post>(`/blog/${id}`).then(setPost).catch(() => setPost(null));
  }, [id]);
  return (
    <div className="page-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {post && (
          <article className="card-shell overflow-hidden">
            <img src={post.cover_image} className="h-64 w-full object-cover" alt="" />
            <div className="p-6">
              <h1 className="text-3xl font-semibold">{post.title}</h1>
              <p className="mt-4 leading-7 text-gray-700">{post.body}</p>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
