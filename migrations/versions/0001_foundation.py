"""Inventory and household-scoped research foundation."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None


def upgrade() -> None:
    op.create_table(
        "memberships",
        sa.Column("user_id", sa.String(100), primary_key=True),
        sa.Column("household_id", sa.String(36), nullable=False),
        sa.Column("role", sa.String(10), nullable=False),
    )
    op.create_index("ix_memberships_household_id", "memberships", ["household_id"])
    op.create_table(
        "items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("household_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("brand", sa.String(100), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("room", sa.String(80), nullable=False),
        sa.Column("serial_number", sa.String(120)),
        sa.Column("purchase_date", sa.Date()),
        sa.Column("warranty_expiry", sa.Date()),
        sa.Column("model_confirmed", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_items_household_id", "items", ["household_id"])
    op.create_table(
        "research_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("household_id", sa.String(36), nullable=False),
        sa.Column("item_id", sa.String(36), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("detail", sa.String(500), nullable=False),
        sa.UniqueConstraint("household_id", "item_id"),
    )
    op.create_index("ix_research_jobs_household_id", "research_jobs", ["household_id"])
    op.create_index("ix_research_jobs_status", "research_jobs", ["status"])
    if op.get_bind().dialect.name == "postgresql":
        # No direct client access: the authenticated API owns all persistence.
        for table in ("memberships", "items", "research_jobs"):
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_table("research_jobs")
    op.drop_table("items")
    op.drop_table("memberships")
