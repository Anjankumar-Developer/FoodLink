#!/usr/bin/env python3
"""
Test script to verify agent logging functionality.
"""

import sys
import os
from datetime import datetime

# Set environment variables before importing app modules
os.environ['DATABASE_URL'] = 'sqlite:///./foodlink.db'
os.environ['SECRET_KEY'] = 'your-secret-key-here'
os.environ['ALGORITHM'] = 'HS256'
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'
os.environ['PROJECT_NAME'] = 'FoodLink API'
os.environ['VERSION'] = '1.0.0'
os.environ['GEMINI_API_KEY'] = 'test-gemini-key-for-testing'

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import Base
from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.agent_log import AgentLog
from app.schemas.agent_log import AgentLogCreate

def test_agent_log_model():
    """Test that the AgentLog model works with the updated fields."""
    print("=== Testing AgentLog Model ===")

    # Create engine and tables using a temporary database for testing
    test_engine = create_engine('sqlite:///./test_agent_log.db')
    Base.metadata.create_all(bind=test_engine)

    # Create session
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSessionLocal()

    try:
        # Test creating an agent log with all required fields
        agent_log_data = AgentLogCreate(
            donation_id=1,
            agent_name="FoodAgent",
            action="analyze_food",
            input_summary="Donation: Apple pie, quantity: 2, expires_in: 24h",
            output_summary="Food is vegetarian, urgency: MEDIUM, estimated life: 18h",
            status="completed",
            execution_time_ms=150
        )

        # Create AgentLog instance
        agent_log = AgentLog(**agent_log_data.dict())

        # Add to database
        db.add(agent_log)
        db.commit()
        db.refresh(agent_log)

        print(f"[PASS] Successfully created agent log with ID: {agent_log.id}")
        print(f"  Agent name: {agent_log.agent_name}")
        print(f"  Action: {agent_log.action}")
        print(f"  Input summary: {agent_log.input_summary}")
        print(f"  Output summary: {agent_log.output_summary}")
        print(f"  Status: {agent_log.status}")
        print(f"  Execution time: {agent_log.execution_time_ms} ms")
        print(f"  Created at: {agent_log.created_at}")

        # Test querying the log
        retrieved_log = db.query(AgentLog).filter(AgentLog.id == agent_log.id).first()
        if retrieved_log:
            print(f"[PASS] Successfully retrieved agent log: {retrieved_log.id}")
        else:
            print("✗ Failed to retrieve agent log")

        # Test that all required fields are present
        # Note: agent_id is served by the id field
        assert hasattr(agent_log, 'id'), "id field missing (serves as agent_id)"
        assert hasattr(agent_log, 'input_summary'), "input_summary field missing"
        assert hasattr(agent_log, 'output_summary'), "output_summary field missing"
        assert hasattr(agent_log, 'execution_time_ms'), "execution_time_ms field missing"
        print("[PASS] All required fields present in AgentLog model")

    except Exception as e:
        print(f"[FAIL] Error testing AgentLog model: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        # Clean up test database
        try:
            os.remove('./test_agent_log.db')
        except:
            pass

    print("=== AgentLog Model Test Completed ===\n")

def test_agent_log_schema():
    """Test that the AgentLog schema validates correctly."""
    print("=== Testing AgentLog Schema ===")

    try:
        # Test valid data
        valid_data = {
            "donation_id": 1,
            "agent_name": "TestAgent",
            "action": "test_action",
            "input_summary": "Test input",
            "output_summary": "Test output",
            "status": "completed",
            "execution_time_ms": 100
        }

        log_create = AgentLogCreate(**valid_data)
        print("[PASS] AgentLogCreate schema validation passed")

        # Test with optional fields as None
        minimal_data = {
            "donation_id": 1,
            "agent_name": "TestAgent",
            "action": "test_action"
        }

        log_create_minimal = AgentLogCreate(**minimal_data)
        print("[PASS] AgentLogCreate schema validation with minimal data passed")

    except Exception as e:
        print(f"[FAIL] Error testing AgentLog schema: {e}")
        raise

    print("=== AgentLog Schema Test Completed ===\n")

if __name__ == "__main__":
    print("Starting Agent Logging Tests...\n")

    try:
        test_agent_log_model()
        test_agent_log_schema()
        print("INFO: All tests passed!")
    except Exception as e:
        print(f"ERROR: Tests failed with error: {e}")
        sys.exit(1)