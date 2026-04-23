from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import VideoTemplate, TemplateAsset, TemplateAssetType

router = APIRouter()

class TemplateAssetSchema(BaseModel):
    id: int
    asset_type: str

class TemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    scene_count: int
    duration_secs: int
    system_prompt: str
    audio_prompt: str
    assets: List[TemplateAssetSchema] = []

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scene_count: int
    duration_secs: int
    system_prompt: str
    audio_prompt: str

@router.get("/", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(VideoTemplate).all()
    out = []
    for t in templates:
        t_dict = {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "scene_count": t.scene_count,
            "duration_secs": t.duration_secs,
            "system_prompt": t.system_prompt,
            "audio_prompt": t.audio_prompt,
            "assets": [{"id": a.id, "asset_type": a.asset_type.value} for a in t.assets]
        }
        out.append(t_dict)
    return out

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
    for key, value in temp.dict().items():
        setattr(db_obj, key, value)
    db.commit()
    return {"status": "ok"}

@router.delete("/{id}")
def delete_template(id: int, db: Session = Depends(get_db)):
    db.query(VideoTemplate).filter(VideoTemplate.id == id).delete()
    db.commit()
    return {"status": "ok"}

@router.post("/{id}/assets/{asset_type}")
async def upload_asset(id: int, asset_type: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp = db.query(VideoTemplate).filter(VideoTemplate.id == id).first()
    if not temp: raise HTTPException(status_code=404, detail="Template not found")
    
    blob = await file.read()
    a_type = TemplateAssetType.IMAGE if asset_type == "image" else TemplateAssetType.MUSIC
    asset = TemplateAsset(template_id=id, asset_type=a_type, blob_data=blob)
    db.add(asset)
    db.commit()
    return {"status": "ok"}

@router.get("/assets/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(TemplateAsset).filter(TemplateAsset.id == asset_id).first()
    if not asset: raise HTTPException(status_code=404)
    mime = "audio/mpeg" if asset.asset_type == TemplateAssetType.MUSIC else "image/jpeg"
    return Response(content=asset.blob_data, media_type=mime)

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db.query(TemplateAsset).filter(TemplateAsset.id == asset_id).delete()
    db.commit()
    return {"status": "ok"}
