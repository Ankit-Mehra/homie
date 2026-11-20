from collections.abc import Iterator
from time import time

import jwt
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.db import Base, session
from app.main import app

SECRET = "test-only-signing-secret-at-least-32-characters"
ISSUER = "https://auth.example.test/auth/v1"


def token(user: str, **overrides: object) -> str:
    claims = {"sub": user, "aud": "authenticated", "iss": ISSUER, "exp": time() + 300}
    claims.update(overrides)
    return jwt.encode(claims, SECRET, algorithm="HS256")


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setattr(settings, "dev_auth", False)
    monkeypatch.setattr(settings, "supabase_jwt_secret", SecretStr(SECRET))
    monkeypatch.setattr(settings, "supabase_jwt_issuer", ISSUER)
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)

    def db() -> Iterator[Session]:
        with Session(engine) as value:
            yield value

    app.dependency_overrides[session] = db
    with TestClient(app) as value:
        yield value
    app.dependency_overrides.clear()
    engine.dispose()


def test_real_token_onboarding_and_isolation(client: TestClient) -> None:
    client.headers["Authorization"] = f"Bearer {token('user-a')}"
    assert client.get("/v1/me").json()["household_id"] is None
    assert client.get("/v1/items").status_code == 403
    home = client.post("/v1/me/household").json()["household_id"]
    assert client.post("/v1/me/household").json()["household_id"] == home
    item = client.post(
        "/v1/items",
        json={"name": "Vacuum", "brand": "Dyson", "model": "V8", "category": "Appliance"},
    )
    assert item.status_code == 201
    client.headers["Authorization"] = f"Bearer {token('user-b')}"
    assert client.post("/v1/me/household").json()["household_id"] != home
    assert client.get("/v1/items").json()["items"] == []
    assert client.get(f"/v1/items/{item.json()['id']}").status_code == 404
    client.headers["Authorization"] = f"Bearer {token('user-a')}"
    assert client.get("/v1/items").json()["items"][0]["id"] == item.json()["id"]


@pytest.mark.parametrize("overrides", [{"exp": 1}, {"iss": "wrong"}, {"aud": "wrong"}, {"sub": ""}])
def test_invalid_claims_rejected(client: TestClient, overrides: dict[str, object]) -> None:
    client.headers["Authorization"] = f"Bearer {token('user', **overrides)}"
    assert client.post("/v1/me/household").status_code == 401


def test_missing_and_forged_token_rejected(client: TestClient) -> None:
    assert client.post("/v1/me/household").status_code == 401
    client.headers["Authorization"] = f"Bearer {token('user')}tampered"
    assert client.get("/v1/me").status_code == 401
    client.headers["Authorization"] = "Bearer local-development-only"
    assert client.get("/v1/me").status_code == 401


def test_asymmetric_signing_and_algorithm_boundary(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from types import SimpleNamespace

    from cryptography.hazmat.primitives.asymmetric import ec

    from app.identity import auth

    private = ec.generate_private_key(ec.SECP256R1())
    claims = {"sub": "asymmetric-user", "aud": "authenticated", "iss": ISSUER, "exp": time() + 300}

    class Keys:
        def get_signing_key_from_jwt(self, value: str) -> SimpleNamespace:
            return SimpleNamespace(key=private.public_key())

    monkeypatch.setattr(settings, "supabase_jwt_secret", SecretStr(""))
    monkeypatch.setattr(auth, "jwks", Keys())
    client.headers["Authorization"] = f"Bearer {jwt.encode(claims, private, algorithm='ES256')}"
    assert client.get("/v1/me").json()["user_id"] == "asymmetric-user"
    client.headers["Authorization"] = f"Bearer {token('user')}"
    assert client.post("/v1/me/household").status_code == 401
    monkeypatch.setattr(settings, "supabase_jwt_secret", SecretStr(SECRET))
    client.headers["Authorization"] = f"Bearer {jwt.encode(claims, private, algorithm='ES256')}"
    assert client.post("/v1/me/household").status_code == 401
