from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import Dict, Any
from app.database import get_db
from app.models.models import User, UserRole, Delivery, DeliveryStatus
from app.schemas.schemas import UserOut
from app.security import require_roles, get_password_hash

router = APIRouter(prefix="/admin", tags=["Administración"])

class CreateGestorDTO(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)
    defaultCity: str = "Pamplona"

@router.post("/create-gestor", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_gestor(
    data: CreateGestorDTO,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        # If user exists, upgrade role to Gestor_de_Punto
        existing_user.role = UserRole.Gestor_de_Punto
        db.commit()
        db.refresh(existing_user)
        return {"message": "Usuario actualizado a Gestor de Punto.", "user": UserOut.model_validate(existing_user)}

    gestor = User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=UserRole.Gestor_de_Punto,
        default_city=data.defaultCity,
        total_points=0,
        level="Gestor Autorizado"
    )
    db.add(gestor)
    db.commit()
    db.refresh(gestor)
    return {"message": "Gestor de Punto creado con éxito.", "user": UserOut.model_validate(gestor)}

@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
) -> Dict[str, Any]:
    total_users = db.query(User).count()
    total_deliveries = db.query(Delivery).filter(Delivery.status == DeliveryStatus.approved).count()
    total_points = db.query(func.sum(User.total_points)).scalar() or 0
    total_co2 = db.query(func.sum(Delivery.total_co2)).filter(Delivery.status == DeliveryStatus.approved).scalar() or 0

    return {
        "metrics": {
            "totalUsers": total_users,
            "totalDeliveries": total_deliveries,
            "totalPoints": int(total_points),
            "totalCo2": float(total_co2)
        }
    }
