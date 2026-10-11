from app.services.hazard import (
    build_summary_insight,
    compute_threshold,
    compute_trend,
    detect_heatwave_events,
    yearly_heatwave_days,
)


def days(start: str, temps: list[float]) -> dict[str, float]:
    """Build a dict of consecutive calendar days starting at `start`, one per temp."""
    from datetime import date, timedelta

    start_date = date.fromisoformat(start)
    return {(start_date + timedelta(days=i)).isoformat(): t for i, t in enumerate(temps)}


def test_threshold_is_the_95th_percentile():
    baseline = {f"2000-01-{d:02d}": float(d) for d in range(1, 21)}  # 1..20
    threshold = compute_threshold(baseline)
    assert threshold == 19.05


def test_run_of_three_hot_days_is_a_heatwave():
    temps = days("2020-06-01", [30, 40, 41, 42, 30])
    events = detect_heatwave_events(temps, threshold=35)

    assert len(events) == 1
    assert events[0].start == "2020-06-02"
    assert events[0].end == "2020-06-04"
    assert events[0].duration_days == 3
    assert events[0].peak_temp_c == 42


def test_two_hot_days_are_not_a_heatwave():
    temps = days("2020-06-01", [40, 41, 30])
    assert detect_heatwave_events(temps, threshold=35) == []


def test_a_gap_in_the_data_breaks_the_run():
    temps = days("2020-06-01", [40, 41])
    temps.update(days("2020-06-05", [42, 43]))  # not consecutive with the first two

    assert detect_heatwave_events(temps, threshold=35) == []


def test_two_separate_heatwaves_are_both_found():
    temps = days("2020-06-01", [40, 41, 42, 10, 10, 40, 41, 42])
    events = detect_heatwave_events(temps, threshold=35)

    assert len(events) == 2
    assert events[0].start == "2020-06-01"
    assert events[1].start == "2020-06-06"


def test_a_run_that_reaches_the_end_of_the_series_still_counts():
    temps = days("2020-06-01", [10, 40, 41, 42])
    events = detect_heatwave_events(temps, threshold=35)

    assert len(events) == 1
    assert events[0].duration_days == 3


def test_yearly_heatwave_days_attributes_to_the_start_year():
    from app.services.hazard import HeatwaveEvent

    events = [
        HeatwaveEvent(start="2019-12-30", end="2020-01-02", duration_days=4, peak_temp_c=40),
        HeatwaveEvent(start="2020-07-01", end="2020-07-03", duration_days=3, peak_temp_c=41),
    ]
    result = yearly_heatwave_days(events, start_year=2019, end_year=2020)

    assert result == {2019: 4, 2020: 3}


def test_trend_detects_a_clear_increase():
    yearly = {2000 + i: i for i in range(15)}  # 0, 1, 2, ... 14 - an obvious upward trend
    trend = compute_trend(yearly)

    assert trend["slope_days_per_year"] > 0
    assert trend["mann_kendall_trend"] == "increasing"
    assert trend["percent_change"] > 0


def test_trend_with_too_few_years_is_reported_as_insufficient():
    trend = compute_trend({2020: 1, 2021: 2})
    assert trend["mann_kendall_trend"] == "insufficient data"


def test_summary_claims_a_trend_only_when_statistically_significant():
    noisy_trend = {"percent_change": 34, "mann_kendall_p_value": 0.44}
    message = build_summary_insight(noisy_trend, "Phoenix, Arizona", 1990, 2020)

    assert "not statistically significant" in message
    assert "34%" in message


def test_summary_states_a_trend_plainly_when_significant():
    clear_trend = {"percent_change": 50, "mann_kendall_p_value": 0.01}
    message = build_summary_insight(clear_trend, "Phoenix, Arizona", 1990, 2020)

    assert "statistically significant trend" in message
    assert "not statistically significant" not in message


def test_summary_reports_stable_for_a_small_change_regardless_of_significance():
    small_trend = {"percent_change": 2, "mann_kendall_p_value": 0.01}
    message = build_summary_insight(small_trend, "Phoenix, Arizona", 1990, 2020)

    assert "stable" in message
