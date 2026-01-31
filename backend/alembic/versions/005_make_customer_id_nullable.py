"""Make customer_id nullable on orders

Revision ID: 005_make_customer_id_nullable
Revises: 004_add_vipps_fields
Create Date: 2026-01-31 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_make_customer_id_nullable'
down_revision: Union[str, None] = '004_add_vipps_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make customer_id nullable (customer is linked after payment via Vipps webhook)
    # Using batch mode for SQLite compatibility
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('customer_id',
                              existing_type=sa.Integer(),
                              nullable=True)


def downgrade() -> None:
    # Note: This will fail if there are orders without customer_id
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('customer_id',
                              existing_type=sa.Integer(),
                              nullable=False)
