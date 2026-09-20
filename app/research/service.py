from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.inventory.service import InventoryService
from app.research.models import ResearchJob


class ResearchService:
    def __init__(self, db: Session, household_id: str):
        self.db, self.household_id = db, household_id

    def submit(self, item_id: str) -> ResearchJob:
        item = InventoryService(self.db, self.household_id).get(item_id)
        if not item.model_confirmed:
            raise HTTPException(409, "Confirm the model before researching documentation")
        query = select(ResearchJob).where(
            ResearchJob.household_id == self.household_id, ResearchJob.item_id == item_id
        )
        existing = self.db.scalar(query)
        if existing:
            return existing
        job = ResearchJob(household_id=self.household_id, item_id=item_id)
        self.db.add(job)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            existing = self.db.scalar(query)
            if existing is None:
                raise
            return existing
        return job

    def get(self, job_id: str) -> ResearchJob:
        job = self.db.scalar(
            select(ResearchJob).where(
                ResearchJob.id == job_id, ResearchJob.household_id == self.household_id
            )
        )
        if job is None:
            raise HTTPException(404, "Research job not found")
        return job
