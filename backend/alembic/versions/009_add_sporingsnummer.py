"""Add shipping_tracking_number to orders

Revision ID: 009_sporingsnr
Revises: 008_storage_vers
Create Date: 2026-02-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '009_sporingsnr'
down_revision: Union[str, None] = '008_storage_vers'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add shipping_tracking_number column to orders table"""
    op.add_column('orders', sa.Column('shipping_tracking_number', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('shipping_tracking_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove shipping_tracking_number column from orders table"""
    op.drop_column('orders', 'shipping_tracking_number')
    op.drop_column('orders', 'shipping_tracking_url')
