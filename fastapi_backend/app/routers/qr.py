from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any
import json
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserOut
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/qr", tags=["Códigos QR"])

class ScanPayloadDTO(BaseModel):
    payload: str

@router.get("/generate")
def generate_qr(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    qr_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "app": "ecopuntos-pamplona"
    }
    return {
        "qr": json.dumps(qr_data),
        "user": UserOut.model_validate(current_user)
    }

@router.post("/scan")
def scan_qr(
    data: ScanPayloadDTO,
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
) -> Dict[str, Any]:
    try:
        parsed = json.loads(data.payload)
        user_id = parsed.get("id")
        if not user_id:
            raise ValueError("ID no presente en QR")
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de código QR no válido.")

    citizen = db.query(User).filter(User.id == int(user_id)).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Ciudadano no encontrado.")
    if citizen.role != UserRole.Ciudadano:
        raise HTTPException(status_code=400, detail="El código QR escaneado no corresponde a una cuenta de Ciudadano.")

    return {
        "valid": True,
        "citizen": UserOut.model_validate(citizen)
    }

@router.get("/citizens")
def search_citizens(
    q: str = "",
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
):
    query = db.query(User).filter(User.role == UserRole.Ciudadano)
    if q and q.strip():
        term = f"%{q.strip()}%"
        if q.strip().isdigit():
            query = query.filter((User.id == int(q.strip())) | (User.name.ilike(term)) | (User.email.ilike(term)))
        else:
            query = query.filter((User.name.ilike(term)) | (User.email.ilike(term)))
    citizens = query.order_by(User.name.asc()).limit(20).all()
    return [UserOut.model_validate(c) for c in citizens]

@router.get("/citizen/{citizen_id}")
def get_citizen_by_id(
    citizen_id: int,
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
) -> Dict[str, Any]:
    citizen = db.query(User).filter(User.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Ciudadano no encontrado.")
    if citizen.role != UserRole.Ciudadano:
        raise HTTPException(status_code=400, detail="El usuario especificado no tiene rol de Ciudadano.")

    return {
        "valid": True,
        "citizen": UserOut.model_validate(citizen)
    }


