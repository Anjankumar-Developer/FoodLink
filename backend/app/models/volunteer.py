from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    vehicle_type = Column(String)
    availability = Column(String)  # Could be a schedule, but we'll store as string for simplicity
    latitude = Column(String)
    longitude = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())