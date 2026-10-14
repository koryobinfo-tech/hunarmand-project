"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

const LINKS = [
  { href: "/admin", label: "Назорат" },
  { href: "/admin/products", label: "Маҳсулотҳо" },
  { href: "/admin/categories", label: "Категорияҳо" },
  { href: "/admin/users", label: "Корбарон" },
  { href: "/admin/blog", label: "Блог" },
  { href: "/admin/pages", label: "Саҳифаҳо" },
  { href: "/admin/orders", label: "Фармоишҳо" },
  { href: "/admin/custom-orders", label: "Фармоиши махсус" },
  { href: "/admin/profile", label: "Профили админ" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { auth, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!auth) {
      router.replace("/admin/login");
      return;
    }
    if (auth.role !== "admin") router.replace("/");
  }, [auth, ready, router]);

  if (!ready || !auth || auth.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-navy text-white">
        <p>Санҷиши дастрасии админ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120d2b] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#1b1540] p-5 md:block">
        <Link href="/admin" className="mb-8 block">
          <div className="text-lg font-bold">Hunarmand</div>
          <div className="text-xs text-amber">Панели админ · дастрасии махсус</div>
        </Link>
        <nav className="space-y-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 ${pathname === l.href ? "bg-gradient-to-r from-ruby to-saffron text-white" : "text-white/80 hover:bg-white/10"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-2 text-sm">
          <Link href="/" className="block rounded-lg bg-white/10 px-3 py-2 text-center">
            Ба сомона
          </Link>
          <button
            className="w-full rounded-lg bg-ruby/80 px-3 py-2"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
          >
            Баромад
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#1b1540]/95 px-4 py-3 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-xs">
                {l.label}
              </Link>
            ))}
          </div>
          <span className="hidden text-sm text-white/70 md:inline">{auth.full_name_or_company} · админ</span>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
