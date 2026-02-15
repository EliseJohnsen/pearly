"""Add storage_version to pattern_data

Revision ID: 008_storage_vers
Revises: 007_add_pickup_point_id
Create Date: 2026-02-14 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '008_storage_vers'
down_revision: Union[str, None] = '007_add_pickup_point_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Convert pattern_data from JSON to JSONB and add storage_version.
    Mark all existing patterns as version 1 (hex-based).
    """
    connection = op.get_bind()

    # Step 1: Convert JSON to JSONB
    connection.execute(
        text("""
        ALTER TABLE patterns
        ALTER COLUMN pattern_data TYPE JSONB USING pattern_data::text::jsonb
        """)
    )

    # Step 2: Add storage_version to existing patterns
    connection.execute(
        text("""
        UPDATE patterns
        SET pattern_data = jsonb_set(
            COALESCE(pattern_data, '{}'::jsonb),
            '{storage_version}',
            '1'::jsonb,
            true
        )
        WHERE pattern_data IS NOT NULL
            AND pattern_data->>'storage_version' IS NULL
        """)
    )

def downgrade() -> None:
    """
    Remove storage_version field and convert JSONB back to JSON.
    """
    connection = op.get_bind()

    # Step 1: Remove storage_version
    connection.execute(
        text("""
        UPDATE patterns
        SET pattern_data = pattern_data - 'storage_version'
        WHERE pattern_data IS NOT NULL
        """)
    )

    # Step 2: Convert JSONB back to JSON
    connection.execute(
        text("""
        ALTER TABLE patterns
        ALTER COLUMN pattern_data TYPE JSON USING pattern_data::text::json
        """)
    )
