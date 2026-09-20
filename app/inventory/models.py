from datetime import date
from uuid import uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Item(Base):
    __tablename__ = "items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    household_id: Mapped[str] = mapped_column(String(36), index=True)
    name: Mapped[str] = mapped_column(String(120))
    brand: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    room: Mapped[str] = mapped_column(String(80), default="")
    serial_number: Mapped[str | None] = mapped_column(String(120))
    purchase_date: Mapped[date | None]
    warranty_expiry: Mapped[date | None]
    model_confirmed: Mapped[bool] = mapped_column(default=False)
