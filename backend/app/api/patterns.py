from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.pattern import Pattern
from app.schemas.pattern import PatternResponse
from app.services.image_processing import (
    convert_image_to_pattern_from_file,
    suggest_board_dimensions_from_file,
)
from app.services.ai_generation import AIGenerationService
from app.services.pdf_generator import generate_pattern_pdf
from app.core.config import settings
from pathlib import Path
import uuid
import base64
import json
from datetime import datetime, timedelta

router = APIRouter()

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/patterns/suggest-boards")
async def suggest_boards(file: UploadFile = File(...)):
    """
    Analyzes an image and suggests optimal board dimensions.
    Returns suggested boards_width and boards_height.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save temporary file
    temp_uuid = str(uuid.uuid4())
    temp_path = UPLOAD_DIR / f"{temp_uuid}_temp{Path(file.filename).suffix}"

    try:
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        suggestion = suggest_board_dimensions_from_file(str(temp_path))

        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
    finally:
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()

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
    original_path = UPLOAD_DIR / f"{file_uuid}_original{Path(file.filename).suffix}"
    pattern_path = UPLOAD_DIR / f"{file_uuid}_pattern.png"

    with open(original_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        output_path, colors_used, pattern_data = convert_image_to_pattern_from_file(
            str(original_path),
            str(pattern_path),
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

    # Read pattern image and encode as base64
    with open(pattern_path, "rb") as f:
        pattern_image_base64 = base64.b64encode(f.read()).decode('utf-8')

    # Read styled image if it exists
    styled_image_base64 = None
    if pattern_data.get("styled") and "styled_image_path" in pattern_data:
        styled_path = Path(pattern_data["styled_image_path"])
        if styled_path.exists():
            with open(styled_path, "rb") as f:
                styled_image_base64 = base64.b64encode(f.read()).decode('utf-8')

    return PatternResponse(
        uuid=file_uuid,
        pattern_image_url=f"/api/patterns/{file_uuid}/image",
        grid_size=grid_size,
        colors_used=colors_used,
        created_at=created_at,
        boards_width=boards_width,
        boards_height=boards_height,
        pattern_data=pattern_data,
        pattern_image_base64=pattern_image_base64,
        styled_image_base64=styled_image_base64
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
    original_path = UPLOAD_DIR / f"{file_uuid}_original{Path(file.filename).suffix}"
    styled_path = UPLOAD_DIR / f"{file_uuid}_styled.png"
    pattern_path = UPLOAD_DIR / f"{file_uuid}_pattern.png"

    with open(original_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        ai_service = AIGenerationService(api_token=replicate_token)

        _, transformation_metadata = await ai_service.transform_and_download(
            image_path=str(original_path),
            save_path=str(styled_path),
            style=style,
            model=model,
            prompt_strength=prompt_strength,
            optimize_for_beads=True
        )

        output_path, colors_used, pattern_data = convert_image_to_pattern_from_file(
            str(styled_path),
            str(pattern_path),
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

        # Create timestamp since we're not saving to DB yet
        created_at = datetime.utcnow()

        # Prepare pattern data with styling info
        full_pattern_data = {
            **pattern_data,
            "styled": True,
            "style": style,
            "styled_image_path": str(styled_path),
            "ai_transformation": {
                "model": transformation_metadata["model"],
                "prompt": transformation_metadata["prompt"],
                "prompt_strength": transformation_metadata["prompt_strength"]
            }
        }

        # Read pattern image and encode as base64
        with open(pattern_path, "rb") as f:
            pattern_image_base64 = base64.b64encode(f.read()).decode('utf-8')

        # Read styled image and encode as base64
        styled_image_base64 = None
        if styled_path.exists():
            with open(styled_path, "rb") as f:
                styled_image_base64 = base64.b64encode(f.read()).decode('utf-8')

        return PatternResponse(
            uuid=file_uuid,
            pattern_image_url=f"/api/patterns/{file_uuid}/image",
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
    Serve the pattern image file from the uploads directory.
    """
    pattern_path = UPLOAD_DIR / f"{pattern_id}_pattern.png"

    if not pattern_path.exists():
        raise HTTPException(status_code=404, detail="Pattern image file not found")

    with open(pattern_path, "rb") as f:
        image_data = f.read()

    return Response(content=image_data, media_type="image/png")

@router.get("/patterns/{pattern_id}/styled-image")
def get_styled_image(pattern_uuid: str, db: Session = Depends(get_db)):
    """
    Serve the styled image file from the uploads directory.
    """
    styled_path = UPLOAD_DIR / f"{pattern_uuid}_styled.png"

    if not styled_path.exists():
        raise HTTPException(status_code=404, detail="Styled image file not found")

    with open(styled_path, "rb") as f:
        image_data = f.read()

    return Response(content=image_data, media_type="image/png")

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

class UpdateGridRequest(BaseModel):
    grid: List[List[str]]

@router.patch("/patterns/{pattern_id}/grid")
def update_pattern_grid(
    pattern_id: str,
    update_request: UpdateGridRequest,
    db: Session = Depends(get_db)
):
    """
    Update the grid data for a specific pattern.
    """
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    if not pattern.pattern_data:
        raise HTTPException(status_code=400, detail="Pattern has no pattern data")

    # Update the grid in pattern_data
    pattern.pattern_data["grid"] = update_request.grid

    # Mark the pattern_data as modified (required for JSONB fields in SQLAlchemy)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(pattern, "pattern_data")

    db.commit()
    db.refresh(pattern)

    return {
        "success": True,
        "message": "Pattern grid updated successfully"
    }

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
