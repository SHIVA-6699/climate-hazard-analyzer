const CURRENT_YEAR = new Date().getFullYear()
const EARLIEST_YEAR = 1950

export default function YearRangeControl({ startYear, endYear, onChange }) {
  return (
    <div className="year-range">
      <label>
        From
        <input
          type="number"
          name="startYear"
          min={EARLIEST_YEAR}
          max={endYear - 1}
          value={startYear}
          onChange={(event) => onChange({ startYear: Number(event.target.value), endYear })}
        />
      </label>
      <label>
        To
        <input
          type="number"
          name="endYear"
          min={startYear + 1}
          max={CURRENT_YEAR}
          value={endYear}
          onChange={(event) => onChange({ startYear, endYear: Number(event.target.value) })}
        />
      </label>
    </div>
  )
}
