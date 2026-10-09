from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import IS_POSTGRES, IS_SQLITE, Base, SessionLocal, engine
from app.routers import auth as auth_router
from app.routers import cart as cart_router
from app.routers import catalog as catalog_router
from app.routers import custom_orders as custom_router
from app.routers import extra as extra_router
from app.seed import seed_if_empty

Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    from sqlalchemy import inspect

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        if "products" in tables:
            columns = {col["name"] for col in inspector.get_columns("products")}
            if "videos" not in columns:
                if IS_SQLITE:
                    conn.execute(text("ALTER TABLE products ADD COLUMN videos JSON NOT NULL DEFAULT '[]'"))
                else:
                    conn.execute(text("ALTER TABLE products ADD COLUMN videos JSON DEFAULT '[]'::json"))
        if "users" in tables and IS_POSTGRES:
            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN avatar_image TYPE TEXT"))
            except Exception:
                pass


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    dialect = engine.dialect.name
    db_ok = False
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    finally:
        db.close()
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "hunarmand",
        "database": dialect,
        "persistent": dialect != "sqlite",
        "db_ok": db_ok,
    }
