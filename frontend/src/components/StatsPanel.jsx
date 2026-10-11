const TREND_LABELS = {
  increasing: 'Increasing',
  decreasing: 'Decreasing',
  'no trend': 'No clear trend',
  'insufficient data': 'Not enough data',
}

export default function StatsPanel({ result }) {
  const { trend } = result

  return (
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
        <dt>Mann-Kendall trend</dt>
        <dd>{TREND_LABELS[trend.mann_kendall_trend] ?? trend.mann_kendall_trend}</dd>
      </div>
      <div>
        <dt>Events found</dt>
        <dd>{result.events.length}</dd>
      </div>
    </dl>
  )
}
