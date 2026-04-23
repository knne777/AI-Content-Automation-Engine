from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SQLEnum, LargeBinary
from sqlalchemy.orm import relationship
import enum
from backend.database import Base

class IdeaState(str, enum.Enum):
    PENDING = "PENDING"
    SCRIPT_GENERATED = "SCRIPT_GENERATED"
    APPROVED = "APPROVED"
    IMAGES_GENERATED = "IMAGES_GENERATED"
    AUDIO_GENERATED = "AUDIO_GENERATED"
    VIDEO_GENERATED = "VIDEO_GENERATED"
    VIDEO_SUBTITLED = "VIDEO_SUBTITLED"
    VIDEO_MUSIC_GENERATED = "VIDEO_MUSIC_GENERATED"
    COMPLETED = "COMPLETED"

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)
    state = Column(SQLEnum(IdeaState), default=IdeaState.PENDING)
    slug = Column(String)
    video_blob = Column(LargeBinary, nullable=True)
    
    scenes = relationship("Scene", back_populates="idea", cascade="all, delete-orphan")

class Scene(Base):
    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id"))
    scene_number = Column(Integer)
    image_prompt = Column(Text)
    narration = Column(Text)
    image_blob = Column(LargeBinary, nullable=True)
    
    idea = relationship("Idea", back_populates="scenes")
