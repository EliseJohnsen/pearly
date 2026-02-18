from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.pattern import Pattern
from app.schemas.pattern import PatternResponse
from app.services.image_processing import (
    convert_image_to_pattern_in_memory,
    image_to_base64,
    suggest_board_dimensions_from_file,
)
from app.services.ai_generation import AIGenerationService
from app.services.pdf_generator import generate_pattern_pdf
from app.services.pattern_generator import render_grid_to_base64, render_grid_to_image
from app.services.color_service import clear_color_cache
from app.core.config import settings
from pathlib import Path
from PIL import Image
import uuid
import io
import json
import tempfile
from datetime import datetime

router = APIRouter()


@router.post("/patterns/suggest-boards")
async def suggest_boards(file: UploadFile = File(...)):
    """
    Analyzes an image and suggests optimal board dimensions.
    Returns suggested boards_width and boards_height.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_file = None
    try:
        # Create temporary file for analysis
        suffix = Path(file.filename).suffix if file.filename else '.png'
        temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        suggestion = suggest_board_dimensions_from_file(temp_file.name)

        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
    finally:
        # Clean up temp file
        if temp_file and Path(temp_file.name).exists():
            Path(temp_file.name).unlink()

@router.post("/patterns/upload", response_model=PatternResponse)
async def upload_image(
    file: UploadFile = File(...),
    boards_width: int = 1,
    boards_height: int = 1,
    use_advanced_preprocessing: bool = False,
    remove_bg: bool = False,
    enhance_colors: bool = True,
    color_boost: float = 1.5,
    contrast_boost: float = 1.3,
    brightness_boost: float = 1.0,
    simplify_details: bool = True,
    simplification_method: str = "bilateral",
    simplification_strength: str = "strong",
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_uuid = str(uuid.uuid4())

    # Read file content and process in memory
    content = await file.read()
    image = Image.open(io.BytesIO(content))

    # Ensure RGB mode
    if image.mode != 'RGB':
        image = image.convert('RGB')

    try:
        pattern_image_base64, colors_used, pattern_data = convert_image_to_pattern_in_memory(
            image,
            boards_width=boards_width,
            boards_height=boards_height,
            use_perle_colors=True,
            use_dithering=False,  # No dithering to avoid checkered patterns on solid areas
            use_advanced_preprocessing=use_advanced_preprocessing,
            remove_bg=remove_bg,
            enhance_colors=enhance_colors,
            color_boost=color_boost,
            contrast_boost=contrast_boost,
            brightness_boost=brightness_boost,
            simplify_details=simplify_details,
            simplification_method=simplification_method,
            simplification_strength=simplification_strength,
            use_nearest_neighbor=True  # Preserve sharp edges and avoid color blending at boundaries
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    # Calculate total grid size for backwards compatibility
    grid_size = pattern_data["width"]

    # Create timestamp since we're not saving to DB yet
    created_at = datetime.utcnow()

    return PatternResponse(
        uuid=file_uuid,
        pattern_image_url="",  # No file-based URL anymore
        grid_size=grid_size,
        colors_used=colors_used,
        created_at=created_at,
        boards_width=boards_width,
        boards_height=boards_height,
        pattern_data=pattern_data,
        pattern_image_base64=pattern_image_base64,
        styled_image_base64=None
    )

@router.get("/patterns")
def get_all_patterns(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get all patterns from the database"""
    patterns = db.query(Pattern).order_by(Pattern.created_at.desc()).all()

    return [
        PatternResponse(
            id=pattern.id,
            uuid=pattern.uuid,
            pattern_image_url=pattern.pattern_data.get("sanity_pattern_image_url", "") if pattern.pattern_data else "",
            grid_size=pattern.grid_size,
            colors_used=pattern.colors_used,
            created_at=pattern.created_at,
            boards_width=pattern.pattern_data.get("boards_width") if pattern.pattern_data else None,
            boards_height=pattern.pattern_data.get("boards_height") if pattern.pattern_data else None,
            pattern_data=pattern.pattern_data
        )
        for pattern in patterns
    ]

@router.get("/patterns/{pattern_id}", response_model=PatternResponse)
def get_pattern(pattern_id: str, db: Session = Depends(get_db)):
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    return PatternResponse(
        id=pattern.id,
        uuid=pattern.uuid,
        pattern_image_url=pattern.pattern_data.get("sanity_pattern_image_url", "") if pattern.pattern_data else "",
        grid_size=pattern.grid_size,
        colors_used=pattern.colors_used,
        created_at=pattern.created_at,
        boards_width=pattern.pattern_data.get("boards_width") if pattern.pattern_data else None,
        boards_height=pattern.pattern_data.get("boards_height") if pattern.pattern_data else None,
        pattern_data=pattern.pattern_data
    )


