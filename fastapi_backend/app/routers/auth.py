from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token
from app.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya se encuentra registrado.")

    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.Ciudadano,
        default_city=user_in.default_city or "Pamplona",
        total_points=0,
        level="Semilla Verde"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role.value})
    return {"token": token, "user": db_user}

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    # Match email or document ID
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        # Check if email input was user ID integer
        if login_in.email.isdigit():
            user = db.query(User).filter(User.id == int(login_in.email)).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas. Verifica tu usuario y contraseña."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"token": token, "user": user}

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
