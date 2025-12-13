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
    uuid: str
    pattern_image_url: str
    grid_size: int
    colors_used: List[Dict[str, Any]]
    is_paid: bool
    created_at: datetime
    boards_width: Optional[int] = None
    boards_height: Optional[int] = None
    pattern_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
