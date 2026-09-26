from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import match as match_model
from ..schemas import match as match_schema

router = APIRouter(
    prefix="/api/matches",
    tags=["matches"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[match_schema.Match])
def read_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    matches = db.query(match_model.Match).offset(skip).limit(limit).all()
    return matches

@router.get("/{match_id}", response_model=match_schema.Match)
def read_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(match_model.Match).filter(match_model.Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.post("/", response_model=match_schema.Match, status_code=status.HTTP_201_CREATED)
def create_match(match: match_schema.MatchCreate, db: Session = Depends(get_db)):
    db_match = match_model.Match(**match.dict())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.put("/{match_id}", response_model=match_schema.Match)
def update_match(match_id: int, match: match_schema.MatchCreate, db: Session = Depends(get_db)):
    db_match = db.query(match_model.Match).filter(match_model.Match.id == match_id).first()
    if db_match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    for key, value in match.dict().items():
        setattr(db_match, key, value)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    db_match = db.query(match_model.Match).filter(match_model.Match.id == match_id).first()
    if db_match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(db_match)
    db.commit()
    return None