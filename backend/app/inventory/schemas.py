from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    brand: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=50)
    room: str = Field(default="", max_length=80)
    serial_number: str | None = Field(default=None, max_length=120)
    purchase_date: date | None = None
    warranty_expiry: date | None = None


class ItemRead(ItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_confirmed: bool


class ItemPage(BaseModel):
    items: list[ItemRead]
    next_offset: int | None
