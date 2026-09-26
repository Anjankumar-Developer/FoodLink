#!/usr/bin/env python3
"""
Debug what's in the match dictionary returned by the matching engine.
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

def debug_match():
    """Debug the match dictionary structure."""
    print("=== Debug Match Dictionary ===")

    # Initialize database
    init_database()

    # Create session using the same engine as init_database
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Initialize services
    data_loader = DataLoader(db)
    matching_engine = MatchingEngine(db)

    print("\n--- Loading Data ---")
    # Load minimal data for testing
    data_loader.load_food_taxonomy()
    data_loader.load_restaurants(limit=150)
    data_loader.load_recipients(limit=10)
    data_loader.load_donations(limit=10)

    print("\n--- Testing Match Generation ---")
    # Get the first donation to test matching
    from app.models import donation as donation_model
    donation = db.query(donation_model.Donation).first()
    if donation:
        print(f"Testing matching for donation ID: {donation.id} ({donation.food_name})")
        matches = matching_engine.generate_matches_for_donation(donation.id)
        print(f"Generated {len(matches)} potential matches")

        if matches:
            print(f"Type of first match: {type(matches[0])}")
            if hasattr(matches[0], '__dict__'):
                print(f"Match object attributes: {list(matches[0].__dict__.keys())}")
            elif isinstance(matches[0], dict):
                print(f"Match dictionary keys: {list(matches[0].keys())}")
                print(f"First match content: {matches[0]}")
            else:
                print(f"Match content: {matches[0]}")

    db.close()
    print("\n=== Debug Completed ===")

if __name__ == "__main__":
    debug_match()