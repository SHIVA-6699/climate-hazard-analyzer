from fastapi import APIRouter, Query, Request

from app.core.limiter import limiter
from app.core.weather_client import WeatherApiError, geocode_place
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, GeocodeResult
from app.services.analysis import analyze_heatwaves

router = APIRouter(prefix="/api")


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("20/minute")
async def analyze(request: Request, data: AnalyzeRequest) -> AnalyzeResponse:
    return await analyze_heatwaves(data)


@router.get("/geocode", response_model=list[GeocodeResult])
@limiter.limit("30/minute")
async def geocode(request: Request, q: str = Query(min_length=2, max_length=100)) -> list[GeocodeResult]:
    results = await geocode_place(q)
    return [GeocodeResult(**r) for r in results]


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}
