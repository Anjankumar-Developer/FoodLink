import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import math
from app.services.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)

class RouteAgent:
    """Agent responsible for calculating routes and pickup feasibility."""

    def __init__(self):
        self.matching_engine = MatchingEngine()

    async def calculate_route(
        self,
        restaurant_location: Dict[str, float],
        recipient_location: Dict[str, float],
        volunteer_location: Optional[Dict[str, float]] = None,
        expires_at: Optional[datetime] = None,
        prepared_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculate route information for food pickup/delivery.

        Args:
            restaurant_location: Dict with latitude and longitude of restaurant
            recipient_location: Dict with latitude and longitude of recipient
            volunteer_location: Optional dict with latitude and longitude of volunteer
                               (if not provided, assumes pickup starts at restaurant)
            expires_at: When the food expires
            prepared_at: When the food was prepared

        Returns:
            Dictionary with route calculation results
        """
        start_time = datetime.now()

        try:
            # Use deterministic calculations only (as specified in requirements)
            # No Gemini for geographic arithmetic
            result = self._calculate_route_deterministic(
                restaurant_location, recipient_location, volunteer_location,
                expires_at, prepared_at
            )

            # Add execution time
            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            result["execution_time_ms"] = execution_time_ms

            return result

        except Exception as e:
            logger.error(f"Error in route agent: {str(e)}")
            # Return a safe fallback
            return {
                "distance_km": 0.0,
                "estimated_minutes": 0,
                "pickup_feasible": False,
                "remaining_lifetime_minutes": 0,
                "route_reason": f"Error calculating route: {str(e)}",
                "execution_time_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }

    def _calculate_route_deterministic(
        self,
        restaurant_location: Dict[str, float],
        recipient_location: Dict[str, float],
        volunteer_location: Optional[Dict[str, float]],
        expires_at: Optional[datetime],
        prepared_at: Optional[datetime]
    ) -> Dict[str, Any]:
        """Deterministic route calculation."""
        # Validate coordinates
        if not self._are_coordinates_valid(restaurant_location) or \
           not self._are_coordinates_valid(recipient_location):
            return {
                "distance_km": 0.0,
                "estimated_minutes": 0,
                "pickup_feasible": False,
                "remaining_lifetime_minutes": 0,
                "route_reason": "Invalid coordinates provided"
            }

        # Extract coordinates
        restaurant_lat = float(restaurant_location["latitude"])
        restaurant_lon = float(restaurant_location["longitude"])
        recipient_lat = float(recipient_location["latitude"])
        recipient_lon = float(recipient_location["longitude"])

        # Calculate restaurant to recipient distance
        distance_km, travel_minutes, _ = self.matching_engine.calculate_distance_score(
            restaurant_lat, restaurant_lon, recipient_lat, recipient_lon
        )

        # If volunteer location is provided, calculate volunteer to restaurant distance
        volunteer_to_restaurant_minutes = 0
        if volunteer_location and self._are_coordinates_valid(volunteer_location):
            volunteer_lat = float(volunteer_location["latitude"])
            volunteer_lon = float(volunteer_location["longitude"])
            _, volunteer_to_restaurant_minutes, _ = self.matching_engine.calculate_distance_score(
                volunteer_lat, volunteer_lon, restaurant_lat, restaurant_lon
            )
        # If no volunteer location, assume volunteer starts at restaurant (0 minutes)

        # Total estimated time includes volunteer to restaurant + restaurant to recipient
        estimated_minutes = volunteer_to_restaurant_minutes + travel_minutes

        # Calculate remaining lifetime if expiration times are provided
        remaining_lifetime_minutes = 0
        if expires_at and prepared_at:
            try:
                now = datetime.now()
                time_left = expires_at - now
                remaining_lifetime_minutes = max(0, int(time_left.total_seconds() / 60))
            except (ValueError, TypeError):
                remaining_lifetime_minutes = 0
        elif expires_at:
            try:
                now = datetime.now()
                time_left = expires_at - now
                remaining_lifetime_minutes = max(0, int(time_left.total_seconds() / 60))
            except (ValueError, TypeError):
                remaining_lifetime_minutes = 0

        # Determine if pickup is feasible
        pickup_feasible = estimated_minutes < remaining_lifetime_minutes if remaining_lifetime_minutes > 0 else False

        # Generate route reason
        if remaining_lifetime_minutes > 0:
            time_buffer = remaining_lifetime_minutes - estimated_minutes
            if time_buffer >= 30:  # More than 30 minutes buffer
                route_reason = f"Pickup can reach recipient before expiry with {time_buffer} minutes buffer"
            elif time_buffer >= 0:
                route_reason = f"Pickup can reach recipient before expiry with {time_buffer} minutes buffer"
            else:
                route_reason = f"Pickup cannot reach recipient before expiry. Late by {abs(time_buffer)} minutes"
        else:
            route_reason = "Unable to determine pickup feasibility due to missing expiration data"

        return {
            "distance_km": round(distance_km, 2),
            "estimated_minutes": round(estimated_minutes),
            "pickup_feasible": pickup_feasible,
            "remaining_lifetime_minutes": remaining_lifetime_minutes,
            "route_reason": route_reason
        }

    def _are_coordinates_valid(self, location: Dict[str, float]) -> bool:
        """Check if location coordinates are valid."""
        try:
            lat = float(location.get("latitude", 0))
            lon = float(location.get("longitude", 0))
            # Basic validation: not None, not zero, and within reasonable bounds
            return lat is not None and lon is not None and lat != 0.0 and lon != 0.0 and \
                   -90 <= lat <= 90 and -180 <= lon <= 180
        except (ValueError, TypeError):
            return False