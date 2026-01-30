"""Add order_logs table

Revision ID: 003_add_order_logs
Revises: 002_add_order_tables
Create Date: 2026-01-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_order_logs'
down_revision: Union[str, None] = '002_add_order_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create order_logs table
    op.create_table(
        'order_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('created_by_type', sa.String(), nullable=False),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['created_by_admin_id'], ['admin_users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_logs_id'), 'order_logs', ['id'], unique=False)
    op.create_index(op.f('ix_order_logs_order_id'), 'order_logs', ['order_id'], unique=False)


def downgrade() -> None:
    # Drop order_logs table
    op.drop_index(op.f('ix_order_logs_order_id'), table_name='order_logs')
    op.drop_index(op.f('ix_order_logs_id'), table_name='order_logs')
    op.drop_table('order_logs')
