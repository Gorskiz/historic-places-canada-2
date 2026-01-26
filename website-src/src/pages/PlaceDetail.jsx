import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { config } from '../config'
import './PlaceDetail.css'

function PlaceDetail({ language }) {
  const { id } = useParams()
  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const url = `${config.endpoints.place(id)}?lang=${language}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Place not found')
        return res.json()
      })
      .then(data => {
        setPlace(data.place)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading place:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [id, language])

  const text = {
    en: {
      loading: 'Loading...',
      notFound: 'Place not found',
      back: '← Back to Search',
      description: 'Description',
      heritage: 'Heritage Value',
      elements: 'Character-Defining Elements',
      recognition: 'Recognition',
      location: 'Location',
      images: 'Images',
      coordinates: 'Coordinates'
    },
    fr: {
      loading: 'Chargement...',
      notFound: 'Lieu non trouvé',
      back: '← Retour à la recherche',
      description: 'Description',
      heritage: 'Valeur patrimoniale',
      elements: 'Éléments caractéristiques',
      recognition: 'Reconnaissance',
      location: 'Emplacement',
      images: 'Images',
      coordinates: 'Coordonnées'
    }
  }

  const t = text[language]

  if (loading) {
    return (
      <div className="place-detail">
        <div className="container">
          <p className="loading">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !place) {
    return (
      <div className="place-detail">
        <div className="container">
          <p className="error">{t.notFound}</p>
          <Link to="/search" className="back-link">{t.back}</Link>
        </div>
      </div>
    )
  }

  const sections = place.sections || {}
  const description = sections['Description of Historic Place'] || sections['Description du lieu patrimonial'] || ''
  const heritage = sections['Heritage Value'] || sections['Valeur patrimoniale'] || ''
  const elements = sections['Character-Defining Elements'] || sections['Éléments caractéristiques'] || ''

  const images = (place.images || []).filter(img =>
    !img.url.includes('arrow') &&
    !img.url.includes('logo') &&
    !img.url.includes('header') &&
    !img.url.includes('icon')
  )

  return (
    <div className="place-detail">
      <div className="container">
        <Link to="/search" className="back-link">{t.back}</Link>

        <h1>{place.name || Object.keys(sections)[0] || 'Historic Place'}</h1>

        {images.length > 0 && (
          <div className="images-gallery">
            {images.slice(0, 3).map((img, idx) => (
              <img
                key={idx}
                src={img.local_file ? `./data/images/${img.local_file}` : img.url}
                alt={img.alt || place.name}
                className="place-image"
              />
            ))}
          </div>
        )}

        {place.coordinates && (
          <div className="map-section">
            <h2>{t.location}</h2>
            <div className="mini-map">
              <MapContainer
                center={[place.coordinates.latitude, place.coordinates.longitude]}
                zoom={10}
                style={{ height: '300px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[place.coordinates.latitude, place.coordinates.longitude]} />
              </MapContainer>
            </div>
            <p className="coordinates">
              {t.coordinates}: {place.coordinates.latitude.toFixed(6)}°, {place.coordinates.longitude.toFixed(6)}°
            </p>
          </div>
        )}

        {description && (
          <section className="content-section">
            <h2>{t.description}</h2>
            <p>{description}</p>
          </section>
        )}

        {heritage && (
          <section className="content-section">
            <h2>{t.heritage}</h2>
            <p>{heritage}</p>
          </section>
        )}

        {elements && (
          <section className="content-section">
            <h2>{t.elements}</h2>
            <p>{elements}</p>
          </section>
        )}

        {sections.Recognition && (
          <section className="content-section">
            <h2>{t.recognition}</h2>
            <div className="metadata">
              {Object.entries(sections).map(([key, value]) => {
                if (['Jurisdiction', 'Recognition Authority', 'Recognition Statute', 'Recognition Type', 'Recognition Date'].includes(key)) {
                  return (
                    <div key={key} className="metadata-item">
                      <strong>{key}:</strong> {value}
                    </div>
                  )
                }
                return null
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default PlaceDetail
