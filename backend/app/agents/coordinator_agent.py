import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

from app.config import settings
from app.services.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)


class CoordinatorAgent:
    """Agent responsible for coordinating the outputs of other agents and making final recommendations."""

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

    async def coordinate(
        self,
        food_analysis: Dict[str, Any],
        recipient_matches: Dict[str, Any],
        route_info: Dict[str, Any],
        matching_engine_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Coordinate outputs from all agents and produce a final recommendation.

        Args:
            food_analysis: Output from Food Agent
            recipient_matches: Output from Recipient Agent
            route_info: Output from Route Agent
            matching_engine_results: Optional results from the deterministic matching engine

        Returns:
            Dictionary with final recommendation and coordination details
        """
        start_time = datetime.now()

        try:
            # Try to use Gemini for reasoning coordination
            gemini_result = await self._coordinate_with_gemini(
                food_analysis, recipient_matches, route_info, matching_engine_results
            )

            # If Gemini fails, fall back to deterministic logic
            if gemini_result.get("error"):
                logger.warning("Gemini coordination failed, using deterministic fallback")
                return self._coordinate_deterministic(
                    food_analysis, recipient_matches, route_info, matching_engine_results
                )

            return gemini_result

        except Exception as e:
            logger.error(f"Error in coordinator agent: {str(e)}")
            # Fall back to deterministic logic on any error
            return self._coordinate_deterministic(
                food_analysis, recipient_matches, route_info, matching_engine_results
            )

    def _gemini_available(self) -> bool:
        return self.model is not None

    async def _coordinate_with_gemini(
        self,
        food_analysis: Dict[str, Any],
        recipient_matches: Dict[str, Any],
        route_info: Dict[str, Any],
        matching_engine_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Use Gemini API to coordinate agent outputs."""
        if not self._gemini_available():
            return {"error": "Gemini unavailable", "fallback_to_deterministic": True}

        try:
            prompt = f"""
            You are a coordinator agent for a food donation system. Your role is to synthesize
            information from specialized agents and make a final recommendation.

            Food Agent Analysis:
            {json.dumps(food_analysis, indent=2)}

            Recipient Agent Matches:
            {json.dumps(recipient_matches, indent=2)}

            Route Agent Information:
            {json.dumps(route_info, indent=2)}

            Matching Engine Results (deterministic calculations):
            {json.dumps(matching_engine_results, indent=2) if matching_engine_results else "Not provided"}

            CRITICAL CONSTRAINTS - You CANNOT override these:
            1. Expired food - if food_analysis shows expired or route_info shows not feasible
            2. Impossible pickup - if route_info shows pickup_feasible is false
            3. Recipient capacity limits - if recipient has no remaining capacity
            4. Incompatibility - if recipient doesn't accept the food type
            5. Missing required data - if essential information is missing

            Based on the agent outputs, provide a coordinated decision in JSON format:
            {{
                "recommended_match_id": "...", // recipient ID of recommended match, or null if no match
                "confidence": 0-100, // confidence in the recommendation
                "priority": "LOW/MEDIUM/HIGH/CRITICAL",
                "reason": "...",
                "next_action": "REQUEST_HUMAN_APPROVAL" or "PROCEED_WITHOUT_APPROVAL" or "ABORT",
                "agent_summary": {{
                    "food_agent": "...",
                    "recipient_agent": "...",
                    "route_agent": "...",
                    "matching_engine": "..."
                }}
            }}

            Guidelines:
            - If no compatible recipients or pickup not feasible, recommend ABORT
            - If high confidence match found, recommend REQUEST_HUMAN_APPROVAL
            - Only recommend PROCEED_WITHOUT_APPROVAL for very high confidence, low-risk scenarios
            - Confidence should reflect the quality and consistency of information across agents
            - Priority should be based on urgency, feasibility, and impact
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
                    "recommended_match_id", "confidence", "priority",
                    "reason", "next_action", "agent_summary"
                ]

                for field in required_fields:
                    if field not in result:
                        raise ValueError(f"Missing required field: {field}")

                # Validate next_action is one of the allowed values
                allowed_actions = ["REQUEST_HUMAN_APPROVAL", "PROCEED_WITHOUT_APPROVAL", "ABORT"]
                if result["next_action"] not in allowed_actions:
                    raise ValueError(f"Invalid next_action: {result['next_action']}")

                # Validate priority is one of the allowed values
                allowed_priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                if result["priority"] not in allowed_priorities:
                    raise ValueError(f"Invalid priority: {result['priority']}")

                # Add execution time
                execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                result["execution_time_ms"] = execution_time_ms

                return result

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
                return {"error": "Failed to parse Gemini response", "fallback_to_deterministic": True}

        except Exception as e:
            logger.error(f"Gemini API error in coordinator agent: {str(e)}")
            return {"error": str(e), "fallback_to_deterministic": True}

    def _coordinate_deterministic(
        self,
        food_analysis: Dict[str, Any],
        recipient_matches: Dict[str, Any],
        route_info: Dict[str, Any],
        matching_engine_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Deterministic fallback for coordination."""
        # Check critical constraints that cannot be overridden

        # Constraint 1: Check if food is expired or urgency is critical with no time left
        food_urgent = food_analysis.get("urgency") == "CRITICAL"
        food_expired = food_analysis.get("estimated_remaining_life_minutes", 0) <= 0

        # Constraint 2: Check if pickup is feasible
        pickup_feasible = route_info.get("pickup_feasible", False)

        # Constraint 3: Check if we have any viable recipients
        matches = recipient_matches.get("matches", [])
        viable_matches = [
            m for m in matches
            if m.get("compatibility_score", 0) > 0 and
               m.get("capacity_score", 0) > 0 and
               (m.get("distance_km") is None or m.get("distance_km") < 50)  # Within reasonable distance
        ]

        # If any critical constraint fails, abort
        if food_expired or not pickup_feasible or not viable_matches:
            recommended_match_id = None
            confidence = 0
            priority = "LOW"
            reason = "Critical constraints violated: "
            if food_expired:
                reason += "food expired or imminently expiring. "
            if not pickup_feasible:
                reason += "pickup not feasible before expiration. "
            if not viable_matches:
                reason += "no viable recipients found. "
            next_action = "ABORT"

        else:
            # We have viable matches, pick the best one
            best_match = viable_matches[0] if viable_matches else None

            if best_match:
                recommended_match_id = str(best_match.get("recipient_id"))

                # Calculate confidence based on scores
                compatibility = best_match.get("compatibility_score", 0)
                capacity = best_match.get("capacity_score", 0)
                distance = best_match.get("distance_km", 50)  # Default to far if not available

                # Distance score (closer = higher score)
                distance_score = max(0, 100 - (distance * 2)) if distance is not None else 50

                # Weighted confidence
                confidence = int(
                    compatibility * 0.4 +
                    capacity * 0.3 +
                    distance_score * 0.2 +
                    (100 if food_analysis.get("urgency") in ["HIGH", "CRITICAL"] else 70) * 0.1  # Boost for urgent food
                )

                # Determine priority based on urgency and feasibility
                food_urgency = food_analysis.get("urgency", "LOW")
                if food_urgency == "CRITICAL" and pickup_feasible:
                    priority = "CRITICAL"
                elif food_urgency in ["HIGH", "CRITICAL"] or estimated_minutes < 30:
                    priority = "HIGH"
                elif food_urgency == "MEDIUM":
                    priority = "MEDIUM"
                else:
                    priority = "LOW"

                # Generate reason
                reason = (
                    f"Recommended recipient {best_match.get('recipient_name')} "
                    f"(ID: {best_match.get('recipient_id')}) with "
                    f"compatibility {compatibility}%, capacity {capacity}%, "
                    f"distance {distance}km. "
                )

                next_action = "REQUEST_HUMAN_APPROVAL"

            else:
                # No viable matches found
                recommended_match_id = None
                confidence = 0
                priority = "LOW"
                reason = "No viable recipients found after filtering"
                next_action = "ABORT"

        # Create agent summaries
        agent_summary = {
            "food_agent": f"Analyzed {food_analysis.get('food_category', 'unknown')} food. "
                         f"Urgency: {food_analysis.get('urgency', 'unknown')}. "
                         f"Estimated life: {food_analysis.get('estimated_remaining_life_minutes', 0)} minutes.",
            "recipient_agent": f"Found {len(matches)} potential recipients. "
                              f"{len(viable_matches)} viable matches after filtering.",
            "route_agent": f"Route calculation: {route_info.get('distance_km', 0)}km, "
                          f"{route_info.get('estimated_minutes', 0)}minutes. "
                          f"Pickup feasible: {route_info.get('pickup_feasible', False)}.",
            "matching_engine": f"Deterministic matching engine provided {len(matching_engine_results) if matching_engine_results else 0} results."
        }

        return {
            "recommended_match_id": recommended_match_id,
            "confidence": confidence,
            "priority": priority,
            "reason": reason.strip(),
            "next_action": next_action,
            "agent_summary": agent_summary
        }