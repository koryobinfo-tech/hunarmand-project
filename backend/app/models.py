import enum
import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint

def enum_col(enum_cls):
    return Enum(enum_cls, native_enum=False, values_callable=lambda x: [e.value for e in x])
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    buyer = "buyer"
    artisan = "artisan"
    admin = "admin"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"


class PaymentMethod(str, enum.Enum):
    national_card = "national_card"
    visa = "visa"
    wallet = "wallet"


class CustomOrderStatus(str, enum.Enum):
    requested = "requested"
    accepted = "accepted"
    in_progress = "in_progress"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    role: Mapped[UserRole] = mapped_column(enum_col(UserRole), nullable=False, default=UserRole.buyer)
    full_name_or_company: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    passport_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    inn_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    avatar_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    passport_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    residential_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    workshop_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_registration_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    workshop_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    workshop_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    craft: Mapped[str | None] = mapped_column(String(128), nullable=True)

    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="buyer")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_image: Mapped[str | None] = mapped_column(String(512), nullable=True)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    seller_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    images: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    videos: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    seller = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    buyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(enum_col(OrderStatus), default=OrderStatus.pending)
    payment_method: Mapped[PaymentMethod] = mapped_column(enum_col(PaymentMethod), default=PaymentMethod.national_card)
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("buyer_id", "product_id", name="uq_cart_buyer_product"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    buyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    product = relationship("Product")


class CustomOrder(Base):
    __tablename__ = "custom_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    buyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    seller_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Фармоиши махсус")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reference_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    agreed_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[CustomOrderStatus] = mapped_column(enum_col(CustomOrderStatus), default=CustomOrderStatus.requested)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    messages = relationship("CustomOrderMessage", back_populates="custom_order", cascade="all, delete-orphan")


class CustomOrderMessage(Base):
    __tablename__ = "custom_order_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    custom_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("custom_orders.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    custom_order = relationship("CustomOrder", back_populates="messages")
    sender = relationship("User")


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
