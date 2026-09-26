FOODLINK AI: Complete 8-Hour Hackathon Blueprint

You’ve picked Problem Statement #305:

“Design a system that matches restaurants' surplus food with nearby shelters in real time, using a multi-agent architecture where specialized AI agents negotiate and hand off tasks autonomously.” 
prompthone ai edition Problem_S…

One important reality check before we build the shiny spaceship: the broad food-rescue concept is not unique by itself. There are already platforms and prototypes connecting surplus food with NGOs, shelters, volunteers, or consumers. For example, ZeroWasteLink, FoodShare, SaveFood, and FeedLink all operate in this general space.

So your differentiation cannot simply be “an app connecting restaurants and NGOs.”

Your winning angle should be:

FOODLINK AI is an AI coordination engine that decides which donation should go to which recipient, when, and through whom, while accounting for perishability, capacity, compatibility, distance, and pickup feasibility.

That is the product we build.

1. The Final Product
FOODLINK AI
Tagline

Rescue food before it expires.

Alternative:

From surplus to shelter, intelligently.

One-line description

FOODLINK AI is a real-time multi-agent food rescue platform that intelligently matches surplus food from restaurants with verified shelters and coordinates the most feasible pickup before the food expires.

2. The Core Problem

The problem isn't merely:

Restaurant has excess food.

and

Shelter needs food.

The actual problem is:

Restaurant
   │
   │ surplus food
   ↓
?????
   │
   ├── Which shelter?
   ├── Can they accept it?
   ├── Do they have capacity?
   ├── Is the food compatible?
   ├── How far away?
   ├── How long until expiry?
   ├── Who can pick it up?
   └── Can it arrive safely?

That's where FOODLINK operates.

3. The Big Idea

Instead of building a marketplace, build a:

Food Rescue Coordination Engine
              RESTAURANT
                  │
                  ▼
          ┌───────────────┐
          │  FOOD AGENT   │
          └───────┬───────┘
                  │
                  ▼
        Food characteristics
                  │
                  ▼
          ┌───────────────┐
          │ SHELTER AGENT │
          └───────┬───────┘
                  │
                  ▼
        Compatible shelters
                  │
                  ▼
          ┌───────────────┐
          │  ROUTE AGENT  │
          └───────┬───────┘
                  │
                  ▼
            Pickup routes
                  │
                  ▼
       ┌────────────────────┐
       │ COORDINATOR AGENT  │
       └─────────┬──────────┘
                 │
                 ▼
            FINAL MATCH

This architecture directly addresses the multi-agent constraint in the assigned problem statement. 
prompthone ai edition Problem_S…

4. Your Differentiator

This is the most important part.

Don't call it:

AI food donation app.

That's too generic.

Call it:

Expiry-Aware Multi-Agent Rescue Optimization

The system doesn't simply find the nearest shelter.

It determines the best feasible rescue.

5. Matching Algorithm

Give every possible donor → shelter pair a score.

For example:

Match Score =
    25% Distance
  + 20% Food Compatibility
  + 20% Expiry Urgency
  + 15% Shelter Capacity
  + 10% Pickup Availability
  + 10% Recipient Priority

For a demo, use a transparent weighted score.

Example:

Restaurant:
35 meals
Vegetarian
Expires in 2h 40m

Shelter A:
2.4 km
Capacity: 40
Vegetarian accepted
Pickup available

Score: 94

Shelter B:

1.3 km
Capacity: 10
Vegetarian accepted
Pickup unavailable

Score: 61

Therefore:

Shelter A wins despite being farther away.

That is much more interesting than nearest-neighbor matching.

6. The Four AI Agents
Agent 1: FOOD AGENT
Responsibility

Understand the donation.

Input:

{
  "food_name": "Vegetable Biryani",
  "quantity": 35,
  "food_type": "cooked_meal",
  "diet": "vegetarian",
  "prepared_at": "18:00",
  "expiry_at": "21:00"
}

Output:

