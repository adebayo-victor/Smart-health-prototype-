"""
Database engine, session management, and Base declaration for SQLAlchemy 2.0.
Provides the get_db dependency generator for FastAPI endpoints.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from config import settings

# Determine database dialect
db_url = settings.sqlalchemy_database_url
is_sqlite = db_url.startswith("sqlite")

# SQLite requires check_same_thread=False when used with multi-threaded frameworks like FastAPI
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Initialize SQLAlchemy engine
engine = create_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
    future=True,
)

# Configure session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

# Declarative base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a scoped database session.
    Automatically closes the session at the end of the request.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
