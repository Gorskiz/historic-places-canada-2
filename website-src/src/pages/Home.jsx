import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { config } from '../config'
import './Home.css'

function Home({ language }) {
  const [stats, setStats] = useState(null)
  const [visibleSection, setVisibleSection] = useState(0)
  const [animatedStats, setAnimatedStats] = useState({ total: 0, provinces: 0, themes: 0 })
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
  }, [language])

  // Fetch featured places with images
  useEffect(() => {
    fetch(`${config.endpoints.places}?lang=${language}&limit=12`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        // Filter places that have images
        if (data && data.places && Array.isArray(data.places)) {
          const placesWithImages = data.places.filter(place => place.primary_image)
          setFeaturedPlaces(placesWithImages.slice(0, 8))
        }
      })
      .catch(err => {
        console.error('Error loading featured places:', err)
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

    animateValue(0, stats.totalPlaces || 13000, 'total')
    animateValue(0, stats.provinces || 13, 'provinces')
    animateValue(0, parseInt(stats.themes) || 50, 'themes')
  }, [stats])

  const text = {
    en: {
      hero: 'Preserving Canadian Heritage',
      subtitle: 'Explore over 13,000 historic places across Canada',
      cta: 'Start Exploring',
      viewPlace: 'View Details',
      featuredPlaces: 'Featured Historic Places',
      loading: 'Loading...',
      about: 'About This Project',
      aboutText: 'In 2026, Parks Canada announced the closure of HistoricPlaces.ca without preserving its invaluable database of over 13,000 historic sites. This community-led project was created to rescue and preserve this irreplaceable cultural heritage data for future generations.',
      why: 'Why This Matters',
      whyText: 'Historic places tell the story of Canada - from Indigenous heritage sites to colonial architecture, from battlefields to cultural landmarks. Without this central database, this knowledge would be lost.',
      features: 'Features',
      searchTitle: 'Advanced Search',
      searchDesc: 'Find historic places by name, location, or category',
      mapTitle: 'Interactive Map',
      mapDesc: 'Explore sites geographically across Canada',
      bilingualTitle: 'Bilingual',
      bilingualDesc: 'Full content in English and French',
      total: 'Total Places',
      provinces: 'Provinces & Territories',
      themes: 'Heritage Themes'
    },
    fr: {
      hero: 'Préserver le patrimoine canadien',
      subtitle: 'Explorez plus de 13 000 lieux patrimoniaux à travers le Canada',
      cta: 'Commencer l\'exploration',
      viewPlace: 'Voir les détails',
      featuredPlaces: 'Lieux historiques en vedette',
      loading: 'Chargement...',
      about: 'À propos de ce projet',
      aboutText: 'En 2026, Parcs Canada a annoncé la fermeture de LieuxPatrimoniaux.ca sans préserver sa précieuse base de données de plus de 13 000 sites historiques. Ce projet communautaire a été créé pour sauver et préserver ces données patrimoniales irremplaçables pour les générations futures.',
      why: 'Pourquoi c\'est important',
      whyText: 'Les lieux patrimoniaux racontent l\'histoire du Canada - des sites patrimoniaux autochtones à l\'architecture coloniale, des champs de bataille aux monuments culturels. Sans cette base de données centrale, ces connaissances seraient perdues.',
      features: 'Fonctionnalités',
      searchTitle: 'Recherche avancée',
      searchDesc: 'Trouvez des lieux par nom, emplacement ou catégorie',
      mapTitle: 'Carte interactive',
      mapDesc: 'Explorez les sites géographiquement à travers le Canada',
      bilingualTitle: 'Bilingue',
      bilingualDesc: 'Contenu complet en anglais et en français',
      total: 'Lieux totaux',
      provinces: 'Provinces et territoires',
      themes: 'Thèmes patrimoniaux'
    }
  }

  const t = text[language]

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
                  className={`carousel-slide ${index === currentSlide ? 'active' : ''} ${
                    index === (currentSlide - 1 + featuredPlaces.length) % featuredPlaces.length ? 'prev' : ''
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
              <p className="hero-subtitle">{t.subtitle}</p>
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="hero-content">
              <h2 className="hero-title">
                <span className="title-line">{t.hero}</span>
              </h2>
              <p className="hero-subtitle">{t.subtitle}</p>
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
                      <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"/>
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.total.toLocaleString()}</div>
                  <div className="stat-label">{t.total}</div>
                </div>
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div className="stat-value">{animatedStats.provinces}</div>
                  <div className="stat-label">{t.provinces}</div>
                </div>
                <div className="stat">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

      <section className="section section-about" ref={sectionRefs[0]}>
        <div className="container">
          <div className={`section-content ${visibleSection >= 0 ? 'visible' : ''}`}>
            <div className="section-number">01</div>
            <h3>{t.about}</h3>
            <p className="large-text">{t.aboutText}</p>
          </div>
        </div>
      </section>

      <section className="section section-why" ref={sectionRefs[1]}>
        <div className="container">
          <div className={`section-content ${visibleSection >= 1 ? 'visible' : ''}`}>
            <div className="section-number">02</div>
            <h3>{t.why}</h3>
            <p className="large-text">{t.whyText}</p>
          </div>
        </div>
      </section>

      <section className="section section-features" ref={sectionRefs[2]}>
        <div className="container">
          <div className={`section-content ${visibleSection >= 2 ? 'visible' : ''}`}>
            <div className="section-number">03</div>
            <h3>{t.features}</h3>
            <div className="features-grid">
              <div className="feature-card" style={{ '--delay': '0ms' }}>
                <div className="feature-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h4>{t.searchTitle}</h4>
                <p>{t.searchDesc}</p>
              </div>
              <div className="feature-card" style={{ '--delay': '100ms' }}>
                <div className="feature-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                </div>
                <h4>{t.mapTitle}</h4>
                <p>{t.mapDesc}</p>
              </div>
              <div className="feature-card" style={{ '--delay': '200ms' }}>
                <div className="feature-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                    <path d="M18 14h-8"/>
                    <path d="M15 18h-5"/>
                    <path d="M10 6h8v4h-8V6Z"/>
                  </svg>
                </div>
                <h4>{t.bilingualTitle}</h4>
                <p>{t.bilingualDesc}</p>
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
