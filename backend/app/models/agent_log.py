from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from ..database import Base

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)  # Serves as agent_id
    donation_id = Column(Integer, ForeignKey("donations.id"))
    agent_name = Column(String)
    action = Column(String)
    input_summary = Column(String)  # Summary of input data provided to the agent
    output_summary = Column(String)  # Summary of output/decision from the agent
    status = Column(String)
    execution_time_ms = Column(BigInteger)  # Execution time in milliseconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())