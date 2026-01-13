"""remove_image_path_columns

Revision ID: 374bedd993d5
Revises: 001_initial_schema
Create Date: 2026-01-13 07:53:03.647446

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '374bedd993d5'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove image path columns - images are now stored in Sanity
    op.drop_column('patterns', 'pattern_image_path')
    op.drop_column('patterns', 'original_image_path')


def downgrade() -> None:
    # Restore image path columns if needed
    op.add_column('patterns', sa.Column('original_image_path', sa.String(), nullable=True))
    op.add_column('patterns', sa.Column('pattern_image_path', sa.String(), nullable=True))
