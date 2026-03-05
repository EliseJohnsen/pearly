"""Add pattern_id to order_lines

Revision ID: 011_patt_link
Revises: 010_addon_sup
Create Date: 2026-03-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '011_patt_link'
down_revision: Union[str, None] = '010_addon_sup'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pattern_id for custom pattern support"""

    # Add pattern_id column for linking custom patterns
    op.add_column('order_lines',
        sa.Column('pattern_id', sa.Integer(), nullable=True)
    )

    # Create foreign key constraint to patterns table
    op.create_foreign_key(
        'fk_order_lines_pattern_id',
        'order_lines', 'patterns',
        ['pattern_id'], ['id'],
        ondelete='SET NULL'  # Keep order history even if pattern is deleted
    )

    # Create index for better query performance
    op.create_index(
        'ix_order_lines_pattern_id',
        'order_lines',
        ['pattern_id']
    )


def downgrade() -> None:
    """Remove pattern_id column"""

    # Drop index first
    op.drop_index('ix_order_lines_pattern_id', table_name='order_lines')

    # Drop foreign key constraint
    op.drop_constraint('fk_order_lines_pattern_id', 'order_lines', type_='foreignkey')

    # Drop column
    op.drop_column('order_lines', 'pattern_id')
