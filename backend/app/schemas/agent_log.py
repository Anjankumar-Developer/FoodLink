from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AgentLogBase(BaseModel):
    donation_id: int
    agent_name: str
    action: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    status: Optional[str] = None
    execution_time_ms: Optional[int] = None

class AgentLogCreate(AgentLogBase):
    pass

class AgentLog(AgentLogBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True