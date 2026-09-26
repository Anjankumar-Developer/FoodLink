from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional, List
import asyncio
from datetime import datetime

from app.agents.food_agent import FoodAgent
from app.agents.recipient_agent import RecipientAgent
from app.agents.route_agent import RouteAgent
from app.agents.coordinator_agent import CoordinatorAgent
from app.services.matching_engine import MatchingEngine
from app.database import get_db
from sqlalchemy.orm import Session
from app.models import agent_log as agent_log_model
from app.models import shelter as shelter_model
from app.schemas import agent_log as agent_log_schema

router = APIRouter(
    prefix="/api/agents",
    tags=["agents"],
    responses={404: {"description": "Not found"}},
)

# Initialize agents
food_agent = FoodAgent()
route_agent = RouteAgent()
coordinator_agent = CoordinatorAgent()


def log_agent_action(
    db: Session,
    agent_name: str,
    donation_id: Optional[int],
    action: str,
    input_summary: str,
    output_summary: str,
    status: str,
    execution_time_ms: int
):
    """Helper function to log agent actions."""
    try:
        agent_log = agent_log_model.AgentLog(
            donation_id=donation_id,
            agent_name=agent_name,
            action=action,
            input_summary=input_summary,
            output_summary=output_summary,
            status=status,
            execution_time_ms=execution_time_ms
        )
        db.add(agent_log)
        db.commit()
    except Exception as e:
        # Don't let logging errors break the main functionality
        print(f"Error logging agent action: {str(e)}")


