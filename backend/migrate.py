#!/usr/bin/env python3
"""
Database migration helper script for Perle backend.

Usage:
    python migrate.py upgrade     # Apply all pending migrations
    python migrate.py downgrade   # Downgrade one migration
    python migrate.py current     # Show current migration version
    python migrate.py history     # Show migration history
    python migrate.py create "description"  # Create new migration
"""

import sys
import os
from alembic.config import Config
from alembic import command

# Ensure we're in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Create Alembic config
alembic_cfg = Config("alembic.ini")


def upgrade():
    """Apply all pending migrations"""
    print("📦 Applying migrations...")
    command.upgrade(alembic_cfg, "head")
    print("✅ Migrations completed successfully")


def downgrade():
    """Downgrade one migration"""
    print("⏪ Downgrading migration...")
    command.downgrade(alembic_cfg, "-1")
    print("✅ Downgrade completed")


def current():
    """Show current migration version"""
    print("📍 Current migration version:")
    command.current(alembic_cfg)


def history():
    """Show migration history"""
    print("📜 Migration history:")
    command.history(alembic_cfg)


def create(message):
    """Create a new migration"""
    if not message:
        print("❌ Error: Migration message is required")
        print("Usage: python migrate.py create 'description of changes'")
        sys.exit(1)

    print(f"🔨 Creating migration: {message}")
    command.revision(alembic_cfg, message=message, autogenerate=True)
    print("✅ Migration created successfully")


def show_help():
    """Show help message"""
    print(__doc__)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)

    action = sys.argv[1].lower()

    try:
        if action == "upgrade":
            upgrade()
        elif action == "downgrade":
            downgrade()
        elif action == "current":
            current()
        elif action == "history":
            history()
        elif action == "create":
            message = sys.argv[2] if len(sys.argv) > 2 else None
            create(message)
        elif action in ["help", "-h", "--help"]:
            show_help()
        else:
            print(f"❌ Unknown action: {action}")
            show_help()
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
