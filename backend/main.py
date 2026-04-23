from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine, Base, SessionLocal
from backend.routers import ideas, pipeline, media, templates
from backend.models import VideoTemplate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Content Automation", version="1.0")

def seed_db():
    db = SessionLocal()
    if not db.query(VideoTemplate).first():
        try:
            from flows.image_content_generator.pipeline.prompt_shorts.finances.constants import IDEA_PROMPT_MINDSET, SCRIPT_PROMPT, AUDIO_PROMPT
            default_template = VideoTemplate(
                name="Concepto Financiero",
                description="Idea de Mindset con guion estilo story-telling.",
                scene_count=12,
                duration_secs=60,
                system_prompt=IDEA_PROMPT_MINDSET + "\n\n" + SCRIPT_PROMPT,
                audio_prompt=AUDIO_PROMPT
            )
            db.add(default_template)
            db.commit()
        except Exception as e:
            pass
    db.close()

seed_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ideas.router, prefix="/api/ideas", tags=["Ideas"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])

import os
# Mount static files to serve generated assets if the directory exists
out_short_dir = os.path.join(os.getcwd(), "flows/image_content_generator/out_short")
if os.path.exists(out_short_dir):
    app.mount("/assets/short", StaticFiles(directory=out_short_dir), name="assets_short")
