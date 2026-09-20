from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db import session
from app.identity.auth import household
from app.research.service import ResearchService


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    item_id: str
    status: str
    detail: str


router = APIRouter(prefix="/v1", tags=["research"])


def service(
    db: Annotated[Session, Depends(session)], home: Annotated[str, Depends(household)]
) -> ResearchService:
    return ResearchService(db, home)


Service = Annotated[ResearchService, Depends(service)]


@router.post("/items/{item_id}/research", status_code=202)
def submit(item_id: str, svc: Service) -> JobRead:
    return JobRead.model_validate(svc.submit(item_id))


@router.get("/research/{job_id}")
def get(job_id: str, svc: Service) -> JobRead:
    return JobRead.model_validate(svc.get(job_id))
