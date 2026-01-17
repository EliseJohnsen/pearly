"""Seed patterns data from Supabase

Revision ID: b3f4c2e8a1d6
Revises: 9a5bb11300d5
Create Date: 2026-01-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import os


# revision identifiers, used by Alembic.
revision: str = 'b3f4c2e8a1d6'
down_revision: Union[str, None] = '9a5bb11300d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Insert patterns data from Supabase export.

    To use this migration:
    1. Place your patterns_rows.sql file in the backend directory
    2. Run: python migrate.py upgrade
    """

    # Read the SQL file
    sql_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'patterns_rows.sql')

    if os.path.exists(sql_file_path):
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()

        # Clean up the SQL for compatibility with both SQLite and PostgreSQL
        sql_content = sql_content.replace('"public"."patterns"', 'patterns')
        sql_content = sql_content.replace('"public".', '')

        # For PostgreSQL, add ON CONFLICT clause to handle duplicates
        # This ensures we don't create duplicates and preserve existing IDs
        # which are critical for Sanity product relations
        bind = op.get_bind()
        if bind.dialect.name == 'postgresql':
            # Add ON CONFLICT DO NOTHING before the semicolon
            # This will skip any rows where the ID already exists
            if ';' in sql_content and 'ON CONFLICT' not in sql_content:
                sql_content = sql_content.replace(');', ') ON CONFLICT (id) DO NOTHING;')
        else:
            # For SQLite: Use INSERT OR IGNORE to skip duplicates
            sql_content = sql_content.replace('INSERT INTO', 'INSERT OR IGNORE INTO')

        # Execute the SQL
        op.execute(sql_content)
    else:
        print(f"Warning: {sql_file_path} not found. Skipping patterns data seed.")
        print("Place your patterns_rows.sql file in the backend directory to seed data.")


def downgrade() -> None:
    """Remove all seeded patterns data"""
    # Get all pattern IDs that were in the seed file
    # You can customize this list based on your actual data
    op.execute("""
        DELETE FROM patterns WHERE id IN (
            245, 237, 206, 199, 187, 174, 172, 170, 167, 110
        );
    """)
