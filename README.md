# Hunarmand

Маркетплейси ҳунарҳои мардумӣ (B2C / C2C): хариди мустақим, фармоиши махсус, харитаи устохонаҳо ва ёрирасони фарҳангӣ.

## Стек

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Python FastAPI + SQLAlchemy
- Database: SQLite барои оғози зуд (`DATABASE_URL` ба PostgreSQL иваз мешавад)

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

## Ҳисобҳои намунавӣ

| Нақш | Телефон | Рамз |
|---|---|---|
| Харидор | +992900000001 | password123 |
| Ҳунарманд | +992900000002 | password123 |

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
