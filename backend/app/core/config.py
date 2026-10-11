from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Climate Hazard Trend Analyzer"
    environment: str = "development"

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "climate_hazard"

    frontend_url: str = "http://localhost:5173"
    cors_origins: list[str] = ["http://localhost:5173"]

    open_meteo_archive_url: str = "https://archive-api.open-meteo.com/v1/archive"
    open_meteo_geocoding_url: str = "https://geocoding-api.open-meteo.com/v1/search"
    open_meteo_timeout_seconds: float = 20.0

    # how far back of data to request beyond the user's start year, to build a stable
    # percentile baseline even when the user picks a short or recent range
    baseline_min_years: int = 15
    earliest_data_year: int = 1950

    cache_ttl_days: int = 30

    rate_limit: str = "30/minute"


settings = Settings()
