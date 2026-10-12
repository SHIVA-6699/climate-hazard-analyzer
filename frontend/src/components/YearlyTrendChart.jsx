import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)

const INK = '#1B2127'
const GRID = '#DCDFD9'

const HEAT_SCALE_LOW = [242, 201, 76]
const HEAT_SCALE_HIGH = [138, 23, 11]

function heatColor(value, max) {
  if (max <= 0) return `rgb(${HEAT_SCALE_LOW.join(',')})`
  const t = Math.min(value / max, 1)
  const mix = HEAT_SCALE_LOW.map((c, i) => Math.round(c + (HEAT_SCALE_HIGH[i] - c) * t))
  return `rgb(${mix.join(',')})`
}

export default function YearlyTrendChart({ yearlyDays, trend, chartRef }) {
  const years = Object.keys(yearlyDays).map(Number).sort((a, b) => a - b)
  const days = years.map((year) => yearlyDays[year])
  const trendLine = years.map((year) => trend.slope_days_per_year * year + trend.intercept)
  const maxDays = Math.max(...days, 1)

  const data = {
    labels: years,
    datasets: [
      {
        type: 'bar',
        label: 'Heatwave days',
        data: days,
        backgroundColor: days.map((value) => heatColor(value, maxDays)),
        borderRadius: 2,
        maxBarThickness: 26,
        order: 2,
      },
      {
        type: 'line',
        label: 'Trend',
        data: trendLine,
        borderColor: INK,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: INK,
        titleFont: { family: 'IBM Plex Sans', weight: '600' },
        bodyFont: { family: 'IBM Plex Mono' },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'IBM Plex Mono', size: 11 }, maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Days per year', font: { family: 'IBM Plex Sans', size: 12 } },
        grid: { color: GRID },
        ticks: { font: { family: 'IBM Plex Mono', size: 11 } },
      },
    },
  }

  return (
    <div className="chart-box">
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span
            className="chart-legend-swatch chart-legend-swatch-gradient"
            style={{ background: `linear-gradient(90deg, rgb(${HEAT_SCALE_LOW.join(',')}), rgb(${HEAT_SCALE_HIGH.join(',')}))` }}
          />
          Heatwave days (color = intensity)
        </span>
        <span className="chart-legend-item">
          <span className="chart-legend-swatch chart-legend-swatch-line" style={{ backgroundColor: INK }} />
          Trend line
        </span>
      </div>
      <div className="chart-canvas">
        <Chart ref={chartRef} type="bar" data={data} options={options} />
      </div>
    </div>
  )
}
