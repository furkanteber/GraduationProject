from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    # Basit/hardcoded kontrol: gerçek senaryoda burada kullanıcı veritabanı sorgulanır.
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email ve şifre zorunlu")

    # Örnek: tek bir demo kullanıcı
    if payload.email != "admin@tebersoft.com" or payload.password != "admin123":
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    return {
        "access_token": "mock-token",
        "token_type": "bearer",
        "email": payload.email,
    }
