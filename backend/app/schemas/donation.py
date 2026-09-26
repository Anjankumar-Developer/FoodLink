from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DonationBase(BaseModel):
    restaurant_id: int
    food_name: str
    food_category: str
    description: Optional[str] = None
    quantity: str
    diet_type: Optional[str] = None
    prepared_at: datetime
    expires_at: datetime
    storage_condition: Optional[str] = None
    status: Optional[str] = "available"

class DonationCreate(DonationBase):
    pass

class Donation(DonationBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True