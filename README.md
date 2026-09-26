# FoodLink

FoodLink is a multi-agent food rescue platform that connects surplus food from restaurants with verified shelters and coordinates pickup operations before food expires.

## ✅ Current status

The backend has been verified to run successfully and the endpoint test suite passes.

## Project structure

- backend/app - FastAPI application, models, schemas, routes, and configuration
- backend/scripts - database initialization helpers
- backend/test_endpoints.py - endpoint validation suite
- backend/.env.example - environment configuration template

## Tech stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite for local development
- Pydantic
- Uvicorn
- httpx

## Local setup

From the backend directory:

1. Create a virtual environment and install dependencies:
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

2. Start the API:
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8002

3. Validate the system:
   python -m pytest -q

## Health and API endpoints

- GET /health
- GET /api/restaurants/
- GET /api/shelters/
- GET /api/donations/
- GET /api/volunteers/
- GET /api/matches/
- GET /api/pickups/
- GET /api/agent_logs/
- GET /api/analytics/overview
- GET /api/analytics/impact
- GET /api/map/restaurants
- GET /api/map/shelters
- GET /api/map/active-rescues
- POST /api/agents/analyze-food
- POST /api/agents/find-shelters
- POST /api/agents/calculate-route
- POST /api/agents/coordinate

## Notes

- Local development uses SQLite by default via the backend environment file.
- The app includes CORS configuration for local API access.
- Database tables are created automatically on startup.
