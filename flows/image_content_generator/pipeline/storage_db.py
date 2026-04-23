from sqlalchemy.orm import Session
from backend.models import Idea, IdeaState, Scene
from typing import Optional, List

class DbStore:
    def __init__(self, db: Session):
        self.db = db

    def add_new_idea(self, title: str, category: str) -> Idea:
        new_idea = Idea(
            title=title,
            category=category,
            state=IdeaState.PENDING,
            slug="" 
        )
        self.db.add(new_idea)
        self.db.commit()
        self.db.refresh(new_idea)
        return new_idea

    def save(self, idea: Idea) -> Idea:
        self.db.commit()
        self.db.refresh(idea)
        return idea

    def get_first_by_state(self, state: IdeaState) -> Optional[Idea]:
        return self.db.query(Idea).filter(Idea.state == state).order_by(Idea.id).first()

    def get_idea(self, idea_id: int) -> Optional[Idea]:
        return self.db.query(Idea).filter(Idea.id == idea_id).first()

    def update_scenes(self, idea_id: int, scenes_data: List[dict]):
        self.db.query(Scene).filter(Scene.idea_id == idea_id).delete()
        scenes = [
            Scene(
                idea_id=idea_id,
                scene_number=i+1,
                image_prompt=s.get("image_prompt", ""),
                narration=s.get("narration", "")
            ) for i, s in enumerate(scenes_data)
        ]
        self.db.add_all(scenes)
        self.db.commit()
