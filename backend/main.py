from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine, Base
from backend.routers import ideas, pipeline, media

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Content Automation", version="1.0")

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

import os
# Mount static files to serve generated assets if the directory exists
out_short_dir = os.path.join(os.getcwd(), "flows/image_content_generator/out_short")
if os.path.exists(out_short_dir):
    app.mount("/assets/short", StaticFiles(directory=out_short_dir), name="assets_short")
