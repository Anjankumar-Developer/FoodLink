import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

from app.config import settings
from app.models import shelter as shelter_model
from app.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class RecipientAgent:
    """Agent responsible for finding compatible recipients for food donations."""

    def __init__(self, db: Session = None):
        self.db = db or next(get_db())
        self.model = None
        if genai is not None and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-pro')
            except Exception as exc:  # pragma: no cover - configuration can fail at runtime
                logger.warning("Gemini configuration failed: %s", exc)
                self.model = None

    async def find_recipients(
        self,
        donation_info: Dict[str, Any],
        available_recipients: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Find compatible recipients for a food donation.

        Args:
            donation_info: Dictionary containing donation information
                - food_category: Category of food
                - diet_type: Diet type of food
                - quantity: Quantity of food
                - location: Donation location (latitude, longitude)
                - expires_at: Expiration timestamp
            available_recipients: Optional list of recipient dictionaries.
                                 If not provided, will query the database.

        Returns:
            Dictionary with recipient matches and explanations
        """
        start_time = datetime.now()

        try:
            # Get recipients from database if not provided
            if available_recipients is None:
                recipients = self._get_recipients_from_db()
            else:
                recipients = available_recipients

            if not recipients:
                return {
                    "matches": [],
                    "total_found": 0,
                    "explanation": "No recipients found in database",
                    "reasoning": "Unable to find any recipients in the system"
                }

            # Try to use Gemini for reasoning about recipient compatibility
            gemini_result = await self._analyze_with_gemini(donation_info, recipients)

            # If Gemini fails, fall back to deterministic logic
            if gemini_result.get("error"):
                logger.warning("Gemini recipient analysis failed, using deterministic fallback")
                return self._find_recipients_deterministic(donation_info, recipients)

            return gemini_result

        except Exception as e:
            logger.error(f"Error in recipient agent: {str(e)}")
            # Fall back to deterministic logic on any error
            if available_recipients is None:
                recipients = self._get_recipients_from_db()
            return self._find_recipients_deterministic(donation_info, recipients)

    def _get_recipients_from_db(self) -> List[Dict[str, Any]]:
        """Get all verified recipients from the database."""
        try:
            recipients = self.db.query(shelter_model.Shelter).filter(
                shelter_model.Shelter.verified == True
            ).all()

            # Convert to dictionaries
            recipient_dicts = []
            for recipient in recipients:
                recipient_dicts.append({
                    "id": recipient.id,
                    "name": recipient.name,
                    "accepted_food_types": recipient.accepted_food_types,
                    "capacity": recipient.capacity,
                    "current_demand": recipient.current_demand,
                    "latitude": recipient.latitude,
                    "longitude": recipient.longitude,
                    "address": recipient.address
                })

            return recipient_dicts
        except Exception as e:
            logger.error(f"Error querying recipients from database: {str(e)}")
            return []

    def _gemini_available(self) -> bool:
        return self.model is not None

    async def _analyze_with_gemini(
        self,
        donation_info: Dict[str, Any],
        recipients: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Use Gemini API to analyze recipient compatibility."""
        if not self._gemini_available():
            return {"error": "Gemini unavailable", "fallback_to_deterministic": True}

        try:
            # Prepare recipient summary for Gemini (limit to avoid token limits)
            recipient_summary = []
            for recipient in recipients[:10]:  # Limit to first 10 to avoid too many tokens
                recipient_summary.append({
                    "id": recipient["id"],
                    "name": recipient["name"],
                    "accepted_food_types": recipient["accepted_food_types"],
                    "capacity": recipient["capacity"],
                    "current_demand": recipient["current_demand"],
                    "latitude": recipient["latitude"],
                    "longitude": recipient["longitude"]
                })

            prompt = f"""
            Analyze the compatibility between a food donation and potential recipients.
            Only use the recipient data provided - do not invent or assume additional recipients.

            Donation Information:
            - Food Category: {donation_info.get('food_category', 'Unknown')}
            - Diet Type: {donation_info.get('diet_type', 'Unknown')}
            - Quantity: {donation_info.get('quantity', 'Unknown')}
            - Location: Latitude {donation_info.get('location', {}).get('latitude', 'Unknown')},
                       Longitude {donation_info.get('location', {}).get('longitude', 'Unknown')}

            Available Recipients:
            {json.dumps(recipient_summary, indent=2)}

            For each recipient, determine:
            1. Compatibility based on accepted food types
            2. Suitability based on capacity vs donation quantity
            3. Geographic proximity (if location data is available)
            4. Overall suitability score

            Return a JSON object with:
            {{
                "matches": [
                    {{
                        "recipient_id": ...,
                        "recipient_name": "...",
                        "compatibility_score": 0-100,
                        "capacity_score": 0-100,
                        "distance_km": ...,
                        "suitability_score": 0-100,
                        "explanation": "..."
                    }}
                ],
                "total_found": ...,
                "reasoning": "..."
            }}

            Sort matches by suitability_score (descending).
            Only include recipients with a suitability_score >= 30.
            """

            response = self.model.generate_content(prompt)

            # Try to parse the JSON response
            try:
                # Extract JSON from response (handle potential markdown formatting)
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]

                result = json.loads(response_text.strip())

                # Validate required fields
                if "matches" not in result or "total_found" not in result or "reasoning" not in result:
                    raise ValueError("Missing required fields in Gemini response")

                # Add execution time
                execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                result["execution_time_ms"] = execution_time_ms

                return result

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
                return {"error": "Failed to parse Gemini response", "fallback_to_deterministic": True}

        except Exception as e:
            logger.error(f"Gemini API error in recipient agent: {str(e)}")
            return {"error": str(e), "fallback_to_deterministic": True}

    def _find_recipients_deterministic(
        self,
        donation_info: Dict[str, Any],
        recipients: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Deterministic fallback for finding recipients."""
        matches = []

        donation_category = donation_info.get("food_category", "").lower()
        donation_diet = donation_info.get("diet_type", "").lower()
        donation_quantity_str = donation_info.get("quantity", "0")
        donation_location = donation_info.get("location", {})

        # Parse donation quantity (extract numeric value)
        try:
            import re
            quantity_match = re.search(r'[\d.]+', donation_quantity_str)
            if quantity_match:
                donation_qty = float(quantity_match.group())
            else:
                donation_qty = 0
        except:
            donation_qty = 0

        for recipient in recipients:
            # Calculate compatibility score
            accepted_types = [t.strip().lower() for t in recipient["accepted_food_types"].split('|')] if recipient["accepted_food_types"] else []

            category_match = donation_category in accepted_types
            diet_match = donation_diet in accepted_types

            if category_match and diet_match:
                compatibility_score = 100
                compatibility_reason = f"Recipient accepts {donation_info.get('food_category')} and {donation_info.get('diet_type')}"
            elif category_match:
                compatibility_score = 80
                compatibility_reason = f"Recipient accepts {donation_info.get('food_category')} but not specifically {donation_info.get('diet_type')}"
            elif diet_match:
                compatibility_score = 60
                compatibility_reason = f"Recipient accepts {donation_info.get('diet_type')} but not specifically {donation_info.get('food_category')}"
            else:
                compatibility_score = 0
                compatibility_reason = f"Recipient does not accept {donation_info.get('food_category')} or {donation_info.get('diet_type')}"

            # Calculate capacity score
            remaining_capacity = recipient["capacity"] - recipient["current_demand"]
            if remaining_capacity <= 0:
                capacity_score = 0
            elif donation_qty <= 0:
                capacity_score = 0
            else:
                if donation_qty <= remaining_capacity:
                    utilization = donation_qty / recipient["capacity"] if recipient["capacity"] > 0 else 0
                    if utilization <= 0.8:
                        capacity_score = 100
                    else:
                        capacity_score = max(0, 100 - ((utilization - 0.8) * 250))
                else:
                    excess_ratio = donation_qty / remaining_capacity
                    capacity_score = max(0, 100 - ((excess_ratio - 1) * 50))

            # Calculate distance if coordinates are available
            distance_km = None
            if (donation_location.get("latitude") and donation_location.get("longitude") and
                recipient["latitude"] and recipient["longitude"]):
                try:
                    import math
                    # Haversine formula
                    lat1, lon1 = float(donation_location["latitude"]), float(donation_location["longitude"])
                    lat2, lon2 = float(recipient["latitude"]), float(recipient["longitude"])

                    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                    c = 2 * math.asin(math.sqrt(a))
                    distance_km = c * 6371  # Earth radius in km
                except (ValueError, TypeError):
                    distance_km = None

            # Calculate suitability score (weighted combination)
            compatibility_weight = 0.4
            capacity_weight = 0.3
            distance_weight = 0.3  # Only if distance is available

            if distance_km is not None:
                # Normalize distance score (closer = higher score)
                distance_score = max(0, 100 - (distance_km * 2))  # 2 points per km, max 50km
                suitability_score = (
                    compatibility_score * compatibility_weight +
                    capacity_score * capacity_weight +
                    distance_score * distance_weight
                )
            else:
                # If no distance, just use compatibility and capacity
                suitability_score = (
                    compatibility_score * 0.6 +
                    capacity_score * 0.4
                )

            # Only include matches with reasonable suitability
            if suitability_score >= 30:
                matches.append({
                    "recipient_id": recipient["id"],
                    "recipient_name": recipient["name"],
                    "compatibility_score": round(compatibility_score, 2),
                    "capacity_score": round(capacity_score, 2),
                    "distance_km": round(distance_km, 2) if distance_km is not None else None,
                    "suitability_score": round(suitability_score, 2),
                    "explanation": f"{compatibility_reason}. Capacity: {capacity_score}%. "
                                 + (f"Distance: {distance_km:.1f}km. " if distance_km is not None else "")
                                 + f"Remaining capacity: {remaining_capacity}."
                })

        # Sort matches by suitability_score (descending)
        matches.sort(key=lambda x: x["suitability_score"], reverse=True)

        # Generate reasoning
        reasoning = (
            f"Deterministically analyzed {len(recipients)} recipients. "
            f"Found {len(matches)} compatible recipients based on food type acceptance, "
            f"capacity availability, and geographic proximity."
        )

        return {
            "matches": matches,
            "total_found": len(matches),
            "reasoning": reasoning
        }