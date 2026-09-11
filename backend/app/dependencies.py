from typing import Generator
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.services.model_manager import ModelManager, model_manager

def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_models() -> ModelManager:
    """Dependency for accessing the centralized ModelManager singleton."""
    return model_manager
