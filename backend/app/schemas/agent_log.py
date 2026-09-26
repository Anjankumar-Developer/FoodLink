from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AgentLogBase(BaseModel):
    donation_id: Optional[int] = None
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

    model_config = ConfigDict(from_attributes=True)