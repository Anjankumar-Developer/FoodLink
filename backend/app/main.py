import sys
from pathlib import Path

# Add the parent directory to sys.path to allow importing from scripts
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models.user import User
from .routes import restaurant, shelter, donation, volunteer, match, pickup, agent_log, analytics, map, agent, rescue, auth
from scripts.init_db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

init_db()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include routers
app.include_router(auth.router)
app.include_router(restaurant.router, tags=["restaurants"])
app.include_router(shelter.router, tags=["shelters"])
app.include_router(donation.router, tags=["donations"])
app.include_router(volunteer.router, tags=["volunteers"])
app.include_router(match.router, tags=["matches"])
app.include_router(pickup.router, tags=["pickups"])
app.include_router(agent_log.router, tags=["agent_logs"])
app.include_router(analytics.router, tags=["analytics"])
app.include_router(map.router, tags=["maps"])
app.include_router(agent.router, tags=["agents"])
app.include_router(rescue.router, tags=["rescue"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)