import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Material, EcoPoint, Reward
from app.security import get_password_hash

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Ensure seed
    if db.query(Material).count() == 0:
        db.add(Material(name="Plástico Test", points_per_kg=50, co2_kg_per_kg=1.5))
    if db.query(EcoPoint).count() == 0:
        db.add(EcoPoint(name="Ecopunto Central Test", address="Calle 6 #4-20", city="Pamplona", lat=7.375, lng=-72.648))
    if db.query(Reward).count() == 0:
        db.add(Reward(name="Bono Test", description="Bono eco", category="Descuento", point_cost=100, stock=10))
    if db.query(User).filter(User.email == "admin@ecopuntos.com").count() == 0:
        db.add(User(id=9001, name="Admin Test", email="admin@ecopuntos.com", password_hash=get_password_hash("admin123"), role=UserRole.Administrador))
    
    db.commit()
    db.close()

def test_full_system_flow():
    # 1. Admin Login
    res = client.post("/api/auth/login", json={"email": "admin@ecopuntos.com", "password": "admin123"})
    assert res.status_code == 200
    admin_token = res.json()["token"]
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 2. Citizen Register
    reg_res = client.post("/api/auth/register", json={"name": "Carlos Citizen", "email": "carlos_test@eco.com", "password": "pass1234", "default_city": "Pamplona"})
    assert reg_res.status_code == 201
    citizen_token = reg_res.json()["token"]
    citizen_id = reg_res.json()["user"]["id"]
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}

    # 3. Create Gestor by Admin
    gestor_res = client.post("/api/admin/create-gestor", json={"name": "Pedro Gestor", "email": "pedro_gestor@eco.com", "password": "gestorpass123"}, headers=headers_admin)
    assert gestor_res.status_code == 201 or gestor_res.status_code == 200

    # Gestor Login
    g_login = client.post("/api/auth/login", json={"email": "pedro_gestor@eco.com", "password": "gestorpass123"})
    assert g_login.status_code == 200
    gestor_token = g_login.json()["token"]
    headers_gestor = {"Authorization": f"Bearer {gestor_token}"}

    # 4. QR Flow
    qr_res = client.get("/api/qr/generate", headers=headers_citizen)
    assert qr_res.status_code == 200
    qr_str = qr_res.json()["qr"]

    scan_res = client.post("/api/qr/scan", json={"payload": qr_str}, headers=headers_gestor)
    assert scan_res.status_code == 200
    assert scan_res.json()["citizen"]["name"] == "Carlos Citizen"

    # 5. Ecopoints & Delivery Registration
    eps_res = client.get("/api/ecopoints")
    assert eps_res.status_code == 200
    ep_id = eps_res.json()["ecopoints"][0]["id"]

    deliv_res = client.post("/api/deliveries", json={"ecopoint_id": ep_id, "items": [{"material_id": 1, "weight_kg": 20}]}, headers=headers_citizen)
    assert deliv_res.status_code == 201 or deliv_res.status_code == 200
    deliv_id = deliv_res.json()["delivery"]["id"]

    # Approve Delivery
    app_res = client.patch(f"/api/deliveries/{deliv_id}/approve", headers=headers_gestor)
    assert app_res.status_code == 200

    # 6. Profile Balance Verification
    prof_res = client.get("/api/auth/profile", headers=headers_citizen)
    assert prof_res.status_code == 200
    assert prof_res.json()["total_points"] >= 1000

    # 7. Rewards & Redemption
    rw_res = client.get("/api/rewards")
    assert rw_res.status_code == 200
    rw_id = rw_res.json()["rewards"][0]["id"]

    red_res = client.post(f"/api/rewards/{rw_id}/redeem", headers=headers_citizen)
    assert red_res.status_code == 200
    assert "redemption_code" in red_res.json()["redemption"]

    # 8. Ranking & Admin Metrics
    rk_res = client.get("/api/ranking")
    assert rk_res.status_code == 200

    metrics_res = client.get("/api/admin/metrics", headers=headers_admin)
    assert metrics_res.status_code == 200
    assert metrics_res.json()["metrics"]["totalDeliveries"] >= 1
