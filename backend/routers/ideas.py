from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from backend.database import get_db
from backend.models import Idea, Scene

router = APIRouter()

@router.get("/")
def list_ideas(db: Session = Depends(get_db)):
    ideas = db.query(Idea).order_by(desc(Idea.id)).all()
    return ideas

@router.get("/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404)
    return idea

@router.get("/{idea_id}/scenes")
def get_idea_scenes(idea_id: int, db: Session = Depends(get_db)):
    scenes = db.query(Scene).filter(Scene.idea_id == idea_id).order_by(Scene.scene_number).all()
    return scenes
