import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { config } from '../config'
import './Home.css'

function Home({ language }) {
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState(null)
  const [visibleSection, setVisibleSection] = useState(0)
  const [animatedStats, setAnimatedStats] = useState({ total: 0, provinces: 0, themes: 0, images: 0 })
  const [featuredPlaces, setFeaturedPlaces] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sectionRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const autoPlayRef = useRef(null)

  useEffect(() => {
    fetch(`${config.endpoints.stats}?lang=${language}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error loading stats:', err))

    fetch(`${config.endpoints.filters}?lang=${language}`)
      .then(res => res.json())
      .then(data => setFilters(data))
      .catch(err => console.error('Error loading filters:', err))
  }, [language])

  // Fetch featured places with images
  useEffect(() => {
    console.log('🔍 Fetching featured places...')
    fetch(`${config.endpoints.places}?lang=${language}&limit=12&random=true`)
      .then(res => {
        console.log('📡 API response status:', res.status)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('📦 Received data:', data)
        console.log('📦 Places count:', data?.places?.length)
        // Filter places that have images
        if (data && data.places && Array.isArray(data.places)) {
          const placesWithImages = data.places.filter(place => place.primary_image)
          console.log('🖼️ Places with images:', placesWithImages.length)
          console.log('🖼️ First place:', placesWithImages[0])
          setFeaturedPlaces(placesWithImages.slice(0, 8))
        } else {
          console.warn('⚠️ Invalid data structure:', data)
        }
      })
      .catch(err => {
        console.error('❌ Error loading featured places:', err)
        setFeaturedPlaces([])
      })
  }, [language])

  // Auto-play carousel
  useEffect(() => {
    if (isAutoPlaying && featuredPlaces.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % featuredPlaces.length)
      }, 5000) // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, featuredPlaces.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10s
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % featuredPlaces.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + featuredPlaces.length) % featuredPlaces.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.findIndex(ref => ref.current === entry.target)
            setVisibleSection(prev => Math.max(prev, index))
          }
        })
      },
      { threshold: 0.1 }
    )

    sectionRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!stats) return

    const duration = 2000
    const steps = 60
    const interval = duration / steps

    const animateValue = (start, end, key) => {
      let current = start
      const increment = (end - start) / steps
      const timer = setInterval(() => {
        current += increment
        if (current >= end) {
          current = end
          clearInterval(timer)
        }
        setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }))
      }, interval)
    }

    animateValue(0, stats.totalPlaces || 0, 'total')
    animateValue(0, stats.provinces || 0, 'provinces')
    animateValue(0, stats.themes || 0, 'themes')
    animateValue(0, stats.totalImages || 0, 'images')
  }, [stats])

  const getSubtitle = () => {
    if (!stats) return language === 'en' ? 'Loading...' : 'Chargement...'
    const count = stats.totalPlaces?.toLocaleString() || '0'
    return language === 'en'
      ? `Explore over ${count} historic places across Canada`
      : `Explorez plus de ${count} lieux patrimoniaux à travers le Canada`
  }

  const text = {
    en: {
      hero: 'Preserving Canadian Heritage',
      cta: 'Start Exploring',
      viewPlace: 'View Details',
      featuredPlaces: 'Featured Historic Places',
      loading: 'Loading...',
      about: 'About This Project',
      aboutText: `In 2026, Parks Canada announced that HistoricPlaces.ca was set to be shut down without preserving its invaluable database of over ${stats?.totalPlaces?.toLocaleString() || '13,000'} historic sites. This community-led open source project was created to rescue and preserve this irreplaceable cultural heritage data for future generations.`,
      openSourceBadge: 'Open Source Project',
      why: 'Why This Matters',
      whyText: 'Historic places tell the story of Canada - from Indigenous heritage sites to colonial architecture, from battlefields to cultural landmarks. Without this central database, this knowledge would be lost.',
      features: 'Features',
      searchTitle: 'Advanced Search',
      searchDesc: 'Find historic places by name, location, or category',
      mapTitle: 'Interactive Map',
      mapDesc: 'Explore sites geographically across Canada',
      bilingualTitle: 'Bilingual',
      bilingualDesc: 'Full content in English and French',
      regionsEyebrow: 'Explore Canada',
      regionsTitle: 'Browse by Region',
      regionsDesc: 'Discover historic places across all 13 provinces and territories.',
      themesEyebrow: 'Curated Collections',
      themesTitle: 'Browse by Theme',
      viewAllCollections: 'View All Collections',
      missionBadge: 'Community Led',
      missionTitle: 'Preserving Our Digital Heritage',
      missionText: `In 2026, the official HistoricPlaces.ca data was set to be shut down. This open-source initiative was created to rescue over ${stats?.totalPlaces?.toLocaleString() || '13,000'} invaluable records, ensuring Canada's architectural and cultural history remains accessible to everyone.`,
      openSourceTitle: 'Open Source',
      openSourceDesc: 'Built by the community, for the community.',
      dataTitle: 'Open Data',
      dataDesc: 'All data is available for research and education.',
      total: 'Total Places',
      images: 'Total Images',
      provinces: 'Provinces',
      themes: 'Themes'
    },
    fr: {
      hero: 'Préserver le patrimoine canadien',
      cta: 'Commencer l\'exploration',
      viewPlace: 'Voir les détails',
      featuredPlaces: 'Lieux historiques en vedette',
      loading: 'Chargement...',
      about: 'À propos de ce projet',
      aboutText: `En 2026, Parcs Canada a annoncé que LieuxPatrimoniaux.ca devait être fermé sans préserver sa précieuse base de données de plus de ${stats?.totalPlaces?.toLocaleString() || '13 000'} sites historiques. Ce projet communautaire open source a été créé pour sauver et préserver ces données patrimoniales irremplaçables pour les générations futures.`,
      openSourceBadge: 'Projet open source',
      why: 'Pourquoi c\'est important',
      whyText: 'Les lieux patrimoniaux racontent l\'histoire du Canada - des sites patrimoniaux autochtones à l\'architecture coloniale, des champs de bataille aux monuments culturels. Sans cette base de données centrale, ces connaissances seraient perdues.',
      features: 'Fonctionnalités',
      searchTitle: 'Recherche avancée',
      searchDesc: 'Trouvez des lieux par nom, emplacement ou catégorie',
      mapTitle: 'Carte interactive',
      mapDesc: 'Explorez les sites géographiquement à travers le Canada',
      bilingualTitle: 'Bilingue',
      bilingualDesc: 'Contenu complet en anglais et en français',
      regionsEyebrow: 'Explorer le Canada',
      regionsTitle: 'Parcourir par région',
      regionsDesc: 'Découvrez des lieux historiques dans les 13 provinces et territoires.',
      themesEyebrow: 'Collections organisées',
      themesTitle: 'Parcourir par thème',
      viewAllCollections: 'Voir toutes les collections',
      missionBadge: 'Projet communautaire',
      missionTitle: 'Préserver notre patrimoine numérique',
      missionText: `En 2026, la base de données officielle LieuxPatrimoniaux.ca devait être fermée. Cette initiative open-source a été créée pour sauver plus de ${stats?.totalPlaces?.toLocaleString() || '13 000'} dossiers précieux, garantissant que l'histoire architecturale et culturelle du Canada reste accessible à tous.`,
      openSourceTitle: 'Open Source',
      openSourceDesc: 'Construit par la communauté, pour la communauté.',
      dataTitle: 'Données ouvertes',
      dataDesc: 'Toutes les données sont disponibles pour la recherche.',
      total: 'Lieux au total',
      images: 'Images au total',
      provinces: 'Provinces',
      themes: 'Thèmes'
    }
  }

  const t = text[language]

  console.log('🎨 Rendering Home component, featuredPlaces.length:', featuredPlaces.length)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-background">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
          <div className="gradient-blob blob-3"></div>
        </div>

        {/* Featured Places Carousel */}
        {featuredPlaces.length > 0 ? (
          <div className="carousel-container">
            <div className="carousel-slides">
              {featuredPlaces.map((place, index) => (
                <div
                  key={place.id}
                  className={`carousel-slide ${index === currentSlide ? 'active' : ''} ${index === (currentSlide - 1 + featuredPlaces.length) % featuredPlaces.length ? 'prev' : ''
                    } ${index === (currentSlide + 1) % featuredPlaces.length ? 'next' : ''}`}
                >
                  <div className="carousel-image-wrapper">
                    <img
                      src={place.primary_image}
                      alt={place.name || 'Historic place'}
                      className="carousel-image"
                    />
                    <div className="carousel-overlay"></div>
                  </div>
                  <div className="carousel-content">
                    <div className="carousel-badge">
                      {place.province || 'Canada'}
                    </div>
                    <h2 className="carousel-title">
                      {place.name}
                    </h2>
                    {place.municipality && (
                      <p className="carousel-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {place.municipality}
                      </p>
                    )}
                    <Link
                      to={`/place/${place.id}`}
                      className="carousel-cta"
                      onClick={() => setIsAutoPlaying(false)}
                    >
                      <span>{t.viewPlace}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              className="carousel-nav carousel-prev"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              className="carousel-nav carousel-next"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Dots Navigation */}
            <div className="carousel-dots">
              {featuredPlaces.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Headline Overlay */}
            <div className="hero-headline">
              <h1 className="hero-title">
                <span className="title-line">{t.hero}</span>
              </h1>
              <p className="hero-subtitle">{getSubtitle()}</p>
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="hero-content">
              <h2 className="hero-title">
                <span className="title-line">{t.hero}</span>
              </h2>
              <p className="hero-subtitle">{getSubtitle()}</p>
              <div className="hero-loading">{t.loading}</div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="hero-actions">
          <div className="container">
            <div className="hero-buttons">
              <Link to="/search" className="cta-button primary">
                <span>{t.cta}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/map" className="cta-button secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span>{t.mapTitle}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="hero-stats-section">
            <div className="container">
              <div className="stats">
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.total.toLocaleString()}</div>
                  <div className="stat-label">{t.total}</div>
                </div>
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.images.toLocaleString()}</div>
                  <div className="stat-label">{t.images}</div>
                </div>
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.provinces}</div>
                  <div className="stat-label">{t.provinces}</div>
                </div>
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.themes}+</div>
                  <div className="stat-label">{t.themes}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 1: Explore by Region */}
      <section className="section section-regions" ref={sectionRefs[0]}>
        <div className="container">
          <div className={`section-header ${visibleSection >= 0 ? 'visible' : ''}`}>
            <span className="section-eyebrow">{t.regionsEyebrow}</span>
            <h3>{t.regionsTitle}</h3>
            <p className="large-text">{t.regionsDesc}</p>
          </div>

          <div className={`regions-grid ${visibleSection >= 0 ? 'visible' : ''}`}>
            {filters?.provinces?.map((prov, index) => (
              <Link
                to={`/search?province=${encodeURIComponent(prov.province)}`}
                key={prov.province}
                className="region-card"
                style={{ '--delay': `${index * 50}ms` }}
              >
                <div className="region-content">
                  <span className="region-name">{prov.province}</span>
                  <span className="region-count">
                    {prov.count.toLocaleString()} {language === 'en' ? 'places' : 'lieux'}
                  </span>
                </div>
                <div className="region-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </Link>
            ))}
            {!filters && (
              // Skeleton loading for regions
              [...Array(13)].map((_, i) => (
                <div key={i} className="region-card skeleton"></div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Curated Collections (Themes) */}
      <section className="section section-themes" ref={sectionRefs[1]}>
        <div className="container">
          <div className={`section-header ${visibleSection >= 1 ? 'visible' : ''}`}>
            <span className="section-eyebrow">{t.themesEyebrow}</span>
            <h3>{t.themesTitle}</h3>
          </div>

          <div className={`themes-grid ${visibleSection >= 1 ? 'visible' : ''}`}>
            {filters?.themes?.slice(0, 8).map((theme, index) => (
              <Link
                to={`/search?theme=${encodeURIComponent(theme.theme)}`}
                key={theme.theme}
                className="theme-card"
                style={{ '--delay': `${index * 100}ms` }}
              >
                <div className="theme-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <h4>{theme.theme}</h4>
                <div className="theme-meta">
                  <span>{theme.count} {language === 'en' ? 'places' : 'lieux'}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="themes-actions">
            <Link to="/search" className="text-link">
              {t.viewAllCollections}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Mission / About */}
      <section className="section section-mission" ref={sectionRefs[2]}>
        <div className="container">
          <div className={`mission-wrapper ${visibleSection >= 2 ? 'visible' : ''}`}>
            <div className="mission-content">
              <div className="mission-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                {t.missionBadge}
              </div>
              <h3>{t.missionTitle}</h3>
              <p>{t.missionText}</p>

              <div className="mission-features">
                <div className="m-feature">
                  <div className="mf-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </div>
                  <div>
                    <strong>{t.openSourceTitle}</strong>
                    <p>{t.openSourceDesc}</p>
                  </div>
                </div>
                <div className="m-feature">
                  <div className="mf-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </div>
                  <div>
                    <strong>{t.dataTitle}</strong>
                    <p>{t.dataDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mission-visual">
              <div className="mission-card card-1">
                <div className="mc-icon">🇨🇦</div>
                <div className="mc-content">
                  <div className="mc-bar" style={{ width: '80%' }}></div>
                  <div className="mc-bar" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="mission-card card-2">
                <div className="mc-icon">🏛️</div>
                <div className="mc-content">
                  <div className="mc-bar" style={{ width: '70%' }}></div>
                  <div className="mc-bar" style={{ width: '40%' }}></div>
                </div>
              </div>
              <div className="mission-showcase">
                <div className="gradient-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cta" ref={sectionRefs[3]}>
        <div className="container">
          <div className={`cta-content ${visibleSection >= 3 ? 'visible' : ''}`}>
            <h3>{language === 'en' ? 'Ready to Explore?' : 'Prêt à explorer?'}</h3>
            <p className="cta-description">
              {language === 'en'
                ? 'Dive into Canada\'s rich history and discover the stories behind each historic place.'
                : 'Plongez dans l\'histoire riche du Canada et découvrez les histoires derrière chaque lieu historique.'}
            </p>
            <Link to="/search" className="cta-button large">
              <span>{t.cta}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
