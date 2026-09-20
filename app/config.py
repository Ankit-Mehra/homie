from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./homie.db"
    environment: str = "development"
    dev_auth: bool = False
    supabase_url: str = ""


settings = Settings()
if settings.dev_auth and settings.environment != "development":
    raise RuntimeError("Development authentication is forbidden outside development")
