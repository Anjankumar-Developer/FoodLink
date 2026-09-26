import json
import math
import re
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.donation import Donation
from ..models.match import Match
from ..models.rescue import Rescue
from ..models.volunteer import Volunteer


STATES = {
    "MATCHED",
    "AWAITING_APPROVAL",
    "APPROVED",
    "VOLUNTEER_ASSIGNED",
    "PICKUP_PENDING",
    "PICKED_UP",
    "DELIVERY_PENDING",
    "DELIVERED",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
    "EXPIRED",
    "FAILED",
}

TRANSITIONS = {
    "MATCHED": {"AWAITING_APPROVAL", "REJECTED", "CANCELLED", "EXPIRED", "FAILED"},
    "AWAITING_APPROVAL": {"APPROVED", "REJECTED", "CANCELLED", "EXPIRED", "FAILED"},
    "APPROVED": {"VOLUNTEER_ASSIGNED", "CANCELLED", "FAILED"},
    "VOLUNTEER_ASSIGNED": {"PICKUP_PENDING", "CANCELLED", "FAILED"},
    "PICKUP_PENDING": {"PICKED_UP", "CANCELLED", "EXPIRED", "FAILED"},
    "PICKED_UP": {"DELIVERY_PENDING", "FAILED"},
    "DELIVERY_PENDING": {"DELIVERED", "FAILED"},
    "DELIVERED": {"COMPLETED", "FAILED"},
    "COMPLETED": set(),
    "REJECTED": set(),
    "CANCELLED": set(),
    "EXPIRED": set(),
    "FAILED": set(),
}

TIMELINE_FIELDS = {
    "MATCHED": "matched",
    "AWAITING_APPROVAL": "matched",
    "APPROVED": "approved",
    "VOLUNTEER_ASSIGNED": "volunteer_assigned",
    "PICKUP_PENDING": "volunteer_assigned",
    "PICKED_UP": "pickup",
    "DELIVERY_PENDING": "pickup",
    "DELIVERED": "delivery",
    "COMPLETED": "completed",
}


def now() -> datetime:
    return datetime.now(timezone.utc)


def is_expired(expires_at: Optional[datetime]) -> bool:
    if not expires_at:
        return False
    if expires_at.tzinfo is None:
        return expires_at <= now().replace(tzinfo=None)
    return expires_at <= now()


def _timeline(rescue: Rescue) -> Dict[str, datetime]:
    return json.loads(rescue.timeline_json or "{}")


def _set_timeline(rescue: Rescue, key: str, timestamp: datetime) -> None:
    timeline = _timeline(rescue)
    timeline[key] = timestamp.isoformat()
    rescue.timeline_json = json.dumps(timeline)


def transition(rescue: Rescue, target: str, db: Session, failure_reason: Optional[str] = None) -> Rescue:
    if target not in STATES or target not in TRANSITIONS.get(rescue.status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Invalid rescue transition: {rescue.status} -> {target}",
        )

    timestamp = now()
    rescue.status = target
    if failure_reason:
        rescue.failure_reason = failure_reason
    field = TIMELINE_FIELDS.get(target)
    if field:
        _set_timeline(rescue, field, timestamp)
        setattr(rescue, f"{field}_at", timestamp)
    db.commit()
    db.refresh(rescue)
    return rescue


def _distance_km(first: Tuple[float, float], second: Tuple[float, float]) -> float:
    lat1, lon1 = map(math.radians, first)
    lat2, lon2 = map(math.radians, second)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


def _capacity(vehicle_type: str) -> float:
    value = vehicle_type.lower()
    if "van" in value or "truck" in value:
        return 1000
    if "suv" in value:
        return 400
    return 150


def volunteer_candidates(db: Session, donation: Donation, limit: int = 5) -> List[Dict[str, Any]]:
    from ..models.restaurant import Restaurant

    restaurant = db.query(Restaurant).filter(Restaurant.id == donation.restaurant_id).first()
    if not restaurant:
        return []
    origin = (float(restaurant.latitude), float(restaurant.longitude))
    quantity_match = re.search(r"[\d.]+", donation.quantity or "")
    quantity = float(quantity_match.group()) if quantity_match else 0
    candidates = []
    for volunteer in db.query(Volunteer).all():
        availability = (volunteer.availability or "").lower()
        if any(value in availability for value in ("off", "unavailable", "busy")):
            continue
        if not volunteer.latitude or not volunteer.longitude:
            continue
        distance = _distance_km(origin, (float(volunteer.latitude), float(volunteer.longitude)))
        capacity = _capacity(volunteer.vehicle_type or "")
        if quantity > capacity:
            continue
        candidates.append({
            "volunteer_id": volunteer.id,
            "name": volunteer.name,
            "vehicle_type": volunteer.vehicle_type,
            "distance_km": round(distance, 3),
            "capacity": capacity,
            "availability": volunteer.availability,
            "score": round((1 / (1 + distance)) * 70 + min(quantity / max(capacity, 1), 1) * 30, 3),
        })
    return sorted(candidates, key=lambda item: (-item["score"], item["distance_km"]))[:limit]


def serialize(rescue: Rescue, candidates: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    return {
        "id": rescue.id,
        "donation_id": rescue.donation_id,
        "match_id": rescue.match_id,
        "volunteer_id": rescue.volunteer_id,
        "status": rescue.status,
        "pickup_token": rescue.pickup_token,
        "delivery_token": rescue.delivery_token,
        "failure_reason": rescue.failure_reason,
        "timeline": _timeline(rescue),
        "candidates": candidates,
    }


def start_rescue(db: Session, donation_id: int) -> Rescue:
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    active = db.query(Rescue).filter(
        Rescue.donation_id == donation_id,
        Rescue.status.notin_(["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED", "FAILED"]),
    ).first()
    if active:
        raise HTTPException(status_code=409, detail="An active rescue already exists for this donation")
    if is_expired(donation.expires_at):
        donation.status = "expired"
        db.commit()
        raise HTTPException(status_code=409, detail="Donation is expired")
    match = db.query(Match).filter(Match.donation_id == donation_id, Match.status.notin_(["rejected", "REJECTED"])).order_by(Match.final_score.desc()).first()
    if not match:
        raise HTTPException(status_code=409, detail="No eligible match exists for this donation")
    rescue = Rescue(donation_id=donation_id, match_id=match.id, status="MATCHED")
    db.add(rescue)
    db.flush()
    _set_timeline(rescue, "matched", now())
    rescue.matched_at = now()
    rescue.status = "AWAITING_APPROVAL"
    match.status = "awaiting_approval"
    donation.status = "matched"
    db.commit()
    db.refresh(rescue)
    return rescue
