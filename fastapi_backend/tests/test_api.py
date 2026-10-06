import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_unauthorized_access_to_profile():
    response = client.get("/api/auth/profile")
    assert response.status_code in (401, 403)

def test_public_ecopoints_list():
    response = client.get("/api/ecopoints")
    assert response.status_code == 200
    assert "ecopoints" in response.json()
