from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class PatternBase(BaseModel):
    grid_size: Optional[int] = 29

class PatternCreate(PatternBase):
    pass

class BeadColor(BaseModel):
    hex: str
    name: str
    count: int

class PatternResponse(BaseModel):
    id: int
    uuid: str
    pattern_image_url: str
    grid_size: int
    colors_used: List[Dict[str, Any]]
    created_at: datetime
    boards_width: Optional[int] = None
    boards_height: Optional[int] = None
    pattern_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class PatternGenerateResponse(BaseModel):
    """Response for pattern generation without persistence - used for product creation"""
    pattern_image_base64: str
    styled_image_base64: Optional[str] = None
    grid_size: int
    colors_used: List[Dict[str, Any]]
    boards_width: int
    boards_height: int
    pattern_data: Dict[str, Any]
