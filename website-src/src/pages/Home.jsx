import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { config } from '../config'
import SEO from '../components/SEO'
import FeaturedHero from '../components/FeaturedHero'
import './Home.css'

function Home({ language }) {
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState(null)
  const [visibleSection, setVisibleSection] = useState(0)
  const sectionRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

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

  const text = {
    en: {
      cta: 'Start Exploring',
      about: 'About This Project',
      aboutText: `In 2026, Parks Canada announced that HistoricPlaces.ca was set to be shut down without preserving its invaluable database of over ${stats?.totalPlaces?.toLocaleString() || '11,000'} historic sites. This community-led open source project was created to rescue and preserve this irreplaceable cultural heritage data for future generations.`,
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
      missionText: `In 2026, the official HistoricPlaces.ca data was set to be shut down. This open-source initiative was created to rescue over ${stats?.totalPlaces?.toLocaleString() || '11,000'} invaluable records, ensuring Canada's architectural and cultural history remains accessible to everyone.`,
      openSourceTitle: 'Open Source',
      openSourceDesc: 'Built by the community, for the community.',
      dataTitle: 'Open Data',
      dataDesc: 'All data is available for research and education.',
      themes: 'Themes',
      disclaimerTitle: 'Important Notice About These Records Originally From historicplaces.ca',
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
      cta: 'Commencer l\'exploration',
      about: 'À propos de ce projet',
      aboutText: `En 2026, Parcs Canada a annoncé que LieuxPatrimoniaux.ca devait être fermé sans préserver sa précieuse base de données de plus de ${stats?.totalPlaces?.toLocaleString() || '11 000'} sites historiques. Ce projet communautaire open source a été créé pour sauver et préserver ces données patrimoniales irremplaçables pour les générations futures.`,
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
      missionText: `En 2026, la base de données officielle LieuxPatrimoniaux.ca devait être fermée. Cette initiative open-source a été créée pour sauver plus de ${stats?.totalPlaces?.toLocaleString() || '11 000'} dossiers précieux, garantissant que l'histoire architecturale et culturelle du Canada reste accessible à tous.`,
      openSourceTitle: 'Open Source',
      openSourceDesc: 'Construit par la communauté, pour la communauté.',
      dataTitle: 'Données ouvertes',
      dataDesc: 'Toutes les données sont disponibles pour la recherche.',
      themes: 'Thèmes',
      disclaimerTitle: 'Avis important concernant ces dossiers originaux de historicplaces.ca',
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

  return (
    <div className="home">
      <SEO
        title={language === 'en' ? 'Canadian Historic Places - Preserving Heritage' : 'Lieux patrimoniaux canadiens - Préserver le patrimoine'}
        description={language === 'en'
          ? `Explore over ${stats?.totalPlaces?.toLocaleString() || '11,000'} historic places across Canada. An open-source community project preserving Canadian architectural and cultural heritage.`
          : `Explorez plus de ${stats?.totalPlaces?.toLocaleString() || '11 000'} lieux patrimoniaux à travers le Canada. Un projet communautaire open source préservant le patrimoine architectural et culturel canadien.`
        }
      />

      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": language === 'en' ? "Historic Places Canada" : "Lieux patrimoniaux du Canada",
          "description": language === 'en'
            ? "Explore over 11,000 historic places across Canada"
            : "Explorez plus de 11 000 lieux patrimoniaux à travers le Canada",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${window.location.origin}/search?query={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "inLanguage": [language === 'en' ? "en-CA" : "fr-CA"],
          "about": {
            "@type": "Thing",
            "name": "Canadian Heritage",
            "description": "Historic and cultural places across Canada"
          }
        })}
      </script>

      <FeaturedHero language={language} stats={stats} />

      {/* Disclaimer Section */}
      <section className="section-disclaimer">
        <div className="container">
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
              <div className="pixel-flag-container">
                <div className="pixel-flag-wrapper">
                  <div className="pixel-flag">
                    <div className="flag-left-bar"></div>
                    <div className="flag-center">
                      <div className="pixel-maple-leaf"></div>
                    </div>
                    <div className="flag-right-bar"></div>
                  </div>
                </div>
                <div className="flag-glow"></div>
                <div className="pixel-particles"></div>
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
