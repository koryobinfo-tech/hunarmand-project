from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import CartItem, Order, OrderItem, OrderStatus, Product, User
from app.schemas import CartItemIn, CartItemOut, CheckoutIn, OrderItemOut, OrderOut, ProductOut

router = APIRouter(tags=["cart"])


def product_out(p: Product) -> ProductOut:
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


@router.get("/cart", response_model=list[CartItemOut])
@router.get("/cart/", response_model=list[CartItemOut], include_in_schema=False)
def get_cart(db: Session = Depends(get_db), user: User = Depends(require_roles("buyer", "admin"))):
    items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.seller), joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.buyer_id == user.id)
        .all()
    )
    return [CartItemOut(id=i.id, product_id=i.product_id, quantity=i.quantity, product=product_out(i.product)) for i in items]


@router.post("/cart", response_model=list[CartItemOut])
@router.post("/cart/", response_model=list[CartItemOut], include_in_schema=False)
def add_to_cart(payload: CartItemIn, db: Session = Depends(get_db), user: User = Depends(require_roles("buyer", "admin"))):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Маҳсулот ёфт нашуд")
    item = db.query(CartItem).filter(CartItem.buyer_id == user.id, CartItem.product_id == payload.product_id).first()
    if item:
        item.quantity += payload.quantity
    else:
        item = CartItem(buyer_id=user.id, product_id=payload.product_id, quantity=payload.quantity)
        db.add(item)
    db.commit()
    return get_cart(db, user)


@router.put("/cart/{item_id}")
def update_cart(item_id: str, payload: CartItemIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(CartItem, item_id)
    if not item or item.buyer_id != user.id:
        raise HTTPException(status_code=404, detail="Сабад холӣ")
    if payload.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = payload.quantity
    db.commit()
    return {"ok": True}


@router.delete("/cart/{item_id}")
def remove_cart(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(CartItem, item_id)
    if item and item.buyer_id == user.id:
        db.delete(item)
        db.commit()
    return {"ok": True}


def serialize_order(order: Order) -> OrderOut:
    items = []
    for it in order.items:
        items.append(
            OrderItemOut(
                id=it.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,
                title=it.product.title if it.product else None,
                image=(it.product.images or [None])[0] if it.product else None,
            )
        )
    return OrderOut(
        id=order.id,
        buyer_id=order.buyer_id,
        total_price=order.total_price,
        status=order.status,
        payment_method=order.payment_method,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        items=items,
    )


@router.post("/checkout", response_model=OrderOut)
def checkout(payload: CheckoutIn, db: Session = Depends(get_db), user: User = Depends(require_roles("buyer", "admin"))):
    cart = db.query(CartItem).options(joinedload(CartItem.product)).filter(CartItem.buyer_id == user.id).all()
    if not cart:
        raise HTTPException(status_code=400, detail="Сабади харид холӣ аст")
    total = 0.0
    order = Order(
        buyer_id=user.id,
        total_price=0,
        status=OrderStatus.paid,
        payment_method=payload.payment_method,
        shipping_address=payload.shipping_address,
    )
    db.add(order)
    db.flush()
    for item in cart:
        if not item.product or item.product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Захираи {item.product.title if item.product else 'маҳсулот'} нокифоя аст")
        item.product.stock -= item.quantity
        line = item.product.price * item.quantity
        total += line
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.product.price,
            )
        )
        db.delete(item)
    order.total_price = total
    db.commit()
    order = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product)).filter(Order.id == order.id).first()
    return serialize_order(order)


@router.get("/orders", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product))
    if user.role.value == "buyer":
        q = q.filter(Order.buyer_id == user.id)
    elif user.role.value == "artisan":
        q = q.join(OrderItem).join(Product).filter(Product.seller_id == user.id)
    return [serialize_order(o) for o in q.order_by(Order.created_at.desc()).all()]
