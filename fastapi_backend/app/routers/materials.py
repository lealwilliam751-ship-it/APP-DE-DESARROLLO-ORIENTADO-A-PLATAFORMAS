from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Material, UserRole, User
from app.schemas.schemas import MaterialCreate, MaterialOut
from app.security import require_roles

router = APIRouter(prefix="/materials", tags=["Materiales"])

@router.get("", response_model=List[MaterialOut])
def get_materials(db: Session = Depends(get_db)):
    return db.query(Material).all()

@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    mat = Material(**data.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat

@router.put("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    data: MaterialCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    
    for key, value in data.model_dump().items():
        setattr(mat, key, value)
        
    db.commit()
    db.refresh(mat)
    return mat

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    
    db.delete(mat)
    db.commit()
    return None
