#!/usr/bin/env python3
"""
Test just the restaurant loader to see if ID fix works.
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

def test_restaurant_loader():
    """Test the restaurant loader with ID fix."""
    print("=== Testing Restaurant Loader ===")

    # Initialize database
    init_database()

    # Create session using the same engine as init_database
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Initialize services
    data_loader = DataLoader(db)

    print("\n--- Loading Restaurants ---")
    # Load a small subset of data for testing
    restaurant_count = data_loader.load_restaurants(limit=5)
    print(f"Loaded {restaurant_count} restaurants")

    print("\n--- Checking Loaded Data ---")
    from app.models import restaurant as restaurant_model

    restaurant_db_count = db.query(restaurant_model.Restaurant).count()
    print(f"Restaurant records in DB: {restaurant_db_count}")

    # Show some sample data
    if restaurant_db_count > 0:
        sample_restaurant = db.query(restaurant_model.Restaurant).first()
        print(f"Sample restaurant: ID={sample_restaurant.id}, Name={sample_restaurant.name}")

    db.close()
    print("\n=== Restaurant Loader Test Completed ===")

if __name__ == "__main__":
    test_restaurant_loader()