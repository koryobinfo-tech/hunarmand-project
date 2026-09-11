"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { Category, api } from "@/lib/api";

type MenuLink = {
  href: string;
  label: string;
};

type MenuItem = MenuLink & {
  children?: boolean;
  items?: MenuLink[];
};

const MENU: MenuItem[] = [
  { href: "/", label: "Асосӣ" },
  {
    href: "/catalog",
    label: "Категорияҳо",
    children: true,
  },
  {
    href: "/custom-orders/new",
    label: "Фармоиш",
    items: [
      { href: "/custom-orders/new", label: "Дархости нав" },
      { href: "/custom-orders", label: "Фармоишҳои ман" },
    ],
  },
  {
    href: "/map",
    label: "Ҳунармандон",
    items: [
      { href: "/map", label: "Харитаи устохонаҳо" },
      { href: "/catalog", label: "Маҳсулоти ҳунармандон" },
    ],
  },
  { href: "/ai", label: "Ёрирасони AI" },
  { href: "/blog", label: "Блог" },
  { href: "/about", label: "Дар бораи мо" },
];

export function Header() {
  const { auth, profile, logout, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [userOpen, setUserOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    if (!auth || auth.role === "artisan") {
      setCartCount(0);
      return;
    }
    api
      .get<{ quantity: number }[]>("/cart")
      .then((items) => setCartCount(items.reduce((s, i) => s + (i.quantity || 1), 0)))
      .catch(() => setCartCount(0));
  }, [auth, pathname]);

  useEffect(() => {
    setOpen(false);
    setMega(null);
    setUserOpen(false);
  }, [pathname]);

  const workspace = auth?.role === "artisan" ? "/dashboard" : "/profile";

  return (
    <header className="sticky top-0 z-50 header-bg text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[11px] tracking-wide text-white/70">
          <span>Маркетплейси ҳунарҳои мардумии Тоҷикистон</span>
          <span className="hidden sm:inline">Душанбе · Хуҷанд · Кӯлоб · Хоруғ · Истаравшан</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню">
          {open ? "✕" : "☰"}
        </button>
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-saffron via-ruby to-teal ring-2 ring-amber">H</span>
          <span className="leading-tight">
            Hunarmand
            <span className="block text-[10px] font-normal text-white/60">ҳунар · бозор · фарҳанг</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {MENU.map((m) => (
            <div
              key={m.label}
              className="relative"
              onMouseEnter={() => setMega(m.items || m.children ? m.label : null)}
              onMouseLeave={() => setMega(null)}
            >
              <Link
                href={m.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${pathname === m.href ? "bg-gradient-to-r from-ruby/80 to-saffron/80" : "hover:bg-white/10"}`}
              >
                {m.label}
                {(m.items || m.children) && <span className="ml-1 text-[10px] opacity-70">▾</span>}
              </Link>
              {mega === m.label && (m.children || m.items) && (
                <div className="absolute left-0 top-full z-50 min-w-56 rounded-xl bg-white p-2 text-ink shadow-2xl">
                  {m.children &&
                    cats.map((c) => (
                      <Link key={c.id} href={`/catalog/${c.slug}`} className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                        {c.name}
                      </Link>
                    ))}
                  {m.items?.map((i) => (
                    <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                      {i.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <form
          className="hidden flex-1 items-center rounded-full bg-white/10 px-3 py-1.5 text-sm lg:flex lg:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/catalog?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ҷустуҷӯи маҳсулот, ҳунар, устод..."
            className="w-full bg-transparent outline-none placeholder:text-white/50"
          />
        </form>

        <Link href="/ai" className="hidden rounded-full bg-gradient-to-r from-violet to-azure px-3 py-1.5 text-xs font-semibold md:inline" title="Ёрирасони фарҳангӣ">
          AI
        </Link>
        <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Сабад">
          🛒
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ruby text-[10px] font-bold">
              {cartCount}
            </span>
          )}
        </Link>

        {ready && auth ? (
          <div className="relative">
            <button type="button" onClick={() => setUserOpen((v) => !v)} className="flex max-w-[160px] items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
              <span className="hidden truncate md:inline">{profile?.full_name_or_company || auth.full_name_or_company}</span>
              <span className="md:hidden">👤</span>
            </button>
            {userOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 text-ink shadow-2xl">
                <Link href={workspace} className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                  {auth.role === "artisan" ? "Коргоҳи ман" : "Профили ман"}
                </Link>
                <Link href="/custom-orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                  Фармоишҳои махсус
                </Link>
                {auth.role !== "artisan" && (
                  <Link href="/profile/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">
                    Харидҳои ман
                  </Link>
                )}
                <button
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-cream"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  Баромад
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
              Вуруд
            </Link>
            <Link href="/register" className="hidden rounded-full bg-gradient-to-r from-saffron to-terracotta px-3 py-1.5 text-sm font-semibold text-navy sm:inline">
              Бақайдгирӣ
            </Link>
          </div>
        )}
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-amber/40 bg-navy px-4 py-4 md:hidden">
          <form
            className="mb-4 flex rounded-full bg-white/10 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/catalog?q=${encodeURIComponent(q)}`);
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ҷустуҷӯ" className="w-full bg-transparent outline-none" />
          </form>
          {MENU.map((m) => (
            <div key={m.label} className="border-b border-white/10 py-2">
              <Link href={m.href} className="block py-1 font-medium">
                {m.label}
              </Link>
              {m.children &&
                cats.map((c) => (
                  <Link key={c.id} href={`/catalog/${c.slug}`} className="block py-1 pl-3 text-sm text-white/75">
                    {c.name}
                  </Link>
                ))}
              {m.items?.map((i) => (
                <Link key={i.href} href={i.href} className="block py-1 pl-3 text-sm text-white/75">
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 header-bg text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-lg font-semibold">Hunarmand</div>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Платформаи онлайни хариди мустақим аз ҳунармандон: чакан, чӯбкорӣ, заргарӣ, кулолгарӣ ва хӯрокаи ватанӣ.
          </p>
        </div>
        <div className="text-sm text-white/80">
          <div className="mb-2 font-semibold text-white">Бозор</div>
          <Link href="/catalog" className="block py-1 hover:text-white">
            Каталог
          </Link>
          <Link href="/custom-orders/new" className="block py-1 hover:text-white">
            Фармоиши махсус
          </Link>
          <Link href="/map" className="block py-1 hover:text-white">
            Харитаи устохонаҳо
          </Link>
          <Link href="/cart" className="block py-1 hover:text-white">
            Сабад
          </Link>
        </div>
        <div className="text-sm text-white/80">
          <div className="mb-2 font-semibold text-white">Фарҳанг</div>
          <Link href="/ai" className="block py-1 hover:text-white">
            Ёрирасони AI
          </Link>
          <Link href="/blog" className="block py-1 hover:text-white">
            Таърих ва анъанаҳо
          </Link>
          <Link href="/about" className="block py-1 hover:text-white">
            Миссия
          </Link>
        </div>
        <div className="text-sm text-white/70">
          <div className="mb-2 font-semibold text-white">Дастгирӣ</div>
          <p>Ворид: +992900000001</p>
          <p>Ҳунарманд: +992900000002</p>
          <p className="mt-2">Рамз: password123</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} Hunarmand · ҳунарҳои мардумӣ</div>
    </footer>
  );
}
