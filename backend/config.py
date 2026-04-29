"""Configuration for FastAPI backend."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """App configuration from environment variables."""
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # LLM Provider
    LLM_PROVIDER: str = "openai"  # "openai" or "anthropic"
    LLM_MODEL: str = "gpt-4o-mini"
    
    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: list = ["*"]
    
    # OCR
    USE_TESSERACT: bool = True
    TESSERACT_PATH: Optional[str] = None  # e.g., r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    
    # Image processing
    MAX_IMAGE_SIZE_MB: float = 10.0
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "gif", "webp"]
    COMPRESSION_QUALITY: int = 85
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
