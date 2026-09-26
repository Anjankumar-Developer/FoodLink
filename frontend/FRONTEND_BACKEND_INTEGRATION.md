# FOODLINK AI - Frontend & Backend Integration Specification

## 1. Architecture Overview
- **Frontend**: React 18 SPA built with Vite, Tailwind CSS, Lucide React icons, Leaflet (interactive maps), and Recharts (impact telemetry).
- **Routing**: Client-side routing managed via `HashRouter` from `react-router-dom` to support nested paths in preview/iframe hosting environments.
- **Backend**: Node.js Express server running on port `3000` with direct Vite middleware integration in development and static asset serving in production.
- **AI Engine**: Google Gemini API via official `@google/genai` TypeScript/JavaScript SDK running on the server side (`server.js`) with `aistudio-build` User-Agent telemetry.

---

## 2. API Endpoints Contract

### A. AI Assistant & Voice Dictation (`server.js`)

#### 1. Audio Transcription
- **Endpoint**: `POST /api/transcribe`
- **Model**: `gemini-3.5-transcribe`
- **Request Body**:
  ```json
  {
    "audio": "data:audio/webm;base64,...",
    "mimeType": "audio/webm"
  }
  ```
- **Response**:
  ```json
  {
    "text": "Spoken transcript...",
    "transcription": "Spoken transcript...",
    "modelUsed": "gemini-3.5-transcribe"
  }
  ```

#### 2. Google Maps Grounding
- **Endpoint**: `POST /api/maps-grounding`
- **Model**: `gemini-3.5-flash` with `{ tools: [{ googleMaps: {} }] }`
- **Request Body**:
  ```json
  {
    "query": "Find emergency soup kitchens and food pantries near downtown",
    "location": {
      "latitude": 37.778,
      "longitude": -122.416
    }
  }
  ```
- **Response**:
  ```json
  {
    "text": "Analysis and verified locations...",
    "places": [
      {
        "title": "St. Anthony's Dining Room",
        "uri": "https://maps.google.com/?cid=...",
        "reviewSnippets": []
      }
    ],
    "groundingChunks": [...],
    "modelUsed": "gemini-3.5-flash"
  }
  ```

#### 3. Multi-Turn Conversational Rescue Assistant
- **Endpoint**: `POST /api/chat`
- **Models**:
  - `gemini-3.5-flash` (Default general tasks and maps grounding)
  - `gemini-3.1-pro-preview` (Complex multi-agent arbitration)
  - `gemini-3.1-flash-lite` (High-speed lookup queries)
- **Request Body**:
  ```json
  {
    "messages": [
      { "role": "user", "content": "How do I maintain safe temperature for cooked pasta?" }
    ],
    "model": "gemini-3.5-flash",
    "systemInstruction": "You are the FOODLINK AI Operations Assistant...",
    "useMaps": false,
    "location": { "latitude": 37.778, "longitude": -122.416 }
  }
  ```
- **Response**:
  ```json
  {
    "text": "Response text...",
    "places": [...],
    "groundingChunks": [...],
    "modelUsed": "gemini-3.5-flash"
  }
  ```

---

## 3. Operations & Logistics Service Layer (`src/services/api.js`)
All frontend UI components interact via the centralized `api` singleton. When backend endpoints are being prototyped, `api` seamlessly falls back to the in-memory `mockApi` implementation so local development and end-to-end workflows are never blocked.

- `api.getDonations(params)`: Retrieves food surplus listings filtered by status or search.
- `api.getDonationById(id)`: Retrieves a single donation record.
- `api.createDonation(donationData)`: Registers a new food surplus batch.
- `api.updateDonation(id, updateData)`: Updates donation parameters or status.
- `api.getShelters(params)`: Retrieves verified shelter registry.
- `api.updateShelterDemand(id, mealsNeeded)`: Updates dining census demand.
- `api.getAgents()` / `api.getAgentStatus(id)`: Retrieves multi-agent monitor states.
- `api.triggerConsensusCycle()`: Initiates multi-agent arbitration cycle.
- `api.getMatches()`: Fetches prioritized food-to-shelter matches.
- `api.acceptMatch(matchId)`: Dispatches match to volunteer transport.
- `api.getVolunteers()`: Fetches active courier fleet.
- `api.getAnalytics(timeframe)`: Returns rescue volume and SLA compliance.
- `api.getDashboardStats()`: Returns real-time aggregate KPI metrics.

---

## 4. Environment Variables Configuration
- `GEMINI_API_KEY`: Google Gemini API Key (server-side only in `server.js`).
- `PORT`: Server port (default `3000`).
- `VITE_API_BASE_URL`: Client-side base URL (default `/api`).
- `VITE_USE_MOCK_API`: Set to `'true'` to force mock data mode on client.

---

## 5. Client Route Architecture (`src/App.jsx`)
Managed using `HashRouter` with route contract:
- `#/`: Landing Page (wrapped in `PublicLayout`)
- `#/login`: Authentication Portal (wrapped in `PublicLayout`)
- `#/dashboard`: Real-Time Logistics Command Center (wrapped in `DashboardLayout`)
- `#/donations`: Food Surplus Listings (wrapped in `DashboardLayout`)
- `#/donations/new`: Log Surplus with Voice Dictation (wrapped in `DashboardLayout`)
- `#/matches`: Autonomous Rescue Matches (wrapped in `DashboardLayout`)
- `#/shelters`: Verified Shelter Directory (wrapped in `DashboardLayout`)
- `#/volunteers`: Transport Fleet Operations (wrapped in `DashboardLayout`)
- `#/map`: Geospatial Corridor Map with Google Maps Grounding (wrapped in `DashboardLayout`)
- `#/agents`: Autonomous Multi-Agent Telemetry (wrapped in `DashboardLayout`)
- `#/analytics`: Operational & Environmental Impact (wrapped in `DashboardLayout`)
- `#/profile`: Coordinator Profile & Compliance Settings (wrapped in `DashboardLayout`)
