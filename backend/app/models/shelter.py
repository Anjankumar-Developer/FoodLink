from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    latitude = Column(String)
    longitude = Column(String)
    capacity = Column(Integer)
    current_demand = Column(Integer, default=0)
    accepted_food_types = Column(String)  # Could be a list, but we'll store as string
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())