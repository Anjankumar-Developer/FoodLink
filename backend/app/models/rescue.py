from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from ..database import Base


class Rescue(Base):
    __tablename__ = "rescues"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True)
    status = Column(String, nullable=False, default="AWAITING_APPROVAL", index=True)
    pickup_token = Column(String, nullable=True)
    delivery_token = Column(String, nullable=True)
    failure_reason = Column(String, nullable=True)
    timeline_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    matched_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    volunteer_assigned_at = Column(DateTime(timezone=True), nullable=True)
    pickup_at = Column(DateTime(timezone=True), nullable=True)
    delivery_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)