{
  "category": "cooked_meal",
  "diet": "vegetarian",
  "quantity": 35,
  "urgency": "HIGH",
  "remaining_minutes": 120
}
7. SHELTER AGENT

Checks:

Capacity
Food preferences
Dietary requirements
Operating hours
Location
Current demand
Pickup availability

Example:

{
  "shelter": "Hope Community Kitchen",
  "capacity": 50,
  "accepted_food": ["vegetarian", "vegan"],
  "current_demand": "high",
  "pickup_available": true
}
8. ROUTE AGENT

Determines:

Distance
Travel time
Pickup window
Expiry window
Route feasibility

Example:

Restaurant
     ↓
2.4 km
     ↓
Shelter

Travel:
14 min

Food remaining:
148 min

SAFE

Use Leaflet + OpenStreetMap for the visual map.

For the hackathon, you don't need a sophisticated routing infrastructure.

9. COORDINATOR AGENT

This is the star.

It receives the other agents' outputs.

FOOD AGENT
     ↓
35 vegetarian meals
     ↓
SHELTER AGENT
     ↓
4 compatible shelters
     ↓
ROUTE AGENT
     ↓
3 feasible routes
     ↓
COORDINATOR
     ↓
Best match

The coordinator produces:

{
  "selected_shelter": "Hope Community Kitchen",
  "allocated_meals": 30,
  "match_score": 94,
  "reason": "High compatibility, sufficient capacity, short travel time and active pickup availability."
}
10. The Killer Demo

This is how you should present the project.

Step 1

Open restaurant dashboard.

FOODLINK AI

Restaurant:
Green Bowl Kitchen

Current Surplus:

🍚 Vegetable Biryani
35 meals

⏱ Expires in:
2h 42m

Diet:
Vegetarian

Button:

RESCUE FOOD
Step 2

AI processing animation:

FOOD AGENT
✓ Donation analyzed

SHELTER AGENT
✓ 6 shelters found

ROUTE AGENT
✓ 4 feasible routes

COORDINATOR
● Optimizing match...
Step 3

Result:

🎯 Best Rescue Match
Hope Community Kitchen

Distance
2.4 km

Capacity
40 meals

Compatibility
100%

Pickup
Available

Expiry Safety
HIGH

Match Score
94%
Step 4

Show map.

🍛 Restaurant
       │
       │ 14 min
       ↓
🟢 Shelter
Step 5

Show reasoning.

Why this match?

✓ Accepts vegetarian food
✓ Can receive 30 meals
✓ Pickup available
✓ 14-minute travel time
✓ Food remains safe for 148 minutes
✓ High recipient demand
11. Add a Human Approval Layer

Don't let the AI autonomously make safety-sensitive decisions.

Instead:

AI recommendation
       ↓
Human confirmation
       ↓
Donation confirmed

Button:

APPROVE RESCUE

This makes the system much more responsible.

The current food-rescue challenge landscape also emphasizes food-safety controls and describes these systems as coordination/decision-support rather than autonomous safety decisions.

12. Food Safety

This is important.

Don't make claims like:

"Our AI guarantees the food is safe."

It doesn't.

Instead:

Food Safety Checklist

Restaurant enters:

Preparation time
Storage condition
Packaging condition
Current temperature
Food category

System shows:

⚠ HUMAN VERIFICATION REQUIRED

Food has 2h 31m remaining
according to the submitted information.

Verify storage and handling
conditions before handoff.

This is much more defensible.

13. Add QR Handoff Verification

This makes your project look substantially more complete.

Workflow:

Restaurant
   ↓
Donation created
   ↓
Shelter accepts
   ↓
Volunteer assigned
   ↓
Pickup
   ↓
QR verification
   ↓
Delivery
   ↓
Completed

At pickup:

SCAN QR

Then:

✓ Pickup verified
18:42

At delivery:

SCAN QR

Then:

✓ Donation delivered

30 meals rescued
14. User Roles

Use four roles.

1. Restaurant

Can:

