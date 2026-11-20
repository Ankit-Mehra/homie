from alembic import context

from app.db import Base, engine
from app.identity.models import Membership  # noqa: F401
from app.inventory.models import Item  # noqa: F401
from app.research.models import ResearchJob  # noqa: F401

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()