class AIGenerationRequest(BaseModel):
    subject: str
    style: str = "pop-art"
    model: str = "flux-schnell"
    width: int = 1024
    height: int = 1024
    additional_details: str = ""
    boards_width: int = 1
    boards_height: int = 1
    auto_convert_to_pattern: bool = True

@router.post("/patterns/upload-with-style", response_model=PatternResponse)
async def upload_image_with_style(
    file: UploadFile = File(...),
    style: str = "wpap",
    boards_width: int = 1,
    boards_height: int = 1,
    model: str = "google/nano-banana",
    prompt_strength: float = 0.5,
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Upload an image and transform it to a specific artistic style using Replicate AI,
    then convert to a bead pattern.

    Args:
        file: The image file to upload
        style: Art style ("pop-art", "wpap", "geometric", "pixel-art", "cartoon")
        boards_width: Number of 29x29 boards in width (for pattern conversion)
        boards_height: Number of 29x29 boards in height (for pattern conversion)
        model: AI model to use ("sdxl-img2img", "flux-dev-img2img")
        prompt_strength: How much to transform the image (0.0-1.0, default: 0.5)
                        Lower values (0.3-0.5) preserve more of the original subject
                        Higher values (0.6-0.8) apply stronger artistic transformation

    Returns:
        PatternResponse with the styled and converted pattern
    """
    replicate_token = getattr(settings, 'REPLICATE_API_TOKEN', None)
    if not replicate_token:
        raise HTTPException(
            status_code=500,
            detail="REPLICATE_API_TOKEN not configured. Please set it in your .env file."
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_uuid = str(uuid.uuid4())
    content = await file.read()

    # Use temporary files for AI processing (required by Replicate API)
    temp_original = None
    temp_styled = None

    try:
        # Create temp file for original image
        suffix = Path(file.filename).suffix if file.filename else '.png'
        temp_original = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        temp_original.write(content)
        temp_original.close()

        # Create temp file path for styled output
        temp_styled = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        temp_styled.close()

        ai_service = AIGenerationService(api_token=replicate_token)

        _, transformation_metadata = await ai_service.transform_and_download(
            image_path=temp_original.name,
            save_path=temp_styled.name,
            style=style,
            model=model,
            prompt_strength=prompt_strength,
            optimize_for_beads=True
        )

        # Load styled image and process in memory
        styled_image = Image.open(temp_styled.name)
        if styled_image.mode != 'RGB':
            styled_image = styled_image.convert('RGB')

        # Convert styled image to base64 before processing
        styled_image_base64 = image_to_base64(styled_image)

        # Convert to pattern in memory
        pattern_image_base64, colors_used, pattern_data = convert_image_to_pattern_in_memory(
            styled_image,
            boards_width=boards_width,
            boards_height=boards_height,
            use_perle_colors=True,
            use_quantization=True,
            use_dithering=False,  # No dithering to avoid checkered patterns on solid colors
            enhance_contrast=1.1,
            use_advanced_preprocessing=False,  # We already styled the image
            use_nearest_neighbor=True  # Preserve sharp edges between color regions
        )

        grid_size = pattern_data["width"]
        created_at = datetime.utcnow()

        # Prepare pattern data with styling info (no file paths stored)
        full_pattern_data = {
            **pattern_data,
            "styled": True,
            "style": style,
            "ai_transformation": {
                "model": transformation_metadata["model"],
                "prompt": transformation_metadata["prompt"],
                "prompt_strength": transformation_metadata["prompt_strength"]
            }
        }

        return PatternResponse(
            uuid=file_uuid,
            pattern_image_url="",  # No file-based URL anymore
            grid_size=grid_size,
            colors_used=colors_used,
            created_at=created_at,
            boards_width=boards_width,
            boards_height=boards_height,
            pattern_data=full_pattern_data,
            pattern_image_base64=pattern_image_base64,
            styled_image_base64=styled_image_base64
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image with style: {str(e)}")

    finally:
        # Clean up temporary files
        if temp_original and Path(temp_original.name).exists():
            Path(temp_original.name).unlink()
        if temp_styled and Path(temp_styled.name).exists():
            Path(temp_styled.name).unlink()

@router.get("/patterns/{pattern_id}/pdf")
def download_pattern_pdf(pattern_id: str, db: Session = Depends(get_db)):
    """
    Generates and downloads a PDF with the bead pattern.
    Each page represents one 29x29 board with beads shown as colored circles
    containing the color code from perle-colors.json.
    """
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    if not pattern.pattern_data:
        raise HTTPException(status_code=400, detail="Pattern data not available for PDF generation")

    try:
        pdf_bytes = generate_pattern_pdf(
            pattern_data=pattern.pattern_data,
            colors_used=pattern.colors_used
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=perlemønster_{pattern_id}.pdf"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/patterns/{pattern_id}/image")
def get_pattern_image(pattern_id: str, db: Session = Depends(get_db)):
    """
    Serve the pattern image rendered from grid data.
    For database patterns, renders the image on-demand from the stored grid.
    """
    # Try to get pattern from database
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if pattern and pattern.pattern_data and "grid" in pattern.pattern_data:
        # Render from grid data
        image = render_grid_to_image(pattern.pattern_data["grid"], bead_size=20)
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        return Response(content=buffer.getvalue(), media_type="image/png")

    raise HTTPException(status_code=404, detail="Pattern image not found")

@router.get("/patterns/{pattern_id}/styled-image")
def get_styled_image(pattern_id: str, db: Session = Depends(get_db)):
    """
    Styled images are no longer stored on disk.
    Use the styled_image_base64 from the pattern response instead.
    """
    raise HTTPException(
        status_code=410,
        detail="Styled images are no longer served from files. Use styled_image_base64 from the pattern response."
    )

@router.delete("/patterns/{pattern_id}")
def delete_pattern(
    pattern_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Delete a pattern by UUID.
    Returns information about whether the pattern has an associated product.
    """
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    # Check if pattern has an associated product
    has_product = False
    sanity_product_id = None
    if pattern.pattern_data and "sanity_product_id" in pattern.pattern_data:
        has_product = True
        sanity_product_id = pattern.pattern_data["sanity_product_id"]

    # Delete pattern from database
    db.delete(pattern)
    db.commit()

    return {
        "success": True,
        "message": "Pattern deleted successfully",
        "has_product": has_product,
        "sanity_product_id": sanity_product_id
    }

class ColorUsed(BaseModel):
    hex: str
    name: str
    count: int
    code: Optional[str] = None

class UpdateGridRequest(BaseModel):
    grid: List[List[str]]
    colors_used: Optional[List[ColorUsed]] = None

@router.patch("/patterns/{pattern_id}/grid")
def update_pattern_grid(
    pattern_id: str,
    update_request: UpdateGridRequest,
    db: Session = Depends(get_db)
):
    """
    Update the grid data and optionally colors_used for a specific pattern.
    """
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    if not pattern.pattern_data:
        raise HTTPException(status_code=400, detail="Pattern has no pattern data")

    # Auto-detect storage version from grid content
    # If grid contains # characters, it's v1 hex format
    # Otherwise assume v2 code format
    sample_value = update_request.grid[0][0] if update_request.grid and update_request.grid[0] else ""
    storage_version = 1 if sample_value.startswith("#") else 2

    # Update the grid in pattern_data
    pattern.pattern_data["grid"] = update_request.grid
    pattern.pattern_data["storage_version"] = storage_version

    # Update colors_used if provided
    if update_request.colors_used is not None:
        pattern.colors_used = [color.model_dump() for color in update_request.colors_used]

    # Mark the pattern_data as modified (required for JSONB fields in SQLAlchemy)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(pattern, "pattern_data")

    db.commit()
    db.refresh(pattern)

    return {
        "success": True,
        "message": "Pattern grid updated successfully"
    }

@router.get("/patterns/{pattern_id}/render-grid")
def render_pattern_grid(pattern_id: str, bead_size: int = 10, db: Session = Depends(get_db)):
    """
    Renders the pattern grid to a base64 PNG image.
    Useful for generating up-to-date pattern images after grid modifications.

    Args:
        pattern_id: The pattern ID
        bead_size: Size of each bead in pixels (default: 10)

    Returns:
        JSON with base64 encoded PNG image
    """
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    if not pattern.pattern_data or "grid" not in pattern.pattern_data:
        raise HTTPException(status_code=400, detail="Pattern has no grid data")

    try:
        grid = pattern.pattern_data["grid"]
        storage_version = pattern.pattern_data.get("storage_version", 1)

        base64_image = render_grid_to_base64(
            grid,
            bead_size=bead_size,
            storage_version=storage_version
        )

        return {
            "pattern_image_base64": base64_image,
            "width": len(grid[0]) if grid else 0,
            "height": len(grid),
            "bead_size": bead_size,
            "storage_version": storage_version
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rendering grid: {str(e)}")

@router.get("/perle-colors")
def get_perle_colors():
    """
    Returns the list of available perle colors from perle-colors.json
    """
    colors_file = Path(__file__).parent.parent / "data" / "perle-colors.json"

    if not colors_file.exists():
        raise HTTPException(status_code=404, detail="Perle colors file not found")

    try:
        with open(colors_file, "r", encoding="utf-8") as f:
            colors = json.load(f)
        return colors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading perle colors: {str(e)}")


@router.post("/admin/refresh-color-cache")
def refresh_color_cache(admin: AdminUser = Depends(get_current_admin)):
    """
    Admin endpoint to refresh the color cache.
    Use this after updating perle-colors.json to load new hex values.
    """
    try:
        clear_color_cache()
        from app.services.color_service import get_perle_colors as load_colors
        colors = load_colors(force_reload=True)
        return {
            "success": True,
            "message": "Color cache refreshed successfully",
            "colors_loaded": len(colors)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing color cache: {str(e)}")
