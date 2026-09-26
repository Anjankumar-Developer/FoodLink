from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PickupBase(BaseModel):
    match_id: int
    volunteer_id: int
    pickup_time: Optional[datetime] = None
    delivery_time: Optional[datetime] = None
    status: Optional[str] = "scheduled"
    pickup_qr: Optional[str] = None
    delivery_qr: Optional[str] = None


class PickupCreate(PickupBase):
    pass


class Pickup(PickupBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)