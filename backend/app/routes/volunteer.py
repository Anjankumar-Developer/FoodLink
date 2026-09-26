from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import volunteer as volunteer_model
from ..schemas import volunteer as volunteer_schema

router = APIRouter(
    prefix="/api/volunteers",
    tags=["volunteers"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[volunteer_schema.Volunteer])
def read_volunteers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    volunteers = db.query(volunteer_model.Volunteer).offset(skip).limit(limit).all()
    return volunteers

@router.get("/{volunteer_id}", response_model=volunteer_schema.Volunteer)
def read_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    volunteer = db.query(volunteer_model.Volunteer).filter(volunteer_model.Volunteer.id == volunteer_id).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer

@router.post("/", response_model=volunteer_schema.Volunteer, status_code=status.HTTP_201_CREATED)
def create_volunteer(volunteer: volunteer_schema.VolunteerCreate, db: Session = Depends(get_db)):
    db_volunteer = volunteer_model.Volunteer(**volunteer.dict())
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer

@router.put("/{volunteer_id}", response_model=volunteer_schema.Volunteer)
def update_volunteer(volunteer_id: int, volunteer: volunteer_schema.VolunteerCreate, db: Session = Depends(get_db)):
    db_volunteer = db.query(volunteer_model.Volunteer).filter(volunteer_model.Volunteer.id == volunteer_id).first()
    if db_volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    for key, value in volunteer.dict().items():
        setattr(db_volunteer, key, value)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer

@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    db_volunteer = db.query(volunteer_model.Volunteer).filter(volunteer_model.Volunteer.id == volunteer_id).first()
    if db_volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    db.delete(db_volunteer)
    db.commit()
    return None