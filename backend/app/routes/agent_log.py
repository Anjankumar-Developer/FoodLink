from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import agent_log as agent_log_model
from ..schemas import agent_log as agent_log_schema

router = APIRouter(
    prefix="/api/agent_logs",
    tags=["agent_logs"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[agent_log_schema.AgentLog])
def read_agent_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    agent_logs = db.query(agent_log_model.AgentLog).offset(skip).limit(limit).all()
    return agent_logs

@router.get("/{agent_log_id}", response_model=agent_log_schema.AgentLog)
def read_agent_log(agent_log_id: int, db: Session = Depends(get_db)):
    agent_log = db.query(agent_log_model.AgentLog).filter(agent_log_model.AgentLog.id == agent_log_id).first()
    if agent_log is None:
        raise HTTPException(status_code=404, detail="Agent log not found")
    return agent_log

@router.post("/", response_model=agent_log_schema.AgentLog, status_code=status.HTTP_201_CREATED)
def create_agent_log(agent_log: agent_log_schema.AgentLogCreate, db: Session = Depends(get_db)):
    db_agent_log = agent_log_model.AgentLog(**agent_log.dict())
    db.add(db_agent_log)
    db.commit()
    db.refresh(db_agent_log)
    return db_agent_log

@router.put("/{agent_log_id}", response_model=agent_log_schema.AgentLog)
def update_agent_log(agent_log_id: int, agent_log: agent_log_schema.AgentLogCreate, db: Session = Depends(get_db)):
    db_agent_log = db.query(agent_log_model.AgentLog).filter(agent_log_model.AgentLog.id == agent_log_id).first()
    if db_agent_log is None:
        raise HTTPException(status_code=404, detail="Agent log not found")
    for key, value in agent_log.dict().items():
        setattr(db_agent_log, key, value)
    db.commit()
    db.refresh(db_agent_log)
    return db_agent_log

@router.delete("/{agent_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_log(agent_log_id: int, db: Session = Depends(get_db)):
    db_agent_log = db.query(agent_log_model.AgentLog).filter(agent_log_model.AgentLog.id == agent_log_id).first()
    if db_agent_log is None:
        raise HTTPException(status_code=404, detail="Agent log not found")
    db.delete(db_agent_log)
    db.commit()
    return None