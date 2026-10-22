import { jwtVerify, SignJWT } from "jose";
import { AI_TOPICS, answerCulture } from "../culture";
import { getStore, productView, saveStore, SEED_ADMIN_ID, type StoreUser } from "./store";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.SECRET_KEY || "hunarmand-vercel-secret-change-me",
);

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
function err(detail: string, status = 400) {
  return json({ detail }, status);
}
function normalizePhone(phone: string) {
  const value = phone.replace(/[ \-()]/g, "").trim();
  return value.toUpperCase() === "ADMIN" ? "ADMIN" : value;
}
function isPhone(phone: string) {
  return /^\+992\d{9}$/.test(phone);
}

async function tokenOf(user: StoreUser) {
  const access_token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  return {
    access_token,
    token_type: "bearer",
    role: user.role,
    user_id: user.id,
    full_name_or_company: user.full_name_or_company,
  };
}

export async function storeAuthUser(req: Request): Promise<StoreUser | null> {
  const header = req.headers.get("authorization") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    return getStore().users.find((u) => u.id === String(payload.sub)) || null;
  } catch {
    return null;
  }
}

async function requireAdmin(req: Request) {
  const user = await storeAuthUser(req);
  if (!user) return { user: null, error: err("Token нодуруст аст", 401) };
  if (user.role !== "admin") return { user: null, error: err("Дастрасӣ танҳо барои админ", 403) };
  return { user, error: null };
}

function checkPassword(user: StoreUser, password: string) {
  return user.password_plain === password;
}

