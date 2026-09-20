import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Novatek LeadOS"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./lead_os.db"

    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # Geoapify
    GEOAPIFY_API_KEY: Optional[str] = ""
    GEOAPIFY_BASE_URL: str = "https://api.geoapify.com/v2/places"

    # AI Providers
    OPENAI_API_KEY: Optional[str] = ""
    GEMINI_API_KEY: Optional[str] = ""
    GROQ_API_KEY: Optional[str] = ""

    # Authentication
    JWT_SECRET: str = "supersecret_novatek_leados_jwt_key_2026_change_in_prod"
    JWT_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # Email / SMTP
    SMTP_HOST: Optional[str] = ""
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = ""
    SMTP_PASSWORD: Optional[str] = ""
    SMTP_FROM: Optional[str] = ""

    # Storage
    STORAGE_BUCKET: Optional[str] = ""
    STORAGE_ENDPOINT: Optional[str] = ""
    STORAGE_ACCESS_KEY: Optional[str] = ""
    STORAGE_SECRET_KEY: Optional[str] = ""

    model_config = SettingsConfigDict(
        env_file=[
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env"
        ],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
