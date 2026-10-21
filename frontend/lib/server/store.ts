import { SEED_ADMIN_ID, SEED_BLOG, SEED_CATEGORIES, SEED_PRODUCTS, SEED_USERS } from "../catalog-seed";

export type StoreUser = {
  id: string;
  role: string;
  full_name_or_company: string;
  phone: string;
  password_plain?: string;
  passport_number: string;
  inn_number: string;
  birth_date: string;
  avatar_image?: string | null;
  bio?: string | null;
  craft?: string | null;
  workshop_address?: string | null;
  residential_address?: string | null;
  passport_address?: string | null;
  workshop_lat?: number | null;
  workshop_lng?: number | null;
  created_at: string;
};

export type StoreProduct = {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  region?: string;
  material?: string;
  images: string[];
  videos: string[];
  created_at: string;
};

export type Store = {
  users: StoreUser[];
  categories: { id: string; name: string; slug: string; description: string; icon_image: string }[];
  products: StoreProduct[];
  blog: { id: string; title: string; excerpt: string; body: string; cover_image: string | null }[];
  pages: { slug: string; title: string; body: string; extra: Record<string, unknown> }[];
  cart: { id: string; buyer_id: string; product_id: string; quantity: number }[];
  orders: { id: string; buyer_id: string; total_price: number; status: string; payment_method: string; shipping_address: string; created_at: string; items: { title?: string; quantity: number; unit_price: number }[] }[];
  custom_orders: Record<string, unknown>[];
  custom_messages: Record<string, unknown>[];
};

const g = globalThis as typeof globalThis & { __hunarmandStore?: Store };

function now() {
  return new Date().toISOString();
}

function seed(): Store {
  return {
    users: SEED_USERS.map((u) => ({ ...u, created_at: now() })),
    categories: SEED_CATEGORIES,
    products: SEED_PRODUCTS.map((p) => ({ ...p, created_at: now() })),
    blog: SEED_BLOG,
    pages: [
      {
        slug: "about",
        title: "Миссия ва дастаи мо",
        body: "Мо ҳунармандони тоҷикро бо харидорон пайваст мекунем. Hunarmand хариди мустақим, фармоиши инфиродӣ, харитаи устохонаҳо ва ёрирасони фарҳангиро муттаҳид мекунад.",
        extra: { team: [{ name: "Мадина Раҳимова", role: "Асосгузор" }] },
      },
    ],
    cart: [],
    orders: [],
    custom_orders: [],
    custom_messages: [],
  };
}

export function getStore(): Store {
  if (!g.__hunarmandStore) {
    g.__hunarmandStore = seed();
  }
  return g.__hunarmandStore;
}

export function saveStore(store: Store) {
  g.__hunarmandStore = store;
}

export function productView(p: StoreProduct, store = getStore()) {
  const seller = store.users.find((u) => u.id === p.seller_id);
  const category = store.categories.find((c) => c.id === p.category_id);
  return {
    ...p,
    seller_name: seller?.full_name_or_company,
    category_name: category?.name,
    category_slug: category?.slug,
  };
}

export { SEED_ADMIN_ID };
