"""Initial schema - patterns and admin_users tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-01-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create patterns table
    op.create_table(
        'patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(), nullable=False),
        sa.Column('original_image_path', sa.String(), nullable=True),
        sa.Column('pattern_image_path', sa.String(), nullable=True),
        sa.Column('pattern_data', sa.JSON(), nullable=True),
        sa.Column('grid_size', sa.Integer(), nullable=True),
        sa.Column('colors_used', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patterns_id'), 'patterns', ['id'], unique=False)
    op.create_index(op.f('ix_patterns_uuid'), 'patterns', ['uuid'], unique=True)

    # Create admin_users table
    op.create_table(
        'admin_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('api_key_hash', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admin_users_id'), 'admin_users', ['id'], unique=False)
    op.create_index(op.f('ix_admin_users_email'), 'admin_users', ['email'], unique=True)


def downgrade() -> None:
    # Drop admin_users table
    op.drop_index(op.f('ix_admin_users_email'), table_name='admin_users')
    op.drop_index(op.f('ix_admin_users_id'), table_name='admin_users')
    op.drop_table('admin_users')

    # Drop patterns table
    op.drop_index(op.f('ix_patterns_uuid'), table_name='patterns')
    op.drop_index(op.f('ix_patterns_id'), table_name='patterns')
    op.drop_table('patterns')
