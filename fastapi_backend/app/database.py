import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

import os
if os.getenv("TESTING") == "1":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_file = os.path.join(base_dir, "test_ecopuntos.db")
    sqlite_url = f"sqlite:///{sqlite_file}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
else:
    try:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with engine.connect() as conn:
            logger.info("Conectado exitosamente a PostgreSQL")
    except Exception as e:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sqlite_file = os.path.join(base_dir, "ecopuntos.db")
        sqlite_url = f"sqlite:///{sqlite_file}"
        logger.warning(f"No se pudo conectar a PostgreSQL ({e}). Usando SQLite local en: {sqlite_url}")
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
