import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL

# For SQLite fallback if MySQL is not available in ephemeral test environments
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLAlchemy engine with resilient connection pooling
engine = create_engine(
    db_url,
    pool_pre_ping=True,      # Automatically reconnects if connection dropped
    pool_recycle=1800,       # Recycles connection every 30 mins
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
