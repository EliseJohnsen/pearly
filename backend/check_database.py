"""
Quick script to check which database the backend is connected to
"""
import os
from app.core.config import settings
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.pattern import Pattern

print("Backend Database Configuration Check\n")
print(f"DATABASE_URL: {settings.DATABASE_URL}")
print(f"(masked): {str(settings.DATABASE_URL).replace(settings.DATABASE_URL.split('@')[0].split(':')[-1], '****')}\n")

# Check database contents
db = next(get_db())

try:
    # Check admin users
    admin_count = db.query(AdminUser).count()
    print(f"Admin users in database: {admin_count}")

    admins = db.query(AdminUser).all()
    for admin in admins:
        print(f"  - {admin.email} (ID: {admin.id})")

    # Check patterns
    pattern_count = db.query(Pattern).count()
    print(f"\nPatterns in database: {pattern_count}")

    if pattern_count > 0:
        patterns = db.query(Pattern).limit(5).all()
        for pattern in patterns:
            print(f"  - Pattern ID {pattern.id}: {pattern.uuid}")

    # Check for test admin
    test_admin = db.query(AdminUser).filter(AdminUser.email == 'e2e-test-admin@perle.test').first()
    if test_admin:
        print(f"\nTest admin found: {test_admin.email}")
    else:
        print(f"\nTest admin NOT found (looking for: e2e-test-admin@perle.test)")
        print("   → Backend is likely NOT connected to test database")

except Exception as e:
    print(f"Error querying database: {e}")
finally:
    db.close()

print("\nTo connect to test database:")
print("   Windows CMD: set DATABASE_URL=postgresql://test_user:test_password@localhost:5433/pearly_test")
print("   Windows PS:  $env:DATABASE_URL=\"postgresql://test_user:test_password@localhost:5433/pearly_test\"")
print("   Then: uvicorn app.main:app --reload")
