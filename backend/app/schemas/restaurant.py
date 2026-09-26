from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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

    class Config:
        orm_mode = True