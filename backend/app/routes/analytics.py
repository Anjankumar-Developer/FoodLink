from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import donation as donation_model, match as match_model, shelter as shelter_model, restaurant as restaurant_model

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/overview", response_model=Dict[str, Any])
def get_analytics_overview(db: Session = Depends(get_db)):
    total_donations = db.query(donation_model.Donation).count()
    total_matches = db.query(match_model.Match).count()
    total_shelters = db.query(shelter_model.Shelter).count()
    total_restaurants = db.query(restaurant_model.Restaurant).count()

    return {
        "total_donations": total_donations,
        "total_matches": total_matches,
        "total_shelters": total_shelters,
        "total_restaurants": total_restaurants,
    }

@router.get("/impact", response_model=Dict[str, Any])
def get_analytics_impact(db: Session = Depends(get_db)):
    # For simplicity, we'll calculate the total quantity of donations (assuming quantity is numeric and in some unit)
    # Since we stored quantity as string, we'll try to convert to float, but for now we'll return a placeholder.
    # In a real scenario, we would have a numeric field for quantity.
    total_food_rescued = 0  # Placeholder

    # Count of successful matches (status = accepted or completed)
    successful_matches = db.query(match_model.Match).filter(match_model.Match.status.in_(["accepted", "completed"])).count()

    return {
        "total_food_rescued": total_food_rescued,  # in kg or units
        "successful_matches": successful_matches,
    }