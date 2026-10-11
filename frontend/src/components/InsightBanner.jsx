function TrendArrow({ direction }) {
  if (direction === 'increasing') {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 17 L19 7 M19 7 H11 M19 7 V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (direction === 'decreasing') {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 7 L19 17 M19 17 H11 M19 17 V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const SIGNIFICANCE_LEVEL = 0.05

export default function InsightBanner({ result }) {
  const { trend } = result
  const isSignificant = trend.mann_kendall_p_value != null && trend.mann_kendall_p_value < SIGNIFICANCE_LEVEL
  const tone = trend.mann_kendall_trend === 'increasing'
    ? 'tone-hazard'
    : trend.mann_kendall_trend === 'decreasing'
      ? 'tone-baseline'
      : 'tone-neutral'

  return (
    <section className={`insight-banner ${tone}`}>
      <div className="insight-banner-figure">
        <TrendArrow direction={trend.mann_kendall_trend} />
        {trend.percent_change != null ? (
          <span className="insight-banner-number">
            {trend.percent_change >= 0 ? '+' : ''}
            {trend.percent_change}%
          </span>
        ) : (
          <span className="insight-banner-number insight-banner-number-small">No data</span>
        )}
        <span className={`insight-banner-badge ${isSignificant ? 'is-significant' : ''}`}>
          {isSignificant ? 'Statistically significant' : 'Not statistically significant'}
        </span>
      </div>
      <p className="insight-banner-text">{result.summary}</p>
    </section>
  )
}