create donation
track donation
see matched shelter
approve pickup
view impact
2. Shelter

Can:

set capacity
define accepted food
create food requests
accept donations
confirm delivery
3. Volunteer

Can:

see available pickups
accept route
navigate
verify pickup
verify delivery
4. Admin

Can:

verify restaurants
verify shelters
monitor rescue activity
view analytics
manage flagged donations
15. Main Pages

Don't build 40 pages.

Build these.

/
├── Landing
├── Login
├── Dashboard
├── Donations
├── Create Donation
├── Shelters
├── Matches
├── Rescue Map
├── Agent Activity
├── Impact Analytics
└── Profile
16. Restaurant Dashboard
FOODLINK AI

Good evening, Green Bowl 👋

┌─────────────┬─────────────┬─────────────┐
│ Donations   │ Meals Saved │ CO₂ Estimate │
│ 24          │ 486         │ 121 kg       │
└─────────────┴─────────────┴─────────────┘

ACTIVE RESCUE

35 Vegetarian Meals
Expires in 2h 42m

AI Match
Hope Community Kitchen
2.4 km

[VIEW MATCH]
17. Shelter Dashboard
SHELTER DASHBOARD

Current Capacity
████████░░ 78%

Meals Needed Today
120

Incoming Donations
4

Urgent Requests
2

────────────────

MATCH REQUEST

30 Vegetarian Meals

Distance: 2.4 km

[ACCEPT]
[DECLINE]
18. Volunteer Dashboard
ACTIVE PICKUPS

#FL-2048

Green Bowl Kitchen
       ↓
Hope Community Kitchen

2.4 km

Estimated time:
14 minutes

Food:
30 meals

Status:
READY FOR PICKUP

[ACCEPT PICKUP]
19. Admin Dashboard
FOODLINK COMMAND CENTER

Active Donations        27
Active Shelters         18
Active Volunteers       42
Meals Rescued         1,284

At-Risk Donations        7

──────────────────────────

LIVE RESCUE MAP

🍛 → 🟢
🍛 → 🟢
🍛 → 🟡
20. AI Agent Monitor

This should be one of your most visually impressive screens.

AI AGENT NETWORK

● FOOD AGENT
Analyzing donation #FL2048
          ↓
✓ 35 meals
✓ Vegetarian
✓ 162 min remaining

● SHELTER AGENT
Evaluating 8 shelters
          ↓
✓ 4 compatible

● ROUTE AGENT
Calculating routes
          ↓
✓ 3 feasible

● COORDINATOR
Optimizing final match
          ↓
✓ Hope Community Kitchen

STATUS
RESCUE READY

Judges can literally see your multi-agent architecture working.

21. Impact Dashboard

Track:

Meals Rescued
1,284

Food Rescued
642 kg

Successful Donations
94%

Average Match Time
18 sec

Average Pickup Time
23 min

For environmental metrics, label estimates clearly rather than presenting calculated impact as measured fact.

22. Recommended Tech Stack

This is where we avoid the traditional hackathon disease of using 19 technologies because someone saw them on LinkedIn.

Frontend
React + Vite
React
Vite
JavaScript

Why?

Fast setup.

Simple.

Excellent ecosystem.

Styling
Tailwind CSS

Use:

Tailwind CSS
shadcn/ui
Lucide React
Charts
Recharts

For:

rescue trends
meals rescued
donation analytics
shelter capacity
Maps
Leaflet

with:

OpenStreetMap
23. Backend
FastAPI
Python
FastAPI
Pydantic
SQLAlchemy

Why FastAPI?

Because your matching logic and AI orchestration naturally fit Python.

24. Database
Supabase PostgreSQL

For the deployed version.

Why not MongoDB?

You have relational data:

Restaurant
    ↓
Donation
    ↓
Match
    ↓
Shelter
    ↓
Volunteer
    ↓
Handoff

PostgreSQL is a natural fit.

And Supabase gives you:

hosted PostgreSQL
dashboard
easy credentials
backups
optional authentication
25. AI
Gemini API

