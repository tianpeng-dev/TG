"""initial migration: patient_profiles

Revision ID: 0001
Revises:
Create Date: 2026-08-08

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "patient_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("gender", sa.String(10), nullable=False),
        sa.Column("birth_date", sa.String(10), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("emergency_contact", sa.JSON, nullable=True),
        sa.Column("diagnosis", sa.JSON, nullable=False),
        sa.Column("medication_plan", sa.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("client_version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("synced", sa.Boolean, nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_table("patient_profiles")
