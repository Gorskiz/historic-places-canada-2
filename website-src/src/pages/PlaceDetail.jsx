import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { config } from '../config'
import SEO from '../components/SEO'
import './PlaceDetail.css'

function PlaceDetail({ language }) {
  const { id } = useParams()
  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedImage, setExpandedImage] = useState(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  useEffect(() => {
    const url = `${config.endpoints.place(id)}?lang=${language}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Place not found')
        return res.json()
      })
      .then(data => {
        setPlace({ ...data.place, images: data.images })
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
      coordinates: 'Coordinates',
      download: 'Download',
      downloadAll: 'Download All',
      disclaimerTitle: 'Important Notice About These Records',
      disclaimerSummary: 'The records on this site may be incomplete, outdated, or contain inaccuracies.',
      disclaimerToggleOpen: 'Read full disclaimer',
      disclaimerToggleClose: 'Hide disclaimer',
      disclaimerNotUpToDate: 'Not Up to Date',
      disclaimerNotUpToDateText: 'The records contained on historicplaces.ca are not up to date. The site was most recently updated 15 years ago. This means that there are many sites that are registered that are not included and some of those included are no longer registered or no longer existing.',
      disclaimerInaccurate: 'May Contain Inaccuracies',
      disclaimerInaccurateText: 'The records contained on historicplaces.ca may have inaccurate information. 15 years is long enough for additional research to have been conducted on sites and new information has been obtained that shows older information to be false. In addition, what are presented as Character Defining Elements on the site is not always what is listed in the official document held by level of government who registered the property.',
      disclaimerIncomplete: 'Not Complete',
      disclaimerIncompleteText: 'The records contained on historicplaces.ca are not complete. When the information for the site was gathered each province took a different approach to what would be included. For example, in some provinces property owners were allowed to opt out of inclusion on the basis of privacy concerns, in other provinces all sites were included. This means that leaving aside the lack of updates over the last 15 years the records are far from complete.',
      disclaimerSource: 'Source: Canadian Register of Historic Places'
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
      coordinates: 'Coordonnées',
      download: 'Télécharger',
      downloadAll: 'Tout télécharger',
      disclaimerTitle: 'Avis important concernant ces dossiers',
      disclaimerSummary: 'Les dossiers sur ce site peuvent être incomplets, obsolètes ou contenir des inexactitudes.',
      disclaimerToggleOpen: 'Lire l\'avis complet',
      disclaimerToggleClose: 'Masquer l\'avis',
      disclaimerNotUpToDate: 'Pas à jour',
      disclaimerNotUpToDateText: 'Les dossiers contenus sur historicplaces.ca ne sont pas à jour. Le site a été mis à jour pour la dernière fois il y a 15 ans. Cela signifie qu\'il existe de nombreux sites enregistrés qui ne sont pas inclus et certains de ceux qui sont inclus ne sont plus enregistrés ou n\'existent plus.',
      disclaimerInaccurate: 'Peut contenir des inexactitudes',
      disclaimerInaccurateText: 'Les dossiers contenus sur historicplaces.ca peuvent contenir des informations inexactes. 15 ans est suffisant pour que des recherches supplémentaires aient été effectuées sur les sites et que de nouvelles informations aient été obtenues montrant que les anciennes informations sont fausses. De plus, ce qui est présenté comme des Éléments caractéristiques sur le site n\'est pas toujours ce qui est indiqué dans le document officiel détenu par le niveau de gouvernement qui a enregistré la propriété.',
      disclaimerIncomplete: 'Pas complet',
      disclaimerIncompleteText: 'Les dossiers contenus sur historicplaces.ca ne sont pas complets. Lorsque les informations pour le site ont été recueillies, chaque province a adopté une approche différente concernant ce qui serait inclus. Par exemple, dans certaines provinces, les propriétaires avaient le droit de se retirer de l\'inclusion pour des raisons de confidentialité, dans d\'autres provinces, tous les sites étaient inclus. Cela signifie que, au-delà du manque de mises à jour au cours des 15 dernières années, les dossiers sont loin d\'être complets.',
      disclaimerSource: 'Source : Registre canadien des lieux patrimoniaux'
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
  const description = place.description || sections['Description of Historic Place'] || sections['Description du lieu patrimonial'] || ''
  const heritage = place.heritage_value || sections['Heritage Value'] || sections['Valeur patrimoniale'] || ''
  const elements = place.character_elements || sections['Character-Defining Elements'] || sections['Éléments caractéristiques'] || ''

  const images = (place.images || []).filter(img => {
    const url = img.r2_url || img.url
    if (!url) return false
    return !url.includes('arrow') &&
      !url.includes('logo') &&
      !url.includes('header') &&
      !url.includes('icon')
  })

  const downloadImage = async (img) => {
    try {
      const url = img.r2_url || img.url
      // detailed filename generation
      const extension = url.split('.').pop().split(/[?#]/)[0] || 'jpg'
      const sanitizedName = place.name.replace(/[^a-z0-9]/gi, '_').toLowerCase().replace(/_+/g, '_')
      const filename = `${sanitizedName}_${images.indexOf(img) + 1}.${extension}`
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading image:', err)
    }
  }

  const downloadAllImages = async () => {
    for (let i = 0; i < images.length; i++) {
      await downloadImage(images[i])
      await new Promise(resolve => setTimeout(resolve, 500)) // Slight delay to prevent browser blocking
    }
  }

  const galleryClass = images.length === 1 ? 'gallery-single' :
    images.length === 2 ? 'gallery-double' :
      'gallery-multi'

  return (
    <div className="place-detail">
      <SEO
        title={`${place.name} - Historic Places Canada`}
        description={description.substring(0, 155) || place.name}
        image={images.length > 0 ? (images[0].r2_url || images[0].url) : undefined}
      />
      {/* Structured Data for Place */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Place",
          "name": place.name,
          "description": description || place.name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": place.municipality || '',
            "addressRegion": place.province || '',
            "addressCountry": "CA"
          },
          ...(place.latitude && place.longitude ? {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": place.latitude,
              "longitude": place.longitude
            }
          } : {}),
          ...(images.length > 0 ? {
            "image": images.map(img => img.r2_url || img.url)
          } : {})
        })}
      </script>
      <div className="container">
        <Link to="/search" className="back-link">{t.back}</Link>

        <h1>{place.name}</h1>

        {images.length > 0 && (
          <div className={`images-gallery ${galleryClass}`}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.r2_url || img.url}
                alt={img.alt || place.name}
                className="place-image"
                onClick={() => setExpandedImage(img)}
              />
            ))}
          </div>
        )}

        {expandedImage && (
          <div className="image-overlay" onClick={() => setExpandedImage(null)}>
            <button className="close-btn" onClick={() => setExpandedImage(null)}>&times;</button>
            <div className="overlay-content" onClick={e => e.stopPropagation()}>
              <img
                src={expandedImage.r2_url || expandedImage.url}
                alt={expandedImage.alt || place.name}
                className="expanded-image"
              />
              <div className="overlay-controls">
                <button className="overlay-btn" onClick={() => downloadImage(expandedImage)}>
                  {t.download}
                </button>
                <button className="overlay-btn" onClick={downloadAllImages}>
                  {t.downloadAll} ({images.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {place.latitude && place.longitude && (
          <div className="map-section">
            <h2>{t.location}</h2>
            <div className="mini-map">
              <MapContainer
                center={[place.latitude, place.longitude]}
                zoom={10}
                style={{ height: '300px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[place.latitude, place.longitude]} />
              </MapContainer>
            </div>
            <p className="coordinates">
              {t.coordinates}: {place.latitude.toFixed(6)}°, {place.longitude.toFixed(6)}°
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

        <section className="content-section">
          <h2>{t.recognition}</h2>
          <div className="metadata">
            {place.jurisdiction && (
              <div className="metadata-item">
                <strong>Jurisdiction:</strong> {place.jurisdiction}
              </div>
            )}
            {place.recognition_authority && (
              <div className="metadata-item">
                <strong>Recognition Authority:</strong> {place.recognition_authority}
              </div>
            )}
            {place.recognition_statute && (
              <div className="metadata-item">
                <strong>Recognition Statute:</strong> {place.recognition_statute}
              </div>
            )}
            {place.recognition_type && (
              <div className="metadata-item">
                <strong>Recognition Type:</strong> {place.recognition_type}
              </div>
            )}
            {place.recognition_date && (
              <div className="metadata-item">
                <strong>Recognition Date:</strong> {place.recognition_date}
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer Card */}
        <div className="disclaimer-card">
          <div className="disclaimer-header">
            <div className="disclaimer-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="disclaimer-text-block">
              <h4 className="disclaimer-title">{t.disclaimerTitle}</h4>
              <p className="disclaimer-summary">{t.disclaimerSummary}</p>
            </div>
          </div>
          <button className="disclaimer-toggle" onClick={() => setDisclaimerOpen(prev => !prev)}>
            <span>{disclaimerOpen ? t.disclaimerToggleClose : t.disclaimerToggleOpen}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={disclaimerOpen ? 'chevron-up' : ''}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {disclaimerOpen && (
            <div className="disclaimer-details">
              <div className="disclaimer-item">
                <p className="disclaimer-item-title">{t.disclaimerNotUpToDate}</p>
                <p>{t.disclaimerNotUpToDateText}</p>
              </div>
              <div className="disclaimer-item">
                <p className="disclaimer-item-title">{t.disclaimerInaccurate}</p>
                <p>{t.disclaimerInaccurateText}</p>
              </div>
              <div className="disclaimer-item">
                <p className="disclaimer-item-title">{t.disclaimerIncomplete}</p>
                <p>{t.disclaimerIncompleteText}</p>
              </div>
            </div>
          )}
          <p className="disclaimer-source">{t.disclaimerSource}</p>
        </div>
      </div>
    </div>
  )
}

export default PlaceDetail
