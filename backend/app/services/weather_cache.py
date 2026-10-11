from datetime import UTC, date, datetime, timedelta

from app.core.config import settings
from app.core.db import get_db
from app.core.weather_client import fetch_daily_max_temperatures


def cache_key(lat: float, lon: float) -> str:
    return f"{round(lat, 2)}_{round(lon, 2)}"


async def get_daily_temperatures(lat: float, lon: float, start: date, end: date) -> dict[str, float]:
    db = get_db()
    key = cache_key(lat, lon)
    doc = await db.weather_cache.find_one({"cache_key": key})

    if doc and _is_fresh(doc) and _covers(doc, start, end):
        return _slice(doc["daily_temps"], start, end)

    fetch_start, fetch_end = _range_to_fetch(doc, start, end)
    fetched = await fetch_daily_max_temperatures(lat, lon, fetch_start, fetch_end)

    merged = {**(doc["daily_temps"] if doc else {}), **fetched}
    covered_start = min(fetch_start, date.fromisoformat(doc["covered_start"])) if doc else fetch_start
    covered_end = max(fetch_end, date.fromisoformat(doc["covered_end"])) if doc else fetch_end

    await db.weather_cache.update_one(
        {"cache_key": key},
        {
            "$set": {
                "cache_key": key,
                "lat": lat,
                "lon": lon,
                "daily_temps": merged,
                "covered_start": covered_start.isoformat(),
                "covered_end": covered_end.isoformat(),
                "cached_at": datetime.now(UTC),
            }
        },
        upsert=True,
    )
    return _slice(merged, start, end)


def _is_fresh(doc: dict) -> bool:
    cached_at = doc["cached_at"]
    if cached_at.tzinfo is None:
        cached_at = cached_at.replace(tzinfo=UTC)
    return datetime.now(UTC) - cached_at < timedelta(days=settings.cache_ttl_days)


def _covers(doc: dict, start: date, end: date) -> bool:
    return date.fromisoformat(doc["covered_start"]) <= start and date.fromisoformat(doc["covered_end"]) >= end


def _range_to_fetch(doc: dict | None, start: date, end: date) -> tuple[date, date]:
    if doc is None:
        return start, end
    covered_start = date.fromisoformat(doc["covered_start"])
    covered_end = date.fromisoformat(doc["covered_end"])
    return min(start, covered_start), max(end, covered_end)


def _slice(daily_temps: dict[str, float], start: date, end: date) -> dict[str, float]:
    return {d: t for d, t in daily_temps.items() if start.isoformat() <= d <= end.isoformat()}
