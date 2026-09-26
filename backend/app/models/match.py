from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"))
    shelter_id = Column(Integer, ForeignKey("shelters.id"))
    distance_km = Column(Float)
    travel_minutes = Column(Integer)
    compatibility_score = Column(Float)
    urgency_score = Column(Float)
    capacity_score = Column(Float)
    pickup_score = Column(Float)
    demand_score = Column(Float)
    final_score = Column(Float)
    status = Column(String, default="pending")  # e.g., pending, accepted, rejected
    explanation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())