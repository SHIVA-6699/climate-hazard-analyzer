import { useState } from 'react'

const CURRENT_YEAR = new Date().getFullYear()
const EARLIEST_YEAR = 1950

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function YearRangeControl({ startYear, endYear, onChange }) {
  const [draftStart, setDraftStart] = useState(String(startYear))
  const [draftEnd, setDraftEnd] = useState(String(endYear))
  const [startError, setStartError] = useState('')
  const [endError, setEndError] = useState('')

  const commitStart = () => {
    const parsed = Number.parseInt(draftStart, 10)
    if (Number.isNaN(parsed)) {
      setDraftStart(String(startYear))
      setStartError('')
      return
    }
    const clamped = clamp(parsed, EARLIEST_YEAR, endYear - 1)
    setDraftStart(String(clamped))
    setStartError(clamped !== parsed ? `Adjusted to stay within ${EARLIEST_YEAR}–${endYear - 1}` : '')
    onChange({ startYear: clamped, endYear })
  }

  const commitEnd = () => {
    const parsed = Number.parseInt(draftEnd, 10)
    if (Number.isNaN(parsed)) {
      setDraftEnd(String(endYear))
      setEndError('')
      return
    }
    const clamped = clamp(parsed, startYear + 1, CURRENT_YEAR)
    setDraftEnd(String(clamped))
    setEndError(clamped !== parsed ? `Adjusted to stay within ${startYear + 1}–${CURRENT_YEAR}` : '')
    onChange({ startYear, endYear: clamped })
  }

  return (
    <div className="year-range">
      <label>
        From
        <input
          type="number"
          name="startYear"
          min={EARLIEST_YEAR}
          max={endYear - 1}
          value={draftStart}
          onChange={(event) => setDraftStart(event.target.value)}
          onBlur={commitStart}
          aria-invalid={Boolean(startError)}
        />
        {startError && <span className="field-error">{startError}</span>}
      </label>
      <label>
        To
        <input
          type="number"
          name="endYear"
          min={startYear + 1}
          max={CURRENT_YEAR}
          value={draftEnd}
          onChange={(event) => setDraftEnd(event.target.value)}
          onBlur={commitEnd}
          aria-invalid={Boolean(endError)}
        />
        {endError && <span className="field-error">{endError}</span>}
      </label>
    </div>
  )
}
