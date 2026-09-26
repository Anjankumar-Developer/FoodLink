from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    food_name = Column(String)
    food_category = Column(String)
    quantity = Column(String)  # Could be a numeric value, but we'll store as string for flexibility
    diet_type = Column(String)
    prepared_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    storage_condition = Column(String)
    status = Column(String, default="available")  # e.g., available, matched, picked up, delivered
    created_at = Column(DateTime(timezone=True), server_default=func.now())