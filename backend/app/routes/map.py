from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import (
    donation as donation_model,
    match as match_model,
    rescue as rescue_model,
    restaurant as restaurant_model,
    shelter as shelter_model,
    volunteer as volunteer_model,
)

router = APIRouter(
    prefix="/api/map",
    tags=["maps"],
    responses={404: {"description": "Not found"}},
)

@router.get("/restaurants", response_model=List[Dict[str, Any]])
def get_restaurants_map(db: Session = Depends(get_db)):
    restaurants = db.query(restaurant_model.Restaurant.id, restaurant_model.Restaurant.name, restaurant_model.Restaurant.latitude, restaurant_model.Restaurant.longitude).all()
    return [{"id": r.id, "name": r.name, "latitude": r.latitude, "longitude": r.longitude} for r in restaurants]

@router.get("/shelters", response_model=List[Dict[str, Any]])
def get_shelters_map(db: Session = Depends(get_db)):
    shelters = db.query(shelter_model.Shelter.id, shelter_model.Shelter.name, shelter_model.Shelter.latitude, shelter_model.Shelter.longitude).all()
    return [{"id": s.id, "name": s.name, "latitude": s.latitude, "longitude": s.longitude} for s in shelters]


@router.get("/recipients", response_model=List[Dict[str, Any]])
def get_recipients_map(db: Session = Depends(get_db)):
    return get_shelters_map(db)

@router.get("/active-rescues", response_model=List[Dict[str, Any]])
def get_active_rescues_map(db: Session = Depends(get_db)):
    active_statuses = [
        "APPROVED", "VOLUNTEER_ASSIGNED", "PICKUP_PENDING",
        "PICKED_UP", "DELIVERY_PENDING", "DELIVERED",
    ]
    active_rescues = (
        db.query(rescue_model.Rescue)
        .filter(rescue_model.Rescue.status.in_(active_statuses))
        .all()
    )
    results = []
    for rescue in active_rescues:
        match = db.query(match_model.Match).filter(match_model.Match.id == rescue.match_id).first()
        donation = db.query(donation_model.Donation).filter(donation_model.Donation.id == rescue.donation_id).first()
        recipient = db.query(shelter_model.Shelter).filter(shelter_model.Shelter.id == match.shelter_id).first() if match else None
        restaurant = db.query(restaurant_model.Restaurant).filter(restaurant_model.Restaurant.id == donation.restaurant_id).first() if donation else None
        volunteer = db.query(volunteer_model.Volunteer).filter(volunteer_model.Volunteer.id == rescue.volunteer_id).first() if rescue.volunteer_id else None
        results.append({
            "rescue_id": rescue.id,
            "donation_id": rescue.donation_id,
            "status": rescue.status,
            "restaurant": {
                "name": restaurant.name if restaurant else None,
                "latitude": restaurant.latitude if restaurant else None,
                "longitude": restaurant.longitude if restaurant else None,
            },
            "volunteer": {
                "id": volunteer.id if volunteer else None,
                "name": volunteer.name if volunteer else None,
                "latitude": volunteer.latitude if volunteer else None,
                "longitude": volunteer.longitude if volunteer else None,
            },
            "recipient": {
                "id": recipient.id if recipient else None,
                "name": recipient.name if recipient else None,
                "latitude": recipient.latitude if recipient else None,
                "longitude": recipient.longitude if recipient else None,
            },
            "distance_km": match.distance_km if match else None,
            "eta_minutes": match.travel_minutes if match else None,
            "expires_at": donation.expires_at.isoformat() if donation and donation.expires_at else None,
        })
    return results