@router.post("/analyze-food", response_model=Dict[str, Any])
async def analyze_food(
    donation_info: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Analyze food information using the Food Agent.
    """
    start_time = datetime.now()

    try:
        # Extract parameters from donation_info
        food_name = donation_info.get("food_name", donation_info.get("food_category", "Unknown"))
        food_category = donation_info.get("food_category", "Unknown")
        description = donation_info.get("description", "")
        quantity = donation_info.get("quantity", "0")
        diet_type = donation_info.get("diet_type", "unknown")
        prepared_at_str = donation_info.get("prepared_at")
        expires_at_str = donation_info.get("expires_at")
        storage_condition = donation_info.get("storage_condition", "unknown")

        # Parse datetime strings if provided
        prepared_at_dt = None
        expires_at_dt = None
        if prepared_at_str:
            prepared_at_dt = datetime.fromisoformat(prepared_at_str.replace('Z', '+00:00'))
        if expires_at_str:
            expires_at_dt = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))

        # Call the food agent
        result = await food_agent.analyze_food(
            food_name=food_name,
            food_category=food_category,
            description=description,
            quantity=quantity,
            diet_type=diet_type,
            prepared_at=prepared_at_dt,
            expires_at=expires_at_dt,
            storage_condition=storage_condition
        )

        # Prepare logs
        input_summary = f"Food: {food_name}, Category: {food_category}, Quantity: {quantity}"
        output_summary = f"Urgency: {result.get('urgency')}, Estimated life: {result.get('estimated_remaining_life_minutes')}min"
        status_msg = "success" if "error" not in result else "fallback_used"

        # Log the action (we don't have a donation_id yet for this endpoint)
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_agent_action(
            db=db,
            agent_name="FoodAgent",
            donation_id=None,
            action="analyze_food",
            input_summary=input_summary,
            output_summary=output_summary,
            status=status_msg,
            execution_time_ms=execution_time_ms
        )

        # Remove internal fields from response
        if "execution_time_ms" in result:
            del result["execution_time_ms"]

        return result

    except Exception as e:
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        # Extract fields for error response with safe defaults
        food_category = donation_info.get("food_category", "Unknown")
        diet_type = donation_info.get("diet_type", "unknown")
        error_result = {
            "error": str(e),
            "food_category": food_category,
            "diet_type": diet_type,
            "urgency": "UNKNOWN",
            "estimated_remaining_life_minutes": 0,
            "risk_flags": ["analysis_error"],
            "recommended_recipient_types": [],
            "reasoning": f"Error during analysis: {str(e)}"
        }

        # Log the error
        food_name = donation_info.get("food_name", donation_info.get("food_category", "Unknown"))
        quantity = donation_info.get("quantity", "0")
        input_summary = f"Food: {food_name}, Category: {food_category}, Quantity: {quantity}"
        output_summary = f"Error: {str(e)}"
        log_agent_action(
            db=db,
            agent_name="FoodAgent",
            donation_id=None,
            action="analyze_food",
            input_summary=input_summary,
            output_summary=output_summary,
            status="error",
            execution_time_ms=execution_time_ms
        )

        return error_result


@router.post("/find-recipients", response_model=Dict[str, Any])
async def find_recipients(
    donation_info: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Find compatible recipients using the Recipient Agent.
    Renamed from /find-shelters to /find-recipients as per requirements.
    """
    start_time = datetime.now()

    try:
        # Initialize recipient agent with database session
        recipient_agent = RecipientAgent(db=db)

        # Call the recipient agent
        result = await recipient_agent.find_recipients(donation_info=donation_info)

        # Prepare logs
        input_summary = f"Donation: {donation_info.get('food_category', 'unknown')}, {donation_info.get('quantity', 'unknown')}"
        output_summary = f"Found {result.get('total_found', 0)} recipients"
        status_msg = "success" if "error" not in result else "fallback_used"

        # Log the action
        donation_id = donation_info.get("id")
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_agent_action(
            db=db,
            agent_name="RecipientAgent",
            donation_id=donation_id,
            action="find_recipients",
            input_summary=input_summary,
            output_summary=output_summary,
            status=status_msg,
            execution_time_ms=execution_time_ms
        )

        # Remove internal fields from response
        if "execution_time_ms" in result:
            del result["execution_time_ms"]

        return result

    except Exception as e:
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        error_result = {
            "matches": [],
            "total_found": 0,
            "explanation": f"Error finding recipients: {str(e)}",
            "reasoning": "Error occurred during recipient matching"
        }

        # Log the error
        input_summary = f"Donation: {donation_info.get('food_category', 'unknown')}, {donation_info.get('quantity', 'unknown')}"
        output_summary = f"Error: {str(e)}"
        log_agent_action(
            db=db,
            agent_name="RecipientAgent",
            donation_id=donation_info.get("id"),
            action="find_recipients",
            input_summary=input_summary,
            output_summary=output_summary,
            status="error",
            execution_time_ms=execution_time_ms
        )

        return error_result


@router.post("/calculate-route", response_model=Dict[str, Any])
async def calculate_route(
    route_info: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Calculate route information using the Route Agent.
    """
    start_time = datetime.now()

    try:
        # Extract parameters from route_info
        restaurant_location = route_info.get("restaurant_location", {"latitude": 0.0, "longitude": 0.0})
        recipient_location = route_info.get("recipient_location", {"latitude": 0.0, "longitude": 0.0})
        volunteer_location = route_info.get("volunteer_location")
        expires_at_str = route_info.get("expires_at")
        prepared_at_str = route_info.get("prepared_at")

        # Parse datetime strings if provided
        expires_at_dt = None
        prepared_at_dt = None
        if expires_at_str:
            expires_at_dt = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        if prepared_at_str:
            prepared_at_dt = datetime.fromisoformat(prepared_at_str.replace('Z', '+00:00'))

        # Call the route agent
        result = await route_agent.calculate_route(
            restaurant_location=restaurant_location,
            recipient_location=recipient_location,
            volunteer_location=volunteer_location,
            expires_at=expires_at_dt,
            prepared_at=prepared_at_dt
        )

        # Prepare logs
        input_summary = f"Route from restaurant to recipient"
        output_summary = f"Distance: {result.get('distance_km')}km, ETA: {result.get('estimated_minutes')}min, Feasible: {result.get('pickup_feasible')}"
        status_msg = "success"

        # Log the action (no specific donation_id for this endpoint)
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_agent_action(
            db=db,
            agent_name="RouteAgent",
            donation_id=None,
            action="calculate_route",
            input_summary=input_summary,
            output_summary=output_summary,
            status=status_msg,
            execution_time_ms=execution_time_ms
        )

        # Remove internal fields from response
        if "execution_time_ms" in result:
            del result["execution_time_ms"]

        return result

    except Exception as e:
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        error_result = {
            "distance_km": 0.0,
            "estimated_minutes": 0,
            "pickup_feasible": False,
            "remaining_lifetime_minutes": 0,
            "route_reason": f"Error calculating route: {str(e)}"
        }

        # Log the error
        input_summary = f"Route from restaurant to recipient"
        output_summary = f"Error: {str(e)}"
        log_agent_action(
            db=db,
            agent_name="RouteAgent",
            donation_id=None,
            action="calculate_route",
            input_summary=input_summary,
            output_summary=output_summary,
            status="error",
            execution_time_ms=execution_time_ms
        )

        return error_result


@router.post("/coordinate", response_model=Dict[str, Any])
async def coordinate(
    coordination_info: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Coordinate outputs from all agents using the Coordinator Agent.
    """
    start_time = datetime.now()

    try:
        # Extract parameters from coordination_info
        food_analysis = coordination_info.get("food_analysis", {})
        recipient_matches = coordination_info.get("recipient_matches", {})
        route_info = coordination_info.get("route_info", {})
        matching_engine_results = coordination_info.get("matching_engine_results")

        # Handle recipient_matches: if it's a list, convert to expected dict format
        if isinstance(recipient_matches, list):
            recipient_matches = {
                "matches": recipient_matches,
                "total_found": len(recipient_matches),
                "reasoning": "Recipient matches provided as list"
            }
        # Ensure it's a dict
        elif not isinstance(recipient_matches, dict):
            recipient_matches = {}

        # Handle matching_engine_results: ensure it's a list or None
        if matching_engine_results is not None and not isinstance(matching_engine_results, list):
            if isinstance(matching_engine_results, dict):
                # If it's a dict, wrap it in a list
                matching_engine_results = [matching_engine_results]
            else:
                # If it's neither list nor dict, treat as empty list
                matching_engine_results = []

        # Call the coordinator agent
        result = await coordinator_agent.coordinate(
            food_analysis=food_analysis,
            recipient_matches=recipient_matches,
            route_info=route_info,
            matching_engine_results=matching_engine_results
        )

        # Prepare logs
        input_summary = f"Coordination of food analysis, recipient matches, and route info"
        output_summary = f"Recommended match: {result.get('recommended_match_id')}, Confidence: {result.get('confidence')}, Priority: {result.get('priority')}, Next action: {result.get('next_action')}"
        status_msg = "success" if "error" not in result else "fallback_used"

        # Log the action
        # Try to extract donation_id from inputs if available
        donation_id = None
        if isinstance(food_analysis, dict) and "donation_id" in food_analysis:
            donation_id = food_analysis["donation_id"]
        elif isinstance(recipient_matches, dict) and "donation_id" in recipient_matches:
            donation_id = recipient_matches["donation_id"]

        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_agent_action(
            db=db,
            agent_name="CoordinatorAgent",
            donation_id=donation_id,
            action="coordinate",
            input_summary=input_summary,
            output_summary=output_summary,
            status=status_msg,
            execution_time_ms=execution_time_ms
        )

        # Remove internal fields from response
        if "execution_time_ms" in result:
            del result["execution_time_ms"]

        return result

    except Exception as e:
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        error_result = {
            "recommended_match_id": None,
            "confidence": 0,
            "priority": "LOW",
            "reason": f"Error during coordination: {str(e)}",
            "next_action": "ABORT",
            "agent_summary": {
                "food_agent": "Error",
                "recipient_agent": "Error",
                "route_agent": "Error",
                "matching_engine": "Error"
            }
        }

        # Log the error
        input_summary = f"Coordination of food analysis, recipient matches, and route info"
        output_summary = f"Error: {str(e)}"
        log_agent_action(
            db=db,
            agent_name="CoordinatorAgent",
            donation_id=None,
            action="coordinate",
            input_summary=input_summary,
            output_summary=output_summary,
            status="error",
            execution_time_ms=execution_time_ms
        )

        return error_result


@router.post("/rescue/{donation_id}", response_model=Dict[str, Any])
async def rescue(
    donation_id: int,
    db: Session = Depends(get_db)
):
    """
    Execute the full rescue workflow:
    Donation → Food Agent → Recipient Agent → Route Agent →
    Deterministic Matching Engine → Coordinator Agent → Human Approval Required
    """
    start_time = datetime.now()

    try:
        # Step 1: Get donation information
        from app.models import donation as donation_model
        from app.models import restaurant as restaurant_model

        donation = db.query(donation_model.Donation).filter(
            donation_model.Donation.id == donation_id
        ).first()

        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Donation with ID {donation_id} not found"
            )

        # Get restaurant information for location
        restaurant = db.query(restaurant_model.Restaurant).filter(
            restaurant_model.Restaurant.id == donation.restaurant_id
        ).first()

        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant for donation {donation_id} not found"
            )

        # Prepare donation info for agents
        donation_info = {
            "id": donation.id,
            "food_category": donation.food_category,
            "diet_type": donation.diet_type,
            "quantity": donation.quantity,
            "description": donation.description or "",
            "location": {
                "latitude": float(restaurant.latitude) if restaurant.latitude and restaurant.latitude != "0.0" else 0.0,
                "longitude": float(restaurant.longitude) if restaurant.longitude and restaurant.longitude != "0.0" else 0.0
            },
            "expires_at": donation.expires_at.isoformat() if donation.expires_at else None,
            "prepared_at": donation.prepared_at.isoformat() if donation.prepared_at else None
        }

        # Step 2: Food Agent Analysis
        food_analysis = await food_agent.analyze_food(
            food_name=donation.food_name or donation.food_category,
            food_category=donation.food_category,
            description=donation.description or "",
            quantity=donation.quantity,
            diet_type=donation.diet_type,
            prepared_at=donation.prepared_at,
            expires_at=donation.expires_at,
            storage_condition=donation.storage_condition or "unknown"
        )

        # Step 3: Recipient Agent - Find compatible recipients
        recipient_agent = RecipientAgent(db=db)
        recipient_matches = await recipient_agent.find_recipients(donation_info=donation_info)

        # Step 4: Route Agent - Calculate routes for top recipients
        route_infos = []
        if recipient_matches.get("matches"):
            # Calculate routes for top 3 recipients to avoid too many calls
            top_matches = recipient_matches["matches"][:3]
            for match in top_matches:
                recipient_id = match.get("recipient_id")
                recipient = db.query(shelter_model.Shelter).filter(
                    shelter_model.Shelter.id == recipient_id
                ).first()

                if recipient:
                    route_info = await route_agent.calculate_route(
                        restaurant_location=donation_info["location"],
                        recipient_location={
                            "latitude": float(recipient.latitude) if recipient.latitude else 0.0,
                            "longitude": float(recipient.longitude) if recipient.longitude else 0.0
                        },
                        expires_at=donation.expires_at,
                        prepared_at=donation.prepared_at
                    )
                    route_infos.append({
                        "recipient_id": recipient_id,
                        "route_info": route_info
                    })

        # Step 5: Deterministic Matching Engine
        matching_engine = MatchingEngine(db_session=db)
        matching_engine_results = matching_engine.generate_matches_for_donation(str(donation_id))

        # Step 6: Coordinator Agent - Make final recommendation
        # Use the best route info (first one) for coordination
        best_route_info = route_infos[0]["route_info"] if route_infos else {
            "distance_km": 0.0,
            "estimated_minutes": 0,
            "pickup_feasible": False,
            "remaining_lifetime_minutes": 0,
            "route_reason": "No route information available"
        }

        coordination_result = await coordinator_agent.coordinate(
            food_analysis=food_analysis,
            recipient_matches=recipient_matches,
            route_info=best_route_info,
            matching_engine_results=matching_engine_results
        )

        # Prepare logs for the overall rescue operation
        input_summary = f"Rescue workflow for donation {donation_id}: {donation.food_category}"
        output_summary = f"Workflow completed. Recommended match: {coordination_result.get('recommended_match_id')}, Action: {coordination_result.get('next_action')}"
        status_msg = "success" if "error" not in coordination_result else "fallback_used"

        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_agent_action(
            db=db,
            agent_name="RescueWorkflow",
            donation_id=donation_id,
            action="rescue_workflow",
            input_summary=input_summary,
            output_summary=output_summary,
            status=status_msg,
            execution_time_ms=execution_time_ms
        )

        # Remove internal fields from response
        if "execution_time_ms" in coordination_result:
            del coordination_result["execution_time_ms"]

        # Add workflow information to response
        coordination_result["workflow_steps_completed"] = [
            "food_agent_analysis",
            "recipient_matching",
            "route_calculation",
            "deterministic_matching",
            "agent_coordination"
        ]
        coordination_result["donation_id"] = donation_id

        return coordination_result

    except HTTPException:
        raise
    except Exception as e:
        execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        error_result = {
            "recommended_match_id": None,
            "confidence": 0,
            "priority": "LOW",
            "reason": f"Error in rescue workflow: {str(e)}",
            "next_action": "ABORT",
            "agent_summary": {
                "food_agent": "Error",
                "recipient_agent": "Error",
                "route_agent": "Error",
                "matching_engine": "Error",
                "coordinator_agent": "Error"
            },
            "donation_id": donation_id,
            "workflow_steps_completed": [],
            "error": str(e)
        }

        # Log the error
        input_summary = f"Rescue workflow for donation {donation_id}"
        output_summary = f"Error: {str(e)}"
        log_agent_action(
            db=db,
            agent_name="RescueWorkflow",
            donation_id=donation_id,
            action="rescue_workflow",
            input_summary=input_summary,
            output_summary=output_summary,
            status="error",
            execution_time_ms=execution_time_ms
        )

        return error_result