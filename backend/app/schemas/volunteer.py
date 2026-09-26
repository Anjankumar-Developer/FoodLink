from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)