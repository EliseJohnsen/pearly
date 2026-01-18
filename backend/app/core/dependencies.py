from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import decode_access_token, verify_api_key
from app.models.admin_user import AdminUser
from datetime import datetime

security = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> AdminUser:
    """
    Dependency to get the current authenticated admin user.
    Supports two authentication methods:
    1. Authorization header with Bearer token (JWT session token)
    2. Cookie with session token

    Raises 401 if authentication fails.
    """
    token = None

    # Try to get token from Authorization header first
    if credentials:
        token = credentials.credentials
    # Fall back to cookie
    elif session_token:
        token = session_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode JWT token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get admin user from database
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user not found",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive",
        )

    return admin


async def verify_admin_api_key(
    api_key: str,
    db: Session = Depends(get_db)
) -> AdminUser:
    """
    Verify an API key and return the associated admin user.
    Used during login flow.

    Raises 401 if API key is invalid.
    """
    # Find all active admin users
    admins = db.query(AdminUser).filter(AdminUser.is_active == True).all()

    # Check API key against each admin's hashed key
    for admin in admins:
        if verify_api_key(api_key, admin.api_key_hash):
            # Update last login timestamp
            admin.last_login = datetime.utcnow()
            db.commit()
            return admin

    # No matching API key found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key",
    )
