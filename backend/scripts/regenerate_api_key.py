#!/usr/bin/env python3
"""
CLI script to regenerate API key for an existing admin user.

Usage:
    python scripts/regenerate_api_key.py --email "elise@perle.no"
"""

import sys
import os
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

import argparse
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.auth import generate_api_key, hash_api_key
from app.models.admin_user import AdminUser


def regenerate_api_key(email: str) -> tuple[AdminUser, str]:
    """
    Regenerate API key for an existing admin user.

    Args:
        email: Admin user's email

    Returns:
        Tuple of (admin_user, new_plain_api_key)
    """
    db: Session = SessionLocal()

    try:
        # Find admin user
        admin = db.query(AdminUser).filter(AdminUser.email == email).first()
        if not admin:
            raise ValueError(f"Admin user with email {email} not found")

        # Generate new API key
        api_key = generate_api_key(prefix="admin")
        api_key_hash = hash_api_key(api_key)

        # Update admin user
        admin.api_key_hash = api_key_hash
        db.commit()
        db.refresh(admin)

        return admin, api_key

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Regenerate API key for an existing admin user"
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Admin user's email address"
    )

    args = parser.parse_args()

    try:
        admin, api_key = regenerate_api_key(args.email)

        print("\n" + "=" * 70)
        print("SUCCESS: API key regenerated!")
        print("=" * 70)
        print(f"Name: {admin.name}")
        print(f"Email: {admin.email}")
        print(f"New API Key: {api_key}")
        print("=" * 70)
        print("\nLogin instructions:")
        print("-" * 70)
        print("1. Go to http://localhost:3000/admin/login (local)")
        print("   or https://pearly-bice.vercel.app/admin/login (prod)")
        print("2. Paste the API key above")
        print("3. Click 'Logg inn'")
        print("-" * 70)
        print("\nWARNING: Save this API key securely!")
        print("It will only be shown once and cannot be recovered.\n")

    except ValueError as e:
        print(f"\nERROR: {e}\n", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUNEXPECTED ERROR: {e}\n", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
