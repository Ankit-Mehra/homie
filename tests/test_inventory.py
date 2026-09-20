from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base, session
from app.identity.auth import household
from app.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)

    def db() -> Iterator[Session]:
        with Session(engine) as value:
            yield value

    app.dependency_overrides[session] = db
    app.dependency_overrides[household] = lambda: "home-a"
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def add(client: TestClient) -> str:
    response = client.post(
        "/v1/items",
        json={"name": "Vacuum", "brand": "Dyson", "model": "V8", "category": "Appliance"},
    )
    assert response.status_code == 201
    assert "household_id" not in response.json()
    return str(response.json()["id"])


def test_confirmation_and_idempotent_research(client: TestClient) -> None:
    item = add(client)
    assert client.post(f"/v1/items/{item}/research").status_code == 409
    assert client.post(f"/v1/items/{item}/confirm-model").json()["model_confirmed"] is True
    first = client.post(f"/v1/items/{item}/research")
    second = client.post(f"/v1/items/{item}/research")
    assert first.status_code == 202
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["status"] == "queued"


def test_household_isolation(client: TestClient) -> None:
    item = add(client)
    client.post(f"/v1/items/{item}/confirm-model")
    job = client.post(f"/v1/items/{item}/research").json()["id"]
    app.dependency_overrides[household] = lambda: "home-b"
    assert client.get("/v1/items").json()["items"] == []
    assert client.get(f"/v1/items/{item}").status_code == 404
    assert client.post(f"/v1/items/{item}/confirm-model").status_code == 404
    assert client.post(f"/v1/items/{item}/research").status_code == 404
    assert client.get(f"/v1/research/{job}").status_code == 404


def test_validation_and_pagination(client: TestClient) -> None:
    assert client.post("/v1/items", json={"name": " "}).status_code == 422
    assert client.get("/v1/items?limit=1000").status_code == 422
    add(client)
    add(client)
    page = client.get("/v1/items?limit=1").json()
    assert len(page["items"]) == 1
    assert page["next_offset"] == 1
    assert client.get("/v1/items?offset=1&limit=1").json()["next_offset"] is None


def test_authentication_required(client: TestClient) -> None:
    del app.dependency_overrides[household]
    response = client.get("/v1/items")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


def test_household_cannot_be_injected(client: TestClient) -> None:
    response = client.post(
        "/v1/items",
        json={
            "name": "Vacuum",
            "brand": "Dyson",
            "model": "V8",
            "category": "Appliance",
            "household_id": "other",
        },
    )
    assert response.status_code == 422
    assert client.get("/v1/items").json()["items"] == []
