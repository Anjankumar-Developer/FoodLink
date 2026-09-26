# FoodLink

FoodLink is an AI-powered multi-agent food rescue platform that connects surplus food from restaurants with verified shelters and coordinates pickup workflows before food expires.

## Overview

The platform integrates:

- **FastAPI Backend**: Manages restaurants, shelters, donations, volunteers, matches, pickups, analytics, and autonomous agent orchestration.
- **Multi-Agent Orchestration**: Four specialized agents (Food Perishability, Recipient Compatibility, Route & Logistics, and Coordinator) automate triage while ensuring deterministic fallbacks and mandatory human approval.
- **Rescue State Machine**: A 9-step verified custody transition workflow (`MATCHED` through `COMPLETED`) with proof-of-custody tokens.
- **React + Vite Frontend**: Operational dashboard with interactive Leaflet mapping, live rescue radar, and Recharts analytics.
- **SQLite Data Layer**: Seeded from comprehensive benchmark datasets for restaurants, recipients, donations, volunteers, and food taxonomies.

## Current Status

- **Demo-Ready**: Backend and frontend builds pass validation with zero critical errors.
- **Deterministic & Resilient**: Gemini AI integration with deterministic fallbacks when API keys are omitted.
- **Verified State Machine**: Transition constraints enforce valid lifecycle flows, rejecting illegal status jumps with HTTP 409.

## Project Structure

```text
FoodLink/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── agents/           # Food, Recipient, Route, and Coordinator agents
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── routes/           # REST endpoints (agents, rescue, map, analytics, etc.)
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # Matching engine, data loader, rescue state machine
│   │   ├── config.py         # App configuration and environment settings
│   │   ├── database.py       # SQLAlchemy engine and session factory
│   │   └── main.py           # FastAPI entrypoint and middleware registration
│   ├── scripts/              # DB initialization and data seeding scripts
│   ├── test_endpoints.py     # End-to-end API integration tests
│   └── test_rescue_workflow.py # Rescue lifecycle & state machine tests
├── frontend/                 # React 19 + Vite dashboard
│   ├── src/                  # Components, pages, hooks, map widgets, and API clients
│   └── server.js             # Local Vite & API proxy server
├── datasets/Datasets/        # Immutable CSV benchmark datasets
└── README.md                 # Project documentation
```

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Asynchronous high-performance REST API
- **SQLAlchemy & SQLite**: Relational ORM and local database persistence
- **Pydantic**: Data validation and type enforcement
- **Google Generative AI**: Gemini-powered reasoning (optional, with deterministic fallback)
- **Uvicorn**: ASGI web server
- **Pytest & HTTPX**: Automated test suites

### Frontend
- **React 19 & Vite 8**: Modern high-speed component architecture
- **Leaflet & React-Leaflet**: Geospatial map visualization and route rendering
- **Recharts**: Operational metrics, delivery times, and rescue volume charts
- **Tailwind CSS & Lucide Icons**: Responsive layout and iconography
- **Motion**: Fluid UI transitions

---

## Local Setup

### 1) Backend

From the project root:

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest

# Setup local environment configuration
# Windows:
copy .env.example .env
# Linux/macOS:
# cp .env.example .env

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI docs will be available at `http://localhost:8000/docs`.

### 2) Frontend

From the project root:

```bash
cd frontend

# Install dependencies
npm install

# Setup local frontend environment configuration
# Windows:
copy .env.example .env.local
# Linux/macOS:
# cp .env.example .env.local

# Start frontend development server
npm run dev
```

The frontend console will be live at `http://localhost:3000` (or `http://localhost:5173`).

---

