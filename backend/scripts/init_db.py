import sqlite3
from pathlib import Path

from sqlalchemy import create_engine

from app.config import settings
from app.database import Base
from app.models.user import User  # Ensure auth schema is included in metadata before create_all()


def _get_sqlite_path():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return None

    relative_path = settings.DATABASE_URL.replace("sqlite:///", "", 1)
    if relative_path.startswith("./"):
        relative_path = relative_path[2:]

    return Path(relative_path).resolve() if not Path(relative_path).is_absolute() else Path(relative_path)


def init_db():
    sqlite_path = _get_sqlite_path()

    if sqlite_path and sqlite_path.exists():
        try:
            with sqlite3.connect(str(sqlite_path)) as connection:
                columns = [row[1] for row in connection.execute("PRAGMA table_info(users)").fetchall()]
                if not columns or "password_hash" not in columns or "organization" not in columns:
                    connection.close()
                    sqlite_path.unlink()
        except Exception:
            if sqlite_path.exists():
                sqlite_path.unlink()

    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()