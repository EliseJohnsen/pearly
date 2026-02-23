"""Add support for add-on products (strukturprodukter)

Revision ID: 010_addon_sup
Revises: 009_sporingsnr
Create Date: 2026-02-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '010_addon_sup'
down_revision: Union[str, None] = '009_sporingsnr'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add columns for supporting strukturprodukter (add-on products)"""

    # Add parent_line_id column for parent-child relationships
    op.add_column('order_lines',
        sa.Column('parent_line_id', sa.Integer(), nullable=True)
    )

    # Create foreign key constraint to order_lines.id (self-referential)
    op.create_foreign_key(
        'fk_order_lines_parent_line_id',
        'order_lines', 'order_lines',
        ['parent_line_id'], ['id'],
        ondelete='CASCADE'
    )

    # Create index for better query performance
    op.create_index(
        'ix_order_lines_parent_line_id',
        'order_lines',
        ['parent_line_id']
    )

    # Add name column (currently missing but used in checkout)
    op.add_column('order_lines',
        sa.Column('name', sa.String(), nullable=True)
    )

    # Add product_type column (optional, for faster queries)
    op.add_column('order_lines',
        sa.Column('product_type', sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Remove columns for strukturprodukter support"""

    # Drop index first
    op.drop_index('ix_order_lines_parent_line_id', table_name='order_lines')

    # Drop foreign key constraint
    op.drop_constraint('fk_order_lines_parent_line_id', 'order_lines', type_='foreignkey')

    # Drop columns
    op.drop_column('order_lines', 'parent_line_id')
    op.drop_column('order_lines', 'name')
    op.drop_column('order_lines', 'product_type')
