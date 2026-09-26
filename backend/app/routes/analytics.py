from datetime import datetime
import re
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import donation as donation_model
from ..models import match as match_model
from ..models import rescue as rescue_model
from ..models import restaurant as restaurant_model
from ..models import shelter as shelter_model
from ..models import volunteer as volunteer_model

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)


def _quantity_value(quantity: str) -> int:
    match = re.search(r"[\d.]+", quantity or "")
    return round(float(match.group())) if match else 0


def _naive(value):
    return value.replace(tzinfo=None) if value and value.tzinfo else value


@router.get("/overview", response_model=Dict[str, Any])
def get_analytics_overview(db: Session = Depends(get_db)):
    donations = db.query(donation_model.Donation).all()
    matches = db.query(match_model.Match).all()
    rescues = db.query(rescue_model.Rescue).all()
    now = datetime.utcnow()
    at_risk = sum(
        1 for donation in donations
        if donation.expires_at
        and 0 < (_naive(donation.expires_at) - now).total_seconds() <= 2 * 3600
    )
    expired = sum(
        1 for donation in donations
        if donation.expires_at and _naive(donation.expires_at) <= now
    )
    completed = [rescue for rescue in rescues if rescue.status == "COMPLETED"]
    active_statuses = {
        "APPROVED", "VOLUNTEER_ASSIGNED", "PICKUP_PENDING",
        "PICKED_UP", "DELIVERY_PENDING", "DELIVERED",
    }
    scores = [match.final_score for match in matches if match.final_score is not None]
    distances = [match.distance_km for match in matches if match.distance_km is not None]
    rescue_times = [
        (_naive(rescue.completed_at) - _naive(rescue.created_at)).total_seconds() / 60
        for rescue in completed
        if rescue.completed_at and rescue.created_at
    ]
    volunteers = db.query(volunteer_model.Volunteer).all()
    available_volunteers = sum(
        1 for volunteer in volunteers
        if not any(
            word in (volunteer.availability or "").lower()
            for word in ("off", "unavailable", "busy")
        )
    )
    active_recipients = sum(
        1 for recipient in db.query(shelter_model.Shelter).all()
        if (recipient.current_demand or 0) > 0
    )

    return {
        "total_donations": len(donations),
        "total_matches": len(matches),
        "total_shelters": db.query(shelter_model.Shelter).count(),
        "total_restaurants": db.query(restaurant_model.Restaurant).count(),
        "meals_rescued": sum(
            _quantity_value(donation.quantity)
            for donation in donations
            if donation.status == "completed"
        ),
        "successful_rescues": len(completed),
        "at_risk_donations": at_risk,
        "expired_donations": expired,
        "active_rescues": sum(1 for rescue in rescues if rescue.status in active_statuses),
        "available_volunteers": available_volunteers,
        "active_recipients": active_recipients,
        "average_match_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "average_rescue_distance_km": round(sum(distances) / len(distances), 2) if distances else 0,
        "average_rescue_time_minutes": round(sum(rescue_times) / len(rescue_times), 2) if rescue_times else 0,
        "rescue_success_rate": round((len(completed) / len(rescues)) * 100, 2) if rescues else 0,
    }


@router.get("/impact", response_model=Dict[str, Any])
def get_analytics_impact(db: Session = Depends(get_db)):
    completed_donations = db.query(donation_model.Donation).filter(
        donation_model.Donation.status == "completed"
    ).all()
    completed_rescues = db.query(rescue_model.Rescue).filter(
        rescue_model.Rescue.status == "COMPLETED"
    ).all()
    completed_match_ids = [rescue.match_id for rescue in completed_rescues]
    distances = [
        match.distance_km
        for match in db.query(match_model.Match).filter(
            match_model.Match.id.in_(completed_match_ids or [-1])
        ).all()
        if match.distance_km is not None
    ]
    meals = sum(_quantity_value(donation.quantity) for donation in completed_donations)

    return {
        "estimated_meals_rescued": meals,
        "estimated_food_diverted_kg": round(meals * 0.45, 2),
        "estimated_rescue_distance_km": round(sum(distances), 2),
        "estimated_successful_rescues": len(completed_rescues),
        "estimate_note": "Estimated impact based on recorded quantities and a 0.45 kg per meal planning factor; not a scientific measurement.",
    }
