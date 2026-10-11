export default function EventList({ events }) {
  if (events.length === 0) {
    return <p className="event-list-empty">No heatwave events matched the threshold in this range.</p>
  }

  const sorted = [...events].sort((a, b) => (a.start < b.start ? 1 : -1))
  const maxDuration = Math.max(...events.map((e) => e.duration_days))

  return (
    <div className="event-list-wrap">
      <div className="event-list-scroll">
        <table className="event-list">
          <thead>
            <tr>
              <th>Start</th>
              <th>End</th>
              <th className="num">Duration</th>
              <th className="num">Peak temp</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((event) => (
              <tr key={event.start}>
                <td>{event.start}</td>
                <td>{event.end}</td>
                <td className="num">
                  <span className="duration-cell">
                    <span className="duration-bar-track">
                      <span
                        className="duration-bar-fill"
                        style={{ width: `${(event.duration_days / maxDuration) * 100}%` }}
                      />
                    </span>
                    {event.duration_days} days
                  </span>
                </td>
                <td className="num">{event.peak_temp_c}&deg;C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="event-list-count">{events.length} events, most recent first</p>
    </div>
  )
}
