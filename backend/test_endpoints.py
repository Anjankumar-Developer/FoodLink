import httpx
import json
import pytest
from typing import Dict, Any

BASE_URL = "http://localhost:8002"

TEST_RESOURCE_DATA = [
    (
        "restaurants",
        {
            "name": "Test Restaurant",
            "address": "123 Test St",
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "rating": "4.5",
            "price_level": "$$",
            "cuisine": "Italian",
            "food_categories": "Pizza,Pasta",
            "verified": False,
        },
        {
            "name": "Updated Restaurant",
            "address": "456 Updated Ave",
            "latitude": "40.7589",
            "longitude": "-73.9851",
            "rating": "4.8",
            "price_level": "$$$",
            "cuisine": "French",
            "food_categories": "Bread,Cheese",
            "verified": True,
        },
    ),
    (
        "shelters",
        {
            "name": "Test Shelter",
            "address": "789 Shelter Rd",
            "latitude": "40.7500",
            "longitude": "-73.9900",
            "capacity": 100,
            "current_demand": 25,
            "accepted_food_types": "Prepared,Packaged",
            "verified": False,
        },
        {
            "name": "Updated Shelter",
            "address": "321 Updated Shelter Lane",
            "latitude": "40.7600",
            "longitude": "-73.9800",
            "capacity": 150,
            "current_demand": 30,
            "accepted_food_types": "Prepared,Packaged,Fresh",
            "verified": True,
        },
    ),
    (
        "volunteers",
        {
            "name": "Test Volunteer",
            "vehicle_type": "Car",
            "availability": "Weekends",
            "latitude": "40.7000",
            "longitude": "-74.0100",
        },
        {
            "name": "Updated Volunteer",
            "vehicle_type": "Truck",
            "availability": "Weekdays",
            "latitude": "40.7100",
            "longitude": "-74.0200",
        },
    ),
]


def test_health():
    print("Testing health endpoint...")
    response = httpx.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("Health endpoint passed\n")

def _run_crud_endpoint(resource_name: str, create_data: Dict[str, Any], update_data: Dict[str, Any]):
    print(f"Testing {resource_name} CRUD endpoints...")

    response = httpx.get(f"{BASE_URL}/api/{resource_name}/")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    print(f"  GET all {resource_name}: {len(items)} items")

    response = httpx.post(f"{BASE_URL}/api/{resource_name}/", json=create_data)
    assert response.status_code == 201, f"Create failed: {response.text}"
    created_item = response.json()
    item_id = created_item["id"]
    print(f"  CREATE {resource_name}: ID {item_id}")

    response = httpx.get(f"{BASE_URL}/api/{resource_name}/{item_id}")
    assert response.status_code == 200
    fetched_item = response.json()
    assert fetched_item["id"] == item_id
    print(f"  GET {resource_name} by ID: {fetched_item.get('name', fetched_item.get('food_name', 'N/A'))}")

    response = httpx.put(f"{BASE_URL}/api/{resource_name}/{item_id}", json=update_data)
    assert response.status_code == 200, f"Update failed: {response.text}"
    updated_item = response.json()
    assert updated_item["id"] == item_id
    print(f"  UPDATE {resource_name}: ID {item_id}")

    response = httpx.delete(f"{BASE_URL}/api/{resource_name}/{item_id}")
    assert response.status_code == 204
    print(f"  DELETE {resource_name}: ID {item_id}")

    response = httpx.get(f"{BASE_URL}/api/{resource_name}/{item_id}")
    assert response.status_code == 404
    print(f"  Verified {resource_name} deletion\n")


@pytest.mark.parametrize("resource_name, create_data, update_data", TEST_RESOURCE_DATA)
def test_crud_endpoint(resource_name: str, create_data: Dict[str, Any], update_data: Dict[str, Any]):
    _run_crud_endpoint(resource_name, create_data, update_data)

def test_analytics():
    print("Testing analytics endpoints...")

    # Test overview
    response = httpx.get(f"{BASE_URL}/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  GET /api/analytics/overview: {data}")

    # Test impact
    response = httpx.get(f"{BASE_URL}/api/analytics/impact")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  GET /api/analytics/impact: {data}\n")

