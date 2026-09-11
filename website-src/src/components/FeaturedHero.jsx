import { useState } from 'react'
import { Link } from 'react-router-dom'
import places from '../data/featured-places.json'
import './FeaturedHero.css'

const copy = {
  en: {
    title: 'A place to discover Canada’s past.',
    description: 'Explore the buildings, landscapes and landmarks that tell our stories. Discover a place nearby, or follow your curiosity across the country.',
    search: 'Explore historic places', map: 'Explore the map',
    collection: 'From the collection', previous: 'Previous place', next: 'Next place',
    record: 'Read the story', unavailable: 'Photograph unavailable',
    source: 'Canadian Register of Historic Places',
    places: 'historic places', images: 'archival photographs', regions: 'provinces and territories',
    browse: 'Browse featured places',
  },
  fr: {
    title: 'Découvrez le passé du Canada, lieu par lieu.',
    description: 'Explorez les bâtiments, les paysages et les lieux qui racontent notre histoire. Découvrez un lieu près de chez vous ou parcourez le pays au gré de votre curiosité.',
    search: 'Explorer les lieux patrimoniaux', map: 'Explorer la carte',
    collection: 'Dans la collection', previous: 'Lieu précédent', next: 'Lieu suivant',
    record: 'Découvrir son histoire', unavailable: 'Photographie indisponible',
    source: 'Registre canadien des lieux patrimoniaux',
    places: 'lieux patrimoniaux', images: 'photographies d’archives', regions: 'provinces et territoires',
    browse: 'Parcourir les lieux en vedette',
  },
}

function ArchivePhoto({ place, language, unavailable }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="featured-photo-mount">
      {failed ? <p role="status">{unavailable}</p> : (
        <img
          className="featured-photo"
          src={place.image}
          alt={place[language].caption}
          lang={place[language].captionLanguage}
          width={place.width}
          height={place.height}
          loading="eager"
          fetchPriority="high"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export default function FeaturedHero({ language, stats }) {
  const [selected, setSelected] = useState(0)
  const place = places[selected]
  const details = place[language]
  const t = copy[language]
  const ratio = place.width / place.height
  const format = ratio < 0.85 ? 'portrait' : ratio > 2 ? 'panorama' : 'landscape'
  const compact = place.width < 360 && place.height < 360
  const number = value => value?.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA')
  const move = offset => setSelected(index => (index + offset + places.length) % places.length)

  return (
    <section className="featured-hero" aria-labelledby="featured-hero-title" data-format={format}>
      <div className="container featured-hero-grid">
        <div className="featured-introduction">
          <h1 id="featured-hero-title">{t.title}</h1>
          <p className="featured-description">{t.description}</p>
          <div className="featured-actions">
            <Link to="/search" className="featured-explore">{t.search}</Link>
            <Link to="/map" className="featured-map">
              <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15" /></svg>
              {t.map}
            </Link>
          </div>
        </div>

        <div className="featured-gallery" role="region" aria-label={t.browse}>
          <div className="featured-gallery-header">
            <span>{t.collection}</span>
            <div className="featured-navigation">
              <span className="featured-position">{selected + 1} / {places.length}</span>
              <button type="button" onClick={() => move(-1)} aria-label={t.previous} aria-controls="featured-record">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m14 6-6 6 6 6" /></svg>
              </button>
              <button type="button" onClick={() => move(1)} aria-label={t.next} aria-controls="featured-record">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10 6 6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          <figure id="featured-record" className="featured-record" data-compact={compact || undefined} aria-live="polite" aria-atomic="true">
            <ArchivePhoto key={place.id} place={place} language={language} unavailable={t.unavailable} />
            <figcaption className="featured-caption">
              <p className="featured-location">{[details.municipality, details.province].filter(Boolean).join(', ')}</p>
              <h2 data-long={details.name.length > 55 || undefined}>
                <Link to={`/place/${place.id}`}>{details.name}</Link>
              </h2>
              <Link className="featured-record-link" to={`/place/${place.id}`}>{t.record}<span aria-hidden="true">↗</span></Link>
              <p className="featured-credit" lang={details.captionLanguage}>{details.caption}</p>
            </figcaption>
          </figure>
          <div className="featured-thumbnails" aria-label={t.browse}>
            {places.map((item, index) => (
              <button key={item.id} type="button" aria-label={item[language].name} aria-pressed={selected === index} onClick={() => setSelected(index)} aria-controls="featured-record">
                <img src={item.image} width={item.width} height={item.height} alt="" loading="lazy" fetchPriority="low" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="container featured-collection-note">
        <p>{t.source}</p>
        <ul>
          {stats?.totalPlaces > 0 && <li><strong>{number(stats.totalPlaces)}</strong> {t.places}</li>}
          {stats?.totalImages > 0 && <li><strong>{number(stats.totalImages)}</strong> {t.images}</li>}
          <li><strong>13</strong> {t.regions}</li>
        </ul>
      </div>
    </section>
  )
}
