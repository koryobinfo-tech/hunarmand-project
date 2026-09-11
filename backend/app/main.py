from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import auth as auth_router
from app.routers import cart as cart_router
from app.routers import catalog as catalog_router
from app.routers import custom_orders as custom_router
from app.routers import extra as extra_router
from app.seed import seed_if_empty

Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(products)")).fetchall()]
        if "videos" not in columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN videos JSON NOT NULL DEFAULT '[]'"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Hunarmand API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(catalog_router.router)
app.include_router(cart_router.router)
app.include_router(custom_router.router)
app.include_router(extra_router.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "hunarmand"}
