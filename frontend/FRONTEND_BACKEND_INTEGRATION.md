# FoodLink Frontend / Backend Integration

The React frontend uses `VITE_API_BASE_URL` and appends `/api` when the value does not already end in `/api`. Set `VITE_USE_MOCK_API=true` only for explicit demo mode. Production requests never fall back to mock data; request failures are shown as `Backend unavailable` with a retry action.

## Resource endpoints

| Endpoint | Method | Request body | Response | Screen | Auth | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/restaurants` | GET | None; optional `skip`, `limit` | `Restaurant[]` | Donation creation, map | None | Loading/error state; retry |
| `/api/restaurants/{id}` | GET | None | `Restaurant` | Donation detail | None | Request error shown to user |
| `/api/shelters` | GET | None; optional `skip`, `limit` | `Shelter[]` | Recipients, matches, shelters | None | Loading/error state; retry |
| `/api/shelters/{id}` | GET | None | `Shelter` | Recipient detail | None | Request error shown to user |
| `/api/volunteers` | GET | None; optional `skip`, `limit` | `Volunteer[]` | Fleet and map | None | Loading/error state; retry |
| `/api/donations` | GET | None; optional `skip`, `limit` | `Donation[]` | Dashboard and Donations | None | Loading/error state; retry |
| `/api/donations/{id}` | GET | None | `Donation` | Donation detail | None | Request error shown to user |
| `/api/donations` | POST | `restaurant_id`, `food_name`, `food_category`, `quantity`, `prepared_at`, `expires_at`; optional `diet_type`, `storage_condition`, `status` | `Donation` | Create Donation | None | Validation or outage toast |
| `/api/matches/donation/{donation_id}` | GET | None | `Match[]` | Donation detail | None | Loading/error state; retry |
| `/api/matches/generate/{donation_id}` | POST | None | `Match[]` | Matches | None | Error toast; no fake replacement |

## Agent endpoints

| Endpoint | Method | Request body | Response | Screen | Auth | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/agents/analyze-food` | POST | Food fields such as `food_name`, `food_category`, `quantity`, `diet_type`, `prepared_at`, `expires_at` | Analysis object with urgency, remaining life, flags, and reasoning | Donation detail / agents | None | Error response or outage state |
| `/api/agents/find-recipients` | POST | Donation information | Recipient matches and reasoning | Matches | None | Error response or outage state |
| `/api/agents/calculate-route` | POST | Restaurant, recipient, and optional volunteer coordinates plus timestamps | Distance, ETA, feasibility, and route reason | Matches / map | None | Error response or outage state |
| `/api/agents/coordinate` | POST | `food_analysis`, `recipient_matches`, `route_info`, optional engine results | Recommendation, confidence, priority, next action | Agents | None | Error response or outage state |
| `/api/agents/rescue/{donation_id}` | POST | None | Coordination result and workflow steps | Match dispatch / rescue workflow | None | Error toast; retry from the same screen |

## Rescue state machine endpoints

| Endpoint | Method | Request body | State change |
| --- | --- | --- | --- |
| `/api/rescue/start/{donation_id}` | POST | None | Creates `AWAITING_APPROVAL` from the best eligible match |
| `/api/rescue/{rescue_id}/approve` | POST | None | `AWAITING_APPROVAL` -> `APPROVED`; human action required |
| `/api/rescue/{rescue_id}/assign-volunteer` | POST | Optional `{ "volunteer_id": 123 }` | `APPROVED` -> `VOLUNTEER_ASSIGNED` -> `PICKUP_PENDING` |
| `/api/rescue/{rescue_id}/pickup` | POST | None | `PICKUP_PENDING` -> `PICKED_UP` -> `DELIVERY_PENDING`; creates pickup token |
| `/api/rescue/{rescue_id}/delivery` | POST | None | `DELIVERY_PENDING` -> `DELIVERED`; creates delivery token |
| `/api/rescue/{rescue_id}/complete` | POST | None | `DELIVERED` -> `COMPLETED` |
| `/api/rescue/{rescue_id}` | GET | None | Returns current status, volunteer, tokens, and timeline |

Invalid transitions return HTTP `409`. Rejection and cancellation are available at `/api/rescue/{rescue_id}/reject` and `/api/rescue/{rescue_id}/cancel`. Verification tokens provide traceability only; they are not payment credentials.

## Common response and authentication rules

Backend resource endpoints return plain JSON objects or arrays. The frontend service wraps arrays as `{ success, data, total }` for existing components. The current backend does not expose authentication requirements, so no bearer token is required. The service still supports an authorization header for future protected deployments.

Network failures and non-2xx responses are propagated to pages. Pages must render loading, empty, and error states; they must not silently substitute demo records. Demo data is available only when `VITE_USE_MOCK_API=true`.

## Local setup

Create `frontend/.env.local` with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

`GEMINI_API_KEY` is server-side only and must not be placed in frontend environment files.
