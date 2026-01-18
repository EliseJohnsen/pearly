#!/usr/bin/env python3
"""
CLI script to create admin users with API keys.

Usage:
    python scripts/create_admin.py --name "John Doe" --email "john@example.com"
    python scripts/create_admin.py --name "Jane Smith" --email "jane@example.com"
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


def create_admin(name: str, email: str) -> tuple[AdminUser, str]:
    """
    Create a new admin user with a generated API key.

    Args:
        name: Admin user's full name
        email: Admin user's email (must be unique)

    Returns:
        Tuple of (admin_user, plain_api_key)
    """
    db: Session = SessionLocal()

    try:
        # Check if admin with this email already exists
        existing_admin = db.query(AdminUser).filter(AdminUser.email == email).first()
        if existing_admin:
            raise ValueError(f"Admin user with email {email} already exists")

        # Generate API key
        api_key = generate_api_key(prefix="admin")
        api_key_hash = hash_api_key(api_key)

        # Create admin user
        admin = AdminUser(
            name=name,
            email=email,
            api_key_hash=api_key_hash,
            is_active=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        return admin, api_key

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Create a new admin user with an API key"
    )
    parser.add_argument(
        "--name",
        required=True,
        help="Admin user's full name"
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Admin user's email address (must be unique)"
    )

    args = parser.parse_args()

    try:
        admin, api_key = create_admin(args.name, args.email)

        print("\n" + "=" * 70)
        print("✅ Admin bruker opprettet!")
        print("=" * 70)
        print(f"Navn: {admin.name}")
        print(f"E-post: {admin.email}")
        print(f"API-nøkkel: {api_key}")
        print("=" * 70)
        print("\n📧 Send denne e-posten til brukeren:")
        print("-" * 70)
        print(f"""
Hei {admin.name}!

Du har nå fått admin-tilgang til Perle.

Din API-nøkkel: {api_key}

Slik logger du inn:
1. Gå til https://pearly-bice.vercel.app/admin/login
   (eller http://localhost:3000/admin/login for lokal utvikling)
2. Lim inn nøkkelen ovenfor
3. Klikk "Logg inn"

Nøkkelen gir tilgang til:
- /patterns - Se alle mønstre
- AI-styling funksjon
- Produktoppretting i Sanity

Tips: Lagre nøkkelen i din password manager for enkel tilgang.

Hilsen Perle-systemet
        """)
        print("-" * 70)
        print("\n⚠️  VIKTIG: Lagre API-nøkkelen på et trygt sted!")
        print("Den vises kun én gang og kan ikke gjenopprettes.\n")

    except ValueError as e:
        print(f"\n❌ Feil: {e}\n", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Uventet feil: {e}\n", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
