# FoodLink

FoodLink is a multi-agent food rescue platform that connects surplus food from restaurants with verified shelters and coordinates pickup workflows before food expires.

## ✅ Verified status

The project has been checked for real issues, the Gemini dependency problem has been fixed, and the backend test suite is passing in the current workspace.

## Overview

The app combines:

- a FastAPI backend for restaurants, shelters, donations, volunteers, matches, pickups, analytics, and agent coordination
- a React + Vite frontend for dashboard and operations views
- a SQLite-backed local database seeded from CSV datasets for food rescue operations

## Project structure

- backend/ - FastAPI app, models, schemas, database setup, and services
- backend/app/ - main application code and route registration
- backend/scripts/ - database and setup helpers
- backend/test_endpoints.py - API validation checks
- frontend/ - React dashboard and UI
- datasets/ - local CSV datasets used for records and testing
- README.md - project overview and setup instructions

## Tech stack

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- Uvicorn
- httpx

### Frontend
- React
- Vite
- Express
- Leaflet
- Recharts
- Tailwind CSS

## Local setup

### 1) Backend

From the project root:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start the API:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```

The app initializes SQLite automatically on startup.

### 2) Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

This starts the React frontend in development mode.

## Environment configuration

Use the sample backend configuration file:

- backend/.env.example

It contains the required app settings, including the SQLite database URL and app metadata.

## Validation

Run backend tests from the backend directory:

```bash
python -m pytest -q
```

The project is currently verified to pass its automated checks in this workspace.

## Key API endpoints

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
- POST /api/agents/find-recipients
- POST /api/agents/calculate-route
- POST /api/agents/coordinate

## Notes

- Local development uses SQLite by default.
- CORS is enabled for local frontend-to-backend communication.
- Agent AI integrations are designed to fall back gracefully when external AI services are unavailable.
- The app supports recipient matching, route feasibility calculations, and rescue coordination workflows.

## License

This project is licensed under the terms in the repository license file.
