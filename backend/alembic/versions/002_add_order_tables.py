"""Add order tables - customers, orders, order_lines, addresses

Revision ID: 002_add_order_tables
Revises: 001_initial_schema
Create Date: 2026-01-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_order_tables'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=True)

    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('total_amount', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(), server_default='NOK', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)
    op.create_index(op.f('ix_orders_customer_id'), 'orders', ['customer_id'], unique=False)

    # Create order_lines table
    op.create_table(
        'order_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('unit_price', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('line_total', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_lines_id'), 'order_lines', ['id'], unique=False)
    op.create_index(op.f('ix_order_lines_order_id'), 'order_lines', ['order_id'], unique=False)

    # Create addresses table
    op.create_table(
        'addresses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address_line_1', sa.String(), nullable=False),
        sa.Column('address_line_2', sa.String(), nullable=True),
        sa.Column('postal_code', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('country', sa.String(), server_default='NO', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_addresses_id'), 'addresses', ['id'], unique=False)
    op.create_index(op.f('ix_addresses_order_id'), 'addresses', ['order_id'], unique=False)


def downgrade() -> None:
    # Drop addresses table
    op.drop_index(op.f('ix_addresses_order_id'), table_name='addresses')
    op.drop_index(op.f('ix_addresses_id'), table_name='addresses')
    op.drop_table('addresses')

    # Drop order_lines table
    op.drop_index(op.f('ix_order_lines_order_id'), table_name='order_lines')
    op.drop_index(op.f('ix_order_lines_id'), table_name='order_lines')
    op.drop_table('order_lines')

    # Drop orders table
    op.drop_index(op.f('ix_orders_customer_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_index(op.f('ix_orders_id'), table_name='orders')
    op.drop_table('orders')

    # Drop customers table
    op.drop_index(op.f('ix_customers_email'), table_name='customers')
    op.drop_index(op.f('ix_customers_id'), table_name='customers')
    op.drop_table('customers')
