from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User, UserRole
from app.schemas import Token, UserLogin, UserOut, UserRegister, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_phone(phone: str) -> str:
    value = phone.strip()
    for char in (" ", "-", "(", ")"):
        value = value.replace(char, "")
    return value


@router.post("/register", response_model=Token)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if payload.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Бақайдгирии админ манъ аст")
    phone = normalize_phone(payload.phone)
    for field, value in (
        ("phone", phone),
        ("passport_number", payload.passport_number),
        ("inn_number", payload.inn_number),
    ):
        exists = db.query(User).filter(getattr(User, field) == value).first()
        if exists:
            raise HTTPException(status_code=400, detail=f"{field} аллакай истифода шудааст")

    if payload.role == UserRole.buyer and not payload.passport_address:
        raise HTTPException(status_code=400, detail="Суроға аз рӯи шиноснома ҳатмист")
    if payload.role == UserRole.artisan:
        if not payload.residential_address or not payload.workshop_address:
            raise HTTPException(status_code=400, detail="Суроғаи зист ва устохона ҳатмист")

    user = User(
        role=payload.role,
        full_name_or_company=payload.full_name_or_company,
        phone=phone,
        password_hash=hash_password(payload.password),
        passport_number=payload.passport_number,
        inn_number=payload.inn_number,
        birth_date=payload.birth_date,
        avatar_image=payload.avatar_image,
        passport_address=payload.passport_address,
        residential_address=payload.residential_address,
        workshop_address=payload.workshop_address,
        tax_registration_number=payload.tax_registration_number,
        workshop_lat=payload.workshop_lat,
        workshop_lng=payload.workshop_lng,
        bio=payload.bio,
        craft=payload.craft,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(
        access_token=create_access_token(user),
        role=user.role,
        user_id=user.id,
        full_name_or_company=user.full_name_or_company,
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    phone = normalize_phone(payload.phone)
    user = db.query(User).filter(User.phone == phone).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Рақам ё рамз нодуруст аст")
    return Token(
        access_token=create_access_token(user),
        role=user.role,
        user_id=user.id,
        full_name_or_company=user.full_name_or_company,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
