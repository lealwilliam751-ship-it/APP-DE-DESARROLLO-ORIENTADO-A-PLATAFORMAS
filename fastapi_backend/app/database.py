import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

try:
    engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
    with engine.connect() as conn:
        logger.info("Conectado exitosamente a PostgreSQL")
except Exception as e:
    logger.warning(f"No se pudo conectar a PostgreSQL ({e}). Usando SQLite local como respaldo de resiliencia.")
    sqlite_url = "sqlite:///./ecopuntos.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
