#!/usr/bin/env python3
"""
Test to see what restaurant IDs are available and which ones donations need.
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
from app.database import Base
from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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

def test_restaurant_ids():
    """Test what restaurant IDs are in the database after loading."""
    print("=== Testing Restaurant IDs ===")

    # Initialize database
    init_database()

    # Create session using the same engine as init_database
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Initialize services
    data_loader = DataLoader(db)

    print("\n--- Loading More Restaurants ---")
    # Load a larger subset of data for testing
    restaurant_count = data_loader.load_restaurants(limit=150)
    print(f"Loaded {restaurant_count} restaurants")

    print("\n--- Checking Available IDs ---")
    from app.models import restaurant as restaurant_model

    # Get all restaurant IDs
    restaurant_ids = [r.id for r in db.query(restaurant_model.Restaurant).all()]
    restaurant_ids.sort()
    print(f"Available restaurant IDs: {restaurant_ids[:20]}..." if len(restaurant_ids) > 20 else f"Available restaurant IDs: {restaurant_ids}")
    print(f"Total unique IDs: {len(set(restaurant_ids))}")
    print(f"ID range: {min(restaurant_ids)} to {max(restaurant_ids)}")

    # Check which IDs the donations are looking for
    needed_ids = [39, 26, 14, 27, 68, 133, 57, 100, 107, 93]
    print(f"\nNeeded IDs from donations: {needed_ids}")

    missing_ids = [id for id in needed_ids if id not in restaurant_ids]
    found_ids = [id for id in needed_ids if id in restaurant_ids]

    print(f"Found IDs: {found_ids}")
    print(f"Missing IDs: {missing_ids}")

    if missing_ids:
        print(f"Need to load more restaurants to cover missing IDs: {missing_ids}")
        # Suggest what limit might be needed
        if missing_ids:
            max_needed = max(missing_ids)
            print(f"Suggested limit: {max_needed + 10} to be safe")

    db.close()
    print("\n=== Restaurant ID Test Completed ===")

if __name__ == "__main__":
    test_restaurant_ids()