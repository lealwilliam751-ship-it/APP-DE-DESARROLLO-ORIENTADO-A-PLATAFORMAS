import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_unauthorized_access_to_profile():
    response = client.get("/api/auth/profile")
    assert response.status_code == 403 or response.status_code == 401

def test_public_ecopoints_list():
    with patch("app.routers.ecopoints.get_all_ecopoints") as mock_get:
        mock_get.return_value = [
            {"id": 1, "name": "Ecopunto Central", "address": "Calle 6 #4-20", "city": "Pamplona", "lat": 7.375, "lng": -72.648}
        ]
        response = client.get("/api/ecopoints")
        assert response.status_code == 200
