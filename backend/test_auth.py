import asyncio
import os
import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User


asyncio.set_event_loop(asyncio.new_event_loop())


def test_signup_and_login_flow():
    unique_email = f"{uuid.uuid4().hex[:8]}@example.com"
    signup_payload = {
        "name": "Aisha Khan",
        "email": unique_email,
        "password": "securepass123",
        "role": "coordinator",
    }

    db = SessionLocal()
    try:
        db.query(User).filter(User.email == unique_email.lower()).delete()
        db.commit()
    finally:
        db.close()

    with TestClient(app) as client:
        signup_response = client.post("/auth/signup", json=signup_payload)
        assert signup_response.status_code == 200, signup_response.text

        login_response = client.post(
            "/auth/login",
            json={"email": signup_payload["email"], "password": signup_payload["password"]},
        )
        assert login_response.status_code == 200, login_response.text
        data = login_response.json()
        assert "token" in data
        assert data["user"]["email"] == signup_payload["email"]
