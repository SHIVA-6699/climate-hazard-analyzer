from datetime import date, timedelta

from app.core.config import settings
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, HeatwaveEventOut, TrendOut
from app.services.hazard import (
    build_summary_insight,
    compute_threshold,
    compute_trend,
    detect_heatwave_events,
    yearly_heatwave_days,
)
from app.services.weather_cache import get_daily_temperatures


async def analyze_heatwaves(request: AnalyzeRequest) -> AnalyzeResponse:
    baseline_start_year = min(request.start_year, request.end_year - settings.baseline_min_years + 1)
    baseline_start_year = max(baseline_start_year, settings.earliest_data_year)

    latest_available = date.today() - timedelta(days=settings.archive_data_lag_days)

    fetch_start = date(baseline_start_year, 1, 1)
    fetch_end = min(date(request.end_year, 12, 31), latest_available)
    fetch_end = max(fetch_end, fetch_start)

    daily_temps = await get_daily_temperatures(request.lat, request.lon, fetch_start, fetch_end)
    threshold = compute_threshold(daily_temps)

    analysis_start = date(request.start_year, 1, 1)
    analysis_end = date(request.end_year, 12, 31)
    temps_in_range = {d: t for d, t in daily_temps.items() if analysis_start.isoformat() <= d <= analysis_end.isoformat()}

    events = detect_heatwave_events(temps_in_range, threshold)
    yearly = yearly_heatwave_days(events, request.start_year, request.end_year)
    trend = compute_trend(yearly)
    summary = build_summary_insight(trend, request.region_label, request.start_year, request.end_year)

    return AnalyzeResponse(
        region_label=request.region_label,
        lat=request.lat,
        lon=request.lon,
        start_year=request.start_year,
        end_year=request.end_year,
        threshold_celsius=round(threshold, 1),
        yearly_heatwave_days=yearly,
        events=[HeatwaveEventOut(**vars(e)) for e in events],
        trend=TrendOut(**trend),
        summary=summary,
    )
