from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import IS_POSTGRES, engine, get_db
from app.models import BlogPost, CustomOrder, OrderItem, Product, User, UserRole
from app.schemas import ArtisanMapOut, AiTopicOut, BlogPostOut, ChatIn, ChatOut, RelatedProduct

router = APIRouter(tags=["extra"])

SYSTEM_PROMPT = (
    "Шумо Ёрирасони Фарҳангии платформаи Hunarmand ҳастед. "
    "Ба тоҷикӣ ҷавоб диҳед. Мавзӯъ: чакан, атлас, адрас, кулолгарӣ, чӯбкорӣ, заргарӣ, хӯрокаи ватанӣ, "
    "нигоҳубини маҳсулот ва рамзи нақшҳо. Суратро аз нигоҳи фарҳангӣ шарҳ диҳед."
)

@router.get("/ai/topics", response_model=list[AiTopicOut])
def ai_topics():
    from app.ai_guide import topics_payload

    return topics_payload()


@router.post("/ai/chat", response_model=ChatOut)
async def ai_chat(payload: ChatIn, db: Session = Depends(get_db)):
    from app.ai_guide import build_reply, related_products

    topic, fallback = build_reply(payload.message, payload.image_url)
    related = [RelatedProduct(**p) for p in related_products(db, topic)]
    suggestions = list(topic.suggestions)

    if settings.openai_api_key:
        try:
            import httpx

            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for item in payload.history[-8:]:
                role = item.get("role", "user")
                content = item.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
            user_content = payload.message or "Суратро аз нигоҳи фарҳангӣ шарҳ диҳед."
            if payload.image_url:
                user_content += f"\n[Сурат: {payload.image_url[:180]}]"
            messages.append({"role": "user", "content": user_content})
            async with httpx.AsyncClient(timeout=40) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    json={"model": settings.openai_model, "messages": messages, "temperature": 0.7},
                )
                res.raise_for_status()
                data = res.json()
                reply = data["choices"][0]["message"]["content"]
                return ChatOut(reply=reply, topic=topic.title, suggestions=suggestions, related=related)
        except Exception:
            pass

    return ChatOut(reply=fallback, topic=topic.title, suggestions=suggestions, related=related)


def artisan_out(a: User) -> ArtisanMapOut:
    return ArtisanMapOut(
        id=a.id,
        full_name_or_company=a.full_name_or_company,
        craft=a.craft,
        workshop_address=a.workshop_address,
        workshop_lat=a.workshop_lat,
        workshop_lng=a.workshop_lng,
        avatar_image=a.avatar_image,
        bio=a.bio,
    )


@router.get("/artisans", response_model=list[ArtisanMapOut])
def artisans_list(db: Session = Depends(get_db)):
    artisans = db.query(User).filter(User.role == UserRole.artisan).all()
    return [artisan_out(a) for a in artisans]


@router.get("/artisans/map", response_model=list[ArtisanMapOut])
def artisans_map(db: Session = Depends(get_db)):
    artisans = db.query(User).filter(User.role == UserRole.artisan).all()
    return [artisan_out(a) for a in artisans if a.workshop_lat is not None and a.workshop_lng is not None]


@router.get("/artisans/{artisan_id}")
def artisan_detail(artisan_id: str, db: Session = Depends(get_db)):
    a = db.get(User, artisan_id)
    if not a or a.role != UserRole.artisan:
        raise HTTPException(status_code=404, detail="Ҳунарманд ёфт нашуд")
    products = db.query(Product).filter(Product.seller_id == a.id).all()
    return {
        "id": a.id,
        "full_name_or_company": a.full_name_or_company,
        "craft": a.craft,
        "bio": a.bio,
        "workshop_address": a.workshop_address,
        "workshop_lat": a.workshop_lat,
        "workshop_lng": a.workshop_lng,
        "avatar_image": a.avatar_image,
        "products": [
            {
                "id": p.id,
                "title": p.title,
                "price": p.price,
                "images": p.images,
            }
            for p in products
        ],
    }


@router.get("/blog", response_model=list[BlogPostOut])
def blog_list(db: Session = Depends(get_db)):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()


@router.get("/blog/{post_id}", response_model=BlogPostOut)
def blog_detail(post_id: str, db: Session = Depends(get_db)):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Мақола ёфт нашуд")
    return post


@router.get("/storage")
def storage_status(db: Session = Depends(get_db)):
    dialect = engine.dialect.name
    users = db.query(User).count()
    products = db.query(Product).count()
    return {
        "database": dialect,
        "persistent": dialect != "sqlite",
        "tables": {
            "users": "профилҳои админ, ҳунарманд ва харидор",
            "products": "маҳсулот ва ҳунарҳо бо сурат/видео ва тавсиф",
            "categories": "категорияҳои ҳунар",
            "orders": "фармоишҳо",
            "custom_orders": "фармоишҳои махсус",
        },
        "counts": {"users": users, "products": products},
        "postgres": IS_POSTGRES,
    }


@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product_query = db.query(Product)
    custom_query = db.query(CustomOrder)
    sales_query = db.query(OrderItem).join(Product, OrderItem.product_id == Product.id)
    if user.role != UserRole.admin:
        product_query = product_query.filter(Product.seller_id == user.id)
        custom_query = custom_query.filter(CustomOrder.seller_id == user.id)
        sales_query = sales_query.filter(Product.seller_id == user.id)
    products = product_query.all()
    custom = custom_query.all()
    sales = sales_query.all()
    revenue = sum(i.unit_price * i.quantity for i in sales)
    return {
        "products": len(products),
        "custom_orders": len(custom),
        "orders": len(sales),
        "revenue": revenue,
        "low_stock": sum(1 for p in products if p.stock < 5),
        "users": db.query(User).count() if user.role == UserRole.admin else 0,
    }


@router.get("/admin/users")
def admin_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Дастрасӣ манъ аст")
    rows = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "role": u.role.value,
            "full_name_or_company": u.full_name_or_company,
            "phone": u.phone,
            "craft": u.craft,
            "avatar_image": u.avatar_image,
            "bio": u.bio,
        }
        for u in rows
    ]
