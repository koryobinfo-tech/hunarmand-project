import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { getSql, hasDatabase, initSchema } from "./db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.SECRET_KEY || "hunarmand-vercel-secret-change-me",
);

type User = {
  id: string;
  role: string;
  full_name_or_company: string;
  phone: string;
  password_hash?: string;
  passport_number?: string;
  inn_number?: string;
  birth_date?: string;
  avatar_image?: string | null;
  created_at?: string;
  passport_address?: string | null;
  residential_address?: string | null;
  workshop_address?: string | null;
  tax_registration_number?: string | null;
  workshop_lat?: number | null;
  workshop_lng?: number | null;
  bio?: string | null;
  craft?: string | null;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function err(detail: string, status = 400) {
  return json({ detail }, status);
}

function normalizePhone(phone: string) {
  return phone.replace(/[ \-()]/g, "").trim();
}

function isPhone(phone: string) {
  return /^\+992\d{9}$/.test(phone);
}

async function tokenOf(user: User) {
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

async function authUser(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    const db = getSql();
    const rows = await db`SELECT * FROM users WHERE id = ${String(payload.sub)} LIMIT 1`;
    return (rows[0] as User) || null;
  } catch {
    return null;
  }
}

function parseJson(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value || [];
}

async function productOut(row: Record<string, unknown>) {
  const db = getSql();
  const seller = row.seller_id
    ? ((await db`SELECT full_name_or_company FROM users WHERE id = ${row.seller_id as string} LIMIT 1`)[0] as { full_name_or_company?: string } | undefined)
    : undefined;
  const category = row.category_id
    ? ((await db`SELECT name, slug FROM categories WHERE id = ${row.category_id as string} LIMIT 1`)[0] as { name?: string; slug?: string } | undefined)
    : undefined;
  return {
    id: row.id,
    seller_id: row.seller_id,
    category_id: row.category_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    stock: Number(row.stock),
    images: parseJson(row.images),
    videos: parseJson(row.videos),
    created_at: row.created_at,
    seller_name: seller?.full_name_or_company,
    category_name: category?.name,
    category_slug: category?.slug,
  };
}

export async function handleApi(req: Request, parts: string[]) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (!hasDatabase()) {
    return err("Базаи Vercel Postgres пайваст нест. Дар Vercel: Storage → Create Database → Postgres, баъд Redeploy.", 503);
  }
  await initSchema();
  const db = getSql();
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

  try {
    if (path === "/health" && req.method === "GET") {
      return json({ status: "ok", service: "hunarmand-vercel", database: "postgresql", persistent: true, db_ok: true });
    }
    if (path === "/storage" && req.method === "GET") {
      const users = await db`SELECT COUNT(*)::int AS n FROM users`;
      const products = await db`SELECT COUNT(*)::int AS n FROM products`;
      return json({
        database: "postgresql",
        persistent: true,
        postgres: true,
        tables: { users: "профилҳо", products: "маҳсулот" },
        counts: { users: users[0].n, products: products[0].n },
      });
    }

    if (path === "/categories" && req.method === "GET") {
      return json(await db`SELECT * FROM categories ORDER BY name`);
    }

    if (path === "/products" && req.method === "GET") {
      const category = url.searchParams.get("category");
      const q = url.searchParams.get("q");
      const sellerId = url.searchParams.get("seller_id");
      let rows = await db`
        SELECT p.*, c.slug AS category_slug FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.created_at DESC`;
      if (category) rows = rows.filter((r) => r.category_id === category || r.category_slug === category);
      if (sellerId) rows = rows.filter((r) => r.seller_id === sellerId);
      if (q) {
        const like = q.toLowerCase();
        rows = rows.filter(
          (r) => String(r.title).toLowerCase().includes(like) || String(r.description).toLowerCase().includes(like),
        );
      }
      return json(await Promise.all(rows.map((r) => productOut(r as Record<string, unknown>))));
    }

    if (path.startsWith("/products/") && req.method === "GET") {
      const id = parts[1];
      const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
      if (!rows[0]) return err("Маҳсулот ёфт нашуд", 404);
      return json(await productOut(rows[0] as Record<string, unknown>));
    }

    if (path === "/products" && req.method === "POST") {
      const user = await authUser(req);
      if (!user || !["artisan", "admin"].includes(user.role)) return err("Дастрасӣ манъ аст", 403);
      const id = crypto.randomUUID();
      await db`
        INSERT INTO products (id, seller_id, category_id, title, description, price, stock, images, videos)
        VALUES (
          ${id},
          ${user.id},
          ${String(body.category_id || "")},
          ${String(body.title || "")},
          ${String(body.description || "")},
          ${Number(body.price || 0)},
          ${Number(body.stock || 0)},
          ${db.json(Array.isArray(body.images) ? body.images : [])},
          ${db.json(Array.isArray(body.videos) ? body.videos : [])}
        )`;
      const rows = await db`SELECT * FROM products WHERE id = ${id}`;
      return json(await productOut(rows[0] as Record<string, unknown>));
    }

    if (path.startsWith("/products/") && req.method === "PUT") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const id = parts[1];
      const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
      if (!rows[0]) return err("Маҳсулот ёфт нашуд", 404);
      if (rows[0].seller_id !== user.id && user.role !== "admin") return err("Дастрасӣ манъ аст", 403);
      await db`
        UPDATE products SET
          category_id = ${String(body.category_id ?? rows[0].category_id)},
          title = ${String(body.title ?? rows[0].title)},
          description = ${String(body.description ?? rows[0].description)},
          price = ${Number(body.price ?? rows[0].price)},
          stock = ${Number(body.stock ?? rows[0].stock)},
          images = ${db.json(body.images ? body.images : parseJson(rows[0].images))},
          videos = ${db.json(body.videos ? body.videos : parseJson(rows[0].videos))}
        WHERE id = ${id}`;
      const next = await db`SELECT * FROM products WHERE id = ${id}`;
      return json(await productOut(next[0] as Record<string, unknown>));
    }

    if (path.startsWith("/products/") && req.method === "DELETE") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const id = parts[1];
      const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
      if (!rows[0]) return err("Маҳсулот ёфт нашуд", 404);
      if (rows[0].seller_id !== user.id && user.role !== "admin") return err("Дастрасӣ манъ аст", 403);
      await db`DELETE FROM cart_items WHERE product_id = ${id}`;
      await db`DELETE FROM products WHERE id = ${id}`;
      return json({ ok: true });
    }

    if (path === "/auth/register" && req.method === "POST") {
      const phone = normalizePhone(String(body.phone || ""));
      const password = String(body.password || "");
      const role = String(body.role || "buyer");
      if (role === "admin") return err("Бақайдгирии админ манъ аст");
      if (!isPhone(phone)) return err("Рақами телефон бояд бо +992 оғоз шавад ва баъд аз он 9 рақам бошад");
      if (!/[A-Za-zА-Яа-яЁёӢӣӮӯҲҳҶҷҚқҒғ]/.test(password) || !/\d/.test(password)) {
        return err("Рамз бояд ҳам ҳарф ва ҳам рақам дошта бошад");
      }
      const exists = await db`SELECT id FROM users WHERE phone = ${phone} LIMIT 1`;
      if (exists[0]) return err("phone аллакай истифода шудааст");
      const id = crypto.randomUUID();
      await db`
        INSERT INTO users (id, role, full_name_or_company, phone, password_hash, passport_number, inn_number, birth_date, passport_address, residential_address, workshop_address, craft, bio, avatar_image)
        VALUES (
          ${id}, ${role}, ${String(body.full_name_or_company || "")}, ${phone},
          ${await bcrypt.hash(password.slice(0, 72), 10)},
          ${String(body.passport_number || id.slice(0, 8))},
          ${String(body.inn_number || id.slice(0, 9))},
          ${String(body.birth_date || "1995-01-01")},
          ${(body.passport_address as string) || null},
          ${(body.residential_address as string) || null},
          ${(body.workshop_address as string) || null},
          ${(body.craft as string) || null},
          ${(body.bio as string) || null},
          ${(body.avatar_image as string) || null}
        )`;
      const user = (await db`SELECT * FROM users WHERE id = ${id}`)[0] as User;
      return json(await tokenOf(user));
    }

    if (path === "/auth/login" && req.method === "POST") {
      const phone = normalizePhone(String(body.phone || ""));
      const rows = await db`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`;
      const user = rows[0] as User | undefined;
      if (!user || !(await bcrypt.compare(String(body.password || ""), user.password_hash || ""))) {
        return err("Рақам ё рамз нодуруст аст", 401);
      }
      return json(await tokenOf(user));
    }

    if (path === "/auth/me" && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      return json(user);
    }

    if (path === "/auth/me" && req.method === "PUT") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const phone = body.phone ? normalizePhone(String(body.phone)) : user.phone;
      if (phone !== user.phone) {
        const clash = await db`SELECT id FROM users WHERE phone = ${phone} AND id <> ${user.id} LIMIT 1`;
        if (clash[0]) return err("Ин рақами телефон аллакай истифода шудааст");
      }
      await db`
        UPDATE users SET
          full_name_or_company = ${String(body.full_name_or_company ?? user.full_name_or_company)},
          phone = ${phone},
          bio = ${body.bio !== undefined ? String(body.bio) : user.bio || null},
          craft = ${body.craft !== undefined ? String(body.craft) : user.craft || null},
          workshop_address = ${body.workshop_address !== undefined ? String(body.workshop_address) : user.workshop_address || null},
          residential_address = ${body.residential_address !== undefined ? String(body.residential_address) : user.residential_address || null},
          avatar_image = ${body.avatar_image !== undefined ? String(body.avatar_image) : user.avatar_image || null},
          passport_address = ${body.passport_address !== undefined ? String(body.passport_address) : user.passport_address || null}
        WHERE id = ${user.id}`;
      return json((await db`SELECT * FROM users WHERE id = ${user.id}`)[0]);
    }

    if (path === "/artisans" && req.method === "GET") {
      return json(await db`SELECT id, full_name_or_company, craft, workshop_address, workshop_lat, workshop_lng, avatar_image, bio FROM users WHERE role = 'artisan'`);
    }
    if (path === "/artisans/map" && req.method === "GET") {
      return json(
        await db`SELECT id, full_name_or_company, craft, workshop_address, workshop_lat, workshop_lng, avatar_image, bio FROM users WHERE role = 'artisan' AND workshop_lat IS NOT NULL`,
      );
    }
    if (path.startsWith("/artisans/") && req.method === "GET") {
      const id = parts[1];
      const a = (await db`SELECT * FROM users WHERE id = ${id} AND role = 'artisan' LIMIT 1`)[0];
      if (!a) return err("Ҳунарманд ёфт нашуд", 404);
      const products = await db`SELECT id, title, price, images FROM products WHERE seller_id = ${id}`;
      return json({ ...a, products: products.map((p) => ({ ...p, images: parseJson(p.images) })) });
    }

    if (path === "/blog" && req.method === "GET") {
      return json(await db`SELECT * FROM blog_posts ORDER BY created_at DESC`);
    }
    if (path.startsWith("/blog/") && req.method === "GET") {
      const post = (await db`SELECT * FROM blog_posts WHERE id = ${parts[1]} LIMIT 1`)[0];
      if (!post) return err("Мақола ёфт нашуд", 404);
      return json(post);
    }

    if (path === "/ai/topics" && req.method === "GET") {
      return json([
        { id: "chakan", title: "Чакан ва нақшҳои миллӣ", prompt: "Маънои нақшҳои чаканро шарҳ диҳед" },
        { id: "pottery", title: "Кулолгарӣ", prompt: "Дар бораи кулолгарии Истаравшан нақл кунед" },
        { id: "wood", title: "Чӯбкорӣ", prompt: "Чӯбкориро шарҳ диҳед" },
      ]);
    }
    if (path === "/ai/chat" && req.method === "POST") {
      const related = await db`SELECT id, title, price, images FROM products ORDER BY created_at DESC LIMIT 4`;
      return json({
        reply: "Ман Ёрирасони Фарҳангии Hunarmand ҳастам. Дар бораи чакан, кулолгарӣ, чӯбкорӣ ва хӯрокаи ватанӣ пурсед.",
        topic: "Фарҳанг",
        suggestions: ["Чакан чист?", "Чӣ тавр зарфро нигоҳ дорем?"],
        related: related.map((p) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          image: parseJson(p.images)[0] || null,
        })),
      });
    }

    if (path === "/cart" && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const items = await db`SELECT * FROM cart_items WHERE buyer_id = ${user.id}`;
      const out = [];
      for (const item of items) {
        const p = (await db`SELECT * FROM products WHERE id = ${item.product_id} LIMIT 1`)[0];
        if (!p) continue;
        out.push({ id: item.id, product_id: item.product_id, quantity: item.quantity, product: await productOut(p as Record<string, unknown>) });
      }
      return json(out);
    }
    if (path === "/cart" && req.method === "POST") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const productId = String(body.product_id || "");
      const qty = Number(body.quantity || 1);
      const existing = (await db`SELECT * FROM cart_items WHERE buyer_id = ${user.id} AND product_id = ${productId} LIMIT 1`)[0];
      if (existing) {
        await db`UPDATE cart_items SET quantity = ${Number(existing.quantity) + qty} WHERE id = ${existing.id}`;
      } else {
        await db`INSERT INTO cart_items (id, buyer_id, product_id, quantity) VALUES (${crypto.randomUUID()}, ${user.id}, ${productId}, ${qty})`;
      }
      return handleApi(new Request(req.url, { headers: req.headers, method: "GET" }), ["cart"]);
    }
    if (path.startsWith("/cart/") && req.method === "PUT") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const qty = Number(body.quantity || 0);
      if (qty <= 0) await db`DELETE FROM cart_items WHERE id = ${parts[1]} AND buyer_id = ${user.id}`;
      else await db`UPDATE cart_items SET quantity = ${qty} WHERE id = ${parts[1]} AND buyer_id = ${user.id}`;
      return json({ ok: true });
    }
    if (path.startsWith("/cart/") && req.method === "DELETE") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      await db`DELETE FROM cart_items WHERE id = ${parts[1]} AND buyer_id = ${user.id}`;
      return json({ ok: true });
    }

    if (path === "/checkout" && req.method === "POST") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const items = await db`SELECT * FROM cart_items WHERE buyer_id = ${user.id}`;
      if (!items.length) return err("Сабади харид холӣ аст");
      let total = 0;
      const orderId = crypto.randomUUID();
      const built = [];
      for (const item of items) {
        const p = (await db`SELECT * FROM products WHERE id = ${item.product_id} LIMIT 1`)[0];
        if (!p) continue;
        const unit = Number(p.price);
        total += unit * Number(item.quantity);
        built.push({ item, p, unit });
      }
      await db`
        INSERT INTO orders (id, buyer_id, total_price, status, payment_method, shipping_address)
        VALUES (${orderId}, ${user.id}, ${total}, 'paid', ${String(body.payment_method || "national_card")}, ${String(body.shipping_address || "")})`;
      for (const row of built) {
        await db`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, title, image)
          VALUES (${crypto.randomUUID()}, ${orderId}, ${row.item.product_id}, ${row.item.quantity}, ${row.unit}, ${row.p.title}, ${(parseJson(row.p.images)[0] as string) || null})`;
      }
      await db`DELETE FROM cart_items WHERE buyer_id = ${user.id}`;
      return json({ id: orderId, total_price: total, status: "paid" });
    }

    if (path === "/orders" && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const orders =
        user.role === "artisan"
          ? await db`
              SELECT DISTINCT o.* FROM orders o
              JOIN order_items i ON i.order_id = o.id
              JOIN products p ON p.id = i.product_id
              WHERE p.seller_id = ${user.id}
              ORDER BY o.created_at DESC`
          : await db`SELECT * FROM orders WHERE buyer_id = ${user.id} ORDER BY created_at DESC`;
      const out = [];
      for (const o of orders) {
        const items = await db`SELECT title, quantity, unit_price FROM order_items WHERE order_id = ${o.id}`;
        out.push({ ...o, items });
      }
      return json(out);
    }

    if (path === "/custom-orders" && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const rows =
        user.role === "artisan"
          ? await db`SELECT * FROM custom_orders WHERE seller_id = ${user.id} ORDER BY created_at DESC`
          : user.role === "admin"
            ? await db`SELECT * FROM custom_orders ORDER BY created_at DESC`
            : await db`SELECT * FROM custom_orders WHERE buyer_id = ${user.id} ORDER BY created_at DESC`;
      const out = [];
      for (const o of rows) {
        const buyer = (await db`SELECT full_name_or_company FROM users WHERE id = ${o.buyer_id}`)[0];
        const seller = (await db`SELECT full_name_or_company FROM users WHERE id = ${o.seller_id}`)[0];
        out.push({ ...o, buyer_name: buyer?.full_name_or_company, seller_name: seller?.full_name_or_company });
      }
      return json(out);
    }
    if (path === "/custom-orders" && req.method === "POST") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const id = crypto.randomUUID();
      await db`
        INSERT INTO custom_orders (id, buyer_id, seller_id, title, description, reference_image, agreed_price)
        VALUES (
          ${id}, ${user.id}, ${String(body.seller_id || "")}, ${String(body.title || "Фармоиши махсус")},
          ${String(body.description || "")}, ${(body.reference_image as string) || null},
          ${body.agreed_price ? Number(body.agreed_price) : null}
        )`;
      return json({ id });
    }
    if (path.match(/^\/custom-orders\/[^/]+$/) && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const o = (await db`SELECT * FROM custom_orders WHERE id = ${parts[1]} LIMIT 1`)[0];
      if (!o) return err("Фармоиш ёфт нашуд", 404);
      const buyer = (await db`SELECT full_name_or_company FROM users WHERE id = ${o.buyer_id}`)[0];
      const seller = (await db`SELECT full_name_or_company FROM users WHERE id = ${o.seller_id}`)[0];
      return json({ ...o, buyer_name: buyer?.full_name_or_company, seller_name: seller?.full_name_or_company });
    }
    if (path.endsWith("/messages") && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      return json(await db`SELECT * FROM custom_order_messages WHERE custom_order_id = ${parts[1]} ORDER BY created_at`);
    }
    if (path.endsWith("/messages") && req.method === "POST") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      await db`
        INSERT INTO custom_order_messages (id, custom_order_id, sender_id, body)
        VALUES (${crypto.randomUUID()}, ${parts[1]}, ${user.id}, ${String(body.body || "")})`;
      return json({ ok: true });
    }
    if (path.match(/^\/custom-orders\/[^/]+$/) && req.method === "PUT") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      await db`UPDATE custom_orders SET status = ${String(body.status || "requested")} WHERE id = ${parts[1]}`;
      return json({ ok: true });
    }

    if (path === "/dashboard/stats" && req.method === "GET") {
      const user = await authUser(req);
      if (!user) return err("Token нодуруст аст", 401);
      const products =
        user.role === "admin" ? await db`SELECT COUNT(*)::int AS n FROM products` : await db`SELECT COUNT(*)::int AS n FROM products WHERE seller_id = ${user.id}`;
      const users = user.role === "admin" ? await db`SELECT COUNT(*)::int AS n FROM users` : [{ n: 0 }];
      return json({
        products: products[0].n,
        custom_orders: 0,
        orders: 0,
        revenue: 0,
        low_stock: 0,
        users: users[0].n,
      });
    }
    if (path === "/admin/users" && req.method === "GET") {
      const user = await authUser(req);
      if (!user || user.role !== "admin") return err("Дастрасӣ манъ аст", 403);
      return json(await db`SELECT id, role, full_name_or_company, phone, craft, avatar_image, bio FROM users ORDER BY created_at DESC`);
    }

    return err("Роут ёфт нашуд", 404);
  } catch (e) {
    return err((e as Error).message || "Хатогии сервер", 500);
  }
}
