"""
deduplicar_ecopuntos.py
Script de investigación, actualización y eliminación de duplicados de puntos de reciclaje en Pamplona, Norte de Santander.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import EcoPoint, Delivery

# Lista oficial de Puntos Reales e Investigados de Reciclaje en Pamplona, Norte de Santander
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
        "address": "Carrera 6 N° 4-65, Barrio Centro",
        "city": "Pamplona",
        "lat": 7.3758,
        "lng": -72.6483
    },
    {
        "name": "Asociación Ecología y Paz",
        "address": "Carrera 8 N° 2-10, Barrio Centro",
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

def deduplicate_and_update():
    print("==========================================================")
    print(" INICIANDO DEDUPLICACIÓN Y ACTUALIZACIÓN DE ECOPUNTOS")
    print(" Pamplona, Norte de Santander")
    print("==========================================================")
    
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        existing_points = db.query(EcoPoint).all()
        print(f"Puntos en base de datos antes de limpiar: {len(existing_points)}")
        for pt in existing_points:
            print(f" - [ID {pt.id}] {pt.name} ({pt.address})")

        # Mapeo de coincidencias para unificar duplicados
        canonical_map = {}
        for real_pt in PUNTOS_REALES_PAMPLONA:
            canonical_name = real_pt["name"]
            canonical_map[canonical_name] = None

        # Asignar cada ecopunto existente a un punto canónico o marcarlo como duplicado
        reassigned_deliveries = 0
        deleted_count = 0

        for pt in list(existing_points):
            name_lower = pt.name.lower()
            
            # Determinar a qué punto real corresponde
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
                matched_real = PUNTOS_REALES_PAMPLONA[4] # Default to Águeda Gallardo

            c_name = matched_real["name"]
            
            if canonical_map[c_name] is None:
                # Este se convertirá en el punto oficial retenido
                pt.name = matched_real["name"]
                pt.address = matched_real["address"]
                pt.city = matched_real["city"]
                pt.lat = matched_real["lat"]
                pt.lng = matched_real["lng"]
                canonical_map[c_name] = pt
                print(f" -> Retenido e id {pt.id} actualizado a: {pt.name}")
            else:
                # Es un duplicado. Reasignar todas sus entregas al retenido y borrarlo.
                target_primary = canonical_map[c_name]
                deliveries_to_move = db.query(Delivery).filter(Delivery.ecopoint_id == pt.id).all()
                for d in deliveries_to_move:
                    d.ecopoint_id = target_primary.id
                    reassigned_deliveries += 1
                
                db.delete(pt)
                deleted_count += 1
                print(f" -> Duplicado eliminado [ID {pt.id}] {pt.name}. Reasignadas {len(deliveries_to_move)} entregas al ID {target_primary.id}.")

        # Crear los puntos reales que aún no existían
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
                print(f" -> Creado nuevo punto real: {real_pt['name']}")

        db.commit()

        final_points = db.query(EcoPoint).all()
        print("\n==========================================================")
        print(f" PROCESO COMPLETADO EXITOSAMENTE:")
        print(f" - Puntos duplicados eliminados: {deleted_count}")
        print(f" - Entregas reasignadas: {reassigned_deliveries}")
        print(f" - Nuevos puntos creados: {created_count}")
        print(f" - Total de puntos reales en Pamplona: {len(final_points)}")
        print("==========================================================")
        for ep in final_points:
            print(f" [{ep.id}] {ep.name} | {ep.address} | Lat: {ep.lat}, Lng: {ep.lng}")

    except Exception as e:
        db.rollback()
        print(f"Error durante la deduplicación: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    deduplicate_and_update()
