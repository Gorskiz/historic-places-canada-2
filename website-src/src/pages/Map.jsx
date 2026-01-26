import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { config } from '../config'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Fix for default marker icon in React-Leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

function Map({ language }) {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = `${config.endpoints.map}?lang=${language}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPlaces(data.places || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading map data:', err)
        setLoading(false)
      })
  }, [language])

  const text = {
    en: {
      title: 'Map of Historic Places',
      loading: 'Loading map...',
      view: 'View Details'
    },
    fr: {
      title: 'Carte des lieux patrimoniaux',
      loading: 'Chargement de la carte...',
      view: 'Voir les détails'
    }
  }

  const t = text[language]

  if (loading) {
    return (
      <div className="map-page">
        <div className="container">
          <p className="loading">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="container">
          <h2>{t.title}</h2>
          <p>{places.length} places with coordinates</p>
        </div>
      </div>

      <div className="map-container-wrapper">
        <MapContainer
          center={[56.1304, -106.3468]} // Center of Canada
          zoom={4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {places.map(place => (
            <Marker
              key={place.id}
              position={[place.coordinates.latitude, place.coordinates.longitude]}
            >
              <Popup>
                <div className="popup-content">
                  <h3>{place.name}</h3>
                  {place.municipality && <p>{place.municipality}, {place.province}</p>}
                  <Link to={`/place/${place.id}`} className="popup-link">
                    {t.view} &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default Map
