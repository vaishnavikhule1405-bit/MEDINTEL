import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("medintel.database")

# Connect args for SQLite if used
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info(f"Database engine initialized with URL pattern: {settings.DATABASE_URL.split('@')[-1]}")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    # Fallback to local SQLite if configured database fails to initialize
    logger.warning("Falling back to local SQLite engine (sqlite:///./medintel.db)")
    engine = create_engine("sqlite:///./medintel.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that yields a database session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
