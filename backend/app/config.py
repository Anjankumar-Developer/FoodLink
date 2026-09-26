from pathlib import Path
from typing import Optional

from pydantic import BaseSettings


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{(PROJECT_ROOT / 'foodlink.db').as_posix()}"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PROJECT_NAME: str = "FoodLink API"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = (".env", "backend/.env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()