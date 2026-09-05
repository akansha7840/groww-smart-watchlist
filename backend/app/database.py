from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create SQLAlchemy engine with connection pool settings for MySQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Automatically reconnects if connection was dropped
    pool_recycle=3600,       # Recycles connections every hour to avoid MySQL timeout
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
