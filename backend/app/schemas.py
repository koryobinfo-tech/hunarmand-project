from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models import CustomOrderStatus, OrderStatus, PaymentMethod, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    full_name_or_company: str


class UserRegister(BaseModel):
    role: UserRole
    full_name_or_company: str
    phone: str
    password: str = Field(min_length=6)
    passport_number: str
    inn_number: str
    birth_date: date
    avatar_image: Optional[str] = None
    passport_address: Optional[str] = None
    residential_address: Optional[str] = None
    workshop_address: Optional[str] = None
    tax_registration_number: Optional[str] = None
    workshop_lat: Optional[float] = None
    workshop_lng: Optional[float] = None
    bio: Optional[str] = None
    craft: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        phone = value.strip()
        for char in (" ", "-", "(", ")"):
            phone = phone.replace(char, "")
        if not phone.startswith("+992") or len(phone) != 13 or not phone[4:].isdigit():
            raise ValueError("Рақами телефон бояд бо +992 оғоз шавад ва баъд аз он 9 рақам бошад")
        return phone

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.isalpha() for ch in value) or not any(ch.isdigit() for ch in value):
            raise ValueError("Рамз бояд ҳам ҳарф ва ҳам рақам дошта бошад")
        return value


class UserLogin(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        phone = value.strip()
        for char in (" ", "-", "(", ")"):
            phone = phone.replace(char, "")
        if not phone.startswith("+992") or len(phone) != 13 or not phone[4:].isdigit():
            raise ValueError("Рақами телефон бояд бо +992 оғоз шавад ва баъд аз он 9 рақам бошад")
        return phone


class UserOut(BaseModel):
    id: str
    role: UserRole
    full_name_or_company: str
    phone: str
    passport_number: str
    inn_number: str
    birth_date: date
    avatar_image: Optional[str] = None
    created_at: datetime
    passport_address: Optional[str] = None
    residential_address: Optional[str] = None
    workshop_address: Optional[str] = None
    tax_registration_number: Optional[str] = None
    workshop_lat: Optional[float] = None
    workshop_lng: Optional[float] = None
    bio: Optional[str] = None
    craft: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name_or_company: Optional[str] = None
    avatar_image: Optional[str] = None
    passport_address: Optional[str] = None
    residential_address: Optional[str] = None
    workshop_address: Optional[str] = None
    tax_registration_number: Optional[str] = None
    bio: Optional[str] = None
    craft: Optional[str] = None


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon_image: Optional[str] = None

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    category_id: str
    title: str
    description: str = ""
    price: float
    stock: int = 0
    images: list[str] = []
    videos: list[str] = []


class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    images: Optional[list[str]] = None
    videos: Optional[list[str]] = None


class ProductOut(BaseModel):
    id: str
    seller_id: str
    category_id: str
    title: str
    description: str
    price: float
    stock: int
    images: list
    videos: list = []
    created_at: datetime
    seller_name: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    product: ProductOut


class CheckoutIn(BaseModel):
    payment_method: PaymentMethod
    shipping_address: str


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: float
    title: Optional[str] = None
    image: Optional[str] = None


class OrderOut(BaseModel):
    id: str
    buyer_id: str
    total_price: float
    status: OrderStatus
    payment_method: PaymentMethod
    shipping_address: Optional[str] = None
    created_at: datetime
    items: list[OrderItemOut] = []


class CustomOrderCreate(BaseModel):
    seller_id: str
    title: str = "Фармоиши махсус"
    description: str
    reference_image: Optional[str] = None
    agreed_price: Optional[float] = None


class CustomOrderOut(BaseModel):
    id: str
    buyer_id: str
    seller_id: str
    title: str
    description: str
    reference_image: Optional[str] = None
    agreed_price: Optional[float] = None
    status: CustomOrderStatus
    created_at: datetime
    buyer_name: Optional[str] = None
    seller_name: Optional[str] = None

    class Config:
        from_attributes = True


class CustomOrderStatusIn(BaseModel):
    status: CustomOrderStatus
    agreed_price: Optional[float] = None


class MessageIn(BaseModel):
    body: str


class MessageOut(BaseModel):
    id: str
    custom_order_id: str
    sender_id: str
    sender_name: Optional[str] = None
    body: str
    created_at: datetime


class ChatIn(BaseModel):
    message: str = ""
    image_url: Optional[str] = None
    history: list[dict] = []


class RelatedProduct(BaseModel):
    id: str
    title: str
    price: float
    image: Optional[str] = None


class ChatOut(BaseModel):
    reply: str
    topic: Optional[str] = None
    suggestions: list[str] = []
    related: list[RelatedProduct] = []


class AiTopicOut(BaseModel):
    id: str
    title: str
    prompt: str


class BlogPostOut(BaseModel):
    id: str
    title: str
    excerpt: str
    body: str
    cover_image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ArtisanMapOut(BaseModel):
    id: str
    full_name_or_company: str
    craft: Optional[str] = None
    workshop_address: Optional[str] = None
    workshop_lat: Optional[float] = None
    workshop_lng: Optional[float] = None
    avatar_image: Optional[str] = None
    bio: Optional[str] = None
