from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.db import session
from app.identity.models import Membership

bearer = HTTPBearer(auto_error=False)
jwks = (
    jwt.PyJWKClient(f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json")
    if settings.supabase_url
    else None
)


def authenticated_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> str:
    if credentials is None:
        raise HTTPException(401, "Sign in to continue")
    if settings.dev_auth and credentials.credentials == "local-development-only":
        user_id = "local-user"
    else:
        try:
            token = credentials.credentials
            secret = settings.supabase_jwt_secret.get_secret_value()
            issuer = settings.supabase_jwt_issuer or f"{settings.supabase_url.rstrip('/')}/auth/v1"
            if not settings.supabase_url and not settings.supabase_jwt_issuer:
                raise HTTPException(503, "Authentication is not configured")
            if secret:
                # Explicit legacy mode: never mix symmetric and asymmetric algorithms.
                claims = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                    issuer=issuer,
                    options={"require": ["exp", "sub", "iss", "aud"]},
                )
            else:
                if jwks is None:
                    raise HTTPException(503, "Authentication is not configured")
                key = jwks.get_signing_key_from_jwt(token)
                claims = jwt.decode(
                    token,
                    key.key,
                    algorithms=["RS256", "ES256"],
                    audience="authenticated",
                    issuer=issuer,
                    options={"require": ["exp", "sub", "iss", "aud"]},
                )
            user_id = claims["sub"]
            if not isinstance(user_id, str) or not user_id:
                raise jwt.InvalidTokenError("Missing user identity")
        except jwt.PyJWTError as exc:
            raise HTTPException(401, "Invalid or expired session") from exc
    return str(user_id)


def household(
    user_id: Annotated[str, Depends(authenticated_user)],
    db: Annotated[Session, Depends(session)],
) -> str:
    membership = db.get(Membership, user_id)
    if membership is None:
        raise HTTPException(403, "Household membership required")
    return membership.household_id
