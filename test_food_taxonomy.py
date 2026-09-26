#!/usr/bin/env python3
"""
Test script for just the food taxonomy loader.
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
from app.database import SessionLocal
from app.database import Base
from app.config import settings
from sqlalchemy import create_engine

def init_database():
    """Initialize the database tables."""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

def test_food_taxonomy():
    """Test the food taxonomy loading in isolation."""
    print("Testing Food Taxonomy Loader...")

    # Initialize database
    init_database()

    db = SessionLocal()
    loader = DataLoader(db)

    print(f"Data directory: {loader.data_dir}")

    # Check if file exists
    csv_path = os.path.join(loader.data_dir, 'food_taxonomy.csv')
    print(f"CSV path: {csv_path}")
    print(f"File exists: {os.path.exists(csv_path)}")

    if os.path.exists(csv_path):
        # Show first few lines
        with open(csv_path, 'r') as f:
            lines = [next(f).strip() for _ in range(5)]
            print("First 5 lines of CSV:")
            for line in lines:
                print(f"  {line}")

    # Load food taxonomy
    print("Loading food taxonomy...")
    count = loader.load_food_taxonomy()
    print(f"Loaded {count} food taxonomy entries")

    # Check what's in the database
    from app.models import food_taxonomy as food_taxonomy_model
    db_records = db.query(food_taxonomy_model.FoodTaxonomy).all()
    print(f"Records in database: {len(db_records)}")
    for record in db_records[:3]:  # Show first 3
        print(f"  ID: {record.id}, Type: {record.food_type_id}, Category: {record.food_category}")

    db.close()
    print("Food taxonomy test completed.\n")

if __name__ == "__main__":
    test_food_taxonomy()