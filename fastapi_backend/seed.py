import sys
import os
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Material, EcoPoint, Reward
from app.security import get_password_hash

def seed_database():
    print("🌱 Inicializando tablas y cargando datos semilla...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Semilla de Materiales
        if db.query(Material).count() == 0:
            materials = [
                Material(name="Plástico PET", points_per_kg=50, co2_kg_per_kg=1.5),
                Material(name="Vidrio", points_per_kg=30, co2_kg_per_kg=0.8),
                Material(name="Cartón y Papel", points_per_kg=20, co2_kg_per_kg=0.5),
                Material(name="Metal / Aluminio", points_per_kg=80, co2_kg_per_kg=2.5),
            ]
            db.add_all(materials)
            print("  ✓ Materiales cargados.")

        # 2. Semilla de Ecopuntos
        if db.query(EcoPoint).count() == 0:
            ecopoints = [
                EcoPoint(name="Ecopunto Central Pamplona", address="Calle 6 #4-20", city="Pamplona", lat=7.3758, lng=-72.6483),
                EcoPoint(name="Ecopunto Plazuela Almeyda", address="Carrera 4 #7-12", city="Pamplona", lat=7.3762, lng=-72.6475),
                EcoPoint(name="Ecopunto Unipamplona Campus", address="Km 1 Vía Bucaramanga", city="Pamplona", lat=7.3800, lng=-72.6500)
            ]
            db.add_all(ecopoints)
            print("  ✓ Ecopuntos cargados.")

        # 3. Semilla de Usuarios
        if db.query(User).count() == 0:
            users = [
                User(id=9001, name="Administrador EcoPuntos", email="admin@ecopuntos.com", password_hash=get_password_hash("admin123"), role=UserRole.Administrador, total_points=500, level="Héroe Ambiental"),
                User(id=2002, name="Carlos Gestor", email="gestor@ecopuntos.com", password_hash=get_password_hash("gestor123"), role=UserRole.Gestor_de_Punto, total_points=200, level="Guardián del Planeta"),
                User(id=1001, name="Ana Ciudadana", email="eco@ecopuntos.com", password_hash=get_password_hash("eco123"), role=UserRole.Ciudadano, total_points=120, level="Eco Guerrero")
            ]
            db.add_all(users)
            print("  ✓ Usuarios de prueba cargados.")

        # 4. Semilla de Recompensas
        if db.query(Reward).count() == 0:
            rewards = [
                Reward(name="Bono $10.000 Mercado Ecológico", description="Descuento en tiendas asociadas de Pamplona", category="Descuentos", point_cost=100, stock=50),
                Reward(name="Kit de Compostaje Doméstico", description="Incluye caneca compostadora y guía ecológica", category="Hogar", point_cost=250, stock=15),
                Reward(name="Termo Reutilizable EcoPuntos", description="Acero inoxidable 750ml", category="Accesorios", point_cost=150, stock=30)
            ]
            db.add_all(rewards)
            print("  ✓ Recompensas cargadas.")

        db.commit()
        print("✅ Base de datos sembrada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al sembrar la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
