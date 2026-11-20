from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import session
from app.identity.auth import authenticated_user
from app.identity.models import Membership

router = APIRouter(prefix="/v1/me", tags=["identity"])
User = Annotated[str, Depends(authenticated_user)]
Database = Annotated[Session, Depends(session)]


class Profile(BaseModel):
    user_id: str
    household_id: str | None


@router.get("")
def profile(user_id: User, db: Database) -> Profile:
    membership = db.get(Membership, user_id)
    return Profile(user_id=user_id, household_id=membership.household_id if membership else None)


@router.post("/household")
def create_household(user_id: User, db: Database) -> Profile:
    membership = db.get(Membership, user_id)
    if membership is None:
        membership = Membership(user_id=user_id, household_id=str(uuid4()), role="owner")
        db.add(membership)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            membership = db.get(Membership, user_id)
            if membership is None:
                raise
    return Profile(user_id=user_id, household_id=membership.household_id)
