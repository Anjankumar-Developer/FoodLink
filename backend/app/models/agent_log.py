from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"))
    agent_name = Column(String)
    action = Column(String)
    reasoning = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())