Use the LLM for:

Food Agent

Classification/extraction.

Shelter Agent

Interpretation of shelter requirements.

Coordinator

Reasoning/explanation.

Impact Assistant

Natural-language insights.

26. Don't Use AI for Everything

This is extremely important.

Use normal code for:

Distance
Capacity
Expiry
Filtering
Scores
Database queries
Route calculations

Use AI for:

Unstructured text
Food descriptions
Natural-language reasoning
Agent coordination
Explanation
Recommendations

That gives you a much stronger engineering story.

27. Architecture
                    FOODLINK AI
                         │
              ┌──────────┴──────────┐
              │                     │
          React App             FastAPI
              │                     │
              │            ┌────────┼────────┐
              │            │        │        │
              │         Matching   Agent    APIs
              │          Engine    Engine
              │                     │
              │        ┌────────────┼────────────┐
              │        │            │            │
              │      Food         Shelter      Route
              │      Agent         Agent       Agent
              │        │            │            │
              │        └────────────┼────────────┘
              │                     │
              │               Coordinator
              │                     │
              └──────────────┬──────┘
                             │
                       PostgreSQL
                         Supabase
                             │
                     ┌───────┴────────┐
                     │                │
                  Gemini           Maps API
28. Database Schema

Keep it to 8 tables.

users
id
name
email
role
created_at
restaurants
id
user_id
name
address
latitude
longitude
verified
shelters
id
user_id
name
address
latitude
longitude
capacity
current_demand
accepted_food_types
verified
donations
id
restaurant_id
food_name
food_category
quantity
diet_type
prepared_at
expires_at
status
created_at
matches
id
donation_id
shelter_id
distance_km
travel_minutes
compatibility_score
urgency_score
final_score
status
volunteers
id
user_id
vehicle_type
availability
latitude
longitude
pickups
id
match_id
volunteer_id
pickup_time
delivery_time
status
agent_logs
id
donation_id
agent_name
action
reasoning
created_at
29. API Structure
Authentication
POST /auth/register
POST /auth/login
GET /auth/me
Restaurants
GET /restaurants
GET /restaurants/{id}
Shelters
GET /shelters
GET /shelters/{id}
POST /shelters
PUT /shelters/{id}
Donations
POST /donations
GET /donations
GET /donations/{id}
PUT /donations/{id}
DELETE /donations/{id}
Matching
POST /matches/generate
GET /matches/{donation_id}
POST /matches/{id}/accept
POST /matches/{id}/reject
Agents
POST /agents/analyze-food
POST /agents/find-shelters
POST /agents/calculate-route
POST /agents/coordinate
POST /agents/rescue
Pickup
POST /pickups
PUT /pickups/{id}/pickup
PUT /pickups/{id}/delivery
Analytics
GET /analytics/overview
GET /analytics/donations
GET /analytics/impact
30. Folder Structure

Keep it clean.

foodlink-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── database/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env
│
└── README.md
31. Agent Structure
agents/
│
├── food_agent.py
├── shelter_agent.py
├── route_agent.py
└── coordinator_agent.py
food_agent.py
analyze_food()
shelter_agent.py
find_compatible_shelters()
route_agent.py
calculate_route()
coordinator_agent.py
generate_matches()
select_best_match()
explain_decision()
32. The Matching Engine

Your backend should first perform deterministic filtering.

Donation
   ↓
Find shelters
   ↓
Remove:
  ❌ closed shelters
  ❌ insufficient capacity
  ❌ incompatible food
  ❌ impossible travel time
   ↓
Remaining candidates
   ↓
Calculate scores
   ↓
Rank
   ↓
AI explains

This is much better than asking an LLM:

"Hey Gemini, which shelter should get this biryani?"

Please don't make a language model perform arithmetic and logistics while wearing a fake mustache.

33. Match Score Formula

Use:

