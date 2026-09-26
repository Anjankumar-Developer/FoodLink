from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    name: str
    email: str
    role: str = "coordinator"
    organization: str | None = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    token: str
    user: User