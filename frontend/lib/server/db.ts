import bcrypt from "bcryptjs";
import postgres from "postgres";
import { ABOUT_BODY, ABOUT_TEAM, ABOUT_TITLE } from "../culture";

const url =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  "";

let sql: ReturnType<typeof postgres> | null = null;

export function hasDatabase() {
  return Boolean(url) && !url.startsWith("sqlite");
}

export function getSql() {
  if (!hasDatabase()) {
    throw new Error("POSTGRES_URL дар Vercel насб нашудааст. Storage → Postgres-ро пайваст кунед.");
  }
  if (!sql) {
    const local = url.includes("localhost") || url.includes("127.0.0.1");
    sql = postgres(url, {
      ssl: local ? false : "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }
  return sql;
}

export async function initSchema() {
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      full_name_or_company TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      passport_number TEXT UNIQUE NOT NULL,
      inn_number TEXT UNIQUE NOT NULL,
      birth_date TEXT NOT NULL,
      avatar_image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      passport_address TEXT,
      residential_address TEXT,
      workshop_address TEXT,
      tax_registration_number TEXT,
      workshop_lat DOUBLE PRECISION,
      workshop_lng DOUBLE PRECISION,
      bio TEXT,
      craft TEXT
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon_image TEXT
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id),
      category_id TEXT NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price DOUBLE PRECISION NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      videos JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE (buyer_id, product_id)
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      total_price DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT 'national_card',
      shipping_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL,
      title TEXT,
      image TEXT
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS custom_orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_image TEXT,
      agreed_price DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'requested',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS custom_order_messages (
      id TEXT PRIMARY KEY,
      custom_order_id TEXT NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      cover_image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS site_pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      extra JSONB NOT NULL DEFAULT '{}'::jsonb
    )`;

  const cats = await db`SELECT id FROM categories LIMIT 1`;
  if (cats.length === 0) {
    const items = [
      ["pottery", "Кулолгарӣ", "Зарфҳо ва сафолҳои дастӣ", "https://images.unsplash.com/photo-1578749556568-bc2c184e1dde?w=800"],
      ["chakan", "Чакан", "Либос ва нақшҳои миллии чакан", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"],
      ["woodwork", "Чӯбкорӣ", "Кандакорӣ ва мебели дастӣ", "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800"],
      ["jewelry", "Заргарӣ", "Зеварҳои анъанавӣ", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"],
      ["food", "Хӯрока", "Маҳсулоти хӯрокаи ватанӣ", "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800"],
      ["atlas", "Атлас ва адрас", "Матоъҳои абрешимӣ", "https://images.unsplash.com/photo-1590736969955-71cc94901354?w=800"],
    ];
    for (const [slug, name, description, icon] of items) {
      await db`
        INSERT INTO categories (id, name, slug, description, icon_image)
        VALUES (${crypto.randomUUID()}, ${name}, ${slug}, ${description}, ${icon})`;
    }
  }

  const posts = await db`SELECT id FROM blog_posts LIMIT 1`;
  if (posts.length === 0) {
    await db`
      INSERT INTO blog_posts (id, title, excerpt, body, cover_image) VALUES
      (${crypto.randomUUID()}, 'Таърихи чӯбкорӣ дар Тоҷикистон', 'Кандакории чӯб аз асрҳои миёна то имрӯз.', 'Чӯбкории тоҷикӣ дар меъморӣ ва асбобҳои рӯзгор нақши калон дорад.', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800'),
      (${crypto.randomUUID()}, 'Сирри нақшҳои чакан', 'Ҳар гул дар чакан маънои худро дорад.', 'Чакан либос ва рӯйпӯши дастдӯз аст.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800'),
      (${crypto.randomUUID()}, 'Кулолгарии Истаравшан', 'Гил, оташ ва дасти устод.', 'Истаравшан маркази қадимии кулолгарӣ аст.', 'https://images.unsplash.com/photo-1578749556568-bc2c184e1dde?w=800')
    `;
  }

  await db`
    INSERT INTO site_pages (slug, title, body, extra)
    VALUES ('about', ${ABOUT_TITLE}, ${ABOUT_BODY}, ${db.json({ team: ABOUT_TEAM })})
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, extra = EXCLUDED.extra`;

  const adminLogin = "ADMIN";
  const adminPassword = "123456";
  const adminName = process.env.ADMIN_NAME || "Админ Hunarmand";
  const existingAdmin = await db`
    SELECT id, phone, passport_number FROM users
    WHERE role = 'admin' OR UPPER(phone) = ${adminLogin}
    LIMIT 1
  `;
  const needsAdminCreds =
    !existingAdmin[0] ||
    String(existingAdmin[0].phone) !== adminLogin ||
    String(existingAdmin[0].passport_number) !== "ADMIN-LOGIN";
  if (needsAdminCreds) {
    const adminHash = await bcrypt.hash(adminPassword.slice(0, 72), 10);
    if (!existingAdmin[0]) {
      try {
        const id = crypto.randomUUID();
        await db`
          INSERT INTO users (id, role, full_name_or_company, phone, password_hash, passport_number, inn_number, birth_date, bio, craft)
          VALUES (
            ${id}, 'admin', ${adminName}, ${adminLogin},
            ${adminHash},
            'ADMIN-LOGIN',
            'ADMININN-01',
            '1990-01-01',
            'Администратори платформаи Hunarmand',
            'Идоракунӣ'
          )`;
      } catch {
        /* already exists */
      }
    } else {
      await db`
        UPDATE users SET
          role = 'admin',
          phone = ${adminLogin},
          password_hash = ${adminHash},
          passport_number = 'ADMIN-LOGIN'
        WHERE id = ${existingAdmin[0].id as string}
      `;
    }
  }
}
