from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShelterBase(BaseModel):
    name: str
    address: str
    latitude: str
    longitude: str
    capacity: int
    current_demand: Optional[int] = 0
    accepted_food_types: Optional[str] = None
    verified: Optional[bool] = False

class ShelterCreate(ShelterBase):
    pass

class Shelter(ShelterBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True