def test_maps():
    print("Testing maps endpoints...")

    # Test restaurants map
    response = httpx.get(f"{BASE_URL}/api/map/restaurants")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print(f"  GET /api/map/restaurants: {len(data)} items")

    # Test shelters map
    response = httpx.get(f"{BASE_URL}/api/map/shelters")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print(f"  GET /api/map/shelters: {len(data)} items")

    # Test active rescues map
    response = httpx.get(f"{BASE_URL}/api/map/active-rescues")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print(f"  GET /api/map/active-rescues: {len(data)} items\n")

def test_agents():
    print("Testing agent endpoints...")

    # Test analyze-food
    response = httpx.post(f"{BASE_URL}/api/agents/analyze-food")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  POST /api/agents/analyze-food: {data.get('analysis', 'N/A')}")

    # Test find-shelters
    response = httpx.post(f"{BASE_URL}/api/agents/find-shelters")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  POST /api/agents/find-shelters: {len(data.get('shelters', []))} shelters")

    # Test calculate-route
    response = httpx.post(f"{BASE_URL}/api/agents/calculate-route")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  POST /api/agents/calculate-route: {data.get('route', {}).get('distance_km', 'N/A')} km")

    # Test coordinate
    response = httpx.post(f"{BASE_URL}/api/agents/coordinate")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    print(f"  POST /api/agents/coordinate: {data.get('coordination', {}).get('status', 'N/A')}\n")

