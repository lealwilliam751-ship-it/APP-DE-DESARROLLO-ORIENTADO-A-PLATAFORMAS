import os
os.environ["TESTING"] = "1"

import pytest
from app.database import engine, Base, SessionLocal

@pytest.fixture(autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
