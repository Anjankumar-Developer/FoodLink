from sqlalchemy import create_engine
from app.database import Base
from app.config import settings

def init_db():
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()