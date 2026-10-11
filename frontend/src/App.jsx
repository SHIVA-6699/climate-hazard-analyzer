import { lazy, Suspense, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { analyzeHeatwaves } from './api'
import ClimateStripes from './components/ClimateStripes'
import EventList from './components/EventList'
import RegionSearch from './components/RegionSearch'
import StatsPanel from './components/StatsPanel'
import YearlyTrendChart from './components/YearlyTrendChart'
import YearRangeControl from './components/YearRangeControl'
import { getErrorMessage } from './utils/errors'
import { exportResultAsCsv } from './utils/exportCsv'
import { exportResultAsPdf } from './utils/exportPdf'

const RegionMap = lazy(() => import('./components/RegionMap'))

const DEFAULT_YEARS = { startYear: 1990, endYear: 2020 }

export default function App() {
  const [region, setRegion] = useState(null)
  const [years, setYears] = useState(DEFAULT_YEARS)
  const [pickerMode, setPickerMode] = useState('search')
  const chartRef = useRef(null)

  const mutation = useMutation({
    mutationFn: analyzeHeatwaves,
  })

  const handleAnalyze = () => {
    if (!region) return
    mutation.mutate({
      lat: region.lat,
      lon: region.lon,
      region_label: region.label,
      start_year: years.startYear,
      end_year: years.endYear,
    })
  }

  const result = mutation.data

  const handleExportPdf = () => {
    if (!result) return
    const chartImage = chartRef.current?.toBase64Image?.('image/png', 1.0)
    exportResultAsPdf(result, chartImage)
  }

  return (
    <div className="shell">
      <header className="masthead">
        <h1>Climate Hazard Trend Analyzer</h1>
        <p>Pick a region and a time range to see how heatwaves there have changed, with the reasoning behind it.</p>
      </header>

      <section className="controls">
        <div className="controls-row">
          <div className="picker-tabs" role="tablist" aria-label="Region selection method">
            <button
              type="button"
              role="tab"
              aria-selected={pickerMode === 'search'}
              className={pickerMode === 'search' ? 'is-active' : ''}
              onClick={() => setPickerMode('search')}
            >
              Search a city
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pickerMode === 'map'}
              className={pickerMode === 'map' ? 'is-active' : ''}
              onClick={() => setPickerMode('map')}
            >
              Pick on map
            </button>
          </div>

          {pickerMode === 'search' ? (
            <RegionSearch onSelect={setRegion} />
          ) : (
            <Suspense fallback={<p className="region-map-hint">Loading map...</p>}>
              <RegionMap
                position={region ? [region.lat, region.lon] : null}
                onPick={(latlng) =>
                  setRegion({ lat: Number(latlng.lat.toFixed(4)), lon: Number(latlng.lng.toFixed(4)), label: 'Selected point' })
                }
              />
            </Suspense>
          )}
        </div>

        <div className="controls-row controls-row-secondary">
          <YearRangeControl
            startYear={years.startYear}
            endYear={years.endYear}
            onChange={setYears}
          />
          <span className="hazard-chip">Hazard: Heatwave</span>
          <button type="button" className="btn btn-primary" onClick={handleAnalyze} disabled={!region || mutation.isPending}>
            {mutation.isPending ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {region && <p className="selected-region">Selected: {region.label} ({region.lat}, {region.lon})</p>}
      </section>

      {mutation.isError && <p className="alert alert-error">{getErrorMessage(mutation.error)}</p>}

      {!result && !mutation.isPending && (
        <section className="hero-empty">
          <ClimateStripes />
          <p>Choose a region above and click Analyze to see its heatwave history.</p>
        </section>
      )}

      {result && (
        <section className="results">
          <p className="insight-headline">{result.summary}</p>

          <YearlyTrendChart yearlyDays={result.yearly_heatwave_days} trend={result.trend} chartRef={chartRef} />

          <StatsPanel result={result} />

          <div className="panel-header">
            <h2>Heatwave events</h2>
            <div className="export-actions">
              <button type="button" className="btn btn-secondary" onClick={() => exportResultAsCsv(result)}>
                Export CSV
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleExportPdf}>
                Export PDF
              </button>
            </div>
          </div>
          <EventList events={result.events} />
        </section>
      )}
    </div>
  )
}
