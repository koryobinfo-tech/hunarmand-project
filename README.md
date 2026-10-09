# Hunarmand

Маркетплейси ҳунарҳои мардумӣ (B2C / C2C): хариди мустақим, фармоиши махсус, харитаи устохонаҳо ва ёрирасони фарҳангӣ.

## Стек

- Frontend: Next.js + TypeScript + Tailwind CSS (Vercel)
- Backend API: `/api` дар худи Next.js + PostgreSQL-и Vercel (маҳсулот гум намешавад)
- FastAPI (ихтиёрӣ) барои Render; сомонаи hunarmand.tj аз базаи Vercel кор мекунад

## Оғоз

Терминали 1 — API:

```
cd backend
py -3 -m pip install -r requirements.txt
py -3 -m uvicorn app.main:app --reload --port 8000
```

Терминали 2 — веб:

```
cd frontend
npm install
npm run dev
```

Сайт: http://localhost:3000  
API: http://localhost:8000/docs

## Базаи доимӣ (PostgreSQL)

Ҷадвалҳо:

- `users` — профилҳои админ, ҳунарманд ва харидор (ном, акс, тавсиф, телефон)
- `products` — маҳсулот/ҳунарҳо бо сурат, видео ва тавсиф
- `categories`, `orders`, `custom_orders` — категорияҳо ва фармоишҳо

CRUD: `POST/GET/PUT/DELETE /products`, `GET/PUT /auth/me`, `GET /admin/users`.

### Vercel Postgres (асосӣ барои hunarmand.tj)

1. Vercel → лоиҳаи frontend → **Storage** → **Create Database** → **Postgres**
2. Ба Environment пайваст шавад: `POSTGRES_URL` (худкор)
3. `NEXT_PUBLIC_API_URL=/api` (аллакай дар `.env.production`)
4. Redeploy. `/api/health` бояд `"persistent": true` нишон диҳад

Маҳсулот, профил ва фармоишҳо дар ҳамин Postgres мемонанд.

### Render

Файли `render.yaml` базаи **hunarmand-db** (PostgreSQL) ва `DATABASE_URL`-ро худкор пайваст мекунад. Агар сервис қаблан бе база сохта шуда бошад, маҳсулот бо ҳар redeploy нест мешавад. Инро як бор иҷро кунед:

1. Render → New → PostgreSQL (`hunarmand-db`)
2. Web Service-и `hunarmand-project` → Environment → `DATABASE_URL` = Internal Database URL
3. Manual Deploy. `/health` бояд `"persistent": true` ва `"database": "postgresql"` бошад
4. Баъд маҳсулоти нав дар `/` ва `/catalog` боқӣ мемонад

Дар Render SQLite рад карда мешавад, чун диск муваққатӣ аст.

### Локалӣ бо Postgres

```
docker compose up -d postgres
```

Дар `backend/.env`:

```
DATABASE_URL=postgresql://hunarmand:hunarmand@localhost:5432/hunarmand
ADMIN_PHONE=+992900000000
ADMIN_PASSWORD=Admin123
ADMIN_NAME=Админ Hunarmand
```

Админ бо ин рақам/рамз сохта мешавад. Тугмаи **Редактировать профил** маълумотро ба база менависад (`PUT /auth/me`) ва пас аз навсозии саҳифа боқӣ мемонад.

## Ҳисобҳои намунавӣ

Ҳисобҳои demo дигар seed намешаванд. Худро бақайд гиред ё бо `ADMIN_PHONE` / `ADMIN_PASSWORD` ворид шавед.

Барои чати AI бо модели воқеӣ дар `backend/.env` калиди `OPENAI_API_KEY` гузоред. Бе калид ҷавобҳои фарҳангии намунавӣ кор мекунанд.

## Саҳифаҳо

- `/` — равзанаи асосӣ
- `/catalog` — каталог ва категорияҳо
- `/register` — бақайдгирии харидор/ҳунарманд
- `/dashboard` — панели ҳунарманд (CRUD маҳсулот)
- `/custom-orders/new` — фармоиши инфиродӣ
- `/map` — харитаи устохонаҳо
- `/cart` ва `/checkout` — сабад ва пардохти демо
- Виҷети AI дар кунҷи рост