## Environment Configuration

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./foodlink.db
SECRET_KEY=foodlink-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
PROJECT_NAME=FoodLink API
VERSION=1.0.0
GEMINI_API_KEY=your-gemini-api-key-optional
```
*Note: Safe development defaults are pre-configured. If `GEMINI_API_KEY` is omitted, all agents run automatically using deterministic fallbacks.*

### Frontend (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

---

## Multi-Agent Architecture

1. **Food Agent** (`POST /api/agents/analyze-food`): Evaluates category risk, calculates remaining shelf life, and assigns an urgency level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
2. **Recipient Agent** (`POST /api/agents/find-recipients`): Evaluates shelters by dietary fit, accepted meal categories, and remaining intake capacity.
3. **Route Agent** (`POST /api/agents/calculate-route`): Computes Haversine distance, travel duration estimates, and determines pickup/delivery feasibility before food expires.
4. **Coordinator Agent** (`POST /api/agents/coordinate`): Aggregates multi-agent telemetry to output a recommended match, confidence score, and priority ranking.
5. **Agent Logging** (`GET /api/agent_logs/`): Records timestamps, prompts, latency, and reasoning in the `AgentLog` table for full auditability.

---

## Rescue State Machine

Every rescue follows a strict state machine:

$$\text{MATCHED} \longrightarrow \text{AWAITING\_APPROVAL} \longrightarrow \text{APPROVED} \longrightarrow \text{VOLUNTEER\_ASSIGNED} \longrightarrow \text{PICKUP\_PENDING} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{DELIVERY\_PENDING} \longrightarrow \text{DELIVERED} \longrightarrow \text{COMPLETED}$$

- **Human Gatekeeper**: Rescues require human approval (`/approve`) before dispatch.
- **Proof-of-Custody**: Pickup and delivery verification tokens ensure traceability.
- **Fail-Safe Transitions**: Unpermitted status updates are rejected with `HTTP 409 Conflict`.

---

## Validation & Testing

Run all backend test suites from the project root:

```bash
# Rescue workflow, state transitions, and contract tests
python -m pytest backend/test_rescue_workflow.py -v

# Agent endpoint integration & deterministic fallback tests
python test_agent_endpoints.py

# Haversine distance and matching engine tests
python test_implementation.py

# Restaurant ID mapping and relational integrity tests
python test_restaurant_ids.py

# Food taxonomy dataset verification
python test_food_taxonomy.py
```

Frontend production build check:

```bash
cd frontend
npm run build
```

---

## Key API Endpoints

### Core Resources
- `GET /health` - API health check
- `GET /api/restaurants/` - List restaurants
- `GET /api/shelters/` - List verified shelters / recipients
- `GET /api/volunteers/` - List registered volunteers
- `GET /api/donations/` & `POST /api/donations/` - Query and create food donations
- `GET /api/matches/` & `POST /api/matches/generate/{donation_id}` - Generate scored shelter matches
- `GET /api/pickups/` - View scheduled pickups

### AI Agent Endpoints
- `POST /api/agents/analyze-food` - Food perishability and urgency analysis
- `POST /api/agents/find-recipients` - Shelter compatibility matching
- `POST /api/agents/calculate-route` - Route travel time and expiry feasibility
- `POST /api/agents/coordinate` - Multi-agent synthesis and priority scoring
- `GET /api/agent_logs/` - Execution audit logs for all agent actions

### Rescue State Machine
- `POST /api/rescue/start/{donation_id}` - Initiate rescue workflow
- `POST /api/rescue/{rescue_id}/approve` - Human coordinator approval
- `POST /api/rescue/{rescue_id}/assign-volunteer` - Assign volunteer driver
- `POST /api/rescue/{rescue_id}/pickup` - Confirm food pickup with token
- `POST /api/rescue/{rescue_id}/delivery` - Confirm delivery with token
- `POST /api/rescue/{rescue_id}/complete` - Mark rescue completed

### Analytics & Mapping
- `GET /api/analytics/overview` - Platform KPIs, rescue volume, and success rates
- `GET /api/analytics/impact` - Estimated meals saved and diverted food metrics
- `GET /api/map/restaurants` - Restaurant coordinates
- `GET /api/map/recipients` - Shelter coordinates and capacities
- `GET /api/map/active-rescues` - Live active rescues and route coordinates

---

## Notes & Safety

- **Human-in-the-Loop**: The platform assists decision-making; a human coordinator must approve distribution before volunteers are notified.
- **Safety Heuristics**: Perishability estimates provide operational guidance and do not replace certified food safety inspections.
- **Data Integrity**: Source CSVs in `datasets/` remain read-only benchmarks.
