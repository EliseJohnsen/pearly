from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import create_access_token
from app.core.dependencies import verify_admin_api_key, get_current_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    api_key: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_name: str
    admin_email: str


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Login with API key.
    Returns a JWT token and sets it as an httpOnly cookie.
    """
    # Verify API key
    admin = await verify_admin_api_key(login_data.api_key, db)

    # Create JWT token
    access_token = create_access_token(data={"sub": admin.email})

    # Set httpOnly cookie (secure in production)
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,  # 30 days
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    return LoginResponse(
        access_token=access_token,
        admin_name=admin.name,
        admin_email=admin.email
    )


@router.post("/logout")
async def logout(response: Response):
    """
    Logout by clearing the session cookie.
    """
    response.delete_cookie(key="session_token")
    return {"message": "Successfully logged out"}


@router.get("/me")
async def get_current_user(admin: AdminUser = Depends(get_current_admin)):
    """
    Get current authenticated admin user.
    Useful for frontend to check if user is logged in.
    """
    return {
        "name": admin.name,
        "email": admin.email,
        "is_active": admin.is_active,
        "last_login": admin.last_login
    }
