from datetime import date

import httpx

from app.core.config import settings


class WeatherApiError(Exception):
    pass


async def fetch_daily_max_temperatures(lat: float, lon: float, start: date, end: date) -> dict[str, float]:
    """Fetch daily max temperature (Celsius) for a point from Open-Meteo's historical archive.

    Returns a dict of ISO date string -> temperature. Open-Meteo omits a day entirely when it
    has no reading for that station-grid cell, rather than returning null, so gaps are simply
    missing keys here, not something the caller has to filter out.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": "temperature_2m_max",
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        try:
            response = await client.get(settings.open_meteo_archive_url, params=params)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise WeatherApiError(f"Could not fetch weather data: {exc}") from exc

    body = response.json()
    daily = body.get("daily")
    if not daily or "time" not in daily or "temperature_2m_max" not in daily:
        raise WeatherApiError("Weather provider returned an unexpected response shape")

    return {
        day: temp
        for day, temp in zip(daily["time"], daily["temperature_2m_max"], strict=True)
        if temp is not None
    }


async def geocode_place(query: str, count: int = 5) -> list[dict]:
    """Look up a place name and return candidate matches with coordinates."""
    params = {"name": query, "count": count, "language": "en", "format": "json"}
    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        try:
            response = await client.get(settings.open_meteo_geocoding_url, params=params)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise WeatherApiError(f"Could not search for that place: {exc}") from exc

    results = response.json().get("results") or []
    return [
        {
            "name": r["name"],
            "admin1": r.get("admin1"),
            "country": r.get("country"),
            "lat": r["latitude"],
            "lon": r["longitude"],
        }
        for r in results
    ]
