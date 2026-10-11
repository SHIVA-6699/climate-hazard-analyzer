import { jsPDF } from 'jspdf'

const TREND_LABELS = {
  increasing: 'Increasing',
  decreasing: 'Decreasing',
  'no trend': 'No clear trend',
  'insufficient data': 'Not enough data',
}

export function exportResultAsPdf(result, chartImage) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  let y = 56

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Climate Hazard Trend Analyzer', marginX, y)

  y += 20
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${result.region_label} · ${result.start_year}-${result.end_year} · Hazard: Heatwave`, marginX, y)

  y += 28
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', marginX, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const summaryLines = doc.splitTextToSize(result.summary, 500)
  doc.text(summaryLines, marginX, y)
  y += summaryLines.length * 14 + 16

  const { trend } = result
  const statLines = [
    `Heatwave threshold: ${result.threshold_celsius}°C`,
    `Linear regression slope: ${trend.slope_days_per_year >= 0 ? '+' : ''}${trend.slope_days_per_year} days/year`,
    `Mann-Kendall test: ${TREND_LABELS[trend.mann_kendall_trend] ?? trend.mann_kendall_trend}${trend.mann_kendall_p_value != null ? ` (p = ${trend.mann_kendall_p_value})` : ''}`,
    `Events found: ${result.events.length}`,
  ]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Statistics', marginX, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  for (const line of statLines) {
    doc.text(line, marginX, y)
    y += 16
  }
  y += 10

  if (chartImage) {
    const chartWidth = 500
    const chartHeight = 200
    doc.addImage(chartImage, 'PNG', marginX, y, chartWidth, chartHeight)
    y += chartHeight + 24
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Heatwave events', marginX, y)
  y += 18

  const sorted = [...result.events].sort((a, b) => (a.start < b.start ? 1 : -1))
  const colX = [marginX, marginX + 110, marginX + 220, marginX + 320]
  const headers = ['Start', 'End', 'Duration', 'Peak temp']

  const drawTableHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    headers.forEach((header, i) => doc.text(header, colX[i], y))
    y += 6
    doc.setLineWidth(0.5)
    doc.line(marginX, y, marginX + 420, y)
    y += 14
    doc.setFont('helvetica', 'normal')
  }

  drawTableHeader()

  const pageHeight = doc.internal.pageSize.getHeight()
  for (const event of sorted) {
    if (y > pageHeight - 48) {
      doc.addPage()
      y = 56
      drawTableHeader()
    }
    doc.text(event.start, colX[0], y)
    doc.text(event.end, colX[1], y)
    doc.text(`${event.duration_days} days`, colX[2], y)
    doc.text(`${event.peak_temp_c}°C`, colX[3], y)
    y += 15
  }

  doc.save(`heatwave-insights-${result.region_label.replace(/[^a-z0-9]+/gi, '-')}-${result.start_year}-${result.end_year}.pdf`)
}
