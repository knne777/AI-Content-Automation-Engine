from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Idea, Scene

router = APIRouter()

@router.get("/ideas/{idea_id}/video")
def stream_video(idea_id: int, request: Request, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea or not idea.video_blob:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data = idea.video_blob
    file_size = len(video_data)
    
    # Handle Range requests for video streaming
    range_header = request.headers.get("Range")
    
    if range_header:
        # Parsing the range header (e.g., 'bytes=0-')
        start, end = 0, file_size - 1
        try:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if len(range_match) > 1 and range_match[1] else file_size - 1
        except ValueError:
            pass

        if start >= file_size or end >= file_size:
            return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})

        chunk_size = end - start + 1
        video_chunk = video_data[start:end+1]

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "video/mp4",
        }
        return Response(content=video_chunk, status_code=206, headers=headers)
        
    # If no Range requested, return full video
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": "video/mp4",
    }
    return Response(content=video_data, headers=headers)

@router.get("/scenes/{scene_id}/image")
def get_image(scene_id: int, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene or not scene.image_blob:
        raise HTTPException(status_code=404, detail="Image not found")
        
    return Response(content=scene.image_blob, media_type="image/png")
