import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

from app.config import settings
from app.services.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)


class FoodAgent:
    """Agent responsible for analyzing food information and determining urgency, category, etc."""

    def __init__(self):
        self.matching_engine = MatchingEngine()
        self.model = None
        if genai is not None and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-pro')
            except Exception as exc:  # pragma: no cover - configuration can fail at runtime
                logger.warning("Gemini configuration failed: %s", exc)
                self.model = None

    async def analyze_food(
        self,
        food_name: str,
        food_category: str,
        description: str,
        quantity: str,
        diet_type: str,
        prepared_at: datetime,
        expires_at: datetime,
        storage_condition: str
    ) -> Dict[str, Any]:
        """
        Analyze food information and return structured analysis.

        Args:
            food_name: Name of the food item
            food_category: Category of food (e.g., fruits, vegetables, prepared_meals)
            description: Description of the food
            quantity: Quantity of food (e.g., "5 kg", "10 meals")
            diet_type: Diet type (e.g., vegetarian, vegan, non-vegetarian, gluten-free)
            prepared_at: When the food was prepared
            expires_at: When the food expires
            storage_condition: How the food is stored

        Returns:
            Dictionary with food analysis results
        """
        start_time = datetime.now()

        try:
            # First, try to use Gemini for natural language reasoning
            gemini_result = await self._analyze_with_gemini(
                food_name, food_category, description, quantity, diet_type,
                prepared_at, expires_at, storage_condition
            )

            # If Gemini fails, fall back to deterministic logic
            if gemini_result.get("error"):
                logger.warning("Gemini analysis failed, using deterministic fallback")
                return self._analyze_deterministic(
                    food_name, food_category, description, quantity, diet_type,
                    prepared_at, expires_at, storage_condition
                )

            return gemini_result

        except Exception as e:
            logger.error(f"Error in food agent analysis: {str(e)}")
            # Fall back to deterministic logic on any error
            return self._analyze_deterministic(
                food_name, food_category, description, quantity, diet_type,
                prepared_at, expires_at, storage_condition
            )

    def _gemini_available(self) -> bool:
        return self.model is not None

    async def _analyze_with_gemini(
        self,
        food_name: str,
        food_category: str,
        description: str,
        quantity: str,
        diet_type: str,
        prepared_at: datetime,
        expires_at: datetime,
        storage_condition: str
    ) -> Dict[str, Any]:
        """Use Gemini API for natural language reasoning about food."""
        if not self._gemini_available():
            return {"error": "Gemini unavailable", "fallback_to_deterministic": True}

        try:
            prompt = f"""
            Analyze the following food donation information and provide a structured analysis.
            Do NOT make any claims about food safety.

            Food Information:
            - Name: {food_name}
            - Category: {food_category}
            - Description: {description}
            - Quantity: {quantity}
            - Diet Type: {diet_type}
            - Prepared At: {prepared_at.isoformat()}
            - Expires At: {expires_at.isoformat()}
            - Storage Condition: {storage_condition}

            Please provide:
            1. Food category (confirm or suggest refinement)
            2. Diet type (confirm or suggest refinement)
            3. Urgency level (LOW, MEDIUM, HIGH, CRITICAL) based on time to expiration
            4. Estimated remaining life in minutes
            5. Risk flags (array of strings, e.g., ["temperature_abuse", "container_damage"])
            6. Recommended recipient types (array of strings, e.g., ["homeless_shelter", "food_bank", "senior_center"])
            7. Reasoning (explanation of your analysis)

            Format your response as JSON with exactly these keys:
            {{
                "food_category": "...",
                "diet_type": "...",
                "urgency": "...",
                "estimated_remaining_life_minutes": 120,
                "risk_flags": [],
                "recommended_recipient_types": [],
                "reasoning": "..."
            }}

            For urgency levels:
            - CRITICAL: Less than 2 hours remaining
            - HIGH: 2-6 hours remaining
            - MEDIUM: 6-24 hours remaining
            - LOW: More than 24 hours remaining

            Do not claim food safety or make guarantees about edibility.
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
                required_fields = [
                    "food_category", "diet_type", "urgency",
                    "estimated_remaining_life_minutes", "risk_flags",
                    "recommended_recipient_types", "reasoning"
                ]

                for field in required_fields:
                    if field not in result:
                        raise ValueError(f"Missing required field: {field}")

                # Add execution time
                execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                result["execution_time_ms"] = execution_time_ms

                return result

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
                return {"error": "Failed to parse Gemini response", "fallback_to_deterministic": True}

        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return {"error": str(e), "fallback_to_deterministic": True}

    def _analyze_deterministic(
        self,
        food_name: str,
        food_category: str,
        description: str,
        quantity: str,
        diet_type: str,
        prepared_at: datetime,
        expires_at: datetime,
        storage_condition: str
    ) -> Dict[str, Any]:
        """Deterministic fallback for food analysis."""
        # Calculate urgency based on time to expiration
        urgency_score = self.matching_engine.calculate_urgency_score(expires_at)

        # Determine urgency level
        if urgency_score >= 90:
            urgency = "CRITICAL"
        elif urgency_score >= 70:
            urgency = "HIGH"
        elif urgency_score >= 40:
            urgency = "MEDIUM"
        else:
            urgency = "LOW"

        # Calculate estimated remaining life in minutes
        now = datetime.now()
        time_left = expires_at - now
        estimated_remaining_life_minutes = max(0, int(time_left.total_seconds() / 60))

        # Determine risk flags based on storage condition and time
        risk_flags = []
        if storage_condition.lower() in ["room_temperature", "unrefrigerated"]:
            risk_flags.append("temperature_abuse")

        if estimated_remaining_life_minutes < 120:  # Less than 2 hours
            risk_flags.append("imminent_expiration")

        # Determine recommended recipient types based on food category and diet type
        recommended_recipient_types = self._get_recommended_recipients(
            food_category, diet_type, quantity
        )

        # Generate reasoning
        reasoning = (
            f"Deterministic analysis of {food_name} ({food_category}). "
            f"Urgency: {urgency} ({urgency_score}%). "
            f"Estimated remaining life: {estimated_remaining_life_minutes} minutes. "
            f"Storage condition: {storage_condition}. "
            f"Diet type: {diet_type}."
        )

        return {
            "food_category": food_category,
            "diet_type": diet_type,
            "urgency": urgency,
            "estimated_remaining_life_minutes": estimated_remaining_life_minutes,
            "risk_flags": risk_flags,
            "recommended_recipient_types": recommended_recipient_types,
            "reasoning": reasoning
        }

    def _get_recommended_recipients(self, food_category: str, diet_type: str, quantity: str) -> list:
        """Get recommended recipient types based on food characteristics."""
        recipients = []

        # Basic mapping based on food category
        category_lower = food_category.lower()
        diet_lower = diet_type.lower()

        # Most food categories can go to food banks and pantries
        if any(x in category_lower for x in ["fruit", "vegetable", "produce", "bread", "grain", "cereal"]):
            recipients.extend(["food_bank", "pantry", "soup_kitchen"])

        # Prepared meals
        if any(x in category_lower for x in ["prepared", "cooked", "meal", "leftover", "catered"]):
            recipients.extend(["homeless_shelter", "soup_kitchen", "senior_center"])

        # Dairy and proteins need refrigeration
        if any(x in category_lower for x in ["dairy", "milk", "cheese", "yogurt", "meat", "fish", "egg"]):
            if "refrigerated" in storage_condition.lower():
                recipients.extend(["food_bank", "homeless_shelter"])  # Assuming they have refrigeration

        # Diet-specific recommendations
        if diet_lower in ["vegan", "vegetarian"]:
            recipients.append("vegans_vegetarians_shelter")  # Specialized if available
        elif diet_lower in ["halal", "kosher"]:
            recipients.append("religious_dietary_shelter")  # Specialized if available

        # Remove duplicates
        return list(set(recipients))