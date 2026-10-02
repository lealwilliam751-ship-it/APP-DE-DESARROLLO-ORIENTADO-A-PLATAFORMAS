from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.models import EcoPoint, UserRole, User
from app.schemas.schemas import EcoPointCreate, EcoPointOut
from app.security import require_roles
from math import radians, cos, sin, asin, sqrt

router = APIRouter(prefix="/ecopoints", tags=["Ecopuntos"])

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # km
    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    a = sin(dLat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

@router.get("")
def get_all_ecopoints(db: Session = Depends(get_db)) -> Dict[str, Any]:
    pts = db.query(EcoPoint).all()
    out = [EcoPointOut.model_validate(p).model_dump() for p in pts]
    return {"ecopoints": out}

@router.get("/nearby")
def get_nearby_ecopoints(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(5.0),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    all_points = db.query(EcoPoint).all()
    nearby = []
    for p in all_points:
        dist = haversine(lat, lng, float(p.lat), float(p.lng))
        if dist <= radius_km:
            nearby.append(EcoPointOut.model_validate(p).model_dump())
    return {"ecopoints": nearby}

@router.get("/{ecopoint_id}", response_model=EcoPointOut)
def get_ecopoint_by_id(ecopoint_id: int, db: Session = Depends(get_db)):
    ep = db.query(EcoPoint).filter(EcoPoint.id == ecopoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Ecopunto no encontrado.")
    return ep

@router.post("", response_model=EcoPointOut, status_code=status.HTTP_201_CREATED)
def create_ecopoint(
    data: EcoPointCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    ep = EcoPoint(**data.model_dump())
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep

@router.put("/{ecopoint_id}", response_model=EcoPointOut)
def update_ecopoint(
    ecopoint_id: int,
    data: EcoPointCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    ep = db.query(EcoPoint).filter(EcoPoint.id == ecopoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Ecopunto no encontrado.")

    for key, value in data.model_dump().items():
        setattr(ep, key, value)

    db.commit()
    db.refresh(ep)
    return ep

@router.delete("/{ecopoint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ecopoint(
    ecopoint_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    ep = db.query(EcoPoint).filter(EcoPoint.id == ecopoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Ecopunto no encontrado.")

    db.delete(ep)
    db.commit()
    return None
