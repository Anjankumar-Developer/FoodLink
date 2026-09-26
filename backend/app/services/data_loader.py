import csv
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models import restaurant as restaurant_model
from ..models import shelter as shelter_model
from ..models import donation as donation_model
from ..models import volunteer as volunteer_model
from ..models import food_taxonomy as food_taxonomy_model
from ..database import SessionLocal
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataLoader:
    """Service for loading and managing CSV data for the FoodLink application."""

    def __init__(self, db_session: Session = None):
        """Initialize the data loader with a database session."""
        self.db = db_session or SessionLocal()
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'datasets', 'Datasets')

    def load_restaurants(self, limit: Optional[int] = None, focus_telangana: bool = False) -> int:
        """
        Load restaurant data from CSV file.

        Args:
            limit: Maximum number of records to load (None for all)
            focus_telangana: Deprecated flag kept for compatibility; the bundled data
                should be loaded as-is because the app is designed to work across all
                Indian states represented in the CSVs.

        Returns:
            Number of restaurants loaded
        """
        csv_path = os.path.join(self.data_dir, 'zomato.csv')
        if not os.path.exists(csv_path):
            logger.error(f"Restaurant CSV file not found at {csv_path}")
            return 0

        loaded_count = 0
        skipped_count = 0

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break

                    # The project dataset contains restaurant rows from multiple Indian states.
                    # Filter only when an explicit regional focus is required; do not drop
                    # valid records from the default app flow.
                    if focus_telangana:
                        area = (row.get('area', '') or '').lower()
                        local_address = (row.get('local address', '') or '').lower()
                        telangana_indicators = ['telangana', 'hyderabad', 'karimnagar', 'warangal',
                                              'khammam', 'nalgonda', 'rangareddy', 'medak']

                        is_telangana = any(indicator in area or indicator in local_address
                                         for indicator in telangana_indicators)

                        if not is_telangana:
                            skipped_count += 1
                            continue

                    # Check if restaurant already exists
                    existing = self.db.query(restaurant_model.Restaurant).filter(
                        restaurant_model.Restaurant.name == row['restaurant name']
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Extract numeric ID from column "Unnamed: 0" in CSV
                    restaurant_id = self._extract_numeric_id(row['Unnamed: 0'])
                    if restaurant_id is None:
                        skipped_count += 1
                        logger.warning(f"Could not extract numeric ID from column Unnamed: 0: {row['Unnamed: 0']}")
                        continue

                    # Check if restaurant already exists
                    existing = self.db.query(restaurant_model.Restaurant).filter(
                        restaurant_model.Restaurant.id == restaurant_id
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Create new restaurant
                    restaurant = restaurant_model.Restaurant(
                        id=restaurant_id,
                        name=row['restaurant name'],
                        address=row.get('local address', ''),  # Using local address as the main address
                        latitude="0.0",  # Default values since CSV doesn't have lat/long
                        longitude="0.0",
                        rating=row.get('rate (out of 5)', '0.0'),
                        price_level=self._convert_cost_to_price_level(row.get('avg cost (two people)', '0')),
                        cuisine=row.get('cuisines type', ''),
                        food_categories=row.get('cuisines type', ''),  # Using cuisines as food categories
                        verified=False
                    )

                    self.db.add(restaurant)

                    try:
                        self.db.commit()
                        loaded_count += 1
                    except IntegrityError:
                        self.db.rollback()
                        skipped_count += 1
                        logger.warning(f"Failed to load restaurant {row['restaurant name']} due to integrity error")
                    except Exception as e:
                        self.db.rollback()
                        skipped_count += 1
                        logger.error(f"Error loading restaurant {row['restaurant name']}: {str(e)}")

            logger.info(f"Loaded {loaded_count} restaurants, skipped {skipped_count} duplicates or invalid records")
            return loaded_count

        except Exception as e:
            logger.error(f"Error reading restaurant CSV file: {str(e)}")
            return 0

    def _extract_numeric_id(self, id_str: str) -> Optional[int]:
        """
        Extract numeric part from a string ID like 'REST-TG01-039' -> 39
        Returns None if no numeric part found.
        """
        if not id_str:
            return None
        import re
        match = re.search(r'[\d]+$', id_str)  # Look for digits at the end
        if match:
            try:
                return int(match.group())
            except ValueError:
                return None
        return None

    def load_recipients(self, limit: Optional[int] = None) -> int:
        """
        Load recipient/shelter data from CSV file.

        Args:
            limit: Maximum number of records to load (None for all)

        Returns:
            Number of recipients loaded
        """
        csv_path = os.path.join(self.data_dir, 'recipients.csv')
        if not os.path.exists(csv_path):
            logger.error(f"Recipient CSV file not found at {csv_path}")
            return 0

        loaded_count = 0
        skipped_count = 0

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break

                    # Extract numeric ID from recipient_id
                    recipient_id = self._extract_numeric_id(row['recipient_id'])
                    if recipient_id is None:
                        skipped_count += 1
                        logger.warning(f"Could not extract numeric ID from {row['recipient_id']}")
                        continue

                    # Check if recipient already exists
                    existing = self.db.query(shelter_model.Shelter).filter(
                        shelter_model.Shelter.id == recipient_id
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Parse operating hours to extract open/close times
                    operating_hours = row.get('operating_hours', '08:00-21:00')

                    # Create new recipient/shelter
                    recipient = shelter_model.Shelter(
                        id=recipient_id,
                        name=row['name'],
                        address=row['address'],
                        latitude=row['latitude'],
                        longitude=row['longitude'],
                        capacity=int(row['capacity']) if row['capacity'].isdigit() else 0,
                        current_demand=int(row['current_demand']) if row['current_demand'].isdigit() else 0,
                        accepted_food_types=row['accepted_food_types'],
                        verified=row['verified'].lower() == 'true'
                    )

                    self.db.add(recipient)

                    try:
                        self.db.commit()
                        loaded_count += 1
                    except IntegrityError:
                        self.db.rollback()
                        skipped_count += 1
                        logger.warning(f"Failed to load recipient {row['name']} due to integrity error")
                    except Exception as e:
                        self.db.rollback()
                        skipped_count += 1
                        logger.error(f"Error loading recipient {row['name']}: {str(e)}")

            logger.info(f"Loaded {loaded_count} recipients, skipped {skipped_count} duplicates or invalid records")
            return loaded_count

        except Exception as e:
            logger.error(f"Error reading recipient CSV file: {str(e)}")
            return 0

    def load_donations(self, limit: Optional[int] = None) -> int:
        """
        Load donation data from CSV file.

        Args:
            limit: Maximum number of records to load (None for all)

        Returns:
            Number of donations loaded
        """
        csv_path = os.path.join(self.data_dir, 'donations.csv')
        if not os.path.exists(csv_path):
            logger.error(f"Donation CSV file not found at {csv_path}")
            return 0

        loaded_count = 0
        skipped_count = 0

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break

                    # Extract numeric ID from donation_id
                    donation_id = self._extract_numeric_id(row['donation_id'])
                    if donation_id is None:
                        skipped_count += 1
                        logger.warning(f"Could not extract numeric ID from {row['donation_id']}")
                        continue

                    # Check if donation already exists
                    existing = self.db.query(donation_model.Donation).filter(
                        donation_model.Donation.id == donation_id
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Extract numeric ID from restaurant_id in the CSV
                    restaurant_csv_id = self._extract_numeric_id(row['restaurant_id'])
                    if restaurant_csv_id is None:
                        skipped_count += 1
                        logger.warning(f"Could not extract numeric ID from restaurant_id {row['restaurant_id']}")
                        continue

                    # Find the restaurant by our internal ID (which should match the extracted numeric ID)
                    restaurant = self.db.query(restaurant_model.Restaurant).filter(
                        restaurant_model.Restaurant.id == restaurant_csv_id
                    ).first()

                    # If we can't find the restaurant by ID, we might need to create a mapping
                    # For now, let's skip donations that don't have a matching restaurant
                    if not restaurant:
                        skipped_count += 1
                        logger.warning(f"No restaurant found with ID {restaurant_csv_id} for donation {row['donation_id']}")
                        continue

                    # Parse datetime strings
                    try:
                        prepared_at = datetime.strptime(row['prepared_at'], '%Y-%m-%d %H:%M:%S')
                        expires_at = datetime.strptime(row['expires_at'], '%Y-%m-%d %H:%M:%S')
                    except ValueError as e:
                        logger.warning(f"Invalid date format for donation {row['donation_id']}: {str(e)}")
                        skipped_count += 1
                        continue

                    # Create new donation
                    donation = donation_model.Donation(
                        id=donation_id,
                        restaurant_id=restaurant.id,
                        food_name=row['food_name'],
                        food_category=row['food_category'],
                        quantity=row['quantity'],
                        diet_type=row['diet_type'],
                        prepared_at=prepared_at,
                        expires_at=expires_at,
                        storage_condition=row['storage_condition'],
                        status=row['status']
                    )

                    self.db.add(donation)

                    try:
                        self.db.commit()
                        loaded_count += 1
                    except IntegrityError:
                        self.db.rollback()
                        skipped_count += 1
                        logger.warning(f"Failed to load donation {row['donation_id']} due to integrity error")
                    except Exception as e:
                        self.db.rollback()
                        skipped_count += 1
                        logger.error(f"Error loading donation {row['donation_id']}: {str(e)}")

            logger.info(f"Loaded {loaded_count} donations, skipped {skipped_count} duplicates or invalid records")
            return loaded_count

        except Exception as e:
            logger.error(f"Error reading donation CSV file: {str(e)}")
            return 0

    def load_volunteers(self, limit: Optional[int] = None) -> int:
        """
        Load volunteer data from CSV file.

        Args:
            limit: Maximum number of records to load (None for all)

        Returns:
            Number of volunteers loaded
        """
        csv_path = os.path.join(self.data_dir, 'volunteers.csv')
        if not os.path.exists(csv_path):
            logger.error(f"Volunteer CSV file not found at {csv_path}")
            return 0

        loaded_count = 0
        skipped_count = 0

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break

                    # Extract numeric ID from volunteer_id
                    volunteer_id = self._extract_numeric_id(row['volunteer_id'])
                    if volunteer_id is None:
                        skipped_count += 1
                        logger.warning(f"Could not extract numeric ID from {row['volunteer_id']}")
                        continue

                    # Check if volunteer already exists
                    existing = self.db.query(volunteer_model.Volunteer).filter(
                        volunteer_model.Volunteer.id == volunteer_id
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Create new volunteer
                    volunteer = volunteer_model.Volunteer(
                        id=volunteer_id,
                        name=row['name'],
                        vehicle_type=row['vehicle_type'],
                        availability=row['availability'],
                        latitude=row['latitude'],
                        longitude=row['longitude']
                    )

                    self.db.add(volunteer)

                    try:
                        self.db.commit()
                        loaded_count += 1
                    except IntegrityError:
                        self.db.rollback()
                        skipped_count += 1
                        logger.warning(f"Failed to load volunteer {row['name']} due to integrity error")
                    except Exception as e:
                        self.db.rollback()
                        skipped_count += 1
                        logger.error(f"Error loading volunteer {row['name']}: {str(e)}")

            logger.info(f"Loaded {loaded_count} volunteers, skipped {skipped_count} duplicates or invalid records")
            return loaded_count

        except Exception as e:
            logger.error(f"Error reading volunteer CSV file: {str(e)}")
            return 0

    def load_food_taxonomy(self) -> int:
        """
        Load food taxonomy data from CSV file.

        Returns:
            Number of food taxonomy entries loaded
        """
        csv_path = os.path.join(self.data_dir, 'food_taxonomy.csv')
        if not os.path.exists(csv_path):
            logger.error(f"Food taxonomy CSV file not found at {csv_path}")
            return 0

        loaded_count = 0
        skipped_count = 0

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Check if food taxonomy entry already exists
                    existing = self.db.query(food_taxonomy_model.FoodTaxonomy).filter(
                        food_taxonomy_model.FoodTaxonomy.food_type_id == row['food_type_id']
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Create new food taxonomy entry
                    food_taxonomy = food_taxonomy_model.FoodTaxonomy(
                        food_type_id=row['food_type_id'],
                        food_category=row['food_category'],
                        description=row['description'],
                        possible_diet_types=row['possible_diet_types'],
                        default_urgency=row['default_urgency'],
                        typical_shelf_life=row['typical_shelf_life']
                    )

                    self.db.add(food_taxonomy)

                    try:
                        self.db.commit()
                        loaded_count += 1
                    except IntegrityError:
                        self.db.rollback()
                        skipped_count += 1
                        logger.warning(f"Failed to load food taxonomy {row['food_type_id']} due to integrity error")
                    except Exception as e:
                        self.db.rollback()
                        skipped_count += 1
                        logger.error(f"Error loading food taxonomy {row['food_type_id']}: {str(e)}")

            logger.info(f"Loaded {loaded_count} food taxonomy entries, skipped {skipped_count} duplicates")
            return loaded_count

        except Exception as e:
            logger.error(f"Error reading food taxonomy CSV file: {str(e)}")
            return 0

    def load_all_data(self, restaurant_limit: Optional[int] = 1000) -> Dict[str, int]:
        """
        Load all data from CSV files.

        Args:
            restaurant_limit: Maximum number of restaurants to load (for performance)

        Returns:
            Dictionary with counts of each type of data loaded
        """
        logger.info("Starting to load all data from CSV files...")

        results = {
            'food_taxonomy': self.load_food_taxonomy(),
            'restaurants': self.load_restaurants(limit=restaurant_limit, focus_telangana=False),
            'recipients': self.load_recipients(),
            'donations': self.load_donations(),
            'volunteers': self.load_volunteers()
        }

        logger.info(f"Data loading completed: {results}")
        return results

    def _convert_cost_to_price_level(self, cost_str: str) -> str:
        """
        Convert average cost to price level category.

        Args:
            cost_str: Cost string from CSV

        Returns:
            Price level category ($, $$, $$$, etc.)
        """
        try:
            cost = float(cost_str)
            if cost < 200:
                return "$"
            elif cost < 400:
                return "$$"
            elif cost < 600:
                return "$$$"
            else:
                return "$$$$"
        except ValueError:
            return "$$"  # Default to middle range