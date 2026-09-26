from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    latitude = Column(String)
    longitude = Column(String)
    rating = Column(String)  # Assuming string for simplicity, could be float
    price_level = Column(String)
    cuisine = Column(String)
    food_categories = Column(String)  # Could be a list, but we'll store as string for simplicity
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())