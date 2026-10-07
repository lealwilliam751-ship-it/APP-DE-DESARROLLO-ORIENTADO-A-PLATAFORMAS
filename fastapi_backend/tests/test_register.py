import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.models import User
import uuid

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)

def test_successful_registration():
    uid = uuid.uuid4().hex[:8]
    email = f"nuevo_usuario_{uid}@pamplona.com"

    payload = {
        "name": "Maria Lopez",
        "email": email,
        "password": "password123",
        "default_city": "Pamplona"
    }

    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "Ciudadano"
    assert data["user"]["total_points"] == 0
    assert data["user"]["level"] == "Semilla Verde"

def test_duplicate_email_registration_fails():
    uid = uuid.uuid4().hex[:8]
    email = f"duplicado_{uid}@pamplona.com"

    payload = {
        "name": "Pedro Perez",
        "email": email,
        "password": "password123",
        "default_city": "Pamplona"
    }

    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "ya se encuentra registrado" in res2.json()["detail"].lower()

def test_short_password_registration_fails():
    payload = {
        "name": "Juan Corto",
        "email": "corto@pamplona.com",
        "password": "123" # Min 6 chars
    }

    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 422

def test_invalid_email_registration_fails():
    payload = {
        "name": "Sin Email",
        "email": "correo_invalido",
        "password": "password123"
    }

    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 422 or res.status_code == 400
