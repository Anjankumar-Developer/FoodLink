# Multi-Agent AI Layer Architecture for FoodLink

## Overview

This document describes the multi-agent AI layer implemented for the FoodLink application. The architecture consists of four specialized agents that work together to facilitate food donations from restaurants to recipients (shelters, food banks, etc.).

## Agent Architecture

### 1. Food Agent

**Responsibility**: Analyzes food information to determine category, diet type, urgency, and other food-specific attributes.

**Inputs**:
- food_name
- food_category
- description
- quantity
- diet_type
- prepared_at
- expires_at
- storage_condition

**Outputs**:
```json
{
  "food_category": "...",
  "diet_type": "...",
  "urgency": "...",
  "estimated_remaining_life_minutes": 120,
  "risk_flags": [],
  "recommended_recipient_types": [],
  "reasoning": "..."
}
```

**Implementation Details**:
- Uses Gemini API for natural language reasoning where appropriate
- Falls back to deterministic logic using the MatchingEngine for expiry calculations
- Does NOT make food safety claims
- Logs all actions to agent_logs table

### 2. Recipient Agent (formerly Shelter Agent)

**Responsibility**: Identifies compatible recipients for food donations based on accepted food types, capacity, demand, and geographic proximity.

**Inputs**:
- donation information
- available recipients (queried from database if not provided)

**Outputs**:
```json
{
  "matches": [
    {
      "recipient_id": "...",
      "recipient_name": "...",
      "compatibility_score": 0-100,
      "capacity_score": 0-100,
      "distance_km": ...,
      "suitability_score": 0-100,
      "explanation": "..."
    }
  ],
  "total_found": ...,
  "reasoning": "..."
}
```

**Implementation Details**:
- Queries actual recipient records from database (does not let LLM invent recipients)
- Uses Gemini API for reasoning about recipient compatibility
- Falls back to deterministic scoring algorithm
- Only uses recipients returned by the database
- Logs all actions to agent_logs table

### 3. Route Agent

**Responsibility**: Calculates distance, estimated time of arrival, and pickup feasibility for food transportation.

**Inputs**:
- restaurant coordinates
- recipient coordinates
- volunteer coordinates (optional)
- expiry window
- preparation time

**Outputs**:
```json
{
  "distance_km": 2.4,
  "estimated_minutes": 10,
  "pickup_feasible": true,
  "remaining_lifetime_minutes": 120,
  "route_reason": "Pickup can reach recipient before expiry"
}
```

**Implementation Details**:
- Primarily deterministic (does NOT ask Gemini to perform geographic arithmetic)
- Uses Haversine formula for distance calculations
- Estimates travel time based on average speed
- Calculates pickup feasibility based on time windows
- Logs all actions to agent_logs table

### 4. Coordinator Agent

**Responsibility**: Receives outputs from all other agents and the matching engine to produce a final recommendation.

**Inputs**:
- Food Agent output
- Recipient Agent output
- Route Agent output
- Matching Engine results

**Outputs**:
```json
{
  "recommended_match_id": "...",
  "confidence": 94,
  "priority": "HIGH",
  "reason": "...",
  "next_action": "REQUEST_HUMAN_APPROVAL",
  "agent_summary": {
    "food_agent": "...",
    "recipient_agent": "...",
    "route_agent": "...",
    "matching_engine": "..."
  }
}
```

**Implementation Details**:
- Cannot override hard constraints: expired food, impossible pickup, recipient capacity limits, incompatibility, missing required data
- Uses Gemini API for synthesizing information and making recommendations
- Falls back to deterministic decision-making logic
- Provides confidence scores and clear next actions
- Logs all actions to agent_logs table

## Agent Orchestration

### Endpoints Implemented

1. `POST /api/agents/analyze-food` - Food Agent endpoint
2. `POST /api/agents/find-recipients` - Recipient Agent endpoint (renamed from find-shelters)
3. `POST /api/agents/calculate-route` - Route Agent endpoint
4. `POST /api/agents/coordinate` - Coordinator Agent endpoint
5. `POST /api/agents/rescue/{donation_id}` - Complete workflow endpoint

### Rescue Workflow

The `/api/agents/rescue/{donation_id}` endpoint executes the full workflow:

```
Donation
    ↓
Food Agent
    ↓
Recipient Agent
    ↓
Route Agent
    ↓
Deterministic Matching Engine
    ↓
Coordinator Agent
    ↓
Human Approval Required
```

## Agent Logging

All agent actions are logged to the `agent_logs` table with the following fields:

- `agent_id`: Primary key
- `agent_name`: Name of the agent (FoodAgent, RecipientAgent, etc.)
- `donation_id`: Foreign key to donations table (nullable for general agent calls)
- `action`: Specific action performed (analyze_food, find_recipients, etc.)
- `input_summary`: Summary of input data provided to the agent
- `output_summary`: Summary of output/decision from the agent
- `status`: Status of the operation (success, error, fallback_used)
- `created_at`: Timestamp when the log was created
- `execution_time_ms`: Execution time in milliseconds

**Logging Rules**:
- Do not store API keys or other sensitive information
- Do not store unnecessary sensitive information
- Logging failures do not break the main functionality

## Failure Handling

### Gemini API Failure

If the Gemini API fails at any point in the workflow:

1. The system continues operating using deterministic logic
2. Returns appropriate fallback responses with indication of fallback usage
3. Does NOT crash the rescue workflow
4. Logs the failure and fallback activation

Example fallback responses:
- Food Agent: "AI unavailable, Deterministic fallback activated"
- Recipient Agent: Falls back to deterministic scoring algorithm
- Coordinator Agent: Falls back to rule-based coordination logic

## Deterministic Logic Sources

The deterministic components of the system primarily rely on:

1. **Matching Engine**: Existing `backend/app/services/matching_engine.py` for:
   - Distance calculations (Haversine formula)
   - Compatibility scoring
   - Urgency scoring based on time to expiration
   - Capacity scoring
   - Pickup feasibility scoring
   - Demand scoring

2. **Rule-based Fallbacks**: When Gemini is unavailable, each agent implements:
   - Food Agent: Rule-based urgency classification and recipient type matching
   - Recipient Agent: Deterministic scoring based on food type acceptance, capacity, and distance
   - Route Agent: Purely deterministic (already was)
   - Coordinator Agent: Rule-based decision making based on constraint checking and scoring

## Security Considerations

- GEMINI_API_KEY is stored securely in environment variables and never exposed to frontend
- All agent endpoints require backend processing - no direct API key exposure
- Input validation and sanitization should be implemented at the API level
- Agent logging excludes sensitive data

## Dependencies

- Google Generative AI (Gemini) API
- Existing FoodLink database models and services
- Matching engine for deterministic calculations
- FastAPI for endpoint implementation

## Installation and Configuration

1. Ensure GEMINI_API_KEY is set in the `.env` file
2. Install required dependencies: `google-generativeai`
3. The agents are automatically initialized when the application starts
4. No additional configuration required beyond standard FoodLink setup

## Testing

The implementation should be tested for:
- Successful agent flow
- Gemini failure scenarios
- Malformed Gemini output handling
- Invalid donation data
- Expired donations
- Incompatible recipients
- Impossible routes
- Coordinator conflicts
- Fallback mode activation

All existing backend tests should continue to pass.