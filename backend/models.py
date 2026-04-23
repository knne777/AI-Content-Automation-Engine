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

class TemplateAssetType(str, enum.Enum):
    IMAGE = "IMAGE"
    MUSIC = "MUSIC"

class TemplateAsset(Base):
    __tablename__ = "template_assets"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("video_templates.id"))
    asset_type = Column(SQLEnum(TemplateAssetType))
    blob_data = Column(LargeBinary)
    
    template = relationship("VideoTemplate", back_populates="assets")

class VideoTemplate(Base):
    __tablename__ = "video_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    scene_count = Column(Integer, default=12)
    duration_secs = Column(Integer, default=60)
    system_prompt = Column(Text)
    audio_prompt = Column(Text)

    ideas = relationship("Idea", back_populates="template")
    assets = relationship("TemplateAsset", back_populates="template", cascade="all, delete-orphan")

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("video_templates.id"), nullable=True)
    title = Column(String, index=True)
    category = Column(String)
    state = Column(SQLEnum(IdeaState), default=IdeaState.PENDING)
    slug = Column(String)
    video_blob = Column(LargeBinary, nullable=True)
    
    template = relationship("VideoTemplate", back_populates="ideas")
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
