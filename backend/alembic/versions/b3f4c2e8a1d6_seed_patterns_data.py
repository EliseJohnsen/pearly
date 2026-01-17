"""Seed patterns data from Supabase

Revision ID: b3f4c2e8a1d6
Revises: 374bedd993d5
Create Date: 2026-01-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import os


# revision identifiers, used by Alembic.
revision: str = 'b3f4c2e8a1d6'
down_revision: Union[str, None] = '374bedd993d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Insert patterns data from Supabase export.

    To use this migration:
    1. Place your patterns_rows.sql file in the backend directory
    2. Run: python migrate.py upgrade
    """
    import logging
    logger = logging.getLogger('alembic.runtime.migration')

    # Read the SQL file
    sql_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'patterns_rows.sql')

    logger.info(f"Looking for patterns_rows.sql at: {sql_file_path}")

    if os.path.exists(sql_file_path):
        logger.info("Found patterns_rows.sql, reading file...")
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()

        logger.info(f"Read {len(sql_content)} characters from SQL file")

        # Clean up the SQL for compatibility with both SQLite and PostgreSQL
        sql_content = sql_content.replace('"public"."patterns"', 'patterns')
        sql_content = sql_content.replace('"public".', '')

        # For PostgreSQL, add ON CONFLICT clause to handle duplicates
        # This ensures we don't create duplicates and preserve existing IDs
        # which are critical for Sanity product relations
        bind = op.get_bind()
        logger.info(f"Database dialect: {bind.dialect.name}")

        if bind.dialect.name == 'postgresql':
            # Add ON CONFLICT DO NOTHING before the semicolon
            # This will skip any rows where the ID already exists
            if ';' in sql_content and 'ON CONFLICT' not in sql_content:
                sql_content = sql_content.replace(');', ') ON CONFLICT (id) DO NOTHING;')
                logger.info("Added ON CONFLICT clause for PostgreSQL")
        else:
            # For SQLite: Use INSERT OR IGNORE to skip duplicates
            sql_content = sql_content.replace('INSERT INTO', 'INSERT OR IGNORE INTO')
            logger.info("Added INSERT OR IGNORE for SQLite")

        # Execute the SQL
        logger.info("Executing SQL insert...")
        try:
            op.execute(sql_content)
            logger.info("✅ Successfully inserted patterns data")
        except Exception as e:
            logger.error(f"❌ Error executing SQL: {e}")
            raise
    else:
        logger.warning(f"⚠️  patterns_rows.sql not found at {sql_file_path}")
        logger.warning("Place your patterns_rows.sql file in the backend directory to seed data.")
        logger.warning("Skipping patterns data seed.")


def downgrade() -> None:
    """Remove all seeded patterns data"""
    # Get all pattern IDs that were in the seed file
    # You can customize this list based on your actual data
    op.execute("""
        DELETE FROM patterns WHERE id IN (
            245, 237, 206, 199, 187, 174, 172, 170, 167, 110
        );
    """)
