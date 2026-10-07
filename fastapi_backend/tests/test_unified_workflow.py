import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Material, EcoPoint, Delivery, DeliveryStatus
from app.security import get_password_hash
import uuid

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Material).count() == 0:
        db.add(Material(name="PET Plástico", points_per_kg=50, co2_kg_per_kg=2.5))

    if db.query(EcoPoint).count() == 0:
        db.add(EcoPoint(name="EcoPunto Parque Sucre", address="Calle 5 #4-12", city="Pamplona", lat=7.375, lng=-72.648))

    db.commit()
    db.close()

def test_unified_workflow_in_person_gestor_delivery():
    """Flujo Presencial: Gestor escanea al ciudadano y registra la entrega en báscula con aprobación e incremento de puntos inmediatos"""
    uid = uuid.uuid4().hex[:8]
    cit_email = f"ciudadano_presencial_{uid}@test.com"
    ges_email = f"gestor_presencial_{uid}@test.com"

    # 1. Register citizen
    res_cit = client.post("/api/auth/register", json={"name": "Ana Gomez", "email": cit_email, "password": "password123"})
    assert res_cit.status_code == 201
    citizen_id = res_cit.json()["user"]["id"]
    citizen_token = res_cit.json()["token"]

    # 2. Admin creates Gestor
    admin_login = client.post("/api/auth/login", json={"email": "admin@ecopuntos.com", "password": "admin123"})
    if admin_login.status_code != 200:
        db = SessionLocal()
        db.add(User(name="Admin Root", email="admin@ecopuntos.com", password_hash=get_password_hash("admin123"), role=UserRole.Administrador))
        db.commit()
        db.close()
        admin_login = client.post("/api/auth/login", json={"email": "admin@ecopuntos.com", "password": "admin123"})

    admin_token = admin_login.json()["token"]

    client.post("/api/admin/create-gestor", json={"name": "Gestor Carlos", "email": ges_email, "password": "gestorpassword123"}, headers={"Authorization": f"Bearer {admin_token}"})
    g_login = client.post("/api/auth/login", json={"email": ges_email, "password": "gestorpassword123"})
    gestor_token = g_login.json()["token"]

    # 3. Gestor fetches citizen by ID (GET /api/qr/citizen/{citizen_id})
    res_lookup = client.get(f"/api/qr/citizen/{citizen_id}", headers={"Authorization": f"Bearer {gestor_token}"})
    assert res_lookup.status_code == 200
    assert res_lookup.json()["valid"] is True
    assert res_lookup.json()["citizen"]["name"] == "Ana Gomez"

    # Get material info
    res_mats = client.get("/api/materials")
    mat_list = res_mats.json()["materials"] if "materials" in res_mats.json() else res_mats.json()
    mat = mat_list[0]
    mat_id = mat["id"]
    pts_per_kg = mat["points_per_kg"]

    # 4. Gestor submits in-person delivery for citizen (Auto-approve = True)
    weight = 3.0
    expected_pts = int(weight * pts_per_kg)

    delivery_payload = {
        "ecopoint_id": 1,
        "citizen_id": citizen_id,
        "auto_approve": True,
        "items": [
            {"material_id": mat_id, "weight_kg": weight}
        ]
    }
    res_deliv = client.post("/api/deliveries", json=delivery_payload, headers={"Authorization": f"Bearer {gestor_token}"})
    assert res_deliv.status_code in (200, 201)
    d_data = res_deliv.json()["delivery"]
    assert d_data["status"] == "approved"
    assert d_data["total_points"] == expected_pts

    # 5. Verify citizen profile immediately credited
    res_prof = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res_prof.status_code == 200
    assert res_prof.json()["total_points"] == expected_pts

def test_unified_workflow_citizen_pre_solicitud_ticket():
    """Flujo de Pre-solicitud: Ciudadano crea ticket en estado PENDIENTE y Gestor aprueba en la bandeja"""
    uid = uuid.uuid4().hex[:8]
    cit_email = f"ciudadano_presolicitud_{uid}@test.com"

    res_cit = client.post("/api/auth/register", json={"name": "Marcos Diaz", "email": cit_email, "password": "password123"})
    citizen_token = res_cit.json()["token"]

    # Get material info
    res_mats = client.get("/api/materials")
    mat_list = res_mats.json()["materials"] if "materials" in res_mats.json() else res_mats.json()
    mat = mat_list[0]
    mat_id = mat["id"]
    pts_per_kg = mat["points_per_kg"]

    # 1. Citizen creates pre-solicitud ticket
    weight = 2.0
    expected_pts = int(weight * pts_per_kg)

    delivery_payload = {
        "ecopoint_id": 1,
        "auto_approve": False,
        "items": [
            {"material_id": mat_id, "weight_kg": weight}
        ]
    }
    res_deliv = client.post("/api/deliveries", json=delivery_payload, headers={"Authorization": f"Bearer {citizen_token}"})
    assert res_deliv.status_code in (200, 201)
    deliv_id = res_deliv.json()["delivery"]["id"]
    assert res_deliv.json()["delivery"]["status"] == "pending"

    # 2. Gestor logs in and checks pending queue
    g_login = client.post("/api/auth/login", json={"email": "admin@ecopuntos.com", "password": "admin123"})
    gestor_token = g_login.json()["token"]

    res_pending = client.get("/api/deliveries/pending", headers={"Authorization": f"Bearer {gestor_token}"})
    assert res_pending.status_code == 200
    pending_ids = [d["id"] for d in res_pending.json()]
    assert deliv_id in pending_ids

    # 3. Gestor approves pre-solicitud ticket
    res_approve = client.patch(f"/api/deliveries/{deliv_id}/approve", headers={"Authorization": f"Bearer {gestor_token}"})
    assert res_approve.status_code == 200
    assert res_approve.json()["result"]["status"] == "approved"

    # 4. Verify citizen profile updated
    res_prof = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res_prof.json()["total_points"] == expected_pts
