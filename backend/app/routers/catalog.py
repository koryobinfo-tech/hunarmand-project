from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Category, Product, User, UserRole
from app.schemas import CategoryOut, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(tags=["catalog"])


def to_product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        seller_id=p.seller_id,
        category_id=p.category_id,
        title=p.title,
        description=p.description,
        price=p.price,
        stock=p.stock,
        images=p.images or [],
        videos=p.videos or [],
        created_at=p.created_at,
        seller_name=p.seller.full_name_or_company if p.seller else None,
        category_name=p.category.name if p.category else None,
        category_slug=p.category.slug if p.category else None,
    )


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.get("/products", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    category: str | None = None,
    q: str | None = None,
    seller_id: str | None = None,
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
):
    query = db.query(Product).options(joinedload(Product.seller), joinedload(Product.category))
    if category:
        query = query.join(Category).filter((Category.slug == category) | (Category.id == category))
    if seller_id:
        query = query.filter(Product.seller_id == seller_id)
    if q:
        like = f"%{q}%"
        query = query.filter(Product.title.ilike(like) | Product.description.ilike(like))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    return [to_product_out(p) for p in query.order_by(Product.created_at.desc()).all()]


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = (
        db.query(Product)
        .options(joinedload(Product.seller), joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Маҳсулот ёфт нашуд")
    return to_product_out(p)


@router.post("/products", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("artisan", "admin")),
):
    cat = db.get(Category, payload.category_id)
    if not cat:
        raise HTTPException(status_code=400, detail="Категория ёфт нашуд")
    p = Product(seller_id=user.id, **payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    p.seller = user
    p.category = cat
    return to_product_out(p)


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Маҳсулот ёфт нашуд")
    if p.seller_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Дастрасӣ манъ аст")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return to_product_out(p)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Маҳсулот ёфт нашуд")
    if p.seller_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Дастрасӣ манъ аст")
    db.delete(p)
    db.commit()
    return {"ok": True}
