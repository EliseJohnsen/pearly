from pydantic import BaseModel, Field, field_validator
import re


class ColorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    code: str = Field(..., min_length=1, max_length=10)
    hex: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator('hex')
    @classmethod
    def validate_hex_format(cls, v: str) -> str:
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Hex must be format #RRGGBB (e.g., #FF0000)')
        return v.upper()

    @field_validator('code')
    @classmethod
    def validate_code_format(cls, v: str) -> str:
        if not re.match(r'^[A-Za-z0-9]{1,10}$', v):
            raise ValueError('Code must be 1-10 alphanumeric characters')
        return v


class ColorCreate(ColorBase):
    pass


class ColorUpdate(ColorBase):
    pass


class ColorResponse(ColorBase):
    pass
