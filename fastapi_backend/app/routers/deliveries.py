from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal
from app.database import get_db
from app.models.models import Delivery, DeliveryItem, Material, User, UserRole, DeliveryStatus
from app.schemas.schemas import DeliveryCreate, DeliveryOut
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/deliveries", tags=["Entregas"])

def calculate_level(points: int) -> str:
    if points >= 1000:
        return "Héroe Ambiental"
    elif points >= 500:
        return "Guardián del Planeta"
    elif points >= 200:
        return "Eco Guerrero"
    elif points >= 50:
        return "Brote Verde"
    return "Semilla Verde"

@router.get("/my")
def get_my_deliveries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deliveries = db.query(Delivery).filter(Delivery.user_id == current_user.id).order_by(Delivery.created_at.desc()).all()
    out = [DeliveryOut.model_validate(d) for d in deliveries]
    return out

@router.get("/pending")
def get_pending_deliveries(
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
):
    deliveries = db.query(Delivery).filter(Delivery.status == DeliveryStatus.pending).order_by(Delivery.created_at.asc()).all()
    out = []
    for d in deliveries:
        d_out = DeliveryOut.model_validate(d)
        if d.user:
            d_out = d_out.model_copy(update={"citizen_name": d.user.name})
        out.append(d_out)
    return out

@router.post("", status_code=status.HTTP_201_CREATED)
def create_delivery(
    data: DeliveryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    ecopoint_id = data.get_ecopoint_id()
    
    # If a gestor or admin is creating the delivery on behalf of a citizen:
    provided_citizen_id = data.get_citizen_id()
    if current_user.role in [UserRole.Gestor_de_Punto, UserRole.Administrador]:
        if not provided_citizen_id:
            raise HTTPException(
                status_code=400,
                detail="Los gestores no pueden registrar ni aprobar una entrega sin identificar claramente al ciudadano destinatario."
            )
        citizen = db.query(User).filter(User.id == provided_citizen_id).first()
        if not citizen:
            raise HTTPException(status_code=404, detail="El ciudadano especificado no existe.")
        if citizen.role != UserRole.Ciudadano:
            raise HTTPException(status_code=400, detail="Solo se pueden registrar entregas a usuarios con rol Ciudadano.")
        target_user_id = citizen.id
    else:
        target_user_id = current_user.id

    # Determine initial status: if Gestor/Admin creates delivery in person with identified citizen, auto-approve immediately
    initial_status = DeliveryStatus.pending
    if current_user.role in [UserRole.Gestor_de_Punto, UserRole.Administrador] and (data.auto_approve is None or data.auto_approve is True):
        initial_status = DeliveryStatus.approved

    delivery = Delivery(
        user_id=target_user_id,
        ecopoint_id=ecopoint_id,
        status=initial_status,
        total_points=0,
        total_co2=Decimal(0)
    )
    db.add(delivery)
    db.flush()

    calc_points = 0
    calc_co2 = Decimal(0)

    for item in data.items:
        mat = db.query(Material).filter(Material.id == item.material_id).first()
        if not mat:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Material con ID {item.material_id} no existe.")

        item_points = int(mat.points_per_kg * item.weight_kg)
        item_co2 = Decimal(str(mat.co2_kg_per_kg)) * Decimal(str(item.weight_kg))

        d_item = DeliveryItem(
            delivery_id=delivery.id,
            material_id=mat.id,
            weight_kg=Decimal(str(item.weight_kg)),
            points=item_points,
            co2_saved=item_co2
        )
        db.add(d_item)

        calc_points += item_points
        calc_co2 += item_co2

    delivery.total_points = calc_points
    delivery.total_co2 = calc_co2

    if initial_status == DeliveryStatus.approved:
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if target_user:
            target_user.total_points += calc_points
            target_user.level = calculate_level(target_user.total_points)

    db.commit()
    db.refresh(delivery)

    d_out = DeliveryOut.model_validate(delivery)
    if delivery.user:
        d_out.citizen_name = delivery.user.name
    delivery_out = d_out.model_dump()
    delivery_out["deliveryId"] = delivery.id
    return {"delivery": delivery_out}


@router.patch("/{delivery_id}/approve")
def approve_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
) -> Dict[str, Any]:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada.")

    if delivery.status != DeliveryStatus.pending:
        raise HTTPException(status_code=400, detail="Solo se pueden aprobar entregas en estado pendiente.")

    user = db.query(User).filter(User.id == delivery.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="El ciudadano asociado a esta entrega no existe.")
    if user.role != UserRole.Ciudadano:
        raise HTTPException(status_code=400, detail="Solo se pueden aprobar entregas dirigidas a un usuario con rol Ciudadano.")

    try:
        delivery.status = DeliveryStatus.approved
        user.total_points += delivery.total_points
        user.level = calculate_level(user.total_points)

        db.commit()
        db.refresh(delivery)

        delivery_out = DeliveryOut.model_validate(delivery).model_dump()
        delivery_out["citizen_name"] = user.name
        return {
            "result": {
                "addedPoints": delivery.total_points,
                "status": "approved",
                "citizen": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "new_points": user.total_points
                }
            },
            "delivery": delivery_out
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error en la transacción de aprobación.")

@router.patch("/{delivery_id}/reject")
def reject_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    gestor: User = Depends(require_roles([UserRole.Gestor_de_Punto, UserRole.Administrador]))
) -> Dict[str, Any]:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada.")

    if delivery.status != DeliveryStatus.pending:
        raise HTTPException(status_code=400, detail="Solo se pueden rechazar entregas en estado pendiente.")

    delivery.status = DeliveryStatus.rejected
    db.commit()
    db.refresh(delivery)
    return {"delivery": DeliveryOut.model_validate(delivery)}

@router.delete("/{delivery_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_delivery(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Entrega no encontrada.")

    if delivery.user_id != current_user.id and current_user.role != UserRole.Administrador:
        raise HTTPException(status_code=403, detail="No tienes permisos para cancelar esta entrega.")

    if delivery.status != DeliveryStatus.pending:
        raise HTTPException(status_code=400, detail="No puedes cancelar una entrega que ya fue procesada.")

    db.delete(delivery)
    db.commit()
    return None
