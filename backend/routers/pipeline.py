from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Idea, IdeaState
from flows.image_content_generator.pipeline.pipeline import Pipeline
from flows.image_content_generator.pipeline.schemas import VideoOrientation
from backend.models import Scene
import os

router = APIRouter()

LONG_OUT_BASE = "flows/image_content_generator/out_long"
SHORT_OUT_BASE = "flows/image_content_generator/out_short"
RESOURCE_BASE = "flows/image_content_generator/resource"

def get_pipeline(db: Session, orientation="short"):
    from pathlib import Path
    out_base = Path(SHORT_OUT_BASE if orientation == "short" else LONG_OUT_BASE)
    resource_base = Path(RESOURCE_BASE)
    ori = VideoOrientation.SHORT if orientation == "short" else VideoOrientation.LONG
    p = Pipeline(out_base=out_base, resource_base=resource_base, orientation=ori)
    from flows.image_content_generator.pipeline.storage_db import DbStore
    p._store = DbStore(db)
    return p

@router.post("/step1/{orientation}")
def run_step1(orientation: str, db: Session = Depends(get_db)):
    pipeline = get_pipeline(db, orientation)
    try:
        pipeline.step1_generate_story()
        return {"status": "success", "message": "Script generated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve/{idea_id}")
def approve_script(idea_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea or idea.state != IdeaState.SCRIPT_GENERATED:
        raise HTTPException(status_code=400, detail="Idea not ready for approval")
    
    idea.state = IdeaState.APPROVED
    db.commit()
    
    # Run the rest of the steps in background
    background_tasks.add_task(run_remaining_steps, idea_id, "short") # assuming short
    return {"status": "success", "message": "Approved. Generation started in background."}

def run_remaining_steps(idea_id: int, orientation: str):
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        pipeline = get_pipeline(db, orientation)
        pipeline.step2_generate_images(idea_id)
        pipeline.step3_generate_audios(idea_id)
        pipeline.step4_generate_videos(idea_id)
        pipeline.step5_generate_subtitles(idea_id)
        pipeline.step6_add_background_music(idea_id)
        pipeline.step7_rename_final_video(idea_id)
    except Exception as e:
        print("Pipeline background error:", e)
    finally:
        db.close()
