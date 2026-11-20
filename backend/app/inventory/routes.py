from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import session
from app.identity.auth import household
from app.inventory.schemas import ItemCreate, ItemPage, ItemRead
from app.inventory.service import InventoryService

router = APIRouter(prefix="/v1/items", tags=["inventory"])


def service(
    db: Annotated[Session, Depends(session)], home: Annotated[str, Depends(household)]
) -> InventoryService:
    return InventoryService(db, home)


Service = Annotated[InventoryService, Depends(service)]


@router.get("")
def list_items(
    svc: Service, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)
) -> ItemPage:
    return svc.list(offset, limit)


@router.post("", status_code=201)
def create_item(data: ItemCreate, svc: Service) -> ItemRead:
    return ItemRead.model_validate(svc.create(data))


@router.get("/{item_id}")
def get_item(item_id: str, svc: Service) -> ItemRead:
    return ItemRead.model_validate(svc.get(item_id))


@router.post("/{item_id}/confirm-model")
def confirm_model(item_id: str, svc: Service) -> ItemRead:
    return ItemRead.model_validate(svc.confirm(item_id))
