from datetime import datetime

from pydantic import BaseModel, Field, model_validator

CURRENT_YEAR = datetime.now().year


class AnalyzeRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    start_year: int = Field(ge=1950, le=CURRENT_YEAR)
    end_year: int = Field(ge=1950, le=CURRENT_YEAR)
    region_label: str = Field(default="this location", max_length=120)

    @model_validator(mode="after")
    def check_year_range(self) -> "AnalyzeRequest":
        if self.end_year <= self.start_year:
            raise ValueError("end_year must be after start_year")
        if self.end_year - self.start_year > 80:
            raise ValueError("Pick a range of 80 years or less")
        return self


class HeatwaveEventOut(BaseModel):
    start: str
    end: str
    duration_days: int
    peak_temp_c: float


class TrendOut(BaseModel):
    slope_days_per_year: float
    intercept: float
    p_value: float | None
    mann_kendall_trend: str
    mann_kendall_p_value: float | None = None
    percent_change: int | None
    early_period_avg_days: float | None = None
    late_period_avg_days: float | None = None


class AnalyzeResponse(BaseModel):
    region_label: str
    lat: float
    lon: float
    start_year: int
    end_year: int
    threshold_celsius: float
    yearly_heatwave_days: dict[int, int]
    events: list[HeatwaveEventOut]
    trend: TrendOut
    summary: str


class GeocodeResult(BaseModel):
    name: str
    admin1: str | None
    country: str | None
    lat: float
    lon: float
