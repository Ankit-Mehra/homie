from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import worker
from app.db import Base
from app.research.models import ResearchJob


def test_worker_reports_unavailable_without_claiming_retrieval(tmp_path, monkeypatch) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'jobs.db'}")
    Base.metadata.create_all(engine)
    sessions = sessionmaker(engine)
    with sessions.begin() as db:
        job = ResearchJob(household_id="one", item_id="item")
        db.add(job)
        db.flush()
        job_id = job.id
    monkeypatch.setattr(worker, "SessionLocal", sessions)
    assert worker.tick() == 1
    assert worker.tick() == 0
    with sessions() as db:
        persisted = db.get(ResearchJob, job_id)
        assert persisted is not None
        assert persisted.status == "unavailable"
        assert "No manual has been retrieved" in persisted.detail
    engine.dispose()
