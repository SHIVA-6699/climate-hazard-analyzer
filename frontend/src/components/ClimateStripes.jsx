// A muted version of the "climate stripes" visualization style: one bar per year, colored by
// how far that year's value sits from the middle of the range. Used here as the page's hero
// motif before any real region has been analyzed, and real data is not invented to fill it.
const PLACEHOLDER_PATTERN = [
  0.2, 0.3, 0.25, 0.4, 0.35, 0.3, 0.45, 0.5, 0.4, 0.55, 0.6, 0.5, 0.65, 0.6, 0.7, 0.75, 0.65, 0.8, 0.85, 0.9,
]

function colorFor(value) {
  // 0 = coolest, 1 = hottest; interpolate between baseline-blue and hazard-red
  const cold = [28, 95, 153]
  const hot = [179, 51, 30]
  const mix = cold.map((c, i) => Math.round(c + (hot[i] - c) * value))
  return `rgb(${mix.join(',')})`
}

export default function ClimateStripes() {
  return (
    <div className="climate-stripes" role="img" aria-label="Decorative illustration of warming climate stripes">
      {PLACEHOLDER_PATTERN.map((value, i) => (
        <span key={i} style={{ backgroundColor: colorFor(value) }} />
      ))}
    </div>
  )
}
