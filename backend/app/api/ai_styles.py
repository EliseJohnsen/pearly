from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.ai_generation_style import AIGenerationStyle
from app.models.pattern import Pattern
from app.schemas.ai_style import (
    AIStyleCreate,
    AIStyleUpdate,
    AIStyleResponse,
    AIStylePublic
)

router = APIRouter()


@router.get("/ai-styles", response_model=List[AIStylePublic])
async def get_public_styles(db: Session = Depends(get_db)):
    """
    Get all active AI generation styles (public endpoint).
    Returns only active styles, sorted by sort_order.
    """
    styles = (
        db.query(AIGenerationStyle)
        .filter(AIGenerationStyle.is_active == True)
        .order_by(AIGenerationStyle.sort_order)
        .all()
    )
    return styles


@router.get("/ai-styles/{code}", response_model=AIStylePublic)
async def get_public_style(code: str, db: Session = Depends(get_db)):
    """
    Get a single AI generation style by code (public endpoint).
    Returns 404 if style doesn't exist or is inactive.
    """
    style = (
        db.query(AIGenerationStyle)
        .filter(AIGenerationStyle.code == code, AIGenerationStyle.is_active == True)
        .first()
    )

    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style '{code}' not found or is inactive"
        )

    return style


@router.get("/admin/ai-styles", response_model=List[AIStyleResponse])
async def get_all_styles(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get all AI generation styles including inactive ones (admin only).
    Sorted by sort_order.
    """
    styles = (
        db.query(AIGenerationStyle)
        .order_by(AIGenerationStyle.sort_order)
        .all()
    )
    return styles


@router.post("/admin/ai-styles", response_model=AIStyleResponse, status_code=status.HTTP_201_CREATED)
async def create_style(
    style: AIStyleCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Create a new AI generation style (admin only).
    Validates that the style code doesn't already exist.
    """
    # Check if code already exists
    existing = db.query(AIGenerationStyle).filter(AIGenerationStyle.code == style.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Style with code '{style.code}' already exists"
        )

    # Create new style
    new_style = AIGenerationStyle(**style.model_dump())
    db.add(new_style)
    db.commit()
    db.refresh(new_style)

    return new_style


@router.put("/admin/ai-styles/{code}", response_model=AIStyleResponse)
async def update_style(
    code: str,
    style_update: AIStyleUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Update an existing AI generation style (admin only).
    The code itself cannot be changed after creation.
    """
    # Find the style to update
    style = db.query(AIGenerationStyle).filter(AIGenerationStyle.code == code).first()

    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style with code '{code}' not found"
        )

    # Update fields
    update_data = style_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(style, field, value)

    db.commit()
    db.refresh(style)

    return style


@router.delete("/admin/ai-styles/{code}")
async def delete_style(
    code: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Delete an AI generation style (admin only).
    Prevents deletion if any patterns reference this style.
    """
    # Find the style
    style = db.query(AIGenerationStyle).filter(AIGenerationStyle.code == code).first()

    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style with code '{code}' not found"
        )

    # Check if any patterns use this style
    pattern_count = db.query(func.count(Pattern.id)).filter(Pattern.style_code == code).scalar()

    if pattern_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete style '{code}' because {pattern_count} pattern(s) are using it. Consider deactivating the style instead."
        )

    # Delete the style
    db.delete(style)
    db.commit()

    return {
        "message": "Style deleted successfully",
        "deleted_style": {
            "code": style.code,
            "name": style.name
        }
    }
