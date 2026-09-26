#!/usr/bin/env python3
"""
Test script for the FoodLink data loader and matching engine.
"""

import sys
import os
# Set environment variables before importing app modules
os.environ['DATABASE_URL'] = 'sqlite:///./foodlink.db'
os.environ['SECRET_KEY'] = 'your-secret-key-here'
os.environ['ALGORITHM'] = 'HS256'
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'
os.environ['PROJECT_NAME'] = 'FoodLink API'
os.environ['VERSION'] = '1.0.0'

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.data_loader import DataLoader
from app.services.matching_engine import MatchingEngine
from app.database import SessionLocal
from app.database import Base
from app.config import settings
from sqlalchemy import create_engine

# Global engine to ensure we use the same instance throughout
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(settings.DATABASE_URL)
    return _engine

def init_database():
    """Initialize the database tables."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

def test_data_loader():
    """Test the data loader service."""
    print("Testing Data Loader...")

    # Initialize database
    init_database()

    # Create session using the same engine as init_database
    from sqlalchemy.orm import sessionmaker
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    loader = DataLoader(db)

    # Test loading a small subset of data
    print("Loading food taxonomy...")
    taxonomy_count = loader.load_food_taxonomy()
    print(f"Loaded {taxonomy_count} food taxonomy entries")

    print("Loading restaurants (Telangana focus, limit 10)...")
    restaurant_count = loader.load_restaurants(limit=10, focus_telangana=True)
    print(f"Loaded {restaurant_count} restaurants")

    print("Loading recipients (limit 5)...")
    recipient_count = loader.load_recipients(limit=5)
    print(f"Loaded {recipient_count} recipients")

    print("Loading donations (limit 5)...")
    donation_count = loader.load_donations(limit=5)
    print(f"Loaded {donation_count} donations")

    print("Loading volunteers (limit 5)...")
    volunteer_count = loader.load_volunteers(limit=5)
    print(f"Loaded {volunteer_count} volunteers")

    db.close()
    print("Data loader test completed.\n")

def test_matching_engine():
    """Test the matching engine service."""
    print("Testing Matching Engine...")

    # Initialize database
    init_database()

    # Create session using the same engine as init_database
    from sqlalchemy.orm import sessionmaker
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    matching_engine = MatchingEngine(db)

    # Get a donation to test matching
    from app.models import donation as donation_model
    donation = db.query(donation_model.Donation).first()

    if donation:
        print(f"Testing matching for donation ID: {donation.id}")
        matches = matching_engine.generate_matches_for_donation(donation.id)
        print(f"Generated {len(matches)} matches")

        if matches:
            print("Top 3 matches:")
            for i, match in enumerate(matches[:3]):
                print(f"  {i+1}. {match['recipient_name']} - Score: {match['final_score']}")
        else:
            print("No matches generated")
    else:
        print("No donations found to test matching")
        print("Try loading some donation data first using the data loader.")

    db.close()
    print("Matching engine test completed.\n")

def test_haversine():
    """Test the Haversine distance calculation."""
    print("Testing Haversine distance calculation...")

    # Create session using the same engine as init_database
    from sqlalchemy.orm import sessionmaker
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    matching_engine = MatchingEngine(db)

    # Test distance between two known points (approximate)
    # Hyderabad to Bangalore
    hyd_lat, hyd_lon = 17.3850, 78.4867
    blr_lat, blr_lon = 12.9716, 77.5946

    distance = matching_engine.haversine_distance(hyd_lat, hyd_lon, blr_lat, blr_lon)
    print(f"Distance between Hyderabad and Bangalore: {distance:.2f} km")

    # Test distance score calculation
    distance_km, travel_minutes, distance_score = matching_engine.calculate_distance_score(
        hyd_lat, hyd_lon, blr_lat, blr_lon
    )
    print(f"Distance: {distance_km:.2f} km, Travel time: {travel_minutes:.1f} min, Score: {distance_score:.2f}")

    db.close()
    print("Haversine test completed.\n")

if __name__ == "__main__":
    print("Starting FoodLink implementation tests...\n")

    try:
        test_haversine()
        test_data_loader()
        test_matching_engine()
        print("All tests completed successfully!")
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()