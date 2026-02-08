"""Add pick up point id to addresses

Revision ID: 007_add_pickup_point_id
Revises: 006_add_shipping_fields
Create Date: 2026-02-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_add_pickup_point_id'
down_revision: Union[str, None] = '006_add_shipping_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('addresses', sa.Column('pick_up_point_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('addresses', 'pick_up_point_id')
