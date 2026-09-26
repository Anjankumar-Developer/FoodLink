from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import restaurant as restaurant_model
from ..schemas import restaurant as restaurant_schema

router = APIRouter(
    prefix="/api/restaurants",
    tags=["restaurants"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[restaurant_schema.Restaurant])
def read_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    restaurants = db.query(restaurant_model.Restaurant).offset(skip).limit(limit).all()
    return restaurants

@router.get("/{restaurant_id}", response_model=restaurant_schema.Restaurant)
def read_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(restaurant_model.Restaurant).filter(restaurant_model.Restaurant.id == restaurant_id).first()
    if restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@router.post("/", response_model=restaurant_schema.Restaurant, status_code=status.HTTP_201_CREATED)
def create_restaurant(restaurant: restaurant_schema.RestaurantCreate, db: Session = Depends(get_db)):
    db_restaurant = restaurant_model.Restaurant(**restaurant.dict())
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.put("/{restaurant_id}", response_model=restaurant_schema.Restaurant)
def update_restaurant(restaurant_id: int, restaurant: restaurant_schema.RestaurantCreate, db: Session = Depends(get_db)):
    db_restaurant = db.query(restaurant_model.Restaurant).filter(restaurant_model.Restaurant.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    for key, value in restaurant.dict().items():
        setattr(db_restaurant, key, value)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(restaurant_model.Restaurant).filter(restaurant_model.Restaurant.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(db_restaurant)
    db.commit()
    return None