#!/usr/bin/env python3
"""
End-to-end test for data loading and matching engine with fixes.
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

def test_end_to_end():
    """Test data loading and matching engine working together."""
    print("=== End-to-End Test ===")

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
    # Load a small subset of data for testing
    taxonomy_count = data_loader.load_food_taxonomy()
    print(f"Loaded {taxonomy_count} food taxonomy entries")

    # Load limited restaurants for testing
    restaurant_count = data_loader.load_restaurants(limit=10)
    print(f"Loaded {restaurant_count} restaurants")

    # Load limited recipients and donations for testing
    recipient_count = data_loader.load_recipients(limit=10)
    print(f"Loaded {recipient_count} recipients")

    donation_count = data_loader.load_donations(limit=10)
    print(f"Loaded {donation_count} donations")

    print("\n--- Checking Loaded Data ---")
    from app.models import food_taxonomy as food_taxonomy_model
    from app.models import restaurant as restaurant_model
    from app.models import shelter as shelter_model
    from app.models import donation as donation_model

    taxonomy_db_count = db.query(food_taxonomy_model.FoodTaxonomy).count()
    restaurant_db_count = db.query(restaurant_model.Restaurant).count()
    recipient_db_count = db.query(shelter_model.Shelter).count()
    donation_db_count = db.query(donation_model.Donation).count()

    print(f"Food taxonomy records in DB: {taxonomy_db_count}")
    print(f"Restaurant records in DB: {restaurant_db_count}")
    print(f"Recipient records in DB: {recipient_db_count}")
    print(f"Donation records in DB: {donation_db_count}")

    # Show some sample data
    if taxonomy_db_count > 0:
        sample_taxonomy = db.query(food_taxonomy_model.FoodTaxonomy).first()
        print(f"Sample taxonomy: ID={sample_taxonomy.id}, Type={sample_taxonomy.food_type_id}")

    if restaurant_db_count > 0:
        sample_restaurant = db.query(restaurant_model.Restaurant).first()
        print(f"Sample restaurant: ID={sample_restaurant.id}, Name={sample_restaurant.name}")

    if recipient_db_count > 0:
        sample_recipient = db.query(shelter_model.Shelter).first()
        print(f"Sample recipient: ID={sample_recipient.id}, Name={sample_recipient.name}")

    if donation_db_count > 0:
        sample_donation = db.query(donation_model.Donation).first()
        print(f"Sample donation: ID={sample_donation.id}, Food={sample_donation.food_name}, Restaurant ID={sample_donation.restaurant_id}")

    print("\n--- Testing Matching Engine ---")
    if donation_db_count > 0 and recipient_db_count > 0:
        # Get the first donation to test matching
        donation = db.query(donation_model.Donation).first()
        if donation:
            print(f"Testing matching for donation ID: {donation.id} ({donation.food_name})")
            matches = matching_engine.generate_matches_for_donation(donation.id)
            print(f"Generated {len(matches)} potential matches")

            if matches:
                # Show top 3 matches
                print("Top 3 matches:")
                for i, match in enumerate(matches[:3]):
                    print(f"  {i+1}. {match['recipient_name']} - Score: {match['final_score']:.2f}")

                    # Also show the scores breakdown
                    print(f"      Distance: {match['distance_score']:.2f}, "
                          f"Compatibility: {match['compatibility_score']:.2f}, "
                          f"Urgency: {match['urgency_score']:.2f}, "
                          f"Capacity: {match['capacity_score']:.2f}, "
                          f"Pickup: {match['pickup_score']:.2f}, "
                          f"Demand: {match['demand_score']:.2f}")
            else:
                print("No matches generated")
        else:
            print("Could not retrieve donation for testing")
    else:
        print("Insufficient data for matching test")

    db.close()
    print("\n=== End-to-End Test Completed ===")

if __name__ == "__main__":
    test_end_to_end()