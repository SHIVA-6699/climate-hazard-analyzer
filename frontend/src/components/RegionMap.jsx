import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickCapture({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    },
  })
  return null
}

export default function RegionMap({ position, onPick }) {
  return (
    <div className="region-map">
      <MapContainer center={position ?? [20, 0]} zoom={position ? 6 : 2} scrollWheelZoom={false}>
        <TileLayer
          attribution="&amp;copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={onPick} />
        {position && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
      <p className="region-map-hint">Click anywhere on the map to pick that point.</p>
    </div>
  )
}
