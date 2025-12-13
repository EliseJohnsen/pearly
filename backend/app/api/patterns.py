from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pattern import Pattern
from app.schemas.pattern import PatternResponse
from app.services.image_processing import convert_image_to_pattern_from_file, suggest_board_dimensions_from_file
from pathlib import Path
import uuid
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
    # Advanced preprocessing parameters
    use_advanced_preprocessing: bool = False,
    remove_bg: bool = False,
    enhance_colors: bool = True,
    color_boost: float = 1.5,
    contrast_boost: float = 1.3,
    brightness_boost: float = 1.0,
    simplify_details: bool = True,
    simplification_method: str = "bilateral",
    simplification_strength: str = "medium",
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
            use_advanced_preprocessing=use_advanced_preprocessing,
            remove_bg=remove_bg,
            enhance_colors=enhance_colors,
            color_boost=color_boost,
            contrast_boost=contrast_boost,
            brightness_boost=brightness_boost,
            simplify_details=simplify_details,
            simplification_method=simplification_method,
            simplification_strength=simplification_strength
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    # Calculate total grid size for backwards compatibility
    grid_size = pattern_data["width"]

    pattern = Pattern(
        uuid=file_uuid,
        original_image_path=str(original_path),
        pattern_image_path=str(pattern_path),
        pattern_data=pattern_data,
        grid_size=grid_size,
        colors_used=colors_used,
        is_paid=False,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )

    db.add(pattern)
    db.commit()
    db.refresh(pattern)

    return PatternResponse(
        uuid=pattern.uuid,
        pattern_image_url=f"/api/patterns/{pattern.uuid}/image",
        grid_size=pattern.grid_size,
        colors_used=pattern.colors_used,
        is_paid=pattern.is_paid,
        created_at=pattern.created_at,
        boards_width=boards_width,
        boards_height=boards_height,
        pattern_data=pattern.pattern_data
    )

@router.get("/patterns/{pattern_uuid}", response_model=PatternResponse)
def get_pattern(pattern_uuid: str, db: Session = Depends(get_db)):
    pattern = db.query(Pattern).filter(Pattern.uuid == pattern_uuid).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    return PatternResponse(
        uuid=pattern.uuid,
        pattern_image_url=f"/api/patterns/{pattern.uuid}/image",
        grid_size=pattern.grid_size,
        colors_used=pattern.colors_used,
        is_paid=pattern.is_paid,
        created_at=pattern.created_at,
        boards_width=pattern.pattern_data.get("boards_width") if pattern.pattern_data else None,
        boards_height=pattern.pattern_data.get("boards_height") if pattern.pattern_data else None,
        pattern_data=pattern.pattern_data
    )

@router.get("/patterns/{pattern_uuid}/image")
def get_pattern_image(pattern_uuid: str, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse

    pattern = db.query(Pattern).filter(Pattern.uuid == pattern_uuid).first()

    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    if not Path(pattern.pattern_image_path).exists():
        raise HTTPException(status_code=404, detail="Pattern image not found")

    return FileResponse(pattern.pattern_image_path)
