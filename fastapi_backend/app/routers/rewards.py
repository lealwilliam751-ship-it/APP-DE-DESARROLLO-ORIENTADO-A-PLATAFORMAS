from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
from app.database import get_db
from app.models.models import Reward, RedeemedReward, User, UserRole
from app.schemas.schemas import RewardCreate, RewardOut, RedeemedRewardOut
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/rewards", tags=["Recompensas"])

@router.get("")
def get_rewards(db: Session = Depends(get_db)) -> Dict[str, Any]:
    rewards = db.query(Reward).all()
    out = [RewardOut.model_validate(r).model_dump() for r in rewards]
    return {"rewards": out}

@router.get("/history")
def get_redemption_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    history = db.query(RedeemedReward).filter(RedeemedReward.user_id == current_user.id).order_by(RedeemedReward.redeemed_at.desc()).all()
    out = [RedeemedRewardOut.model_validate(h).model_dump() for h in history]
    return {"history": out}

@router.post("/{reward_id}/redeem")
def redeem_reward(
    reward_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada.")

    if reward.stock == 0:
        raise HTTPException(status_code=400, detail="Esta recompensa se encuentra agotada.")

    if current_user.total_points < reward.point_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo de puntos insuficiente. Tienes {current_user.total_points} pts y se requieren {reward.point_cost} pts."
        )

    try:
        current_user.total_points -= reward.point_cost

        if reward.stock > 0:
            reward.stock -= 1

        code = f"ECO-{uuid.uuid4().hex[:8].upper()}"

        redemption = RedeemedReward(
            user_id=current_user.id,
            reward_id=reward.id,
            points_spent=reward.point_cost,
            redemption_code=code
        )
        db.add(redemption)
        db.commit()
        db.refresh(redemption)

        red_out = RedeemedRewardOut.model_validate(redemption).model_dump()
        return {"redemption": red_out}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error en la transacción de canje.")

@router.post("", response_model=RewardOut, status_code=status.HTTP_201_CREATED)
def create_reward(
    data: RewardCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    reward = Reward(**data.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

@router.put("/{reward_id}", response_model=RewardOut)
def update_reward(
    reward_id: int,
    data: RewardCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada.")

    for key, value in data.model_dump().items():
        setattr(reward, key, value)

    db.commit()
    db.refresh(reward)
    return reward

@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.Administrador]))
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada.")

    db.delete(reward)
    db.commit()
    return None
