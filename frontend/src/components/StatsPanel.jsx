const TREND_LABELS = {
  increasing: 'Increasing',
  decreasing: 'Decreasing',
  'no trend': 'No clear trend',
  'insufficient data': 'Not enough data',
}

const SIGNIFICANCE_LEVEL = 0.05

function TrendArrow({ direction }) {
  if (direction === 'increasing') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 17 L19 7 M19 7 H11 M19 7 V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (direction === 'decreasing') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 7 L19 17 M19 17 H11 M19 17 V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12 H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export default function StatsPanel({ result }) {
  const { trend } = result
  const isSignificant = trend.mann_kendall_p_value != null && trend.mann_kendall_p_value < SIGNIFICANCE_LEVEL
  const verdictTone = trend.mann_kendall_trend === 'increasing'
    ? 'tone-hazard'
    : trend.mann_kendall_trend === 'decreasing'
      ? 'tone-baseline'
      : 'tone-neutral'

  return (
    <div className="stats-panel">
      <div className={`trend-verdict ${verdictTone}`}>
        <TrendArrow direction={trend.mann_kendall_trend} />
        <div>
          <p className="trend-verdict-label">{TREND_LABELS[trend.mann_kendall_trend] ?? trend.mann_kendall_trend}</p>
          <p className="trend-verdict-sub">
            {isSignificant ? 'Statistically significant' : 'Not statistically significant'}
            {trend.mann_kendall_p_value != null && ` (p = ${trend.mann_kendall_p_value})`}
          </p>
        </div>
      </div>

      <dl className="stats-grid">
        <div>
          <dt>Heatwave threshold</dt>
          <dd>{result.threshold_celsius}&deg;C</dd>
        </div>
        <div>
          <dt>Linear regression slope</dt>
          <dd>
            {trend.slope_days_per_year >= 0 ? '+' : ''}
            {trend.slope_days_per_year} days/yr
          </dd>
        </div>
        <div>
          <dt>Events found</dt>
          <dd>{result.events.length}</dd>
        </div>
      </dl>
    </div>
  )
}
