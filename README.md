# Climate Hazard Trend Analyzer

Case study submission for the Full-Stack Developer role at Dygnify Ventures.

Pick a city (or a point on the map) and a year range, and it tells you how heatwaves have changed there — with a chart, the actual stats behind it, and an insight sentence that doesn't overstate what the data actually shows.

Live: https://climate-hazard-analyzer-8e9a.onrender.com

(Note: it's on Render's free tier, so if nobody's hit it in a while the first request can take 20-30 seconds to wake up. After that it's normal speed.)

## What it does

- Search a city by name, or pick a point on a map
- Pick a year range (defaults to 1990-2020)
- Hits the backend, which pulls daily max temperature data for that spot, works out heatwave days per year, and runs a trend analysis on it
- Shows a bar chart of heatwave days per year (bars colored by how hot that year was relative to the others), a trend line, a plain-English summary, and the list of individual heatwave events
- Export the results as CSV or PDF

## Setup

### Backend

```
cd backend
python -m venv .venv
.venv/Scripts/activate   (or source .venv/bin/activate on mac/linux)
pip install -r requirements.txt
cp .env.example .env
```

You need a MongoDB instance. Easiest way locally is the docker-compose file at the repo root:

```
docker compose up -d
```

That gives you Mongo on localhost:27017, which matches the default `.env`. Then:

```
uvicorn app.main:app --reload --port 8000
```

### Frontend

```
cd frontend
npm install
npm run dev
```

This runs on :5173 and proxies `/api` calls to the backend on :8000, so run both at the same time while developing.

### Running it as one thing (how it's actually deployed)

The backend can serve the built frontend directly, so in production it's just one process:

```
cd frontend && npm run build
```

This builds into `backend/static`, and `backend/app/main.py` mounts that folder, so once it's built you only need to run the backend and the whole app is on one port.

There's also a Dockerfile at the root that does both of those steps in one image — that's what's deployed on Render (`render.yaml` is the Render blueprint, it just needs a `MONGO_URI` env var pointing at a Mongo Atlas cluster).

### Tests

```
cd backend
pip install -r requirements-dev.txt
pytest
```

## Architecture

- **Frontend**: React + Vite, Chart.js for the graph, Leaflet for the map picker. No router since it's a single page.
- **Backend**: FastAPI. `app/core` has config/db/the weather API client, `app/services` has the actual heatwave logic and the Mongo caching layer, `app/api/routes.py` is the three endpoints (`/api/analyze`, `/api/geocode`, `/api/health`).
- **Database**: MongoDB, used only as a cache for the weather data pulled from Open-Meteo. One document per location (rounded to ~1km), each one storing whatever date range has been fetched for that spot so far. If a later request needs a wider range, it only fetches the missing part and merges it in, instead of re-downloading everything.
- **Data source**: [Open-Meteo](https://open-meteo.com/) — the historical archive API for daily max temperatures, and their geocoding API for the city search. Picked it because it's free, doesn't need an API key, and has decent global coverage back to the 1940s-50s depending on location. NOAA and Copernicus were the other options in the brief but both need account setup / API keys, which wasn't worth the time for an 8-10 hour case study.

## Heatwave logic

A heatwave is 3 or more consecutive days where the daily max temperature is above the 95th percentile of max temps for that location, over a baseline period.

The baseline is at least 15 years of data. If you pick a short or recent range (say, just 2021-2024), the backend quietly pulls extra years further back so the percentile is based on something stable, rather than computing a "95th percentile" off of 4 years of data. It never extends forward past your end year though — only backward, and it never changes the years you actually see results for, just what's used to calculate the threshold.

For the trend, it runs two things on the yearly heatwave-day counts:
- linear regression (slope + p-value), for the days/year number
- the Mann-Kendall test, which is the standard non-parametric trend test used in climate science and is less thrown off by outlier years than regression

The summary sentence only says there's a "trend" if Mann-Kendall says it's significant (p < 0.05). If it's not significant, the sentence still tells you the raw percent change, but says it might just be year-to-year noise rather than a real shift. I did this because early on I was testing with Phoenix 1990-2020 and it reported something like "+34% increase" when the actual trend test said that wasn't statistically significant — which is a pretty misleading thing for an app to say with confidence. Didn't want to ship that.

## Assumptions / simplifications

- The 95th percentile is computed once across the whole baseline, not per day-of-year. Real heatwave definitions usually use a day-of-year-specific percentile (so a hot day in July and a hot day in January are judged against different baselines), since otherwise a location with a big seasonal swing mostly flags its hottest season. Doing it per-day-of-year properly needs more baseline data and more compute per request, not something I could do well in the time I had. It's noted here instead of just being a silent limitation.
- Only heatwave is implemented, not drought or heavy rainfall — the brief says heatwave should be the default and only hazard, so I didn't build hazard types nobody would see.
- Locations are cached by lat/lon rounded to 2 decimal places (~1km), so two nearby points in the same city share a cache entry instead of each doing a separate fetch.
- Rate limiting is 30 requests/minute per IP, in-memory (no Redis) — fine for a case study, wouldn't hold up across multiple server instances in a real deployment.

## What I'd improve with more time

- Day-of-year-specific percentile thresholds instead of one flat baseline percentile
- Drought and heavy rainfall as actual hazard types, not just heatwave
- The event table gets long for wide year ranges — right now it's a scrollable box, but pagination or a "show more" would be nicer
- Frontend tests (there's only backend tests right now)
- A proper CI pipeline running tests on push instead of just running them locally before pushing
- Distributed rate limiting if this ever needed to run on more than one instance

## AI tools used

I used ChatGPT and Claude Code while building this — mainly for scaffolding boilerplate (FastAPI project structure, Pydantic schemas), debugging (e.g. a Chart.js production build bug where a bar+line combo chart crashed because the chart type's controller wasn't registered, which only showed up after a minified build, not in dev), and going back and forth on the UI a few times until it didn't look like a generic admin dashboard. The heatwave detection logic, the baseline/trend design, and the "don't claim a trend you can't back up" decision were things I worked through myself and then had help implementing and testing.
