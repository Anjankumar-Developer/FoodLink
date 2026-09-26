from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MatchBase(BaseModel):
    donation_id: int
    shelter_id: int
    distance_km: Optional[float] = None
    travel_minutes: Optional[int] = None
    compatibility_score: Optional[float] = None
    urgency_score: Optional[float] = None
    capacity_score: Optional[float] = None
    pickup_score: Optional[float] = None
    demand_score: Optional[float] = None
    final_score: Optional[float] = None
    status: Optional[str] = "pending"
    explanation: Optional[str] = None

class MatchCreate(MatchBase):
    pass

class Match(MatchBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True