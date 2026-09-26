Now integrate the EXISTING FOODLINK frontend with the existing backend.

IMPORTANT:

The frontend already exists in:

frontend/

DO NOT rebuild it.

DO NOT replace the UI.

DO NOT create a new React project.

DO NOT change the visual design unless required to fix an integration issue.

Inspect the existing frontend first.

==================================================
STEP 1: FRONTEND AUDIT
==================================================

Inspect:

frontend/src/

Identify:

- routes
- pages
- components
- services
- API calls
- state management
- demo data
- map components
- charts
- loading states
- error states

Find whether an API service already exists.

If it exists, extend it.

If not, create:

frontend/src/services/api.js

==================================================
STEP 2: API CONTRACT
==================================================

Connect the frontend to:

GET /api/restaurants
GET /api/restaurants/{id}

GET /api/recipients
GET /api/recipients/{id}

GET /api/volunteers

GET /api/donations
GET /api/donations/{id}
POST /api/donations

GET /api/matches/donation/{donation_id}
POST /api/matches/generate/{donation_id}

POST /api/agents/analyze-food
POST /api/agents/find-recipients
POST /api/agents/calculate-route
POST /api/agents/coordinate
POST /api/agents/rescue/{donation_id}

==================================================
STEP 3: DEMO DATA
==================================================

The existing frontend may contain demoData.

Do NOT delete it immediately.

Use it only as explicit fallback/demo mode.

Production mode must use backend APIs.

Never silently replace failed API responses with fake data.

If backend is unavailable, show:

"Backend unavailable"

and provide an obvious demo-mode state if one already exists.

==================================================
STEP 4: ENVIRONMENT
==================================================

Configure frontend environment:

VITE_API_BASE_URL

Example:

VITE_API_BASE_URL=http://localhost:8000

Never put:

GEMINI_API_KEY

in frontend environment variables.

==================================================
STEP 5: CONNECT THESE SCREENS
==================================================

Dashboard:

- KPI data
- donations
- active rescues
- match statistics
- recipient statistics

Donations:

- list donations
- status
- expiry
- quantity
- restaurant

Donation Detail:

- donation information
- expiry countdown
- AI analysis
- recommended matches

Matches:

- candidate recipients
- score
- score breakdown
- distance
- ETA
- compatibility
- urgency
- capacity

AI Agents:

Display:

Food Agent
Recipient Agent
Route Agent
Coordinator Agent

Show:

status
execution
reasoning
timestamp

Live Map:

Use backend coordinates.

Display:

restaurants
recipients
volunteers
active rescues

Analytics:

Use backend data.

==================================================
STEP 6: ERROR STATES
==================================================

Every API page needs:

loading state
empty state
error state
retry action

Do not leave blank screens.

==================================================
STEP 7: CORS
==================================================

Fix backend CORS for local development.

Allow frontend origin.

Do not use unrestricted production CORS unless explicitly required.

==================================================
STEP 8: END-TO-END TEST
==================================================

Perform this exact flow:

1. Open dashboard
2. Load restaurants
3. Load recipients
4. Create donation
5. Generate matches
6. Run multi-agent analysis
7. Display recommended recipient
8. Display score breakdown
9. Display route
10. Display map
11. Continue to rescue workflow

Fix every API mismatch.

==================================================
DELIVERABLE
==================================================

Create:

FRONTEND_BACKEND_INTEGRATION.md

Include:

- endpoint
- method
- request body
- response
- frontend screen using it
- authentication requirement
- error handling

Then run:

frontend build
backend tests
API integration tests

Fix all errors.

Do not redesign the frontend.