from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session, defer

from backend.database import get_db
from backend.models import VideoTemplate

router = APIRouter()

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scene_count: int
    duration_secs: int
    system_prompt: str
    audio_prompt: str

@router.get("/")
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(VideoTemplate).options(defer(VideoTemplate.ref_image_blob), defer(VideoTemplate.bg_music_blob)).all()
    return [{
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "scene_count": t.scene_count,
        "duration_secs": t.duration_secs,
        "system_prompt": t.system_prompt,
        "audio_prompt": t.audio_prompt
    } for t in templates]

@router.post("/")
def create_template(temp: TemplateCreate, db: Session = Depends(get_db)):
    db_obj = VideoTemplate(**temp.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return {"id": db_obj.id, "name": db_obj.name}

@router.put("/{id}")
def update_template(id: int, temp: TemplateCreate, db: Session = Depends(get_db)):
    db_obj = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not db_obj: raise HTTPException(status_code=404)
    db_obj.name = temp.name
    db_obj.description = temp.description
    db_obj.scene_count = temp.scene_count
    db_obj.duration_secs = temp.duration_secs
    db_obj.system_prompt = temp.system_prompt
    db_obj.audio_prompt = temp.audio_prompt
    db.commit()
    return {"status": "ok"}

@router.delete("/{id}")
def delete_template(id: int, db: Session = Depends(get_db)):
    db.query(VideoTemplate).filter(VideoTemplate.id == id).delete()
    db.commit()
    return {"status": "ok"}

@router.post("/{id}/image")
async def upload_ref_image(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not temp: raise HTTPException(status_code=404)
    temp.ref_image_blob = await file.read()
    db.commit()
    return {"status": "ok"}

@router.post("/{id}/music")
async def upload_music(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not temp: raise HTTPException(status_code=404)
    temp.bg_music_blob = await file.read()
    db.commit()
    return {"status": "ok"}

@router.get("/{id}/image")
def get_ref_image(id: int, db: Session = Depends(get_db)):
    temp = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not temp or not temp.ref_image_blob: raise HTTPException(status_code=404)
    return Response(content=temp.ref_image_blob, media_type="image/jpeg")

@router.get("/{id}/music")
def get_music(id: int, db: Session = Depends(get_db)):
    temp = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not temp or not temp.bg_music_blob: raise HTTPException(status_code=404)
    return Response(content=temp.bg_music_blob, media_type="audio/mpeg")
