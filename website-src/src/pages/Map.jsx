import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ScaleControl, ZoomControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
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
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = DefaultIcon

function Map({ language }) {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query to avoid excessive filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const url = `${config.endpoints.map}?lang=${language}`;

    setLoading(true)
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

  const filteredPlaces = useMemo(() => {
    if (!debouncedQuery) return places;
    const lowerQ = debouncedQuery.toLowerCase();
    return places.filter(p =>
      (p.name && p.name.toLowerCase().includes(lowerQ)) ||
      (p.municipality && p.municipality.toLowerCase().includes(lowerQ)) ||
      (p.province && p.province.toLowerCase().includes(lowerQ))
    )
  }, [places, debouncedQuery])

  const text = {
    en: {
      title: 'Map of Historic Places',
      loading: 'Loading historic places map...',
      view: 'View Details',
      searchPlaceholder: 'Search places, cities, provinces...',
      results: 'results'
    },
    fr: {
      title: 'Carte des lieux patrimoniaux',
      loading: 'Chargement de la carte...',
      view: 'Voir les détails',
      searchPlaceholder: 'Rechercher des lieux, villes...',
      results: 'résultats'
    }
  }

  const t = text[language]

  return (
    <div className="map-page">
      {/* Floating Search Control */}
      <div className="map-overlay-control">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {places.length > 0 && (
            <div className="result-count-badge">
              {filteredPlaces.length.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="map-loading-overlay">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      )}

      <div className="map-container-wrapper">
        <MapContainer
          center={[56.1304, -106.3468]} // Center of Canada
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // We will add it manually to position it better if needed
          minZoom={3}
          maxBounds={[
            [41.0, -142.0], // Southwest
            [84.0, -50.0]   // Northeast (Rough bounds of Canada)
          ]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" />

          {/* Cluster Group for Performance */}
          <MarkerClusterGroup
            chunkedLoading
            removeOutsideVisibleBounds
            maxClusterRadius={60}
          >
            {filteredPlaces.map(place => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
              >
                <Popup className="custom-popup">
                  <div className="popup-content">
                    {/* Placeholder for an image if we had one in this payload, currently we only have basic info */}
                    {/* <div className="popup-header-image" style={{backgroundImage: `url(...)`}}></div> */}
                    <div className="popup-info">
                      <h3>{place.name}</h3>
                      {place.municipality && <p>{place.municipality}, {place.province}</p>}
                      <Link to={`/place/${place.id}`} className="view-details-btn">
                        {t.view}
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  )
}

export default Map
