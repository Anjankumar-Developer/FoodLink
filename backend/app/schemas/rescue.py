from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class VolunteerAssignment(BaseModel):
    volunteer_id: Optional[int] = None


class RescueResponse(BaseModel):
    id: int
    donation_id: int
    match_id: int
    volunteer_id: Optional[int]
    status: str
    pickup_token: Optional[str]
    delivery_token: Optional[str]
    failure_reason: Optional[str]
    timeline: Dict[str, datetime]
    candidates: Optional[List[Dict[str, Any]]] = None
