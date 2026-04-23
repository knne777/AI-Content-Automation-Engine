from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from backend.database import get_db
from backend.models import Idea, Scene

router = APIRouter()

from sqlalchemy.orm import defer

@router.get("/")
def list_ideas(db: Session = Depends(get_db)):
    ideas = db.query(Idea).options(defer(Idea.video_blob)).order_by(desc(Idea.id)).all()
    return [{"id": i.id, "title": i.title, "category": i.category, "state": i.state, "slug": i.slug} for i in ideas]

@router.get("/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).options(defer(Idea.video_blob)).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404)
    return {"id": idea.id, "title": idea.title, "category": idea.category, "state": idea.state, "slug": idea.slug}

@router.get("/{idea_id}/scenes")
def get_idea_scenes(idea_id: int, db: Session = Depends(get_db)):
    scenes = db.query(Scene).options(defer(Scene.image_blob)).filter(Scene.idea_id == idea_id).order_by(Scene.scene_number).all()
    return [{"id": s.id, "scene_number": s.scene_number, "narration": s.narration, "image_prompt": s.image_prompt} for s in scenes]
