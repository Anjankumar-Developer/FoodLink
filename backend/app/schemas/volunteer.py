from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VolunteerBase(BaseModel):
    name: str
    vehicle_type: Optional[str] = None
    availability: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None

class VolunteerCreate(VolunteerBase):
    pass

class Volunteer(VolunteerBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True