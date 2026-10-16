"""
fix_points.py
Script para hacer nullable la columna 'location' si existe en PostgreSQL,
deduplicar los ecopuntos dejando EXACTAMENTE los 6 ecopuntos oficiales de Pamplona,
recolectar/reasignar todas las entregas a los IDs correspondientes, y sincronizar sqlite + postgresql.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import EcoPoint, Delivery

PUNTOS_REALES_PAMPLONA = [
    {
        "name": "Centro de Acopio Asociación Renacer",
        "address": "Carrera 6 #1-15, Sector Chapinero (Planta Km 3 Vía La Cortada)",
        "city": "Pamplona",
        "lat": 7.3785,
        "lng": -72.6460
    },
    {
        "name": "Punto Limpio Empopamplona S.A. E.S.P.",
        "address": "Carrera 6 N 4-65, Barrio Centro",
        "city": "Pamplona",
        "lat": 7.3758,
        "lng": -72.6483
    },
    {
        "name": "Asociación Ecología y Paz",
        "address": "Carrera 8 N 2-10, Barrio Centro",
        "city": "Pamplona",
        "lat": 7.3770,
        "lng": -72.6490
    },
    {
        "name": "Ecopunto Unipamplona Campus Principal",
        "address": "Ciudad Universitaria, Km 1 Vía Bucaramanga",
        "city": "Pamplona",
        "lat": 7.3820,
        "lng": -72.6515
    },
    {
        "name": "Ecopunto Parque Águeda Gallardo",
        "address": "Calle 6 con Carrera 5, Centro Histórico",
        "city": "Pamplona",
        "lat": 7.3765,
        "lng": -72.6480
    },
    {
        "name": "Ecopunto Plazuela Almeyda",
        "address": "Carrera 4 con Calle 7, Barrio El Carmen",
        "city": "Pamplona",
        "lat": 7.3795,
        "lng": -72.6455
    }
]

def run_fix():
    print("==========================================================")
    print(" INICIANDO DEPURACIÓN Y FIX DE ECOPUNTOS DUPLICADOS")
    print("==========================================================")
    
    # 1. Ajustar restricción de 'location' en Postgres si aplica
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ecopoints ALTER COLUMN location DROP NOT NULL;"))
            conn.commit()
            print(" -> [Postgres] Restricción NOT NULL eliminada de la columna 'location'.")
        except Exception as e:
            print(" -> [Info] No fue necesario alterar 'location':", e)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        existing_points = db.query(EcoPoint).all()
        print(f"\nTotal puntos en DB ANTES de limpiar: {len(existing_points)}")
        for pt in existing_points:
            print(f" - [ID {pt.id}] {pt.name} | {pt.address}")

        canonical_map = {r["name"]: None for r in PUNTOS_REALES_PAMPLONA}
        reassigned_deliveries = 0
        deleted_count = 0

        for pt in list(existing_points):
            name_lower = pt.name.lower()
            
            # Matchear con cuál de los 6 reales corresponde
            matched_real = None
            if "renacer" in name_lower or "chapinero" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[0]
            elif "empopamplona" in name_lower or "limpio" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[1]
            elif "ecología" in name_lower or "ecologia" in name_lower or "paz" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[2]
            elif "unipamplona" in name_lower or "universidad" in name_lower or "campus" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[3]
            elif "águeda" in name_lower or "agueda" in name_lower or "sucre" in name_lower or "parque" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[4]
            elif "almeyda" in name_lower or "almeida" in name_lower:
                matched_real = PUNTOS_REALES_PAMPLONA[5]
            else:
                matched_real = PUNTOS_REALES_PAMPLONA[4]

            c_name = matched_real["name"]
            
            if canonical_map[c_name] is None:
                # Retener este registro y actualizar sus campos
                pt.name = matched_real["name"]
                pt.address = matched_real["address"]
                pt.city = matched_real["city"]
                pt.lat = matched_real["lat"]
                pt.lng = matched_real["lng"]
                canonical_map[c_name] = pt
                print(f" Retenido [ID {pt.id}]: {pt.name}")
            else:
                # Es duplicado: reasignar entregas al canónico retenido y borrarlo
                target_primary = canonical_map[c_name]
                deliveries_to_move = db.query(Delivery).filter(Delivery.ecopoint_id == pt.id).all()
                for d in deliveries_to_move:
                    d.ecopoint_id = target_primary.id
                    reassigned_deliveries += 1
                
                db.delete(pt)
                deleted_count += 1
                print(f" Duplicado eliminado [ID {pt.id}] {pt.name} -> Entregas movidas: {len(deliveries_to_move)}")

        # Crear los puntos que faltan de los 6 si no existían
        created_count = 0
        for real_pt in PUNTOS_REALES_PAMPLONA:
            if canonical_map[real_pt["name"]] is None:
                new_ep = EcoPoint(
                    name=real_pt["name"],
                    address=real_pt["address"],
                    city=real_pt["city"],
                    lat=real_pt["lat"],
                    lng=real_pt["lng"]
                )
                db.add(new_ep)
                created_count += 1
                print(f" Creado nuevo punto oficial: {real_pt['name']}")

        db.commit()

        final_points = db.query(EcoPoint).order_by(EcoPoint.id).all()
        print("\n==========================================================")
        print(" RESUMEN FINAL DE ECOPUNTOS EN BASE DE DATOS:")
        print(f" Total de puntos en Pamplona: {len(final_points)} (Objetivo: 6)")
        print(f" Eliminados duplicados: {deleted_count}")
        print(f" Entregas reasignadas: {reassigned_deliveries}")
        print(f" Nuevos creados: {created_count}")
        print("==========================================================")
        for ep in final_points:
            print(f"  [ID {ep.id}] {ep.name}")
            print(f"         Direccion: {ep.address} | Lat: {ep.lat}, Lng: {ep.lng}")

    except Exception as e:
        db.rollback()
        print("Error durante la limpieza:", e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_fix()

