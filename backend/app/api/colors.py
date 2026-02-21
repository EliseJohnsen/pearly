from fastapi import APIRouter, Depends, HTTPException, status
from pathlib import Path
import json
import tempfile
import os
from typing import List

from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.services.color_service import clear_color_cache
from app.schemas.color import ColorCreate, ColorUpdate, ColorResponse

router = APIRouter()

COLORS_FILE = Path(__file__).parent.parent / "data" / "perle-colors.json"


def read_colors() -> List[dict]:
    """Read colors from the JSON file."""
    if not COLORS_FILE.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perle colors file not found"
        )

    try:
        with open(COLORS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing colors file: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading colors file: {str(e)}"
        )


def write_colors_atomically(colors: List[dict]) -> None:
    """
    Atomically write colors to file to prevent corruption.
    Uses temp file + atomic rename pattern.
    """
    # Create temp file in same directory as target file
    temp_fd, temp_path = tempfile.mkstemp(
        dir=COLORS_FILE.parent,
        suffix='.tmp',
        prefix='perle-colors-'
    )

    try:
        # Write to temp file
        with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
            json.dump(colors, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add trailing newline

        # Atomic rename (overwrites original)
        Path(temp_path).replace(COLORS_FILE)

        # Clear cache after successful write
        clear_color_cache()

    except Exception as e:
        # Clean up temp file on error
        try:
            Path(temp_path).unlink(missing_ok=True)
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save colors: {str(e)}"
        )


@router.post("/admin/colors", response_model=ColorResponse, status_code=status.HTTP_201_CREATED)
async def create_color(
    color: ColorCreate,
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Create a new color (admin only).
    Validates that the color code doesn't already exist.
    """
    colors = read_colors()

    # Check if code already exists
    existing_codes = [c.get('code') for c in colors]
    if color.code in existing_codes:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Color with code '{color.code}' already exists"
        )

    # Add new color
    new_color = {
        "name": color.name,
        "code": color.code,
        "hex": color.hex
    }
    colors.append(new_color)

    # Write to file
    write_colors_atomically(colors)

    return ColorResponse(**new_color)


@router.put("/admin/colors/{code}", response_model=ColorResponse)
async def update_color(
    code: str,
    color_update: ColorUpdate,
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Update an existing color (admin only).
    Can update the code itself, but validates uniqueness if code is changed.
    """
    colors = read_colors()

    # Find the color to update
    color_index = None
    for i, c in enumerate(colors):
        if c.get('code') == code:
            color_index = i
            break

    if color_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Color with code '{code}' not found"
        )

    # If code is being changed, check for conflicts
    if color_update.code != code:
        existing_codes = [c.get('code') for i, c in enumerate(colors) if i != color_index]
        if color_update.code in existing_codes:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Color with code '{color_update.code}' already exists"
            )

    # Update the color
    updated_color = {
        "name": color_update.name,
        "code": color_update.code,
        "hex": color_update.hex
    }
    colors[color_index] = updated_color

    # Write to file
    write_colors_atomically(colors)

    return ColorResponse(**updated_color)


@router.delete("/admin/colors/{code}")
async def delete_color(
    code: str,
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Delete a color (admin only).
    """
    colors = read_colors()

    # Find the color to delete
    color_to_delete = None
    for i, c in enumerate(colors):
        if c.get('code') == code:
            color_to_delete = colors.pop(i)
            break

    if color_to_delete is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Color with code '{code}' not found"
        )

    # Write to file
    write_colors_atomically(colors)

    return {
        "message": "Color deleted successfully",
        "deleted_color": color_to_delete
    }
