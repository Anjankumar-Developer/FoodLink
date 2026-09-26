#!/usr/bin/env python3
"""
Integration test for agent endpoints.
This test will work once the agent endpoints are implemented.
"""

import sys
import os
import json
from datetime import datetime, timedelta

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

from fastapi.testclient import TestClient
from app.main import app

def test_agent_endpoints():
    """Test that all agent endpoints are working correctly."""
    print("=== Testing Agent Endpoints ===")

    # Create test client
    client = TestClient(app)

    # Test data for a sample donation
    test_donation = {
        "food_name": "Vegetarian Pizza",
        "food_category": "Cooked Food",
        "description": "Leftover vegetarian pizza from event",
        "quantity": "10 slices",
        "diet_type": "vegetarian",
        "prepared_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=6)).isoformat(),
        "storage_condition": "refrigerated"
    }

    test_results = []

    # Test 1: Food Agent endpoint
    try:
        print("\n--- Testing Food Agent ---")
        response = client.post("/api/agents/analyze-food", json=test_donation)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Food Agent responded: {json.dumps(data, indent=2)}")
            test_results.append(("Food Agent", True, str(data)))
        else:
            print(f"[FAIL] Food Agent failed with status {response.status_code}: {response.text}")
            test_results.append(("Food Agent", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"[ERROR] Food Agent exception: {e}")
        test_results.append(("Food Agent", False, f"Exception: {e}"))

    # Test 2: Recipient Agent endpoint
    try:
        print("\n--- Testing Recipient Agent ---")
        # First, we need some recipient data - let's see if we can get it from the DB
        # For now, we'll send a request that would trigger the agent logic
        recipient_request = {
            "donation_info": test_donation,
            "available_recipients": []  # Empty for now, agent should query DB
        }
        response = client.post("/api/agents/find-recipients", json=recipient_request)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Recipient Agent responded: {json.dumps(data, indent=2)[:200]}...")
            test_results.append(("Recipient Agent", True, str(data)[:100]))
        else:
            print(f"[FAIL] Recipient Agent failed with status {response.status_code}: {response.text}")
            test_results.append(("Recipient Agent", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"[ERROR] Recipient Agent exception: {e}")
        test_results.append(("Recipient Agent", False, f"Exception: {e}"))

    # Test 3: Route Agent endpoint
    try:
        print("\n--- Testing Route Agent ---")
        route_request = {
            "pickup_location": {"latitude": 17.3850, "longitude": 78.4867},  # Hyderabad
            "delivery_location": {"latitude": 17.4065, "longitude": 78.4772},  # Nearby location
            "expiry_window_minutes": 360  # 6 hours
        }
        response = client.post("/api/agents/calculate-route", json=route_request)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Route Agent responded: {json.dumps(data, indent=2)}")
            test_results.append(("Route Agent", True, str(data)))
        else:
            print(f"[FAIL] Route Agent failed with status {response.status_code}: {response.text}")
            test_results.append(("Route Agent", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"[ERROR] Route Agent exception: {e}")
        test_results.append(("Route Agent", False, f"Exception: {e}"))

    # Test 4: Coordinator Agent endpoint
    try:
        print("\n--- Testing Coordinator Agent ---")
        coord_request = {
            "food_analysis": {"food_category": "Cooked Food", "urgency": "MEDIUM"},
            "recipient_matches": [],
            "route_info": {"distance_km": 5.0, "estimated_minutes": 15},
            "matching_engine_scores": {}
        }
        response = client.post("/api/agents/coordinate", json=coord_request)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Coordinator Agent responded: {json.dumps(data, indent=2)}")
            test_results.append(("Coordinator Agent", True, str(data)))
        else:
            print(f"[FAIL] Coordinator Agent failed with status {response.status_code}: {response.text}")
            test_results.append(("Coordinator Agent", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"[ERROR] Coordinator Agent exception: {e}")
        test_results.append(("Coordinator Agent", False, f"Exception: {e}"))

    # Test 5: Rescue endpoint (requires a donation ID)
    try:
        print("\n--- Testing Rescue Endpoint ---")
        # We'll need to create a donation first or use an existing one
        # For now, we'll test with a non-existent ID to see the error handling
        response = client.post("/api/agents/rescue/99999")
        # This might return 404 if donation doesn't exist, or 200 if it processes
        # We mainly want to see that the endpoint exists and doesn't crash the server
        if response.status_code in [200, 404, 422]:  # Valid responses
            print(f"[PASS] Rescue endpoint responded (status {response.status_code}): {response.text[:100]}...")
            test_results.append(("Rescue Endpoint", True, f"Status {response.status_code}"))
        else:
            print(f"[FAIL] Rescue endpoint failed with status {response.status_code}: {response.text}")
            test_results.append(("Rescue Endpoint", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"[ERROR] Rescue endpoint exception: {e}")
        test_results.append(("Rescue Endpoint", False, f"Exception: {e}"))

    # Summary
    print("\n=== Test Summary ===")
    passed = sum(1 for _, success, _ in test_results if success)
    total = len(test_results)

    for test_name, success, details in test_results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name}: {details}")

    print(f"\nOverall: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All agent endpoint tests passed!")
        return True
    else:
        print("⚠️  Some agent endpoint tests failed or endpoints not yet implemented.")
        return False

if __name__ == "__main__":
    print("Starting Agent Endpoint Integration Tests...")
    print("Note: These tests will fail if agent endpoints are not yet implemented.")
    print("This is expected during development.\n")

    success = test_agent_endpoints()
    sys.exit(0 if success else 1)