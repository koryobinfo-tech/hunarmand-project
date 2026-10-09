import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def sqlalchemy_url(url: str) -> str:
    value = (url or "").strip()
    if value.startswith("postgres://"):
        value = "postgresql+psycopg2://" + value[len("postgres://") :]
    elif value.startswith("postgresql://") and "+psycopg2" not in value:
        value = "postgresql+psycopg2://" + value[len("postgresql://") :]
    on_render = bool(os.getenv("RENDER")) or "render.com" in value
    if value.startswith("postgresql") and on_render and "sslmode=" not in value:
        value += ("&" if "?" in value else "?") + "sslmode=require"
    return value


DATABASE_URL = sqlalchemy_url(settings.database_url)
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

if os.getenv("RENDER") and IS_SQLITE:
    raise RuntimeError(
        "Дар Render SQLite муваққатӣ аст. DATABASE_URL-ро ба PostgreSQL (Persistent Database) пайваст кунед."
    )

connect_args = {"check_same_thread": False} if IS_SQLITE else {}
engine_kwargs: dict = {"connect_args": connect_args}
if IS_POSTGRES:
    engine_kwargs.update(pool_pre_ping=True, pool_recycle=280, pool_size=5, max_overflow=10)

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
