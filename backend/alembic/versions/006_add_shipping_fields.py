"""Add shipping fields to orders

Revision ID: 006_add_shipping_fields
Revises: 005_make_customer_id_nullable
Create Date: 2026-02-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006_add_shipping_fields'
down_revision: Union[str, None] = '005_make_customer_id_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('shipping_method_id', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('shipping_amount', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('orders', 'shipping_amount')
    op.drop_column('orders', 'shipping_method_id')
