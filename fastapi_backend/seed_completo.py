"""
seed_completo.py — Seed de prueba completo para EcoPuntos Pamplona
Crea: materiales, ecopuntos, usuarios (10 ciudadanos variados), recompensas y entregas aprobadas.
Ejecutar desde fastapi_backend/: python seed_completo.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import (
    User, UserRole, Material, EcoPoint, Reward,
    Delivery, DeliveryItem, DeliveryStatus
)
from app.security import get_password_hash

def calculate_level(points: int) -> str:
    if points >= 1200:
        return "Héroe Ambiental"
    elif points >= 800:
        return "Guardián del Planeta"
    elif points >= 500:
        return "Eco Guerrero"
    elif points >= 200:
        return "Brote Verde"
    return "Semilla Verde"

def seed_database():
    print("Inicializando tablas...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Materiales 
        if db.query(Material).count() == 0:
            materials = [
                Material(name="Plastico PET",      points_per_kg=50,  co2_kg_per_kg=1.5),
                Material(name="Vidrio",             points_per_kg=30,  co2_kg_per_kg=0.8),
                Material(name="Carton y Papel",     points_per_kg=20,  co2_kg_per_kg=0.5),
                Material(name="Metal / Aluminio",   points_per_kg=80,  co2_kg_per_kg=2.5),
            ]
            db.add_all(materials)
            db.flush()
            print("  Materiales cargados.")
        else:
            print("  Materiales ya existentes, omitiendo.")

        mats = db.query(Material).all()
        def find_mat(*keywords):
            for m in mats:
                norm_name = m.name.lower().replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
                for kw in keywords:
                    if kw.lower() in norm_name:
                        return m
            return mats[0] if mats else None

        mat_pet    = find_mat("plastico", "pet")
        mat_vidrio = find_mat("vidrio")
        mat_papel  = find_mat("carton", "papel")
        mat_metal  = find_mat("metal", "aluminio")

        # 2. Ecopuntos Reales e Investigados de Pamplona, Norte de Santander 
        real_ecopoints_data = [
            dict(name="Centro de Acopio Asociación Renacer", address="Carrera 6 #1-15, Sector Chapinero (Planta Km 3 Vía La Cortada)", city="Pamplona", lat=7.3785, lng=-72.6460),
            dict(name="Punto Limpio Empopamplona S.A. E.S.P.", address="Carrera 6 N 4-65, Barrio Centro", city="Pamplona", lat=7.3758, lng=-72.6483),
            dict(name="Asociación Ecología y Paz", address="Carrera 8 N 2-10, Barrio Centro", city="Pamplona", lat=7.3770, lng=-72.6490),
            dict(name="Ecopunto Unipamplona Campus Principal",address="Ciudad Universitaria, Km 1 Vía Bucaramanga", city="Pamplona", lat=7.3820, lng=-72.6515),
            dict(name="Ecopunto Parque Águeda Gallardo",    address="Calle 6 con Carrera 5, Centro Histórico", city="Pamplona", lat=7.3765, lng=-72.6480),
            dict(name="Ecopunto Plazuela Almeyda",          address="Carrera 4 con Calle 7, Barrio El Carmen", city="Pamplona", lat=7.3795, lng=-72.6455),
        ]

        # Deduplicar y sincronizar ecopuntos existentes
        all_eps = db.query(EcoPoint).all()
        ep_map = {}
        for ep_item in list(all_eps):
            clean_name = ep_item.name.strip().lower()
            match = None
            if "renacer" in clean_name or "chapinero" in clean_name:
                match = real_ecopoints_data[0]["name"]
            elif "empopamplona" in clean_name or "limpio" in clean_name:
                match = real_ecopoints_data[1]["name"]
            elif "ecología" in clean_name or "ecologia" in clean_name or "paz" in clean_name:
                match = real_ecopoints_data[2]["name"]
            elif "unipamplona" in clean_name or "universidad" in clean_name or "campus" in clean_name:
                match = real_ecopoints_data[3]["name"]
            elif "águeda" in clean_name or "agueda" in clean_name or "sucre" in clean_name or "parque" in clean_name or "central" in clean_name:
                match = real_ecopoints_data[4]["name"]
            elif "almeyda" in clean_name or "almeida" in clean_name:
                match = real_ecopoints_data[5]["name"]
            else:
                match = real_ecopoints_data[4]["name"]

            if match not in ep_map:
                ep_map[match] = ep_item
                for r in real_ecopoints_data:
                    if r["name"] == match:
                        ep_item.name = r["name"]
                        ep_item.address = r["address"]
                        ep_item.city = r["city"]
                        ep_item.lat = r["lat"]
                        ep_item.lng = r["lng"]
                        break
            else:
                primary_ep = ep_map[match]
                db.query(Delivery).filter(Delivery.ecopoint_id == ep_item.id).update({"ecopoint_id": primary_ep.id})
                db.delete(ep_item)

        existing_names = {ep_item.name for ep_item in db.query(EcoPoint).all()}
        for r in real_ecopoints_data:
            if r["name"] not in existing_names:
                db.add(EcoPoint(**r))
        
        db.flush()
        print("  Ecopuntos reales de Pamplona sincronizados y sin duplicados.")

        ep = db.query(EcoPoint).first()

        # 3. Usuarios (admin + gestor + 10 ciudadanos) 
        users_data = [
            # Roles de gestión
            dict(name="Administrador EcoPuntos", email="admin@ecopuntos.com",
                 password="admin123", role=UserRole.Administrador, total_points=0, level="Semilla Verde"),
            dict(name="Carlos Gestor",           email="gestor@ecopuntos.com",
                 password="gestor123", role=UserRole.Gestor_de_Punto, total_points=0, level="Semilla Verde"),
            # Ciudadanos con distintos niveles
            dict(name="Ana Lucia Perez",         email="ana@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=1250, level=calculate_level(1250)),
            dict(name="Juan David Torres",       email="juan@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=980,  level=calculate_level(980)),
            dict(name="Maria Fernanda Ruiz",     email="maria@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=820,  level=calculate_level(820)),
            dict(name="Carlos Andres Mora",      email="carlos@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=640,  level=calculate_level(640)),
            dict(name="Laura Sofia Jimenez",     email="laura@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=510,  level=calculate_level(510)),
            dict(name="Pedro Alfonso Suarez",    email="pedro@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=390,  level=calculate_level(390)),
            dict(name="Valentina Castro",        email="vale@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=210,  level=calculate_level(210)),
            dict(name="Diego Herrera Lopez",     email="diego@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=145,  level=calculate_level(145)),
            dict(name="Natalia Gomez Vargas",    email="natalia@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=70,   level=calculate_level(70)),
            dict(name="Santiago Ramos Gil",      email="santiago@ecopuntos.com",
                 password="eco123",    role=UserRole.Ciudadano, total_points=25,   level=calculate_level(25)),
        ]

        for u in users_data:
            pw = u.pop("password")
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                existing.name = u["name"]
                existing.role = u["role"]
                existing.total_points = u["total_points"]
                existing.level = u["level"]
                existing.password_hash = get_password_hash(pw)
            else:
                user_obj = User(**u, password_hash=get_password_hash(pw))
                db.add(user_obj)

        db.flush()
        print("  Usuarios procesados (2 de gestion + 10 ciudadanos para ranking).")

        # 4. Recompensas 
        if db.query(Reward).count() == 0:
            rewards = [
                Reward(name="Bono $10.000 Mercado Ecologico", description="Descuento en tiendas asociadas de Pamplona", category="Descuentos", point_cost=100, stock=50),
                Reward(name="Kit de Compostaje Domestico",    description="Incluye caneca compostadora y guia ecologica", category="Hogar", point_cost=250, stock=15),
                Reward(name="Termo Reutilizable EcoPuntos",   description="Acero inoxidable 750ml", category="Accesorios", point_cost=150, stock=30),
                Reward(name="Bolsa de Mercado Ecologica",     description="Hecha con materiales reciclados, capacidad 10kg", category="Accesorios", point_cost=80, stock=100),
                Reward(name="Descuento 20% Cicloverde",       description="Descuento en alquiler de bicicletas verdes", category="Transporte", point_cost=200, stock=20),
            ]
            db.add_all(rewards)
            print("  Recompensas cargadas.")
        else:
            print("  Recompensas ya existentes, omitiendo.")

        # 5. Entregas aprobadas por ciudadano 
        ciudadanos = db.query(User).filter(User.role == UserRole.Ciudadano).all()
        ciudadanos_by_email = {u.email: u for u in ciudadanos}
        ana_user = ciudadanos_by_email.get("ana@ecopuntos.com")

        has_seed_deliveries = False
        if ana_user:
            has_seed_deliveries = db.query(Delivery).filter(Delivery.user_id == ana_user.id).first() is not None

        if not has_seed_deliveries and ep:
            entregas_prueba = [
                ("ana@ecopuntos.com",      [(mat_metal, 5.0), (mat_pet, 8.0)]),
                ("ana@ecopuntos.com",      [(mat_pet, 10.0), (mat_papel, 12.0)]),
                ("juan@ecopuntos.com",     [(mat_metal, 4.0), (mat_vidrio, 6.0)]),
                ("juan@ecopuntos.com",     [(mat_pet, 7.0), (mat_papel, 5.0)]),
                ("maria@ecopuntos.com",    [(mat_metal, 3.5), (mat_pet, 5.0)]),
                ("maria@ecopuntos.com",    [(mat_vidrio, 8.0), (mat_papel, 4.0)]),
                ("carlos@ecopuntos.com",   [(mat_metal, 2.0), (mat_pet, 6.0)]),
                ("laura@ecopuntos.com",    [(mat_pet, 4.0), (mat_papel, 6.0)]),
                ("pedro@ecopuntos.com",    [(mat_vidrio, 5.0), (mat_papel, 8.0)]),
                ("vale@ecopuntos.com",     [(mat_pet, 2.0), (mat_vidrio, 3.0)]),
                ("diego@ecopuntos.com",    [(mat_papel, 4.0)]),
                ("natalia@ecopuntos.com",  [(mat_vidrio, 1.5)]),
                ("santiago@ecopuntos.com", [(mat_papel, 1.0)]),
            ]

            for email, items in entregas_prueba:
                user = ciudadanos_by_email.get(email)
                if not user:
                    continue

                calc_points = 0
                calc_co2 = Decimal("0")

                delivery = Delivery(
                    user_id=user.id,
                    ecopoint_id=ep.id,
                    status=DeliveryStatus.approved,
                    total_points=0,
                    total_co2=Decimal("0")
                )
                db.add(delivery)
                db.flush()

                for mat, kg in items:
                    p = int(mat.points_per_kg * kg)
                    c = Decimal(str(mat.co2_kg_per_kg)) * Decimal(str(kg))
                    db.add(DeliveryItem(
                        delivery_id=delivery.id,
                        material_id=mat.id,
                        weight_kg=Decimal(str(kg)),
                        points=p,
                        co2_saved=c
                    ))
                    calc_points += p
                    calc_co2 += c

                delivery.total_points = calc_points
                delivery.total_co2 = calc_co2

            print("  Entregas de prueba aprobadas cargadas.")

        db.commit()
        print("\nBase de datos sembrada correctamente.")
        print("\nUsuarios de prueba:")
        print("  admin@ecopuntos.com    / admin123  (Administrador)")
        print("  gestor@ecopuntos.com   / gestor123 (Gestor)")
        print("  ana@ecopuntos.com      / eco123    (Ciudadana - 1er lugar ranking)")
        print("  juan@ecopuntos.com     / eco123    (Ciudadano - 2do lugar)")
        print("  maria@ecopuntos.com    / eco123    (Ciudadana - 3er lugar)")
        print("  ... (7 ciudadanos mas)")

    except Exception as e:
        db.rollback()
        print(f"Error al sembrar: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