Final Score =
    0.25 × Distance Score
  + 0.20 × Compatibility Score
  + 0.20 × Urgency Score
  + 0.15 × Capacity Score
  + 0.10 × Pickup Score
  + 0.10 × Demand Score

Normalize everything from:

0 → 100

Then:

Final Score = 0 → 100
34. Example

Donation:

35 vegetarian meals
Expires in 140 minutes

Shelter A:

2 km
Capacity 50
Vegetarian
Pickup available
High demand

Result:

Distance:       96
Compatibility:  100
Urgency:         82
Capacity:       100
Pickup:         100
Demand:          90

Final:
94.3

Shelter B:

1 km
Capacity 15
Vegetarian
Pickup unavailable
Medium demand

Result:

Final:
67.4

AI recommendation:

Shelter A is preferred because its greater capacity and immediate pickup availability outweigh the additional travel distance.

Now your AI is explaining a real algorithm.

35. "Negotiation" Between Agents

Because the statement specifically says agents should negotiate and hand off tasks, demonstrate that visibly.

Example:

FOOD AGENT

35 meals available.
Expiry: 140 min.

        ↓

SHELTER AGENT

Shelter A can accept 30.
Shelter B can accept 15.

        ↓

ROUTE AGENT

Shelter A:
14 min

Shelter B:
31 min

        ↓

COORDINATOR

Shelter A receives 30.
Shelter B receives 5.

        ↓

FINAL
35 meals rescued

That is enough for a convincing prototype.

36. What "Self-Improving" Means

The assigned problem doesn't require self-learning, only #305 multi-agent negotiation.

So do not invent unnecessary continual learning.

Instead, the coordinator can learn from successful outcomes in an optional stretch feature:

Recommendation
     ↓
Human accepts/rejects
     ↓
Feedback stored
     ↓
Future weighting adjusted

But this is Phase 2, not your core 8-hour build.

37. Synthetic Demo Data

You'll need enough data to make the dashboard feel alive.

Create:

10 restaurants
Green Bowl
Urban Tiffins
Spice Hub
Fresh Kitchen
Cafe 24
Biryani House
Daily Dosa
The Meal Lab
South Kitchen
Food Junction
10 shelters
Hope Community Kitchen
City Night Shelter
Care Foundation
Community Food Center
Helping Hands
...
30 donations

Different:

Biryani
Rice
Dal
Chapati
Sandwiches
Vegetable curry
Fruits
Bakery items
15 volunteers

Various:

Bike
Scooter
Car
Walking

Clearly label these as demo/synthetic data in the project.

38. The Landing Page

Hero:

Don't Let Good Food Expire.
Subheading

FOODLINK AI connects surplus food with verified shelters using real-time multi-agent coordination.

Buttons:

[Start Rescue]

[View Live Network]

Then:

1,284+
Meals Rescued

94%
Successful Matches

18
Active Shelters

23 min
Avg Pickup

For the demo, these are simulated metrics, so label them appropriately.

39. Visual Style

Use:

Background
#0B0F14
Cards
#111820
Primary

Green.

Accent

Warm orange.

Status
Success → Green
Warning → Amber
Danger → Red
Info → Blue

No purple.

Your interface should feel like:

modern logistics SaaS + humanitarian platform

not:

college project with 14 gradients and a giant "AI POWERED" badge.

40. Animations

Use Framer Motion only where useful.

Animate:

Agent execution
Cards
Dashboard numbers
Map markers
Match generation
Status changes

Example:

Food Agent
     ↓
animated connector
     ↓
Shelter Agent
     ↓
animated connector
     ↓
Route Agent
     ↓
Coordinator

That could look excellent during judging.

41. 8-Hour Execution Plan

This is the part you should actually follow.

Hour 1
Frontend foundation

Build:

React
Vite
Tailwind
Routing
Sidebar
Navbar
Dashboard shell

Pages:

Login
Dashboard
Donations
Create Donation
Matches
Map
Agent Activity
Hour 2
Backend foundation

Build:

FastAPI
Database connection
Models
Schemas
CORS
Basic CRUD
Hour 3
Core matching

