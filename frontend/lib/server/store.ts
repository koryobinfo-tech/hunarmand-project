import fs from "fs";
import path from "path";
import { ABOUT_BODY, ABOUT_TEAM, ABOUT_TITLE } from "../culture";
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
  version: number;
  users: StoreUser[];
  categories: { id: string; name: string; slug: string; description: string; icon_image: string }[];
  products: StoreProduct[];
  blog: { id: string; title: string; excerpt: string; body: string; cover_image: string | null }[];
  pages: { slug: string; title: string; body: string; extra: Record<string, unknown> }[];
  cart: { id: string; buyer_id: string; product_id: string; quantity: number }[];
  orders: {
    id: string;
    buyer_id: string;
    total_price: number;
    status: string;
    payment_method: string;
    shipping_address: string;
    created_at: string;
    items: { title?: string; quantity: number; unit_price: number }[];
  }[];
  custom_orders: Record<string, unknown>[];
  custom_messages: Record<string, unknown>[];
};

const STORE_VERSION = 5;
const g = globalThis as typeof globalThis & { __hunarmandStore?: Store };

function now() {
  return new Date().toISOString();
}

function seed(): Store {
  return {
    version: STORE_VERSION,
    users: SEED_USERS.map((u) => ({ ...u, created_at: now() })),
    categories: SEED_CATEGORIES,
    products: SEED_PRODUCTS.map((p) => ({ ...p, created_at: now() })),
    blog: SEED_BLOG,
    pages: [
      {
        slug: "about",
        title: ABOUT_TITLE,
        body: ABOUT_BODY,
        extra: { team: ABOUT_TEAM },
      },
    ],
    cart: [],
    orders: [],
    custom_orders: [],
    custom_messages: [],
  };
}

function filePaths() {
  return [
    path.join(process.cwd(), "data", "hunarmand-db.json"),
    path.join("/tmp", "hunarmand-db.json"),
  ];
}

function loadFromDisk(): Store | null {
  for (const file of filePaths()) {
    try {
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as Store;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function saveToDisk(store: Store) {
  for (const file of filePaths()) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(store));
    } catch {
      /* read-only on some hosts */
    }
  }
}

function mergeSeed(store: Store): Store {
  const base = seed();
  const users = new Map(store.users?.map((u) => [u.id, u]));
  for (const u of base.users) if (!users.has(u.id)) users.set(u.id, u);
  const products = new Map(store.products?.map((p) => [p.id, p]));
  for (const p of base.products) if (!products.has(p.id)) products.set(p.id, p);
  const categories = store.categories?.length ? store.categories : base.categories;
  store.users = [...users.values()];
  store.products = [...products.values()];
  store.categories = categories;
  store.blog = store.blog?.length ? store.blog : base.blog;
  store.pages = store.pages?.length ? store.pages : base.pages;
  const about = store.pages.find((p) => p.slug === "about") || store.pages[0];
  if (about) {
    about.slug = "about";
    about.title = ABOUT_TITLE;
    about.body = ABOUT_BODY;
    about.extra = { team: ABOUT_TEAM };
  } else {
    store.pages.push(base.pages[0]);
  }
  store.cart = store.cart || [];
  store.orders = store.orders || [];
  store.custom_orders = store.custom_orders || [];
  store.custom_messages = store.custom_messages || [];
  store.version = STORE_VERSION;
  return store;
}

export function getStore(): Store {
  if (!g.__hunarmandStore) {
    g.__hunarmandStore = mergeSeed(loadFromDisk() || seed());
    saveToDisk(g.__hunarmandStore);
  }
  return g.__hunarmandStore;
}

export function saveStore(store: Store) {
  g.__hunarmandStore = store;
  saveToDisk(store);
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
