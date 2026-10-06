from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.models.models import UserRole, DeliveryStatus

# Token Schemas
class Token(BaseModel):
    token: str
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# User Schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str
    password: str = Field(..., min_length=6)
    default_city: Optional[str] = "Pamplona"

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    default_city: str
    total_points: int
    level: str
    created_at: Optional[datetime] = None

# Material Schemas
class MaterialCreate(BaseModel):
    name: str
    points_per_kg: int
    co2_kg_per_kg: float

class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    points_per_kg: int
    co2_kg_per_kg: float

# EcoPoint Schemas
class EcoPointCreate(BaseModel):
    name: str
    address: str
    city: str = "Pamplona"
    lat: float
    lng: float

class EcoPointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    city: str
    lat: float
    lng: float
    created_at: Optional[datetime] = None

# Delivery Schemas
class DeliveryItemCreate(BaseModel):
    material_id: int
    weight_kg: float = Field(..., gt=0)

class DeliveryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material_id: int
    weight_kg: float
    points: int
    co2_saved: float

class DeliveryCreate(BaseModel):
    ecopoint_id: Optional[int] = None
    ecopointId: Optional[int] = None
    citizen_id: Optional[int] = None
    citizenId: Optional[int] = None
    items: List[DeliveryItemCreate] = Field(..., min_length=1)

    def get_ecopoint_id(self) -> int:
        return self.ecopoint_id if self.ecopoint_id is not None else (self.ecopointId or 1)

    def get_citizen_id(self) -> Optional[int]:
        return self.citizen_id if self.citizen_id is not None else self.citizenId

class DeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    ecopoint_id: int
    status: DeliveryStatus
    total_points: int
    total_co2: float
    created_at: datetime
    citizen_name: Optional[str] = None
    items: Optional[List[DeliveryItemOut]] = []


# Reward Schemas
class RewardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    point_cost: int
    stock: int = -1

class RewardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    point_cost: int
    stock: int
    created_at: Optional[datetime] = None

class RedeemedRewardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    reward_id: Optional[int]
    points_spent: int
    redemption_code: str
    redeemed_at: datetime