Implement:

distance
capacity
compatibility
expiry
score
ranking

This is more important than fancy AI.

Hour 4
Donation → Matching flow

Complete:

Create Donation
      ↓
Find Shelters
      ↓
Calculate Scores
      ↓
Generate Match
      ↓
Show Recommendation

At this point you should already have a working MVP.

Hour 5
AI agents

Implement:

Food Agent
Shelter Agent
Route Agent
Coordinator

Keep them lightweight.

Hour 6
Map + Rescue Flow

Build:

Map
Markers
Route
Volunteer
Pickup
Delivery

Then add QR simulation.

Hour 7
Polish

Add:

animations
charts
agent monitor
notifications
loading states
error handling
responsive layout
Hour 8
Demo hardening

Do not add major features.

Test:

Login
↓
Create donation
↓
AI analysis
↓
Find shelters
↓
Match
↓
Map
↓
Approve
↓
Pickup
↓
Delivery
↓
Impact

Then deploy.

42. What NOT to Build

This is equally important.

Don't build:

❌ Real-time chat
❌ Payment system
❌ Full food delivery system
❌ Advanced computer vision
❌ Custom ML model
❌ IoT sensors
❌ Blockchain
❌ Complex route optimization
❌ Native Android app
❌ Separate microservices
❌ Kafka
❌ Kubernetes
❌ Facial recognition
❌ 15 different AI agents

Your project needs to work, not qualify for a cloud architecture certification.

43. MVP vs Stretch
MUST HAVE
✓ Restaurant
✓ Shelter
✓ Donation
✓ Matching
✓ Multi-agent flow
✓ Match score
✓ Map
✓ Dashboard
✓ Database
✓ AI explanation
SHOULD HAVE
✓ Volunteer
✓ Pickup tracking
✓ QR verification
✓ Impact dashboard
✓ Agent activity
STRETCH
○ Demand forecasting
○ Food image classification
○ Dynamic volunteer routing
○ SMS/WhatsApp notifications
○ Continual feedback learning
○ Cold-chain monitoring

If you finish the MVP early, only then touch stretch features.

44. The Demo Story

Your presentation should be:

Problem

Restaurants have surplus food. Shelters have demand. The difficult part is coordinating the right donation before it expires.

Solution

FOODLINK AI creates an intelligent rescue network.

Technology

Four specialized AI agents coordinate food analysis, recipient matching, route feasibility, and final allocation.

Demo

Restaurant creates:

35 vegetarian meals
2h 40m expiry

AI analyzes it.

AI finds:

6 shelters

Filters them.

Calculates:

4 feasible

Ranks them.

Selects:

Hope Community Kitchen

Route:

2.4 km
14 minutes

Human approves.

Volunteer picks up.

Shelter confirms.

Then:

35 meals rescued.
45. The 90-Second Demo
0–15 sec

Landing page.

"This is FOODLINK AI."

15–30 sec

Restaurant creates donation.

30–45 sec

Show agents working.

Food Agent ✓
Shelter Agent ✓
Route Agent ✓
Coordinator ✓
45–60 sec

Show best match.

60–75 sec

Show live map.

75–90 sec

Complete pickup.

Show:

35 meals rescued
2.4 km route
14 min pickup
1 successful rescue

Then finish with:

"We aren't building another food listing platform. We're building the intelligence layer that coordinates food rescue before the food expires."

That sentence is important because the existing ecosystem already contains food-sharing/rescue products.

46. Your Technical USP

Put this on your architecture slide:

FOODLINK AI = Matching + Multi-Agent Coordination + Perishability
Traditional platform

Food → Recipient

FOODLINK

Food
 ↓
Understand
 ↓
Filter
 ↓
Score
 ↓
Negotiate
 ↓
Route
 ↓
Human Verify
 ↓
Rescue
 ↓
Measure Impact

That's the distinction.

47. Your Innovation Slide
Existing approach
List donation
       ↓
People browse
       ↓
