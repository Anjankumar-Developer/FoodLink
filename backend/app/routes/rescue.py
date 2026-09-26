import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.rescue import Rescue
from ..models.donation import Donation
from ..models.match import Match
from ..models.pickup import Pickup
from ..schemas.rescue import VolunteerAssignment
from ..services.rescue_service import (
    serialize,
    start_rescue,
    transition,
    volunteer_candidates,
)

router = APIRouter(prefix="/api/rescue", tags=["rescue"])


def get_rescue(rescue_id: int, db: Session) -> Rescue:
    rescue = db.query(Rescue).filter(Rescue.id == rescue_id).first()
    if not rescue:
        raise HTTPException(status_code=404, detail="Rescue not found")
    return rescue


@router.post("/start/{donation_id}")
def start(donation_id: int, db: Session = Depends(get_db)):
    rescue = start_rescue(db, donation_id)
    return serialize(rescue)


@router.get("/{rescue_id}")
def read(rescue_id: int, db: Session = Depends(get_db)):
    return serialize(get_rescue(rescue_id, db))


@router.post("/{rescue_id}/approve")
def approve(rescue_id: int, db: Session = Depends(get_db)):
    rescue = transition(get_rescue(rescue_id, db), "APPROVED", db)
    db.query(Match).filter(Match.id == rescue.match_id).update({"status": "approved"})
    db.query(Donation).filter(Donation.id == rescue.donation_id).update({"status": "approved"})
    db.commit()
    return serialize(rescue)


@router.post("/{rescue_id}/assign-volunteer")
def assign(rescue_id: int, assignment: VolunteerAssignment = VolunteerAssignment(), db: Session = Depends(get_db)):
    rescue = get_rescue(rescue_id, db)
    donation_record = db.query(Donation).filter(Donation.id == rescue.donation_id).first()
    candidates = volunteer_candidates(db, donation_record)
    if not candidates:
        raise HTTPException(status_code=409, detail="No feasible volunteer is available")
    selected = next((item for item in candidates if item["volunteer_id"] == assignment.volunteer_id), candidates[0])
    if assignment.volunteer_id and selected["volunteer_id"] != assignment.volunteer_id:
        raise HTTPException(status_code=409, detail="Requested volunteer is not feasible")
    rescue = transition(rescue, "VOLUNTEER_ASSIGNED", db)
    rescue.volunteer_id = selected["volunteer_id"]
    db.commit()
    db.refresh(rescue)
    rescue = transition(rescue, "PICKUP_PENDING", db)
    pickup_record = db.query(Pickup).filter(Pickup.match_id == rescue.match_id).first()
    if not pickup_record:
        pickup_record = Pickup(match_id=rescue.match_id, volunteer_id=rescue.volunteer_id, status="scheduled")
        db.add(pickup_record)
        db.commit()
    return serialize(rescue, candidates)


@router.post("/{rescue_id}/pickup")
def pickup(rescue_id: int, db: Session = Depends(get_db)):
    rescue = get_rescue(rescue_id, db)
    rescue = transition(rescue, "PICKED_UP", db)
    rescue.pickup_token = f"pickup_{rescue.id}_{secrets.token_urlsafe(12)}"
    pickup_record = db.query(Pickup).filter(Pickup.match_id == rescue.match_id).first()
    if pickup_record:
        pickup_record.pickup_time = rescue.pickup_at
        pickup_record.pickup_qr = rescue.pickup_token
        pickup_record.status = "in_progress"
    db.commit()
    db.refresh(rescue)
    rescue = transition(rescue, "DELIVERY_PENDING", db)
    return serialize(rescue)


@router.post("/{rescue_id}/delivery")
def delivery(rescue_id: int, db: Session = Depends(get_db)):
    rescue = transition(get_rescue(rescue_id, db), "DELIVERED", db)
    rescue.delivery_token = f"delivery_{rescue.id}_{secrets.token_urlsafe(12)}"
    pickup_record = db.query(Pickup).filter(Pickup.match_id == rescue.match_id).first()
    if pickup_record:
        pickup_record.delivery_time = rescue.delivery_at
        pickup_record.delivery_qr = rescue.delivery_token
        pickup_record.status = "completed"
    db.commit()
    db.refresh(rescue)
    return serialize(rescue)


@router.post("/{rescue_id}/complete")
def complete(rescue_id: int, db: Session = Depends(get_db)):
    rescue = transition(get_rescue(rescue_id, db), "COMPLETED", db)
    db.query(Match).filter(Match.id == rescue.match_id).update({"status": "completed"})
    db.query(Donation).filter(Donation.id == rescue.donation_id).update({"status": "completed"})
    db.commit()
    return serialize(rescue)


@router.post("/{rescue_id}/reject")
def reject(rescue_id: int, db: Session = Depends(get_db)):
    return serialize(transition(get_rescue(rescue_id, db), "REJECTED", db, "Rejected by human coordinator"))


@router.post("/{rescue_id}/cancel")
def cancel(rescue_id: int, db: Session = Depends(get_db)):
    return serialize(transition(get_rescue(rescue_id, db), "CANCELLED", db, "Cancelled by human coordinator"))
