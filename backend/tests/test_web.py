from fastapi.testclient import TestClient

from app.main import app


def test_browser_client_is_served_by_api() -> None:
    response = TestClient(app).get("/")

    assert response.status_code == 200
    assert "Homie" in response.text