def main():
    print("Starting API endpoint tests...\n")

    try:
        test_health()

        # Test data for each resource
        test_data = {
            "restaurants": (
                {
                    "name": "Test Restaurant",
                    "address": "123 Test St",
                    "latitude": "40.7128",
                    "longitude": "-74.0060",
                    "rating": "4.5",
                    "price_level": "$$",
                    "cuisine": "Italian",
                    "food_categories": "Pizza,Pasta",
                    "verified": False
                },
                {
                    "name": "Updated Restaurant",
                    "address": "456 Updated Ave",
                    "latitude": "40.7589",
                    "longitude": "-73.9851",
                    "rating": "4.8",
                    "price_level": "$$$",
                    "cuisine": "French",
                    "food_categories": "Bread,Cheese",
                    "verified": True
                }
            ),
            "shelters": (
                {
                    "name": "Test Shelter",
                    "address": "789 Shelter Rd",
                    "latitude": "40.7500",
                    "longitude": "-73.9900",
                    "capacity": 100,
                    "current_demand": 25,
                    "accepted_food_types": "Prepared,Packaged",
                    "verified": False
                },
                {
                    "name": "Updated Shelter",
                    "address": "321 Updated Shelter Lane",
                    "latitude": "40.7600",
                    "longitude": "-73.9800",
                    "capacity": 150,
                    "current_demand": 30,
                    "accepted_food_types": "Prepared,Packaged,Fresh",
                    "verified": True
                }
            ),
            "donations": (
                {
                    "restaurant_id": 1,  # Will be updated after creation
                    "food_name": "Test Food",
                    "food_category": "Prepared",
                    "quantity": "10 kg",
                    "diet_type": "Vegetarian",
                    "prepared_at": "2026-09-26T12:00:00",
                    "expires_at": "2026-09-27T12:00:00",
                    "storage_condition": "Refrigerated",
                    "status": "available"
                },
                {
                    "restaurant_id": 1,
                    "food_name": "Updated Food",
                    "food_category": "Fresh",
                    "quantity": "15 kg",
                    "diet_type": "Vegan",
                    "prepared_at": "2026-09-26T13:00:00",
                    "expires_at": "2026-09-28T13:00:00",
                    "storage_condition": "Refrigerated",
                    "status": "matched"
                }
            ),
            "volunteers": (
                {
                    "name": "Test Volunteer",
                    "vehicle_type": "Car",
                    "availability": "Weekends",
                    "latitude": "40.7000",
                    "longitude": "-74.0100"
                },
                {
                    "name": "Updated Volunteer",
                    "vehicle_type": "Truck",
                    "availability": "Weekdays",
                    "latitude": "40.7100",
                    "longitude": "-74.0200"
                }
            ),
            "matches": (
                {
                    "donation_id": 1,  # Will be updated after creation
                    "shelter_id": 1,   # Will be updated after creation
                    "distance_km": 5.5,
                    "travel_minutes": 15,
                    "compatibility_score": 0.9,
                    "urgency_score": 0.8,
                    "capacity_score": 0.7,
                    "pickup_score": 0.85,
                    "demand_score": 0.75,
                    "final_score": 0.8,
                    "status": "pending",
                    "explanation": "Good match"
                },
                {
                    "donation_id": 1,
                    "shelter_id": 1,
                    "distance_km": 3.2,
                    "travel_minutes": 10,
                    "compatibility_score": 0.95,
                    "urgency_score": 0.85,
                    "capacity_score": 0.8,
                    "pickup_score": 0.9,
                    "demand_score": 0.8,
                    "final_score": 0.86,
                    "status": "accepted",
                    "explanation": "Excellent match"
                }
            ),
            "pickups": (
                {
                    "match_id": 1,     # Will be updated after creation
                    "volunteer_id": 1, # Will be updated after creation
                    "pickup_time": "2026-09-26T14:00:00",
                    "delivery_time": "2026-09-26T15:00:00",
                    "status": "scheduled",
                    "pickup_qr": "PICKUP123",
                    "delivery_qr": "DELIVERY456"
                },
                {
                    "match_id": 1,
                    "volunteer_id": 1,
                    "pickup_time": "2026-09-26T14:30:00",
                    "delivery_time": "2026-09-26T15:30:00",
                    "status": "in_progress",
                    "pickup_qr": "PICKUP789",
                    "delivery_qr": "DELIVERY012"
                }
            ),
            "agent_logs": (
                {
                    "donation_id": 1,  # Will be updated after creation
                    "agent_name": "TestAgent",
                    "action": "analyze_food",
                    "reasoning": "Testing agent logging",
                    "status": "completed"
                },
                {
                    "donation_id": 1,
                    "agent_name": "UpdatedAgent",
                    "action": "find_shelters",
                    "reasoning": "Updated agent logging test",
                    "status": "completed"
                }
            )
        }

        # We need to handle the foreign key dependencies
        # We'll create restaurants and shelters first, then use their IDs

        # Test restaurants
        test_crud_endpoint("restaurants", *test_data["restaurants"])

        # Test shelters
        test_crud_endpoint("shelters", *test_data["shelters"])

        # Now we need to get the actual IDs for donations test
        # Let's create a restaurant and shelter to get their IDs
        restaurant_response = httpx.post(f"{BASE_URL}/api/restaurants/", json=test_data["restaurants"][0])
        restaurant_id = restaurant_response.json()["id"]

        shelter_response = httpx.post(f"{BASE_URL}/api/shelters/", json=test_data["shelters"][0])
        shelter_id = shelter_response.json()["id"]

        # Update test data with actual IDs
        donation_create = test_data["donations"][0].copy()
        donation_create["restaurant_id"] = restaurant_id
        donation_update = test_data["donations"][1].copy()
        donation_update["restaurant_id"] = restaurant_id

        # Test donations
        print("Testing donations CRUD endpoints...")
        # GET all (should be empty initially)
        response = httpx.get(f"{BASE_URL}/api/donations/")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"  GET all donations: {len(items)} items")

        # CREATE
        response = httpx.post(f"{BASE_URL}/api/donations/", json=donation_create)
        assert response.status_code == 201
        created_donation = response.json()
        donation_id = created_donation["id"]
        print(f"  CREATE donation: ID {donation_id}")

        # GET by ID
        response = httpx.get(f"{BASE_URL}/api/donations/{donation_id}")
        assert response.status_code == 200
        fetched_donation = response.json()
        assert fetched_donation["id"] == donation_id
        print(f"  GET donation by ID: {fetched_donation['food_name']}")

        # UPDATE
        response = httpx.put(f"{BASE_URL}/api/donations/{donation_id}", json=donation_update)
        assert response.status_code == 200
        updated_donation = response.json()
        assert updated_donation["id"] == donation_id
        print(f"  UPDATE donation: ID {donation_id}")

        # DELETE
        response = httpx.delete(f"{BASE_URL}/api/donations/{donation_id}")
        assert response.status_code == 204
        print(f"  DELETE donation: ID {donation_id}")

        # Verify deletion
        response = httpx.get(f"{BASE_URL}/api/donations/{donation_id}")
        assert response.status_code == 404
        print(f"  Verified donation deletion\n")

        # Test volunteers
        test_crud_endpoint("volunteers", *test_data["volunteers"])

        # For matches, we need a donation and shelter
        # Create a donation and shelter for the match test
        restaurant_response = httpx.post(f"{BASE_URL}/api/restaurants/", json=test_data["restaurants"][0])
        restaurant_id = restaurant_response.json()["id"]

        shelter_response = httpx.post(f"{BASE_URL}/api/shelters/", json=test_data["shelters"][0])
        shelter_id = shelter_response.json()["id"]

        donation_data = {
            "restaurant_id": restaurant_id,
            "food_name": "Match Test Food",
            "food_category": "Prepared",
            "quantity": "5 kg",
            "diet_type": "Non-Vegetarian",
            "prepared_at": "2026-09-26T12:00:00",
            "expires_at": "2026-09-27T12:00:00",
            "storage_condition": "Refrigerated",
            "status": "available"
        }
        donation_response = httpx.post(f"{BASE_URL}/api/donations/", json=donation_data)
        donation_id_for_match = donation_response.json()["id"]

        # Update match test data with actual IDs
        match_create = test_data["matches"][0].copy()
        match_create["donation_id"] = donation_id_for_match
        match_create["shelter_id"] = shelter_id
        match_update = test_data["matches"][1].copy()
        match_update["donation_id"] = donation_id_for_match
        match_update["shelter_id"] = shelter_id

        print("Testing matches CRUD endpoints...")
        # GET all (should be empty initially)
        response = httpx.get(f"{BASE_URL}/api/matches/")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"  GET all matches: {len(items)} items")

        # CREATE
        response = httpx.post(f"{BASE_URL}/api/matches/", json=match_create)
        assert response.status_code == 201
        created_match = response.json()
        match_id = created_match["id"]
        print(f"  CREATE match: ID {match_id}")

        # GET by ID
        response = httpx.get(f"{BASE_URL}/api/matches/{match_id}")
        assert response.status_code == 200
        fetched_match = response.json()
        assert fetched_match["id"] == match_id
        print(f"  GET match by ID: ID {match_id}")

        # UPDATE
        response = httpx.put(f"{BASE_URL}/api/matches/{match_id}", json=match_update)
        assert response.status_code == 200
        updated_match = response.json()
        assert updated_match["id"] == match_id
        print(f"  UPDATE match: ID {match_id}")

        # DELETE
        response = httpx.delete(f"{BASE_URL}/api/matches/{match_id}")
        assert response.status_code == 204
        print(f"  DELETE match: ID {match_id}")

        # Verify deletion
        response = httpx.get(f"{BASE_URL}/api/matches/{match_id}")
        assert response.status_code == 404
        print(f"  Verified match deletion\n")

        # For pickups, we need a match and volunteer
        # Create a match and volunteer for the pickup test
        restaurant_response = httpx.post(f"{BASE_URL}/api/restaurants/", json=test_data["restaurants"][0])
        restaurant_id = restaurant_response.json()["id"]

        shelter_response = httpx.post(f"{BASE_URL}/api/shelters/", json=test_data["shelters"][0])
        shelter_id = shelter_response.json()["id"]

        donation_data = {
            "restaurant_id": restaurant_id,
            "food_name": "Pickup Test Food",
            "food_category": "Prepared",
            "quantity": "8 kg",
            "diet_type": "Vegetarian",
            "prepared_at": "2026-09-26T12:00:00",
            "expires_at": "2026-09-27T12:00:00",
            "storage_condition": "Refrigerated",
            "status": "available"
        }
        donation_response = httpx.post(f"{BASE_URL}/api/donations/", json=donation_data)
        donation_id_for_pickup = donation_response.json()["id"]

        match_data = {
            "donation_id": donation_id_for_pickup,
            "shelter_id": shelter_id,
            "distance_km": 4.2,
            "travel_minutes": 12,
            "compatibility_score": 0.88,
            "urgency_score": 0.82,
            "capacity_score": 0.78,
            "pickup_score": 0.88,
            "demand_score": 0.82,
            "final_score": 0.83,
            "status": "accepted",
            "explanation": "Good match for pickup"
        }
        match_response = httpx.post(f"{BASE_URL}/api/matches/", json=match_data)
        match_id_for_pickup = match_response.json()["id"]

        volunteer_response = httpx.post(f"{BASE_URL}/api/volunteers/", json=test_data["volunteers"][0])
        volunteer_id = volunteer_response.json()["id"]

        # Update pickup test data with actual IDs
        pickup_create = test_data["pickups"][0].copy()
        pickup_create["match_id"] = match_id_for_pickup
        pickup_create["volunteer_id"] = volunteer_id
        pickup_update = test_data["pickups"][1].copy()
        pickup_update["match_id"] = match_id_for_pickup
        pickup_update["volunteer_id"] = volunteer_id

        print("Testing pickups CRUD endpoints...")
        # GET all (should be empty initially)
        response = httpx.get(f"{BASE_URL}/api/pickups/")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"  GET all pickups: {len(items)} items")

        # CREATE
        response = httpx.post(f"{BASE_URL}/api/pickups/", json=pickup_create)
        assert response.status_code == 201
        created_pickup = response.json()
        pickup_id = created_pickup["id"]
        print(f"  CREATE pickup: ID {pickup_id}")

        # GET by ID
        response = httpx.get(f"{BASE_URL}/api/pickups/{pickup_id}")
        assert response.status_code == 200
        fetched_pickup = response.json()
        assert fetched_pickup["id"] == pickup_id
        print(f"  GET pickup by ID: ID {pickup_id}")

        # UPDATE
        response = httpx.put(f"{BASE_URL}/api/pickups/{pickup_id}", json=pickup_update)
        assert response.status_code == 200
        updated_pickup = response.json()
        assert updated_pickup["id"] == pickup_id
        print(f"  UPDATE pickup: ID {pickup_id}")

        # DELETE
        response = httpx.delete(f"{BASE_URL}/api/pickups/{pickup_id}")
        assert response.status_code == 204
        print(f"  DELETE pickup: ID {pickup_id}")

        # Verify deletion
        response = httpx.get(f"{BASE_URL}/api/pickups/{pickup_id}")
        assert response.status_code == 404
        print(f"  Verified pickup deletion\n")

        # For agent_logs, we need a donation
        # Create a donation for the agent_log test
        restaurant_response = httpx.post(f"{BASE_URL}/api/restaurants/", json=test_data["restaurants"][0])
        restaurant_id = restaurant_response.json()["id"]

        donation_data = {
            "restaurant_id": restaurant_id,
            "food_name": "Agent Log Test Food",
            "food_category": "Prepared",
            "quantity": "12 kg",
            "diet_type": "Non-Vegetarian",
            "prepared_at": "2026-09-26T12:00:00",
            "expires_at": "2026-09-27T12:00:00",
            "storage_condition": "Refrigerated",
            "status": "available"
        }
        donation_response = httpx.post(f"{BASE_URL}/api/donations/", json=donation_data)
        donation_id_for_agent_log = donation_response.json()["id"]

        # Update agent_log test data with actual ID
        agent_log_create = test_data["agent_logs"][0].copy()
        agent_log_create["donation_id"] = donation_id_for_agent_log
        agent_log_update = test_data["agent_logs"][1].copy()
        agent_log_update["donation_id"] = donation_id_for_agent_log

        print("Testing agent_logs CRUD endpoints...")
        # GET all (should be empty initially)
        response = httpx.get(f"{BASE_URL}/api/agent_logs/")
        print(f"  GET all agent_logs status: {response.status_code}")
        print(f"  GET all agent_logs response: {response.text}")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"  GET all agent_logs: {len(items)} items")

        # CREATE
        response = httpx.post(f"{BASE_URL}/api/agent_logs/", json=agent_log_create)
        print(f"  CREATE agent_log status: {response.status_code}")
        print(f"  CREATE agent_log response: {response.text}")
        assert response.status_code == 201, f"Create failed: {response.text}"
        created_agent_log = response.json()
        agent_log_id = created_agent_log["id"]
        print(f"  CREATE agent_log: ID {agent_log_id}")

        # GET by ID
        response = httpx.get(f"{BASE_URL}/api/agent_logs/{agent_log_id}")
        assert response.status_code == 200
        fetched_agent_log = response.json()
        assert fetched_agent_log["id"] == agent_log_id
        print(f"  GET agent_log by ID: ID {agent_log_id}")

        # UPDATE
        response = httpx.put(f"{BASE_URL}/api/agent_logs/{agent_log_id}", json=agent_log_update)
        assert response.status_code == 200
        updated_agent_log = response.json()
        assert updated_agent_log["id"] == agent_log_id
        print(f"  UPDATE agent_log: ID {agent_log_id}")

        # DELETE
        response = httpx.delete(f"{BASE_URL}/api/agent_logs/{agent_log_id}")
        assert response.status_code == 204
        print(f"  DELETE agent_log: ID {agent_log_id}")

        # Verify deletion
        response = httpx.get(f"{BASE_URL}/api/agent_logs/{agent_log_id}")
        assert response.status_code == 404
        print(f"  Verified agent_log deletion\n")

        # Test analytics and maps
        test_analytics()
        test_maps()
        test_agents()

        print("All tests passed!")

    except Exception as e:
        print(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    main()