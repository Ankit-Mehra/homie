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
    jwt.PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
    if settings.supabase_url
    else None
)


def household(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(session)],
) -> str:
    if credentials is None:
        raise HTTPException(401, "Sign in to continue")
    if settings.dev_auth and credentials.credentials == "local-development-only":
        user_id = "local-user"
    else:
        try:
            if jwks is None:
                raise HTTPException(503, "Authentication is not configured")
            token = credentials.credentials
            key = jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=["RS256", "ES256"],
                audience="authenticated",
                issuer=f"{settings.supabase_url}/auth/v1",
                options={"require": ["exp", "sub", "iss", "aud"]},
            )
            user_id = claims["sub"]
        except jwt.PyJWTError as exc:
            raise HTTPException(401, "Invalid or expired session") from exc
    membership = db.get(Membership, user_id)
    if membership is None:
        raise HTTPException(403, "Household membership required")
    return membership.household_id
