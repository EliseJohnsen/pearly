"""Add AI generation styles table and pattern tracking

Revision ID: 012_ai_styles
Revises: 011_patt_link
Create Date: 2026-03-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision: str = '012_ai_styles'
down_revision: Union[str, None] = '011_patt_link'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add AI generation styles configuration table"""

    # Create ai_generation_styles table
    op.create_table(
        'ai_generation_styles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('style_prompt', sa.Text(), nullable=False),
        sa.Column('negative_prompt', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_ai_generation_styles_id', 'ai_generation_styles', ['id'])
    op.create_index('ix_ai_generation_styles_code', 'ai_generation_styles', ['code'], unique=True)
    op.create_index('ix_ai_generation_styles_is_active', 'ai_generation_styles', ['is_active'])

    # Add style_code column to patterns table
    op.add_column('patterns',
        sa.Column('style_code', sa.String(length=50), nullable=True)
    )

    # Create index on style_code
    op.create_index('ix_patterns_style_code', 'patterns', ['style_code'])

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_patterns_style_code',
        'patterns', 'ai_generation_styles',
        ['style_code'], ['code'],
        ondelete='RESTRICT'  # Prevent deletion of styles that are in use
    )

    # Seed initial WPAP style
    ai_generation_styles_table = table(
        'ai_generation_styles',
        column('code', sa.String),
        column('name', sa.String),
        column('description', sa.Text),
        column('style_prompt', sa.Text),
        column('negative_prompt', sa.Text),
        column('is_active', sa.Boolean),
        column('sort_order', sa.Integer),
    )

    op.bulk_insert(
        ai_generation_styles_table,
        [
            {
                'code': 'wpap',
                'name': 'WPAP Pop Art',
                'description': 'Moderne pop art-stil med flate geometriske former, skarpe kanter og sterke farger. Motivet konstrueres av fargede polygoner i en stilisert, abstrakt stil.',
                'style_prompt': 'do not change motive, create modern pop art illustration, flat geometric shapes, hard sharp edges, no gradients, no shading, replace existing colors with bold high-contrast colors, poster art style, abstract planes, colorful angular shapes, motive constructed from flat single-colored polygons, strong color separation, replace details with abstract shapes',
                'negative_prompt': 'realistic photo, smooth gradients, curved lines, photographic, detailed textures, different subject',
                'is_active': True,
                'sort_order': 1,
            }
        ]
    )


def downgrade() -> None:
    """Remove AI generation styles table and pattern tracking"""

    # Drop foreign key constraint from patterns
    op.drop_constraint('fk_patterns_style_code', 'patterns', type_='foreignkey')

    # Drop index from patterns
    op.drop_index('ix_patterns_style_code', table_name='patterns')

    # Drop column from patterns
    op.drop_column('patterns', 'style_code')

    # Drop indexes from ai_generation_styles
    op.drop_index('ix_ai_generation_styles_is_active', table_name='ai_generation_styles')
    op.drop_index('ix_ai_generation_styles_code', table_name='ai_generation_styles')
    op.drop_index('ix_ai_generation_styles_id', table_name='ai_generation_styles')

    # Drop ai_generation_styles table
    op.drop_table('ai_generation_styles')
