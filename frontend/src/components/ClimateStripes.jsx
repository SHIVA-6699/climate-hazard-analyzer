const PLACEHOLDER_PATTERN = [
  0.18, 0.22, 0.2, 0.28, 0.24, 0.3, 0.26, 0.32, 0.29, 0.35, 0.31, 0.38, 0.33, 0.4, 0.36, 0.42, 0.38, 0.45, 0.4, 0.48,
  0.43, 0.5, 0.46, 0.53, 0.49, 0.56, 0.52, 0.58, 0.55, 0.61, 0.58, 0.64, 0.6, 0.67, 0.63, 0.7, 0.66, 0.74, 0.7, 0.78,
  0.74, 0.82, 0.78, 0.86, 0.82, 0.9, 0.87, 0.94, 0.92, 0.98,
]

function colorFor(value) {
  const cold = [28, 95, 153]
  const hot = [179, 51, 30]
  const mix = cold.map((c, i) => Math.round(c + (hot[i] - c) * value))
  return `rgb(${mix.join(',')})`
}

export default function ClimateStripes({ className = '' }) {
  return (
    <div
      className={`climate-stripes ${className}`.trim()}
      role="img"
      aria-label="Decorative illustration of warming climate stripes"
    >
      {PLACEHOLDER_PATTERN.map((value, i) => (
        <span key={i} style={{ backgroundColor: colorFor(value) }} />
      ))}
    </div>
  )
}