export async function handleStoreApi(req: Request, parts: string[]) {
  const store = getStore();
  const path = "/" + parts.filter(Boolean).join("/");
  const url = new URL(req.url);
  let body: Record<string, unknown> = {};
  if (req.method !== "GET" && req.method !== "DELETE") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  if ((path === "/health" || path === "/") && req.method === "GET") {
    return json({
      status: "ok",
      service: "hunarmand-store",
      database: "local-store",
      persistent: true,
      db_ok: true,
      culture_version: 5,
      max_upload_mb: 20,
    });
  }
  if (path === "/storage" && req.method === "GET") {
    return json({
      database: "local-store",
      persistent: true,
      postgres: false,
      counts: { users: store.users.length, products: store.products.length },
    });
  }

  if (path === "/categories" && req.method === "GET") return json(store.categories);

  if (path === "/products" && req.method === "GET") {
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const sellerId = url.searchParams.get("seller_id");
    const min = Number(url.searchParams.get("min_price") || 0);
    const max = Number(url.searchParams.get("max_price") || 0);
    let rows = store.products.map((p) => productView(p, store));
    if (category) rows = rows.filter((r) => r.category_id === category || r.category_slug === category);
    if (sellerId) rows = rows.filter((r) => r.seller_id === sellerId);
    if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (r.region || "").toLowerCase().includes(q));
    if (min) rows = rows.filter((r) => r.price >= min);
    if (max) rows = rows.filter((r) => r.price <= max);
    return json(rows);
  }
  if (path.startsWith("/products/") && req.method === "GET") {
    const p = store.products.find((x) => x.id === parts[1]);
    if (!p) return err("Маҳсулот ёфт нашуд", 404);
    return json(productView(p, store));
  }
  if (path === "/products" && req.method === "POST") {
    const user = await storeAuthUser(req);
    if (!user || !["artisan", "admin"].includes(user.role)) return err("Дастрасӣ манъ аст", 403);
    const item = {
      id: crypto.randomUUID(),
      seller_id: user.id,
      category_id: String(body.category_id || store.categories[0]?.id || ""),
      title: String(body.title || "Маҳсулоти нав"),
      description: String(body.description || ""),
      price: Number(body.price || 0),
      stock: Number(body.stock || 0),
      region: String(body.region || ""),
      material: String(body.material || ""),
      images: Array.isArray(body.images) ? (body.images as string[]) : [],
      videos: Array.isArray(body.videos) ? (body.videos as string[]) : [],
      created_at: new Date().toISOString(),
    };
    store.products.unshift(item);
    saveStore(store);
    return json(productView(item, store));
  }
  if (path.startsWith("/products/") && req.method === "PUT") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const p = store.products.find((x) => x.id === parts[1]);
    if (!p) return err("Маҳсулот ёфт нашуд", 404);
    if (p.seller_id !== user.id && user.role !== "admin") return err("Дастрасӣ манъ аст", 403);
    p.category_id = String(body.category_id ?? p.category_id);
    p.title = String(body.title ?? p.title);
    p.description = String(body.description ?? p.description);
    p.price = Number(body.price ?? p.price);
    p.stock = Number(body.stock ?? p.stock);
    if (body.region !== undefined) p.region = String(body.region);
    if (body.material !== undefined) p.material = String(body.material);
    if (body.images) p.images = body.images as string[];
    if (body.videos) p.videos = body.videos as string[];
    saveStore(store);
    return json(productView(p, store));
  }
  if (path.startsWith("/products/") && req.method === "DELETE") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const p = store.products.find((x) => x.id === parts[1]);
    if (!p) return err("Маҳсулот ёфт нашуд", 404);
    if (p.seller_id !== user.id && user.role !== "admin") return err("Дастрасӣ манъ аст", 403);
    store.products = store.products.filter((x) => x.id !== parts[1]);
    store.cart = store.cart.filter((c) => c.product_id !== parts[1]);
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/auth/register" && req.method === "POST") {
    const phone = normalizePhone(String(body.phone || ""));
    const password = String(body.password || "");
    const role = String(body.role || "buyer");
    if (role === "admin" || phone === "ADMIN") return err("Бақайдгирии админ манъ аст");
    if (!isPhone(phone)) return err("Рақами телефон бояд бо +992 оғоз шавад ва баъд аз он 9 рақам бошад");
    if (!/[A-Za-zА-Яа-яЁёӢӣӮӯҲҳҶҷҚқҒғ]/.test(password) || !/\d/.test(password)) {
      return err("Рамз бояд ҳам ҳарф ва ҳам рақам дошта бошад");
    }
    if (store.users.some((u) => u.phone === phone)) return err("phone аллакай истифода шудааст");
    const user: StoreUser = {
      id: crypto.randomUUID(),
      role,
      full_name_or_company: String(body.full_name_or_company || ""),
      phone,
      password_plain: password,
      passport_number: String(body.passport_number || crypto.randomUUID().slice(0, 8)),
      inn_number: String(body.inn_number || crypto.randomUUID().slice(0, 9)),
      birth_date: String(body.birth_date || "1995-01-01"),
      avatar_image: (body.avatar_image as string) || null,
      bio: (body.bio as string) || null,
      craft: (body.craft as string) || null,
      workshop_address: (body.workshop_address as string) || null,
      residential_address: (body.residential_address as string) || null,
      passport_address: (body.passport_address as string) || null,
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
    saveStore(store);
    return json(await tokenOf(user));
  }
  if (path === "/auth/login" && req.method === "POST") {
    const phone = normalizePhone(String(body.phone || body.login || ""));
    const password = String(body.password || "");
    const user = store.users.find((u) => u.phone === phone);
    if (!user || !checkPassword(user, password)) return err("Рақам ё рамз нодуруст аст", 401);
    return json(await tokenOf(user));
  }
  if (path === "/auth/me" && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    return json(user);
  }
  if (path === "/auth/me" && req.method === "PUT") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    if (user.role !== "admin") user.phone = body.phone ? normalizePhone(String(body.phone)) : user.phone;
    user.full_name_or_company = String(body.full_name_or_company ?? user.full_name_or_company);
    if (body.bio !== undefined) user.bio = String(body.bio);
    if (body.craft !== undefined) user.craft = String(body.craft);
    if (body.workshop_address !== undefined) user.workshop_address = String(body.workshop_address);
    if (body.residential_address !== undefined) user.residential_address = String(body.residential_address);
    if (body.avatar_image !== undefined) user.avatar_image = String(body.avatar_image);
    saveStore(store);
    return json(user);
  }

  if (path === "/artisans" && req.method === "GET") {
    return json(store.users.filter((u) => u.role === "artisan"));
  }
  if (path === "/artisans/map" && req.method === "GET") {
    return json(store.users.filter((u) => u.role === "artisan" && u.workshop_lat != null));
  }
  if (path.startsWith("/artisans/") && req.method === "GET") {
    const a = store.users.find((u) => u.id === parts[1] && u.role === "artisan");
    if (!a) return err("Ҳунарманд ёфт нашуд", 404);
    return json({ ...a, products: store.products.filter((p) => p.seller_id === a.id).map((p) => productView(p, store)) });
  }

  if (path === "/blog" && req.method === "GET") return json(store.blog);
  if (path.startsWith("/blog/") && req.method === "GET") {
    const post = store.blog.find((b) => b.id === parts[1]);
    if (!post) return err("Мақола ёфт нашуд", 404);
    return json(post);
  }
  if (path === "/blog" && req.method === "POST") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const post = {
      id: crypto.randomUUID(),
      title: String(body.title || ""),
      excerpt: String(body.excerpt || ""),
      body: String(body.body || ""),
      cover_image: (body.cover_image as string) || null,
    };
    store.blog.unshift(post);
    saveStore(store);
    return json(post);
  }
  if (path.startsWith("/blog/") && req.method === "PUT") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const post = store.blog.find((b) => b.id === parts[1]);
    if (!post) return err("Мақола ёфт нашуд", 404);
    post.title = String(body.title ?? post.title);
    post.excerpt = String(body.excerpt ?? post.excerpt);
    post.body = String(body.body ?? post.body);
    if (body.cover_image !== undefined) post.cover_image = body.cover_image as string;
    saveStore(store);
    return json(post);
  }
  if (path.startsWith("/blog/") && req.method === "DELETE") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    store.blog = store.blog.filter((b) => b.id !== parts[1]) as typeof store.blog;
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/ai/topics" && req.method === "GET") {
    return json(AI_TOPICS);
  }
  if (path === "/ai/chat" && req.method === "POST") {
    const known = answerCulture(String(body.message || ""));
    const related = store.products.slice(0, 4).map((p) => ({ id: p.id, title: p.title, price: p.price, image: p.images[0] || null }));
    if (known) {
      return json({
        reply: known.reply,
        topic: known.topic,
        suggestions: AI_TOPICS.map((t) => t.prompt),
        related,
      });
    }
    return json({
      reply: "Ман Ёрирасони Фарҳангии Hunarmand ҳастам. Дар бораи чакан, кулолгарӣ ё чӯбкорӣ пурсед — мавзӯъҳоро аз тарафи чап интихоб кунед.",
      topic: "Фарҳанг",
      suggestions: AI_TOPICS.map((t) => t.prompt),
      related,
    });
  }

  if (path === "/cart" && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const out = store.cart
      .filter((c) => c.buyer_id === user.id)
      .map((item) => {
        const p = store.products.find((x) => x.id === item.product_id);
        if (!p) return null;
        return { id: item.id, product_id: item.product_id, quantity: item.quantity, product: productView(p, store) };
      })
      .filter(Boolean);
    return json(out);
  }
  if (path === "/cart" && req.method === "POST") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const productId = String(body.product_id || "");
    const qty = Number(body.quantity || 1);
    const existing = store.cart.find((c) => c.buyer_id === user.id && c.product_id === productId);
    if (existing) existing.quantity += qty;
    else store.cart.push({ id: crypto.randomUUID(), buyer_id: user.id, product_id: productId, quantity: qty });
    saveStore(store);
    return handleStoreApi(new Request(req.url, { headers: req.headers, method: "GET" }), ["cart"]);
  }
  if (path.startsWith("/cart/") && req.method === "PUT") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const qty = Number(body.quantity || 0);
    if (qty <= 0) store.cart = store.cart.filter((c) => !(c.id === parts[1] && c.buyer_id === user.id));
    else {
      const row = store.cart.find((c) => c.id === parts[1] && c.buyer_id === user.id);
      if (row) row.quantity = qty;
    }
    saveStore(store);
    return json({ ok: true });
  }
  if (path.startsWith("/cart/") && req.method === "DELETE") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    store.cart = store.cart.filter((c) => !(c.id === parts[1] && c.buyer_id === user.id));
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/checkout" && req.method === "POST") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const items = store.cart.filter((c) => c.buyer_id === user.id);
    if (!items.length) return err("Сабади харид холӣ аст");
    let total = 0;
    const built: { title: string; quantity: number; unit_price: number }[] = [];
    for (const item of items) {
      const p = store.products.find((x) => x.id === item.product_id);
      if (!p) continue;
      total += p.price * item.quantity;
      built.push({ title: p.title, quantity: item.quantity, unit_price: p.price });
    }
    const orderId = crypto.randomUUID();
    store.orders.unshift({
      id: orderId,
      buyer_id: user.id,
      total_price: total,
      status: "paid",
      payment_method: String(body.payment_method || "national_card"),
      shipping_address: String(body.shipping_address || ""),
      created_at: new Date().toISOString(),
      items: built,
    });
    store.cart = store.cart.filter((c) => c.buyer_id !== user.id);
    saveStore(store);
    return json({ id: orderId, total_price: total, status: "paid" });
  }

  if (path === "/orders" && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const rows = user.role === "admin" ? store.orders : store.orders.filter((o) => o.buyer_id === user.id);
    return json(rows);
  }
  if (path.startsWith("/orders/") && req.method === "PUT") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const o = store.orders.find((x) => x.id === parts[1]);
    if (o) o.status = String(body.status || "pending");
    saveStore(store);
    return json({ ok: true });
  }
  if (path.startsWith("/orders/") && req.method === "DELETE") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    store.orders = store.orders.filter((x) => x.id !== parts[1]);
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/custom-orders" && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    return json(store.custom_orders);
  }
  if (path === "/custom-orders" && req.method === "POST") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const id = crypto.randomUUID();
    store.custom_orders.unshift({
      id,
      buyer_id: user.id,
      seller_id: String(body.seller_id || ""),
      title: String(body.title || "Фармоиши махсус"),
      description: String(body.description || ""),
      status: "requested",
      created_at: new Date().toISOString(),
    });
    saveStore(store);
    return json({ id });
  }
  if (path.match(/^\/custom-orders\/[^/]+$/) && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const o = store.custom_orders.find((x) => String(x.id) === parts[1]);
    if (!o) return err("Фармоиш ёфт нашуд", 404);
    return json(o);
  }
  if (path.match(/^\/custom-orders\/[^/]+$/) && req.method === "PUT") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    const o = store.custom_orders.find((x) => String(x.id) === parts[1]);
    if (o) o.status = String(body.status || "requested");
    saveStore(store);
    return json({ ok: true });
  }
  if (path.match(/^\/custom-orders\/[^/]+$/) && req.method === "DELETE") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    store.custom_orders = store.custom_orders.filter((x) => String(x.id) !== parts[1]);
    saveStore(store);
    return json({ ok: true });
  }
  if (path.endsWith("/messages") && req.method === "GET") return json(store.custom_messages.filter((m) => m.custom_order_id === parts[1]));
  if (path.endsWith("/messages") && req.method === "POST") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    store.custom_messages.push({ id: crypto.randomUUID(), custom_order_id: parts[1], sender_id: user.id, body: String(body.body || "") });
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/dashboard/stats" && req.method === "GET") {
    const user = await storeAuthUser(req);
    if (!user) return err("Token нодуруст аст", 401);
    return json({
      products: store.products.length,
      custom_orders: store.custom_orders.length,
      orders: store.orders.length,
      revenue: store.orders.reduce((s, o) => s + o.total_price, 0),
      low_stock: store.products.filter((p) => p.stock < 5).length,
      users: store.users.length,
    });
  }

  if (path === "/admin/users" && req.method === "GET") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    return json(store.users);
  }
  if (path.startsWith("/admin/users/") && req.method === "PUT") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const row = store.users.find((u) => u.id === parts[2]);
    if (!row) return err("Корбар ёфт нашуд", 404);
    if (row.id === SEED_ADMIN_ID) row.role = "admin";
    else if (body.role) row.role = String(body.role);
    row.full_name_or_company = String(body.full_name_or_company ?? row.full_name_or_company);
    if (row.role !== "admin" && body.phone) row.phone = normalizePhone(String(body.phone));
    saveStore(store);
    return json(row);
  }
  if (path.startsWith("/admin/users/") && req.method === "DELETE") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    if (parts[2] === user.id || parts[2] === SEED_ADMIN_ID) return err("Шумо наметавонед ҳисоби худатонро нест кунед");
    store.users = store.users.filter((u) => u.id !== parts[2]);
    saveStore(store);
    return json({ ok: true });
  }

  if (path === "/categories" && req.method === "POST") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const cat = {
      id: crypto.randomUUID(),
      name: String(body.name || ""),
      slug: String(body.slug || String(body.name || "").toLowerCase().replace(/\s+/g, "-")),
      description: String(body.description || ""),
      icon_image: (body.icon_image as string) || "",
    };
    store.categories.push(cat);
    saveStore(store);
    return json(cat);
  }
  if (path.startsWith("/categories/") && req.method === "PUT") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    const cat = store.categories.find((c) => c.id === parts[1]);
    if (!cat) return err("Категория ёфт нашуд", 404);
    cat.name = String(body.name ?? cat.name);
    cat.slug = String(body.slug ?? cat.slug);
    cat.description = String(body.description ?? cat.description);
    if (body.icon_image !== undefined) cat.icon_image = String(body.icon_image);
    saveStore(store);
    return json(cat);
  }
  if (path.startsWith("/categories/") && req.method === "DELETE") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    store.categories = store.categories.filter((c) => c.id !== parts[1]) as typeof store.categories;
    saveStore(store);
    return json({ ok: true });
  }

  if (path.startsWith("/pages/") && req.method === "GET") {
    const row = store.pages.find((p) => p.slug === parts[1]);
    if (!row) return err("Саҳифа ёфт нашуд", 404);
    return json(row);
  }
  if (path.startsWith("/pages/") && req.method === "PUT") {
    const { user, error } = await requireAdmin(req);
    if (!user) return error;
    let row = store.pages.find((p) => p.slug === parts[1]);
    if (!row) {
      row = { slug: parts[1], title: "", body: "", extra: {} };
      store.pages.push(row);
    }
    row.title = String(body.title || row.title);
    row.body = String(body.body || row.body);
    if (body.extra) row.extra = body.extra as Record<string, unknown>;
    saveStore(store);
    return json(row);
  }

  return err("Роут ёфт нашуд", 404);
}
