import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Material, EcoPoint, Reward
from app.security import get_password_hash

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy materials & ecopoints if not existing
    if db.query(Material).count() == 0:
        db.add(Material(name="Plástico Error Test", points_per_kg=50, co2_kg_per_kg=1.5))
    if db.query(EcoPoint).count() == 0:
        db.add(EcoPoint(name="EcoPunto Error Test", address="Calle 1 #2-3", city="Pamplona", lat=7.37, lng=-72.64))
    if db.query(Reward).count() == 0:
        db.add(Reward(name="Premio Costoso Test", description="Recompensa de alto valor", category="Test", point_cost=99999, stock=10))

    # Create test users
    admin = db.query(User).filter(User.email == "admin_err@ecopuntos.com").first()
    if not admin:
        db.add(User(name="Admin Error Test", email="admin_err@ecopuntos.com", password_hash=get_password_hash("admin123"), role=UserRole.Administrador))

    citizen = db.query(User).filter(User.email == "citizen_err@ecopuntos.com").first()
    if not citizen:
        db.add(User(name="Ciudadano Error Test", email="citizen_err@ecopuntos.com", password_hash=get_password_hash("eco123"), role=UserRole.Ciudadano, total_points=10))

    db.commit()
    db.close()

def get_tokens():
    res_adm = client.post("/api/auth/login", json={"email": "admin_err@ecopuntos.com", "password": "admin123"})
    res_cit = client.post("/api/auth/login", json={"email": "citizen_err@ecopuntos.com", "password": "eco123"})
    return res_adm.json()["token"], res_cit.json()["token"]

# 1. 401 sin token (o token inválido)
def test_error_401_unauthorized_without_token():
    res = client.get("/api/auth/profile")
    assert res.status_code in (401, 403)

    res_invalid_token = client.get("/api/auth/profile", headers={"Authorization": "Bearer token_falso_invalid_123"})
    assert res_invalid_token.status_code in (401, 403)

# 2. 403 cuando un ciudadano llama a un endpoint exclusivo de administrador
def test_error_403_forbidden_citizen_calling_admin_endpoint():
    _, citizen_token = get_tokens()
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}

    # Intentar acceder a métricas de admin con rol Ciudadano
    res = client.get("/api/admin/metrics", headers=headers_citizen)
    assert res.status_code == 403
    assert "restringido" in res.json()["detail"].lower() or "privilegios" in res.json()["detail"].lower() or "acceso" in res.json()["detail"].lower()

# 3. 422 con datos inválidos (validación Pydantic)
def test_error_422_invalid_payload_data():
    res = client.post("/api/auth/login", json={"email": "not_an_email"}) # falta contraseña
    assert res.status_code == 422

    _, citizen_token = get_tokens()
    headers = {"Authorization": f"Bearer {citizen_token}"}
    # Entrega con peso negativo o cero
    res_deliv = client.post("/api/deliveries", json={"ecopoint_id": 1, "items": [{"material_id": 1, "weight_kg": -5.0}]}, headers=headers)
    assert res_deliv.status_code == 422

# 4. 404 con un recurso inexistente
def test_error_404_nonexistent_resource():
    res_ecopoint = client.get("/api/ecopoints/999999")
    assert res_ecopoint.status_code == 404
    assert "no encontrado" in res_ecopoint.json()["detail"].lower()

    admin_token, _ = get_tokens()
    res_delete = client.delete("/api/materials/999999", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_delete.status_code == 404

# 5. Canje con puntos insuficientes (400 Bad Request)
def test_error_insufficient_points_for_reward():
    _, citizen_token = get_tokens()
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}

    db = SessionLocal()
    reward = db.query(Reward).first()
    if not reward:
        reward = Reward(name="Premio Costoso", description="Desc", category="Test", point_cost=500, stock=10)
        db.add(reward)
        db.commit()
        db.refresh(reward)
    reward_id = reward.id
    db.close()

    res = client.post(f"/api/rewards/{reward_id}/redeem", headers=headers_citizen)
    assert res.status_code == 400
    assert "insuficiente" in res.json()["detail"].lower()
