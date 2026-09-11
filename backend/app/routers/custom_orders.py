from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import CustomOrder, CustomOrderMessage, CustomOrderStatus, User, UserRole
from app.schemas import CustomOrderCreate, CustomOrderOut, CustomOrderStatusIn, MessageIn, MessageOut

router = APIRouter(prefix="/custom-orders", tags=["custom-orders"])
ORDER_LOAD = (joinedload(CustomOrder.buyer), joinedload(CustomOrder.seller))


def serialize(order: CustomOrder) -> CustomOrderOut:
    return CustomOrderOut(
        id=order.id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        title=order.title,
        description=order.description,
        reference_image=order.reference_image,
        agreed_price=order.agreed_price,
        status=order.status,
        created_at=order.created_at,
        buyer_name=order.buyer.full_name_or_company if order.buyer else None,
        seller_name=order.seller.full_name_or_company if order.seller else None,
    )


def load_order(db: Session, order_id: str) -> CustomOrder | None:
    return db.query(CustomOrder).options(*ORDER_LOAD).filter(CustomOrder.id == order_id).first()


def assert_party(order: CustomOrder, user: User) -> None:
    if user.id not in (order.buyer_id, order.seller_id) and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Дастрасӣ манъ аст")


def create_custom_order(
    payload: CustomOrderCreate,
    db: Session,
    user: User,
):
    if not payload.seller_id:
        raise HTTPException(status_code=400, detail="Ҳунармандро интихоб кунед")
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Тавсифи фармоиш ҳатмист")
    seller = db.get(User, payload.seller_id)
    if not seller or seller.role != UserRole.artisan:
        raise HTTPException(status_code=400, detail="Ҳунарманд ёфт нашуд")
    data = payload.model_dump()
    if data.get("agreed_price") == 0:
        data["agreed_price"] = None
    if not data.get("reference_image"):
        data["reference_image"] = None
    order = CustomOrder(buyer_id=user.id, **data)
    db.add(order)
    db.commit()
    created = load_order(db, order.id)
    return serialize(created or order)


@router.post("", response_model=CustomOrderOut)
@router.post("/", response_model=CustomOrderOut, include_in_schema=False)
def create_custom_order_route(
    payload: CustomOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("buyer", "admin")),
):
    return create_custom_order(payload, db, user)


@router.get("", response_model=list[CustomOrderOut])
@router.get("/", response_model=list[CustomOrderOut], include_in_schema=False)
def list_custom_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(CustomOrder).options(*ORDER_LOAD)
    if user.role == UserRole.buyer:
        q = q.filter(CustomOrder.buyer_id == user.id)
    elif user.role == UserRole.artisan:
        q = q.filter(CustomOrder.seller_id == user.id)
    orders = q.order_by(CustomOrder.created_at.desc()).all()
    return [serialize(o) for o in orders]


@router.get("/{order_id}", response_model=CustomOrderOut)
def get_custom_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Фармоиш ёфт нашуд")
    assert_party(order, user)
    return serialize(order)


@router.put("/{order_id}", response_model=CustomOrderOut)
def update_status(
    order_id: str,
    payload: CustomOrderStatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("artisan", "admin")),
):
    order = load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Фармоиш ёфт нашуд")
    if order.seller_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Дастрасӣ манъ аст")
    order.status = payload.status
    if payload.agreed_price is not None:
        order.agreed_price = payload.agreed_price
    db.commit()
    return serialize(load_order(db, order_id) or order)


@router.get("/{order_id}/messages", response_model=list[MessageOut])
def list_messages(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Фармоиш ёфт нашуд")
    assert_party(order, user)
    msgs = (
        db.query(CustomOrderMessage)
        .options(joinedload(CustomOrderMessage.sender))
        .filter(CustomOrderMessage.custom_order_id == order_id)
        .order_by(CustomOrderMessage.created_at.asc())
        .all()
    )
    return [
        MessageOut(
            id=m.id,
            custom_order_id=m.custom_order_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name_or_company if m.sender else None,
            body=m.body,
            created_at=m.created_at,
        )
        for m in msgs
    ]


@router.post("/{order_id}/messages", response_model=MessageOut)
def send_message(
    order_id: str,
    payload: MessageIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = load_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Фармоиш ёфт нашуд")
    assert_party(order, user)
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Паём холӣ аст")
    if order.status == CustomOrderStatus.requested and user.id == order.seller_id:
        order.status = CustomOrderStatus.accepted
    msg = CustomOrderMessage(custom_order_id=order_id, sender_id=user.id, body=payload.body.strip())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return MessageOut(
        id=msg.id,
        custom_order_id=msg.custom_order_id,
        sender_id=msg.sender_id,
        sender_name=user.full_name_or_company,
        body=msg.body,
        created_at=msg.created_at,
    )
