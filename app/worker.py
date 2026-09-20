"""Durable foundation worker. Never represents missing integration as completed research."""

import time

from sqlalchemy import update

from app.db import SessionLocal
from app.research.models import ResearchJob


def tick() -> int:
    with SessionLocal.begin() as db:
        result = db.execute(
            update(ResearchJob)
            .where(ResearchJob.status == "queued")
            .values(
                status="unavailable",
                detail="Live documentation discovery is not configured. No manual has been retrieved or verified.",
            )
        )
        return int(getattr(result, "rowcount", 0))


def main() -> None:
    while True:
        tick()
        time.sleep(3)


if __name__ == "__main__":
    main()
