from dataclasses import dataclass
from datetime import date, datetime

import numpy as np
import pymannkendall as mk
from scipy import stats

HEATWAVE_MIN_DURATION_DAYS = 3
HEATWAVE_PERCENTILE = 95


@dataclass
class HeatwaveEvent:
    start: str
    end: str
    duration_days: int
    peak_temp_c: float


def _sorted_series(daily_temps: dict[str, float]) -> list[tuple[date, float]]:
    return sorted((datetime.fromisoformat(d).date(), t) for d, t in daily_temps.items())


def compute_threshold(baseline_temps: dict[str, float]) -> float:
    if not baseline_temps:
        raise ValueError("No baseline temperature data to compute a threshold from")
    values = np.array(list(baseline_temps.values()))
    return float(np.percentile(values, HEATWAVE_PERCENTILE))


def detect_heatwave_events(daily_temps: dict[str, float], threshold: float) -> list[HeatwaveEvent]:
    series = _sorted_series(daily_temps)
    events: list[HeatwaveEvent] = []
    current_run: list[tuple[date, float]] = []

    def close_run() -> None:
        if len(current_run) >= HEATWAVE_MIN_DURATION_DAYS:
            events.append(
                HeatwaveEvent(
                    start=current_run[0][0].isoformat(),
                    end=current_run[-1][0].isoformat(),
                    duration_days=len(current_run),
                    peak_temp_c=round(max(t for _, t in current_run), 1),
                )
            )

    for i, (day, temp) in enumerate(series):
        is_hot = temp > threshold
        follows_previous_day = i > 0 and (day - series[i - 1][0]).days == 1

        if is_hot and (not current_run or follows_previous_day):
            current_run.append((day, temp))
        else:
            close_run()
            current_run = [(day, temp)] if is_hot else []

    close_run()
    return events


def yearly_heatwave_days(events: list[HeatwaveEvent], start_year: int, end_year: int) -> dict[int, int]:
    counts = {year: 0 for year in range(start_year, end_year + 1)}
    for event in events:
        year = datetime.fromisoformat(event.start).year
        if year in counts:
            counts[year] += event.duration_days
    return counts


def compute_trend(yearly_days: dict[int, int]) -> dict:
    years = np.array(sorted(yearly_days.keys()))
    days = np.array([yearly_days[y] for y in years])

    if len(years) < 3:
        return {
            "slope_days_per_year": 0.0,
            "intercept": 0.0,
            "p_value": None,
            "mann_kendall_trend": "insufficient data",
            "percent_change": None,
        }

    regression = stats.linregress(years, days)

    mk_result = mk.original_test(days)

    first_span = max(1, len(days) // 3)
    early_avg = float(np.mean(days[:first_span]))
    late_avg = float(np.mean(days[-first_span:]))
    if early_avg > 0:
        percent_change = round((late_avg - early_avg) / early_avg * 100)
    elif late_avg > 0:
        percent_change = None  # went from zero heatwave days to some; a percentage is meaningless here
    else:
        percent_change = 0

    return {
        "slope_days_per_year": round(float(regression.slope), 3),
        "intercept": round(float(regression.intercept), 3),
        "p_value": round(float(regression.pvalue), 4),
        "mann_kendall_trend": mk_result.trend,
        "mann_kendall_p_value": round(float(mk_result.p), 4),
        "percent_change": percent_change,
        "early_period_avg_days": round(early_avg, 1),
        "late_period_avg_days": round(late_avg, 1),
    }


SIGNIFICANCE_LEVEL = 0.05


def build_summary_insight(trend: dict, region_label: str, start_year: int, end_year: int) -> str:
    period = f"{start_year}-{end_year}"
    change = trend["percent_change"]
    mk_p = trend.get("mann_kendall_p_value")
    is_significant = mk_p is not None and mk_p < SIGNIFICANCE_LEVEL

    if change is None:
        return f"Not enough heatwave activity in {region_label} between {start_year} and {end_year} to describe a trend."

    direction = "increased" if change > 0 else "decreased" if change < 0 else "stayed about the same"

    if abs(change) <= 5:
        return f"Heatwave days in {region_label} have stayed roughly stable across {period}."

    if is_significant:
        return f"Heatwave days in {region_label} have {direction} by about {abs(change)}% across {period}, a statistically significant trend (Mann-Kendall p = {mk_p})."

    return (
        f"Heatwave days in {region_label} were about {abs(change)}% {'higher' if change > 0 else 'lower'} in the "
        f"later years of {period} than the earlier ones, but the trend is not statistically significant "
        f"(Mann-Kendall p = {mk_p}), so this may just be year-to-year variation rather than a real shift."
    )
