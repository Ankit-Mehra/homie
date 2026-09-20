from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.inventory.models import Item
from app.inventory.schemas import ItemCreate, ItemPage, ItemRead


class InventoryService:
    def __init__(self, db: Session, household_id: str):
        self.db, self.household_id = db, household_id

    def get(self, item_id: str) -> Item:
        item = self.db.scalar(
            select(Item).where(Item.id == item_id, Item.household_id == self.household_id)
        )
        if item is None:
            raise HTTPException(404, "Item not found")
        return item

    def list(self, offset: int, limit: int) -> ItemPage:
        rows = list(
            self.db.scalars(
                select(Item)
                .where(Item.household_id == self.household_id)
                .order_by(Item.id)
                .offset(offset)
                .limit(limit + 1)
            )
        )
        return ItemPage(
            items=[ItemRead.model_validate(row) for row in rows[:limit]],
            next_offset=offset + limit if len(rows) > limit else None,
        )

    def create(self, data: ItemCreate) -> Item:
        item = Item(household_id=self.household_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def confirm(self, item_id: str) -> Item:
        item = self.get(item_id)
        item.model_confirmed = True
        self.db.commit()
        return item
