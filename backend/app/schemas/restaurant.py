from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RestaurantBase(BaseModel):
    name: str
    address: str
    latitude: str
    longitude: str
    rating: Optional[str] = None
    price_level: Optional[str] = None
    cuisine: Optional[str] = None
    food_categories: Optional[str] = None
    verified: Optional[bool] = False


class RestaurantCreate(RestaurantBase):
    pass


class Restaurant(RestaurantBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)