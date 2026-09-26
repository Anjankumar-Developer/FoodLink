You are the senior backend engineer for FOODLINK AI.

Build the production-structured but hackathon-fast backend.

PROJECT

FOODLINK AI connects restaurant surplus food with verified shelters and coordinates rescue operations before food expires.

TECH STACK

Python 3.11+
FastAPI
Pydantic
SQLAlchemy
PostgreSQL
Supabase PostgreSQL
Uvicorn
python-dotenv
httpx

DO NOT:
- use microservices
- use Kafka
- use Redis
- use Celery
- use Kubernetes
- over-engineer authentication
- create unnecessary infrastructure

PROJECT STRUCTURE

backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   ├── agents/
│   └── utils/
├── scripts/
├── requirements.txt
├── .env.example
└── README.md

DATABASE MODELS

users:
id
name
email
role
created_at

restaurants:
id
name
address
latitude
longitude
rating
price_level
cuisine
food_categories
verified
created_at

shelters:
id
name
address
latitude
longitude
capacity
current_demand
accepted_food_types
verified
created_at

donations:
id
restaurant_id
food_name
food_category
quantity
diet_type
prepared_at
expires_at
storage_condition
status
created_at

matches:
id
donation_id
shelter_id
distance_km
travel_minutes
compatibility_score
urgency_score
capacity_score
pickup_score
demand_score
final_score
status
explanation
created_at

volunteers:
id
name
vehicle_type
availability
latitude
longitude
created_at

pickups:
id
match_id
volunteer_id
pickup_time
delivery_time
status
pickup_qr
delivery_qr
created_at

agent_logs:
id
donation_id
agent_name
action
reasoning
status
created_at

CREATE CRUD APIs.

Restaurants:
GET /api/restaurants
GET /api/restaurants/{id}

Shelters:
GET /api/shelters
GET /api/shelters/{id}
POST /api/shelters
PUT /api/shelters/{id}

Donations:
GET /api/donations
GET /api/donations/{id}
POST /api/donations
PUT /api/donations/{id}

Volunteers:
GET /api/volunteers
GET /api/volunteers/{id}

Matches:
GET /api/matches/donation/{donation_id}
POST /api/matches/generate/{donation_id}
POST /api/matches/{match_id}/accept
POST /api/matches/{match_id}/reject

Analytics:
GET /api/analytics/overview
GET /api/analytics/impact

Maps:
GET /api/map/restaurants
GET /api/map/shelters
GET /api/map/active-rescues

Agents:
POST /api/agents/analyze-food
POST /api/agents/find-shelters
POST /api/agents/calculate-route
POST /api/agents/coordinate

System:
GET /health

Implement:
- SQLAlchemy models
- Pydantic schemas
- database session management
- environment variables
- CORS
- proper HTTP status codes
- validation
- error handling

Do not implement Gemini logic yet.

Create database initialization/migration-friendly logic.

Create .env.example.

Run the backend.

Test every endpoint.

Fix all Python errors, import errors, database errors and CORS errors before finishing.