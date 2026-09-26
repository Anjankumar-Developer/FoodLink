from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import shelter as shelter_model
from ..schemas import shelter as shelter_schema

router = APIRouter(
    prefix="/api/shelters",
    tags=["shelters"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[shelter_schema.Shelter])
def read_shelters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    shelters = db.query(shelter_model.Shelter).offset(skip).limit(limit).all()
    return shelters

@router.get("/{shelter_id}", response_model=shelter_schema.Shelter)
def read_shelter(shelter_id: int, db: Session = Depends(get_db)):
    shelter = db.query(shelter_model.Shelter).filter(shelter_model.Shelter.id == shelter_id).first()
    if shelter is None:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return shelter

@router.post("/", response_model=shelter_schema.Shelter, status_code=status.HTTP_201_CREATED)
def create_shelter(shelter: shelter_schema.ShelterCreate, db: Session = Depends(get_db)):
    db_shelter = shelter_model.Shelter(**shelter.dict())
    db.add(db_shelter)
    db.commit()
    db.refresh(db_shelter)
    return db_shelter

@router.put("/{shelter_id}", response_model=shelter_schema.Shelter)
def update_shelter(shelter_id: int, shelter: shelter_schema.ShelterCreate, db: Session = Depends(get_db)):
    db_shelter = db.query(shelter_model.Shelter).filter(shelter_model.Shelter.id == shelter_id).first()
    if db_shelter is None:
        raise HTTPException(status_code=404, detail="Shelter not found")
    for key, value in shelter.dict().items():
        setattr(db_shelter, key, value)
    db.commit()
    db.refresh(db_shelter)
    return db_shelter

@router.delete("/{shelter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelter(shelter_id: int, db: Session = Depends(get_db)):
    db_shelter = db.query(shelter_model.Shelter).filter(shelter_model.Shelter.id == shelter_id).first()
    if db_shelter is None:
        raise HTTPException(status_code=404, detail="Shelter not found")
    db.delete(db_shelter)
    db.commit()
    return None