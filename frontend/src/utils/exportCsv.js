export function exportResultAsCsv(result) {
  const rows = [['start', 'end', 'duration_days', 'peak_temp_c']]
  for (const event of result.events) {
    rows.push([event.start, event.end, event.duration_days, event.peak_temp_c])
  }

  const csv = rows.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `heatwave-events-${result.region_label.replace(/[^a-z0-9]+/gi, '-')}-${result.start_year}-${result.end_year}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
