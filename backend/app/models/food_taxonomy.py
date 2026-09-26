from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class FoodTaxonomy(Base):
    __tablename__ = "food_taxonomy"

    id = Column(Integer, primary_key=True, index=True)
    food_type_id = Column(String, unique=True, index=True)
    food_category = Column(String)
    description = Column(String)
    possible_diet_types = Column(String)  # Stored as pipe-separated string
    default_urgency = Column(String)  # low, medium, high
    typical_shelf_life = Column(String)  # e.g., "2-8 hours"
    created_at = Column(DateTime(timezone=True), server_default=func.now())