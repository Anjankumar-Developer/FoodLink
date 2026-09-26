from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Pickup(Base):
    __tablename__ = "pickups"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    pickup_time = Column(DateTime(timezone=True))
    delivery_time = Column(DateTime(timezone=True))
    status = Column(String, default="scheduled")  # e.g., scheduled, in_progress, completed
    pickup_qr = Column(String)
    delivery_qr = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())