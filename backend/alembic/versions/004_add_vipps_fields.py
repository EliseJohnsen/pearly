"""Add Vipps payment fields to orders

Revision ID: 004_add_vipps_fields
Revises: 003_add_order_logs
Create Date: 2026-01-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_vipps_fields'
down_revision: Union[str, None] = '003_add_order_logs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add payment_status column with default value
    op.add_column('orders', sa.Column('payment_status', sa.String(), nullable=True))
    op.execute("UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL")

    # Add vipps_reference column
    op.add_column('orders', sa.Column('vipps_reference', sa.String(), nullable=True))
    op.create_index(op.f('ix_orders_vipps_reference'), 'orders', ['vipps_reference'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_orders_vipps_reference'), table_name='orders')
    op.drop_column('orders', 'vipps_reference')
    op.drop_column('orders', 'payment_status')
