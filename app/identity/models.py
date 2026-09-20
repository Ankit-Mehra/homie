from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Membership(Base):
    __tablename__ = "memberships"
    user_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    household_id: Mapped[str] = mapped_column(String(36), index=True)
    role: Mapped[str] = mapped_column(String(10), default="member")
