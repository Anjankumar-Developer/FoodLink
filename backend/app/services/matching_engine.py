import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models import restaurant as restaurant_model
from ..models import shelter as shelter_model
from ..models import donation as donation_model
from ..models import match as match_model
from ..models import food_taxonomy as food_taxonomy_model
from ..services.data_loader import DataLoader
from ..database import SessionLocal
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MatchingEngine:
    """Service for calculating matches between donations and recipients."""

    def __init__(self, db_session: Session = None):
        """Initialize the matching engine with a database session."""
        self.db = db_session or SessionLocal()
        self.data_loader = DataLoader(self.db)

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points on the earth (specified in decimal degrees).

        Args:
            lat1, lon1: Latitude and longitude of point 1
            lat2, lon2: Latitude and longitude of point 2

        Returns:
            Distance in kilometers
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r

    def calculate_distance_score(self, donation_lat: float, donation_lon: float,
                                recipient_lat: float, recipient_lon: float) -> Tuple[float, float, int]:
        """
        Calculate distance score and related metrics.

        Args:
            donation_lat, donation_lon: Donation location coordinates
            recipient_lat, recipient_lon: Recipient location coordinates

        Returns:
            Tuple of (distance_km, travel_minutes, distance_score)
        """
        # Calculate distance using Haversine formula
        distance_km = self.haversine_distance(donation_lat, donation_lon, recipient_lat, recipient_lon)

        # Estimate travel time (assuming average speed of 30 km/h in urban areas)
        travel_minutes = (distance_km / 30.0) * 60.0

        # Calculate distance score (closer = higher score)
        # Normalize to 0-100 where 0km = 100 score and 50km+ = 0 score
        distance_score = max(0, 100 - (distance_km * 2))  # 2 points per km, max 50km

        return distance_km, travel_minutes, distance_score

    def calculate_compatibility_score(self, donation_food_category: str,
                                    donation_diet_type: str,
                                    recipient_accepted_food_types: str) -> Tuple[float, str]:
        """
        Calculate compatibility score based on food category and diet type.

        Args:
            donation_food_category: Food category of the donation
            donation_diet_type: Diet type of the donation
            recipient_accepted_food_types: Pipe-separated list of accepted food types

        Returns:
            Tuple of (compatibility_score, reason)
        """
        # Convert accepted food types to list
        accepted_types = [t.strip().lower() for t in recipient_accepted_food_types.split('|')] if recipient_accepted_food_types else []

        # Check if donation food category is accepted
        donation_category_lower = donation_food_category.lower()
        donation_diet_lower = donation_diet_type.lower()

        category_match = donation_category_lower in accepted_types
        diet_match = donation_diet_lower in accepted_types

        # Calculate score
        if category_match and diet_match:
            score = 100
            reason = f"Recipient accepts {donation_food_category} and {donation_diet_type}"
        elif category_match:
            score = 80
            reason = f"Recipient accepts {donation_food_category} but not specifically {donation_diet_type}"
        elif diet_match:
            score = 60
            reason = f"Recipient accepts {donation_diet_type} but not specifically {donation_food_category}"
        else:
            score = 0
            reason = f"Recipient does not accept {donation_food_category} or {donation_diet_type}"

        return score, reason

    def calculate_urgency_score(self, expires_at: datetime) -> float:
        """
        Calculate urgency score based on time until expiration.

        Args:
            expires_at: Expiration datetime of the donation

        Returns:
            Urgency score (0-100)
        """
        now = datetime.now()
        time_left = expires_at - now

        # If already expired, urgency is 0
        if time_left.total_seconds() <= 0:
            return 0.0

        # Calculate percentage of time left
        # We'll consider 24 hours as the maximum relevant time window
        max_hours = 24
        hours_left = time_left.total_seconds() / 3600

        if hours_left >= max_hours:
            # More than 24 hours left - low urgency
            return 20.0
        elif hours_left >= 12:
            # 12-24 hours left - moderate urgency
            return 50.0
        elif hours_left >= 6:
            # 6-12 hours left - high urgency
            return 80.0
        else:
            # Less than 6 hours left - critical urgency
            return 100.0

    def calculate_capacity_score(self, donation_quantity: str,
                               recipient_capacity: int,
                               recipient_current_demand: int) -> float:
        """
        Calculate capacity score based on donation quantity vs recipient capacity.

        Args:
            donation_quantity: Quantity string from donation (e.g., "10 kg", "5 meals")
            recipient_capacity: Maximum capacity of recipient
            recipient_current_demand: Current demand of recipient

        Returns:
            Capacity score (0-100)
        """
        # Parse donation quantity (extract numeric value)
        try:
            # Extract numeric part from quantity string
            import re
            quantity_match = re.search(r'[\d.]+', donation_quantity)
            if quantity_match:
                donation_qty = float(quantity_match.group())
            else:
                donation_qty = 0
        except:
            donation_qty = 0

        # Calculate remaining capacity
        remaining_capacity = recipient_capacity - recipient_current_demand

        if remaining_capacity <= 0:
            # No remaining capacity
            return 0.0

        if donation_qty <= 0:
            # Invalid quantity
            return 0.0

        # Calculate ratio of donation to remaining capacity
        # Ideal is donation <= remaining capacity
        if donation_qty <= remaining_capacity:
            # Donation fits within capacity - score based on utilization
            utilization = donation_qty / recipient_capacity if recipient_capacity > 0 else 0
            # Optimal utilization is around 70-80% of capacity
            if utilization <= 0.8:
                score = 100
            else:
                # Penalize over-utilization
                score = max(0, 100 - ((utilization - 0.8) * 250))
        else:
            # Donation exceeds remaining capacity
            excess_ratio = donation_qty / remaining_capacity
            score = max(0, 100 - ((excess_ratio - 1) * 50))

        return max(0.0, min(100.0, score))

    def calculate_pickup_feasibility_score(self, travel_minutes: float,
                                         expires_at: datetime,
                                         prepared_at: datetime) -> Tuple[bool, float]:
        """
        Calculate pickup feasibility based on travel time vs food lifetime.

        Args:
            travel_minutes: Estimated travel time in minutes
            expires_at: Expiration datetime
            prepared_at: Preparation datetime

        Returns:
            Tuple of (pickup_feasible, pickup_score)
        """
        # Calculate total food lifetime
        total_lifetime = expires_at - prepared_at
        lifetime_minutes = total_lifetime.total_seconds() / 60

        if lifetime_minutes <= 0:
            # Food already expired or invalid dates
            return False, 0.0

        # Calculate remaining lifetime
        now = datetime.now()
        remaining_lifetime = expires_at - now
        remaining_minutes = max(0, remaining_lifetime.total_seconds() / 60)

        # Check if pickup is feasible (can arrive before food expires)
        pickup_feasible = travel_minutes < remaining_minutes

        # Calculate pickup score based on time buffer
        if remaining_minutes > 0:
            time_buffer_ratio = (remaining_minutes - travel_minutes) / remaining_minutes
            # Score based on buffer - more buffer = higher score
            pickup_score = max(0, min(100, time_buffer_ratio * 100))
        else:
            pickup_score = 0.0

        return pickup_feasible, pickup_score

    def calculate_demand_score(self, recipient_current_demand: int,
                             recipient_capacity: int) -> float:
        """
        Calculate demand score based on current demand vs capacity.

        Args:
            recipient_current_demand: Current demand of recipient
            recipient_capacity: Maximum capacity of recipient

        Returns:
            Demand score (0-100)
        """
        if recipient_capacity <= 0:
            return 0.0

        # Calculate demand ratio
        demand_ratio = recipient_current_demand / recipient_capacity

        # Lower demand = higher score (recipients with less current demand are preferred)
        # We want to balance the load across recipients
        if demand_ratio <= 0.3:
            # Low demand - high score
            return 100
        elif demand_ratio <= 0.7:
            # Medium demand - medium score
            return 50 + (0.7 - demand_ratio) * 125  # Scale from 100 to 50
        else:
            # High demand - low score
            return max(0, 100 - (demand_ratio - 0.7) * 250)  # Scale from 50 to 0

    def check_hard_constraints(self, donation: donation_model.Donation,
                             recipient: shelter_model.Shelter) -> Tuple[bool, List[str]]:
        """
        Check hard constraints that must be satisfied for a match to be possible.

        Args:
            donation: Donation object
            recipient: Recipient/Shelter object

        Returns:
            Tuple of (constraints_passed, list_of_failed_constraints)
        """
        failed_constraints = []

        # Get donation location (we'll need to get this from the restaurant)
        restaurant = self.db.query(restaurant_model.Restaurant).filter(
            restaurant_model.Restaurant.id == donation.restaurant_id
        ).first()

        if not restaurant:
            failed_constraints.append("Donation restaurant not found")
            return False, failed_constraints

        # Hard constraint 1: recipient cannot accept the food category
        # (This is actually covered in compatibility score, but we'll check it as a hard constraint too)
        accepted_types = [t.strip().lower() for t in recipient.accepted_food_types.split('|')] if recipient.accepted_food_types else []
        if donation.food_category.lower() not in accepted_types and donation.diet_type.lower() not in accepted_types:
            failed_constraints.append("Recipient cannot accept the food category or diet type")

        # Hard constraint 2: donation already expired
        if donation.expires_at < datetime.now():
            failed_constraints.append("Donation has already expired")

        # Hard constraint 3: recipient has no remaining capacity
        remaining_capacity = recipient.capacity - recipient.current_demand
        if remaining_capacity <= 0:
            failed_constraints.append("Recipient has no remaining capacity")

        # Hard constraint 4: pickup ETA exceeds remaining food lifetime
        # Calculate travel time
        try:
            donation_lat = float(restaurant.latitude) if restaurant.latitude and restaurant.latitude != "0.0" else 0.0
            donation_lon = float(restaurant.longitude) if restaurant.longitude and restaurant.longitude != "0.0" else 0.0
            recipient_lat = float(recipient.latitude) if recipient.latitude else 0.0
            recipient_lon = float(recipient.longitude) if recipient.longitude else 0.0

            if donation_lat != 0.0 and donation_lon != 0.0 and recipient_lat != 0.0 and recipient_lon != 0.0:
                distance_km = self.haversine_distance(donation_lat, donation_lon, recipient_lat, recipient_lon)
                travel_minutes = (distance_km / 30.0) * 60.0  # Assuming 30 km/h average speed

                # Calculate remaining food lifetime
                remaining_lifetime = donation.expires_at - datetime.now()
                remaining_minutes = max(0, remaining_lifetime.total_seconds() / 60)

                if travel_minutes >= remaining_minutes:
                    failed_constraints.append("Pickup ETA exceeds remaining food lifetime")
            else:
                # If we don't have valid coordinates, we can't check this constraint
                pass
        except (ValueError, TypeError):
            # If coordinates are invalid, skip this constraint
            pass

        # Hard constraint 5: recipient is outside operational hours
        # For simplicity, we'll assume all recipients operate 8:00-21:00 as per the CSV data
        # In a real implementation, we'd check actual operating hours
        now = datetime.now()
        current_hour = now.hour
        if current_hour < 8 or current_hour > 21:
            failed_constraints.append("Recipient is outside operational hours (assumed 8:00-21:00)")

        # Hard constraint 6: donation status is RESCUED or EXPIRED
        if donation.status in ["RESCUED", "EXPIRED"]:
            failed_constraints.append(f"Donation status is {donation.status}")

        return len(failed_constraints) == 0, failed_constraints

    def generate_matches_for_donation(self, donation_id: str) -> List[Dict[str, Any]]:
        """
        Generate matches for a specific donation.

        Args:
            donation_id: ID of the donation to generate matches for

        Returns:
            List of match dictionaries sorted by final score (descending)
        """
        # Get the donation
        donation = self.db.query(donation_model.Donation).filter(
            donation_model.Donation.id == donation_id
        ).first()

        if not donation:
            logger.warning(f"Donation {donation_id} not found")
            return []

        # Get all active recipients
        recipients = self.db.query(shelter_model.Shelter).filter(
            shelter_model.Shelter.verified == True
        ).all()

        matches = []

        for recipient in recipients:
            # Check hard constraints first
            constraints_passed, failed_constraints = self.check_hard_constraints(donation, recipient)

            if not constraints_passed:
                # Skip this recipient if hard constraints are not met
                continue

            # Get restaurant location for distance calculation
            restaurant = self.db.query(restaurant_model.Restaurant).filter(
                restaurant_model.Restaurant.id == donation.restaurant_id
            ).first()

            if not restaurant:
                continue

            # Calculate scores
            try:
                # Distance score
                donation_lat = float(restaurant.latitude) if restaurant.latitude and restaurant.latitude != "0.0" else 0.0
                donation_lon = float(restaurant.longitude) if restaurant.longitude and restaurant.longitude != "0.0" else 0.0
                recipient_lat = float(recipient.latitude) if recipient.latitude else 0.0
                recipient_lon = float(recipient.longitude) if recipient.longitude else 0.0

                if donation_lat == 0.0 and donation_lon == 0.0:
                    # Use default coordinates if not available
                    distance_km, travel_minutes, distance_score = 0.0, 0.0, 50.0  # Middle score
                else:
                    distance_km, travel_minutes, distance_score = self.calculate_distance_score(
                        donation_lat, donation_lon, recipient_lat, recipient_lon
                    )

                # Compatibility score
                compatibility_score, compatibility_reason = self.calculate_compatibility_score(
                    donation.food_category, donation.diet_type, recipient.accepted_food_types
                )

                # Urgency score
                urgency_score = self.calculate_urgency_score(donation.expires_at)

                # Capacity score
                capacity_score = self.calculate_capacity_score(
                    donation.quantity, recipient.capacity, recipient.current_demand
                )

                # Pickup feasibility score
                pickup_feasible, pickup_score = self.calculate_pickup_feasibility_score(
                    travel_minutes, donation.expires_at, donation.prepared_at
                )

                # Demand score
                demand_score = self.calculate_demand_score(
                    recipient.current_demand, recipient.capacity
                )

                # Calculate final score using the specified weights
                final_score = (
                    distance_score * 0.25 +
                    compatibility_score * 0.20 +
                    urgency_score * 0.20 +
                    capacity_score * 0.15 +
                    pickup_score * 0.10 +
                    demand_score * 0.10
                )

                # Create match object
                match_data = {
                    "donation_id": donation.id,
                    "recipient_id": recipient.id,
                    "recipient_name": recipient.name,
                    "distance_km": round(distance_km, 2),
                    "travel_minutes": round(travel_minutes, 1),
                    "compatibility_score": round(compatibility_score, 2),
                    "urgency_score": round(urgency_score, 2),
                    "capacity_score": round(capacity_score, 2),
                    "pickup_score": round(pickup_score, 2),
                    "demand_score": round(demand_score, 2),
                    "final_score": round(final_score, 2),
                    "status": "RECOMMENDED" if final_score >= 50 else "NOT_RECOMMENDED",
                    "hard_constraints_passed": True,
                    "explanation": f"{compatibility_reason}. Distance: {distance_km}km ({travel_minutes}min travel). "
                                 f"Urgency: {urgency_score}%. Capacity: {capacity_score}%. "
                                 f"Pickup: {'Feasible' if pickup_feasible else 'Not feasible'} ({pickup_score}%). "
                                 f"Demand: {demand_score}%."
                }

                matches.append(match_data)

            except Exception as e:
                logger.error(f"Error calculating match for donation {donation_id} and recipient {recipient.id}: {str(e)}")
                continue

        # Sort matches by final score (descending)
        matches.sort(key=lambda x: x["final_score"], reverse=True)

        return matches

    def save_match(self, match_data: Dict[str, Any]) -> Optional[match_model.Match]:
        """
        Save a match to the database.

        Args:
            match_data: Dictionary containing match data

        Returns:
            Saved Match object or None if failed
        """
        try:
            match_obj = match_model.Match(
                donation_id=match_data["donation_id"],
                shelter_id=match_data["recipient_id"],
                distance_km=match_data["distance_km"],
                travel_minutes=int(match_data["travel_minutes"]),
                compatibility_score=match_data["compatibility_score"],
                urgency_score=match_data["urgency_score"],
                capacity_score=match_data["capacity_score"],
                pickup_score=match_data["pickup_score"],
                demand_score=match_data["demand_score"],
                final_score=match_data["final_score"],
                status=match_data["status"],
                explanation=match_data["explanation"]
            )

            self.db.add(match_obj)
            self.db.commit()
            self.db.refresh(match_obj)
            return match_obj

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving match: {str(e)}")
            return None

    def generate_and_save_matches_for_donation(self, donation_id: str) -> List[match_model.Match]:
        """
        Generate matches for a donation and save them to the database.

        Args:
            donation_id: ID of the donation to generate matches for

        Returns:
            List of saved Match objects
        """
        matches_data = self.generate_matches_for_donation(donation_id)
        saved_matches = []

        for match_data in matches_data:
            # Only save matches that are recommended (score >= 50)
            if match_data["final_score"] >= 50:
                saved_match = self.save_match(match_data)
                if saved_match:
                    saved_matches.append(saved_match)

        return saved_matches