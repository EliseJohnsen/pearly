from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AIStyleBase(BaseModel):
    """Base schema for AI generation style"""
    code: str = Field(..., min_length=1, max_length=50, description="Unique style code (e.g., 'wpap')")
    name: str = Field(..., min_length=1, max_length=100, description="Display name for users")
    description: str = Field(..., min_length=1, description="User-facing description of the style")
    style_prompt: str = Field(..., min_length=1, description="AI prompt for generating this style")
    negative_prompt: str = Field(..., min_length=1, description="AI negative prompt (what to avoid)")
    is_active: bool = Field(default=True, description="Whether this style is available for use")
    sort_order: int = Field(default=0, description="Sort order for displaying styles (lower = first)")


class AIStyleCreate(AIStyleBase):
    """Schema for creating a new AI style"""
    pass


class AIStyleUpdate(BaseModel):
    """Schema for updating an existing AI style"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    style_prompt: Optional[str] = Field(None, min_length=1)
    negative_prompt: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class AIStyleResponse(AIStyleBase):
    """Schema for AI style responses (full details)"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIStylePublic(BaseModel):
    """Public-facing schema for end users (limited fields)"""
    code: str
    name: str
    description: str
    sort_order: int

    class Config:
        from_attributes = True
