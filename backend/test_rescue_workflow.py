from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Donation, Match, Restaurant, Shelter, Volunteer
from app.services.rescue_service import start_rescue, transition, volunteer_candidates
from app.routes.rescue import approve, assign, complete, delivery, pickup, start
from app.routes.map import get_active_rescues_map, get_recipients_map
from app.routes.analytics import get_analytics_impact, get_analytics_overview
from app.schemas.rescue import VolunteerAssignment


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def seed(db, expires_at=None, volunteer_availability="available"):
    restaurant = Restaurant(name="Kitchen", address="1 Main", latitude="37.78", longitude="-122.41")
    shelter = Shelter(
        name="Recipient", address="2 Main", latitude="37.79", longitude="-122.42",
        capacity=100, current_demand=20, accepted_food_types="Prepared|Vegetarian",
    )
    volunteer = Volunteer(
        name="Driver", vehicle_type="Cargo Van", availability=volunteer_availability,
        latitude="37.781", longitude="-122.411",
    )
    db.add_all([restaurant, shelter, volunteer])
    db.flush()
    donation = Donation(
        restaurant_id=restaurant.id, food_name="Meals", food_category="Prepared",
        quantity="20 meals", diet_type="Vegetarian", prepared_at=datetime.utcnow(),
        expires_at=expires_at or datetime.utcnow() + timedelta(hours=4),
        storage_condition="hot", status="available",
    )
    db.add(donation)
    db.flush()
    match = Match(
        donation_id=donation.id, shelter_id=shelter.id, final_score=90,
        distance_km=1.4, travel_minutes=5,
        compatibility_score=90, status="pending", explanation="Best fit",
    )
    db.add(match)
    db.commit()
    return donation, match, volunteer


def test_complete_rescue_flow_and_tokens(db):
    donation, _, volunteer = seed(db)

    rescue = start_rescue(db, donation.id)
    assert rescue.status == "AWAITING_APPROVAL"
    assert "matched" in rescue.timeline_json

    rescue = transition(rescue, "APPROVED", db)
    rescue.volunteer_id = volunteer.id
    db.commit()
    rescue = transition(rescue, "VOLUNTEER_ASSIGNED", db)
    rescue = transition(rescue, "PICKUP_PENDING", db)
    rescue.pickup_token = "pickup_test_token"
    rescue = transition(rescue, "PICKED_UP", db)
    rescue = transition(rescue, "DELIVERY_PENDING", db)
    rescue.delivery_token = "delivery_test_token"
    rescue = transition(rescue, "DELIVERED", db)
    rescue = transition(rescue, "COMPLETED", db)

    assert rescue.status == "COMPLETED"
    assert rescue.pickup_token == "pickup_test_token"
    assert rescue.delivery_token == "delivery_test_token"
    assert set(__import__("json").loads(rescue.timeline_json)) == {
        "matched", "approved", "volunteer_assigned", "pickup", "delivery", "completed"
    }


def test_invalid_transition_is_rejected(db):
    donation, _, _ = seed(db)
    rescue = start_rescue(db, donation.id)

    with pytest.raises(HTTPException) as error:
        transition(rescue, "COMPLETED", db)

    assert error.value.status_code == 409


def test_expired_donation_is_rejected(db):
    donation, _, _ = seed(db, datetime.utcnow() - timedelta(minutes=1))

    with pytest.raises(HTTPException) as error:
        start_rescue(db, donation.id)

    assert error.value.status_code == 409
    db.refresh(donation)
    assert donation.status == "expired"


def test_rejected_match_cannot_start_rescue(db):
    donation, match, _ = seed(db)
    match.status = "rejected"
    db.commit()

    with pytest.raises(HTTPException) as error:
        start_rescue(db, donation.id)

    assert error.value.status_code == 409


def test_cancelled_rescue_cannot_continue(db):
    donation, _, _ = seed(db)
    rescue = start_rescue(db, donation.id)
    rescue = transition(rescue, "CANCELLED", db, "Coordinator cancelled")

    with pytest.raises(HTTPException) as error:
        transition(rescue, "APPROVED", db)

    assert error.value.status_code == 409


def test_unavailable_volunteer_is_not_a_candidate(db):
    donation, _, _ = seed(db, volunteer_availability="off duty")

    assert volunteer_candidates(db, donation) == []


def test_rescue_routes_persist_tokens_and_finish_flow(db):
    donation, _, volunteer = seed(db)
    rescue = start(donation.id, db)
    rescue = approve(rescue["id"], db)
    rescue = assign(rescue["id"], VolunteerAssignment(volunteer_id=volunteer.id), db)
    rescue = pickup(rescue["id"], db)
    assert rescue["status"] == "DELIVERY_PENDING"
    assert rescue["pickup_token"].startswith("pickup_")

    rescue = delivery(rescue["id"], db)
    assert rescue["status"] == "DELIVERED"
    assert rescue["delivery_token"].startswith("delivery_")
    rescue = complete(rescue["id"], db)
    assert rescue["status"] == "COMPLETED"


def test_map_contract_returns_recipient_coordinates_and_active_route(db):
    donation, _, volunteer = seed(db)
    rescue = start(donation.id, db)
    rescue = approve(rescue["id"], db)
    assign(rescue["id"], VolunteerAssignment(volunteer_id=volunteer.id), db)

    recipients = get_recipients_map(db)
    active_rescues = get_active_rescues_map(db)

    assert recipients[0]["latitude"] == "37.79"
    assert active_rescues[0]["status"] == "PICKUP_PENDING"
    assert active_rescues[0]["restaurant"]["latitude"] == "37.78"
    assert active_rescues[0]["volunteer"]["latitude"] == "37.781"
    assert active_rescues[0]["recipient"]["latitude"] == "37.79"
    assert active_rescues[0]["eta_minutes"] is not None


def test_analytics_contract_exposes_operational_and_impact_metrics(db):
    overview = get_analytics_overview(db)
    impact = get_analytics_impact(db)

    assert {
        "total_donations", "meals_rescued", "successful_rescues",
        "at_risk_donations", "expired_donations", "active_rescues",
        "available_volunteers", "active_recipients", "average_match_score",
        "average_rescue_distance_km", "average_rescue_time_minutes",
        "rescue_success_rate",
    }.issubset(overview)
    assert impact["estimated_meals_rescued"] == 0
    assert "not a scientific measurement" in impact["estimate_note"]
