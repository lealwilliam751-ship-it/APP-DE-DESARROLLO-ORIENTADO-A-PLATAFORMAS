from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    Ciudadano = "Ciudadano"
    Gestor_de_Punto = "Gestor_de_Punto"
    Administrador = "Administrador"

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class CampaignStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), default=UserRole.Ciudadano, nullable=False)
    default_city = Column(String(100), default="Pamplona")
    total_points = Column(Integer, default=0, nullable=False)
    level = Column(String(50), default="Semilla Verde", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    deliveries = relationship("Delivery", back_populates="user", cascade="all, delete-orphan")
    redeemed_rewards = relationship("RedeemedReward", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    points_per_kg = Column(Integer, nullable=False)
    co2_kg_per_kg = Column(Numeric(10, 2), nullable=False)

class EcoPoint(Base):
    __tablename__ = "ecopoints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), default="Pamplona", nullable=False)
    lat = Column(Numeric(10, 8), nullable=False)
    lng = Column(Numeric(11, 8), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deliveries = relationship("Delivery", back_populates="ecopoint", cascade="all, delete-orphan")

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ecopoint_id = Column(Integer, ForeignKey("ecopoints.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(DeliveryStatus, name="delivery_status"), default=DeliveryStatus.pending, nullable=False)
    total_points = Column(Integer, default=0)
    total_co2 = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="deliveries")
    ecopoint = relationship("EcoPoint", back_populates="deliveries")
    items = relationship("DeliveryItem", back_populates="delivery", cascade="all, delete-orphan")

class DeliveryItem(Base):
    __tablename__ = "delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Numeric(10, 2), nullable=False)
    points = Column(Integer, nullable=False)
    co2_saved = Column(Numeric(10, 2), nullable=False)

    delivery = relationship("Delivery", back_populates="items")
    material = relationship("Material")

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    point_cost = Column(Integer, nullable=False)
    stock = Column(Integer, default=-1) # -1 = infinite
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RedeemedReward(Base):
    __tablename__ = "redeemed_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id", ondelete="SET NULL"), nullable=True)
    points_spent = Column(Integer, nullable=False)
    redemption_code = Column(String(50), unique=True, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="redeemed_rewards")
    reward = relationship("Reward")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    goal_points = Column(Integer, nullable=False)
    current_points = Column(Integer, default=0)
    status = Column(Enum(CampaignStatus, name="campaign_status"), default=CampaignStatus.active, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CampaignParticipant(Base):
    __tablename__ = "campaign_participants"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points_contributed = Column(Integer, default=0, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
