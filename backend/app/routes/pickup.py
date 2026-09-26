from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import pickup as pickup_model
from ..schemas import pickup as pickup_schema

router = APIRouter(
    prefix="/api/pickups",
    tags=["pickups"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[pickup_schema.Pickup])
def read_pickups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pickups = db.query(pickup_model.Pickup).offset(skip).limit(limit).all()
    return pickups

@router.get("/{pickup_id}", response_model=pickup_schema.Pickup)
def read_pickup(pickup_id: int, db: Session = Depends(get_db)):
    pickup = db.query(pickup_model.Pickup).filter(pickup_model.Pickup.id == pickup_id).first()
    if pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return pickup

@router.post("/", response_model=pickup_schema.Pickup, status_code=status.HTTP_201_CREATED)
def create_pickup(pickup: pickup_schema.PickupCreate, db: Session = Depends(get_db)):
    db_pickup = pickup_model.Pickup(**pickup.dict())
    db.add(db_pickup)
    db.commit()
    db.refresh(db_pickup)
    return db_pickup

@router.put("/{pickup_id}", response_model=pickup_schema.Pickup)
def update_pickup(pickup_id: int, pickup: pickup_schema.PickupCreate, db: Session = Depends(get_db)):
    db_pickup = db.query(pickup_model.Pickup).filter(pickup_model.Pickup.id == pickup_id).first()
    if db_pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    for key, value in pickup.dict().items():
        setattr(db_pickup, key, value)
    db.commit()
    db.refresh(db_pickup)
    return db_pickup

@router.delete("/{pickup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pickup(pickup_id: int, db: Session = Depends(get_db)):
    db_pickup = db.query(pickup_model.Pickup).filter(pickup_model.Pickup.id == pickup_id).first()
    if db_pickup is None:
        raise HTTPException(status_code=404, detail="Pickup not found")
    db.delete(db_pickup)
    db.commit()
    return None