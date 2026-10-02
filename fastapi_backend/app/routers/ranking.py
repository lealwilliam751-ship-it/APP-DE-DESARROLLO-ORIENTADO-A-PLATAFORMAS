from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserOut
from app.security import get_current_user

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.get("")
def get_top_ranking(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    users = (
        db.query(User)
        .filter(User.role == UserRole.Ciudadano)
        .order_by(User.total_points.desc())
        .limit(limit)
        .all()
    )
    out = [UserOut.model_validate(u).model_dump() for u in users]
    return {"ranking": out}

@router.get("/me")
def get_my_position(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    higher_count = (
        db.query(User)
        .filter(User.role == UserRole.Ciudadano, User.total_points > current_user.total_points)
        .count()
    )

    return {
        "position": higher_count + 1,
        "user": UserOut.model_validate(current_user)
    }
