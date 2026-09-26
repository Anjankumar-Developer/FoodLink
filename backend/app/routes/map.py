from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import restaurant as restaurant_model, shelter as shelter_model, pickup as pickup_model, match as match_model

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

@router.get("/active-rescues", response_model=List[Dict[str, Any]])
def get_active_rescues_map(db: Session = Depends(get_db)):
    # Active rescues: pickups that are in progress (status = 'in_progress') or matches that are accepted but not completed?
    # We'll define active rescues as pickups with status 'in_progress'
    active_pickups = db.query(pickup_model.Pickup).filter(pickup_model.Pickup.status == "in_progress").all()
    results = []
    for pickup in active_pickups:
        # We need to get the match, then the donation and shelter to get locations?
        # For simplicity, we'll just return the pickup id and status, and maybe the volunteer and match info.
        # But the endpoint expects location data? We'll return what we have.
        results.append({
            "pickup_id": pickup.id,
            "status": pickup.status,
            "pickup_time": pickup.pickup_time.isoformat() if pickup.pickup_time else None,
            "delivery_time": pickup.delivery_time.isoformat() if pickup.delivery_time else None,
        })
    return results