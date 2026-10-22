import { loadLocalCatalog, mergeById, saveLocalCatalog } from "./local-db";

const API = "/api";

export type Role = "buyer" | "artisan" | "admin";

export type AuthUser = {
  access_token: string;
  role: Role;
  user_id: string;
  full_name_or_company: string;
};

export type Product = {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  videos: string[];
  created_at: string;
  seller_name?: string;
  category_name?: string;
  category_slug?: string;
  region?: string;
  material?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_image?: string;
};

function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hunarmand_token");
}

export function getStoredAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("hunarmand_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthUser | null) {
  if (!auth) {
    localStorage.removeItem("hunarmand_auth");
    localStorage.removeItem("hunarmand_token");
    return;
  }
  localStorage.setItem("hunarmand_auth", JSON.stringify(auth));
  localStorage.setItem("hunarmand_token", auth.access_token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const t = token();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { cache: "no-store", ...init, headers });
  } catch {
    throw new Error("Пайвастшавӣ ба сервер қатъ аст. Саҳифаро навсозӣ кунед ё баъдтар кӯшиш кунед.");
  }
  if (!res.ok) {
    let detail = "Хатогии шабака";
    try {
      const data = await res.json();
      detail = data.detail || detail;
      if (Array.isArray(detail)) detail = detail.map((d: { msg?: string }) => d.msg).join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  if (typeof window !== "undefined") {
    const clean = path.split("?")[0];
    if (init.method === undefined && (clean === "/products" || clean === "/categories")) {
      const overlay = await loadLocalCatalog<{ products?: Product[]; categories?: Category[] }>();
      if (clean === "/products" && Array.isArray(data)) {
        const merged = mergeById(data as Product[], overlay?.products);
        await saveLocalCatalog({ ...overlay, products: merged }).catch(() => undefined);
        return merged as T;
      }
    }
    if (clean === "/products" && init.method === "POST" && data && typeof data === "object" && "id" in (data as object)) {
      const overlay = (await loadLocalCatalog<{ products?: Product[] }>()) || {};
      const products = mergeById(overlay.products || [], [data as unknown as Product]);
      await saveLocalCatalog({ ...overlay, products }).catch(() => undefined);
    }
    if (clean.startsWith("/products/") && (init.method === "PUT" || init.method === "DELETE")) {
      const overlay = (await loadLocalCatalog<{ products?: Product[] }>()) || {};
      const id = clean.slice("/products/".length);
      let products = overlay.products || [];
      if (init.method === "DELETE") products = products.filter((p) => p.id !== id);
      else if (data && typeof data === "object" && "id" in (data as object)) {
        products = mergeById(products, [data as unknown as Product]);
      }
      await saveLocalCatalog({ ...overlay, products }).catch(() => undefined);
    }
  }
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