Someone accepts
FOODLINK
Donation
    ↓
AI understands
    ↓
AI identifies recipients
    ↓
AI evaluates perishability
    ↓
AI evaluates logistics
    ↓
Agents coordinate
    ↓
Best rescue selected
    ↓
Human verifies
48. Responsible AI

Include a slide.

FOODLINK does NOT:
guarantee food safety
autonomously distribute food
make medical decisions
replace human verification
FOODLINK DOES:
prioritize feasible matches
provide explainable recommendations
surface expiry risk
assist coordination
maintain traceability

This is especially useful because food-rescue systems have genuine safety and verification considerations. Current food-rescue challenge guidance explicitly calls for safety and verification controls.

49. Future Roadmap

Don't promise 74 things.

Phase 1
AI matching
Multi-agent coordination
Maps
Tracking
Analytics
Phase 2
Demand forecasting
Volunteer optimization
Food image classification
Phase 3
Cold-chain integration
IoT temperature monitoring
Municipal partnerships
Large-scale NGO networks
50. Future AI

Eventually:

Historical donations
        ↓
Demand prediction
        ↓
Shelter needs
        ↓
Restaurant surplus prediction
        ↓
Proactive matching

So FOODLINK evolves from:

Reactive rescue

to:

Predictive rescue

That's a strong future story.

51. Suggested GitHub README tagline
FOODLINK AI
───────────

An AI-powered multi-agent coordination platform
for rescuing surplus food before it expires.

Restaurant → AI Matching → Shelter → Volunteer → Rescue

Built with:
React • FastAPI • PostgreSQL • Gemini • Leaflet
52. Final Technology Stack

This is the stack I recommend you actually use:

┌───────────────────────────────┐
│           FRONTEND            │
│                               │
│ React + Vite                  │
│ Tailwind CSS                  │
│ shadcn/ui                     │
│ Framer Motion                 │
│ Recharts                      │
│ Leaflet                       │
└───────────────┬───────────────┘
                │ REST
                ↓
┌───────────────────────────────┐
│           BACKEND             │
│                               │
│ Python                        │
│ FastAPI                       │
│ Pydantic                      │
│ SQLAlchemy                    │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ↓                ↓
┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │   Gemini API  │
│   Supabase    │  │      AI       │
└───────────────┘  └───────────────┘
Deployment
Frontend → Vercel
Backend  → Render / Railway
Database → Supabase
AI       → Gemini API
Maps     → OpenStreetMap + Leaflet
53. The Exact MVP You Should Have at the End

If the clock hits 8 hours and you have this:

                    FOODLINK AI

Restaurant
   │
   │ Create Donation
   ↓
35 Vegetarian Meals
Expires: 2h 40m
   │
   ↓
┌────────────────────────────┐
│      AI AGENT NETWORK      │
│                            │
│ Food Agent       ✓         │
│ Shelter Agent    ✓         │
│ Route Agent      ✓         │
│ Coordinator      ✓         │
└──────────────┬─────────────┘
               ↓
        BEST MATCH: 94%
               ↓
      Hope Community Kitchen
               ↓
           2.4 km
          14 minutes
               ↓
        HUMAN APPROVAL
               ↓
          VOLUNTEER
               ↓
             QR
               ↓
          DELIVERY
               ↓
        🍛 35 MEALS RESCUED

Stop. That's your MVP.

Don't sacrifice that working flow to add some magnificent AI feature that takes the entire final hour and then discovers the API key has expired. Human civilization has suffered enough.

Your project identity

Problem: #305
Product: FOODLINK AI
Core innovation: Expiry-aware multi-agent rescue coordination
Frontend: React + Vite + Tailwind
Backend: FastAPI
Database: Supabase PostgreSQL
AI: Gemini
Maps: Leaflet + OpenStreetMap
Charts: Recharts
Deployment: Vercel + Render/Railway + Supabase
Core demo: Restaurant → Agents → Best Shelter → Route → Human Approval → QR Handoff → Impact
