"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

const artisanLinks = [
  { href: "/dashboard", label: "Коргоҳи ман" },
  { href: "/dashboard/products", label: "Маҳсулотҳо" },
  { href: "/dashboard/products/new", label: "Иловаи маҳсулот" },
  { href: "/custom-orders", label: "Фармоишҳои махсус" },
  { href: "/dashboard/orders", label: "Фармоишҳо" },
  { href: "/ai", label: "Ёрирасони AI" },
  { href: "/map", label: "Харита" },
];

const buyerLinks = [
  { href: "/profile", label: "Профили ман" },
  { href: "/profile/orders", label: "Харидҳои ман" },
  { href: "/custom-orders", label: "Фармоишҳои махсус" },
  { href: "/cart", label: "Сабади харид" },
  { href: "/ai", label: "Ёрирасони AI" },
  { href: "/map", label: "Харита" },
];

export function DashboardShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "artisan" | "buyer";
}) {
  const pathname = usePathname();
  const links = role === "artisan" ? artisanLinks : buyerLinks;
  return (
    <div className="page-bg">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-0 px-3 py-6 md:grid-cols-[220px_1fr]">
        <aside className="sidebar mb-4 rounded-2xl p-4 text-white md:mb-0 md:rounded-l-2xl md:rounded-r-none">
          <div className="mb-4 text-sm font-semibold opacity-80">{role === "artisan" ? "Панели ҳунарманд" : "Панели харидор"}</div>
          <nav className="space-y-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-lg px-3 py-2 ${pathname === l.href ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="card-shell rounded-2xl p-5 md:rounded-l-none">{children}</section>
      </div>
    </div>
  );
}
