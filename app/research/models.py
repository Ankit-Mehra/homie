from uuid import uuid4

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ResearchJob(Base):
    __tablename__ = "research_jobs"
    __table_args__ = (UniqueConstraint("household_id", "item_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    household_id: Mapped[str] = mapped_column(String(36), index=True)
    item_id: Mapped[str] = mapped_column(String(36))
    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)
    detail: Mapped[str] = mapped_column(String(500), default="Waiting for discovery worker")
