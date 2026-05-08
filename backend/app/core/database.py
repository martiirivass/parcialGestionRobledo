"""
Database configuration with SQLModel
"""
from typing import Generator, AsyncGenerator
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import create_engine as sa_create_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Create engine with NullPool for async support
engine = create_engine(
    settings.database_url,
    echo=False,
    poolclass=NullPool,
)


def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Get a database session"""
    return Session(engine)


def get_session_context() -> Generator[Session, None, None]:
    """Context manager for database sessions"""
    with Session(engine) as session:
        yield session


# Type alias for session dependencies
SessionDep = Session