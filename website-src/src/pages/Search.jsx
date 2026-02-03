import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { config } from '../config'
import SEO from '../components/SEO'
import './Search.css'

function Search({ language }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  // Helper to retrieve saved state
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem('historic_search_state')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      console.error('Error parsing saved search state', e)
      return null
    }
  }

  // Initialize state from URL params OR localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    if (searchParams.has('q')) return searchParams.get('q') || ''

    // If URL is empty of params, try to restore
    const hasParams = Array.from(searchParams.keys()).length > 0
    if (!hasParams) {
      const saved = getSavedState()
      if (saved?.searchTerm) return saved.searchTerm
    }
    return ''
  })

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalResults, setTotalResults] = useState(0)

  // Filters State
  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      province: '',
      municipality: '',
      type: '',
      jurisdiction: '',
      theme: '',
      architect: '',
      min_year: '',
      max_year: '',
      sort: 'name_asc'
    }

    // Check URL first
    let hasUrlFilter = false
    const urlFilters = { ...defaultFilters }

    Object.keys(defaultFilters).forEach(key => {
      const val = searchParams.get(key)
      if (val !== null) {
        urlFilters[key] = val
        hasUrlFilter = true
      }
    })

    if (hasUrlFilter) return urlFilters

    // If no URL filters and no params, check storage
    const hasParams = Array.from(searchParams.keys()).length > 0
    if (!hasParams) {
      const saved = getSavedState()
      if (saved?.filters) {
        return { ...defaultFilters, ...saved.filters }
      }
    }

    return defaultFilters
  })

  // Initialize showAdvanced based on current filters (whether from URL or storage)
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const activeFilters = [
      filters.province,
      filters.municipality,
      filters.type,
      filters.jurisdiction,
      filters.theme,
      filters.architect,
      filters.min_year,
      filters.max_year
    ]

    // Check if any filter is truthy
    if (activeFilters.some(val => val)) return true

    // Or check saved preference
    const saved = getSavedState()
    const hasParams = Array.from(searchParams.keys()).length > 0
    if (saved?.showAdvanced !== undefined && !hasParams) {
      return saved.showAdvanced
    }

    return false
  })

  // Persist state to localStorage
  useEffect(() => {
    const stateToSave = {
      searchTerm,
      filters,
      showAdvanced
    }
    localStorage.setItem('historic_search_state', JSON.stringify(stateToSave))
  }, [searchTerm, filters, showAdvanced])

  // Options State
  const [options, setOptions] = useState({
    provinces: [],
    types: [],
    jurisdictions: [],
    themes: []
  })

  const observer = useRef()
  const LIMIT = 50

  // Load filter options
  useEffect(() => {
    // We can use the new /api/filters endpoint
    fetch(`${config.endpoints.filters}?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        setOptions({
          provinces: data.provinces || [],
          types: data.types || [],
          jurisdictions: data.jurisdictions || [],
          themes: data.themes || []
        })
      })
      .catch(err => {
        console.error('Error loading filters:', err)
        // Fallback to old provinces endpoint if new one fails (during transition)
        fetch(`${config.endpoints.provinces}?lang=${language}`)
          .then(res => res.json())
          .then(data => setOptions(prev => ({ ...prev, provinces: data.provinces?.map(p => p.province) || [] })))
          .catch(e => console.error('Fallback failed', e))
      })
  }, [language])

  const performSearch = useCallback((currentOffset, isNewSearch) => {
    let url = `${config.endpoints.search}?lang=${language}&limit=${LIMIT}&offset=${currentOffset}`

    if (searchTerm && searchTerm.length >= 2) {
      url += `&q=${encodeURIComponent(searchTerm)}`
    }

    // Add all filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        url += `&${key}=${encodeURIComponent(filters[key])}`
      }
    })

    // If no search term and no filters, we can still load all places via this endpoint now 
    // because we updated the backend to handle empty q if filters are present OR just load all if nothing is present logic?
    // Actually the backend code:
    // SELECT ... WHERE language=?
    // if (q) AND ...
    // if (province) AND ...
    // So if nothing matches, it returns ALL places with limit. Perfect.

    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const newResults = data.results || []

        setResults(prev => {
          if (isNewSearch) return newResults
          // Filter out duplicates
          const existingIds = new Set(prev.map(p => p.id))
          const uniqueNewResults = newResults.filter(p => !existingIds.has(p.id))
          return [...prev, ...uniqueNewResults]
        })

        if (data.total !== undefined) {
          setTotalResults(data.total)
        } else if (isNewSearch) {
          // Fallback if API doesn't return total (though we just added it)
          setTotalResults(newResults.length)
        }

        setHasMore(newResults.length === LIMIT)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error searching:', err)
        setLoading(false)
      })
  }, [searchTerm, filters, language])

  // Debounce search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0)
      setHasMore(true)
      performSearch(0, true)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, filters, performSearch])

  // Infinite scroll observer
  const lastElementRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prevOffset => {
          const newOffset = prevOffset + LIMIT
          performSearch(newOffset, false)
          return newOffset
        })
      }
    })

    if (node) observer.current.observe(node)
  }, [loading, hasMore, performSearch])

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchTerm) params.set('q', searchTerm)

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.set(key, filters[key])
      }
    })

    setSearchParams(params, { replace: true })
  }, [searchTerm, filters, setSearchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setOffset(0) // Reset to first page on filter change
  }

  const clearFilters = () => {
    setFilters({
      province: '',
      municipality: '',
      type: '',
      jurisdiction: '',
      theme: '',
      architect: '',
      min_year: '',
      max_year: '',
      sort: 'name_asc'
    })
    setSearchTerm('')
    setOffset(0)
  }

  const text = {
    en: {
      title: 'Search Historic Places',
      searchPlaceholder: 'Search by name, description...',
      province: 'Province / Jurisdiction',
      municipality: 'Municipality',
      type: 'Recognition Type',
      jurisdiction: 'Jurisdiction',
      theme: 'Theme / Keyword',
      architect: 'Architect / Builder',
      yearRange: 'Year Range',
      minYear: 'Min Year',
      maxYear: 'Max Year',
      all: 'All',
      results: 'results found',
      of: 'of',
      noResults: 'No results found. Try adjusting your search.',
      loading: 'Loading...',
      advanced: 'Advanced Filters',
      clear: 'Clear All',
      sortBy: 'Sort by',
      sortOptions: {
        name_asc: 'Name (A-Z)',
        name_desc: 'Name (Z-A)',
        newest: 'Newest Recognition',
        oldest: 'Oldest Recognition',
        random: 'Random'
      },
      noImage: 'No image available',
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
      title: 'Rechercher des lieux patrimoniaux',
      searchPlaceholder: 'Rechercher par nom, description...',
      province: 'Province/Territoire',
      municipality: 'Municipalité',
      type: 'Type de reconnaissance',
      jurisdiction: 'Juridiction',
      theme: 'Thème / Mot-clé',
      yearRange: 'Année',
      minYear: 'Année min',
      maxYear: 'Année max',
      all: 'Tous',
      results: 'résultats trouvés',
      of: 'de',
      noResults: 'Aucun résultat trouvé.',
      loading: 'Chargement...',
      advanced: 'Filtres avancés',
      clear: 'Effacer tout',
      sortBy: 'Trier par',
      sortOptions: {
        name_asc: 'Nom (A-Z)',
        name_desc: 'Nom (Z-A)',
        newest: 'Reconnaissance (Récent)',
        oldest: 'Reconnaissance (Ancien)',
        random: 'Aléatoire'
      },
      noImage: 'Aucune image disponible',
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
    <div className="search-page">
      <SEO
        title={language === 'en' ? 'Search Historic Places - Canada' : 'Rechercher des lieux patrimoniaux - Canada'}
        description={language === 'en'
          ? 'Search and discover historic places across Canada. Filter by province, municipality, theme, and more.'
          : 'Recherchez et découvrez des lieux patrimoniaux à travers le Canada. Filtrez par province, municipalité, thème et plus encore.'
        }
      />
      <div className="container">
        <h2>{t.title}</h2>

        <div className="search-controls">
          <div className="main-search-bar">
            <input
              type="text"
              className="search-input"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {t.advanced}
              <span className="toggle-icon">{showAdvanced ? '−' : '+'}</span>
            </button>
          </div>

          <div className={`advanced-filters ${showAdvanced ? 'open' : ''}`}>
            <div className="filters-grid">

              {/* Province */}
              <div className="filter-group">
                <label>{t.province}</label>
                <select
                  value={filters.province}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t.all}</option>
                  {options.provinces.map(p => (
                    <option key={p.province} value={p.province}>{p.province} ({p.count})</option>
                  ))}
                </select>
              </div>

              {/* Jurisdiction - Hidden as it duplicates Province currently */
              /* <div className="filter-group">
                <label>{t.jurisdiction}</label>
                <select
                  value={filters.jurisdiction}
                  onChange={(e) => handleFilterChange('jurisdiction', e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t.all}</option>
                  {options.jurisdictions.map(j => (
                    <option key={j.jurisdiction} value={j.jurisdiction}>{j.jurisdiction} ({j.count})</option>
                  ))}
                </select>
              </div> */}

              {/* Type */}
              <div className="filter-group">
                <label>{t.type}</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t.all}</option>
                  {options.types.map(t => (
                    <option key={t.recognition_type} value={t.recognition_type}>{t.recognition_type} ({t.count})</option>
                  ))}
                </select>
              </div>

              {/* Municipality */}
              <div className="filter-group">
                <label>{t.municipality}</label>
                <input
                  type="text"
                  value={filters.municipality}
                  onChange={(e) => handleFilterChange('municipality', e.target.value)}
                  className="filter-input"
                  placeholder={t.municipality}
                />
              </div>

              {/* Theme */}
              <div className="filter-group">
                <label>{t.theme}</label>
                <select
                  value={filters.theme}
                  onChange={(e) => handleFilterChange('theme', e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t.all}</option>
                  {options.themes?.map(t => (
                    <option key={t.theme} value={t.theme}>{t.theme} ({t.count})</option>
                  ))}
                </select>
              </div>

              {/* Architect */}
              <div className="filter-group">
                <label>{t.architect}</label>
                <input
                  type="text"
                  value={filters.architect}
                  onChange={(e) => handleFilterChange('architect', e.target.value)}
                  className="filter-input"
                  placeholder={t.architect}
                />
              </div>

              {/* Years */}
              <div className="filter-group year-group">
                <label>{t.yearRange}</label>
                <div className="year-inputs">
                  <input
                    type="number"
                    value={filters.min_year}
                    onChange={(e) => handleFilterChange('min_year', e.target.value)}
                    className="filter-input"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={filters.max_year}
                    onChange={(e) => handleFilterChange('max_year', e.target.value)}
                    className="filter-input"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div className="filters-actions">
              <button className="clear-btn" onClick={clearFilters}>
                {t.clear}
              </button>
            </div>
          </div>
        </div>

        {/* Data Disclaimer */}
        <div className="search-disclaimer">
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

        <div className="search-header-row">
          <div className="results-count">
            {loading && results.length === 0 ? '' : `${results.length} ${t.of} ${totalResults} ${t.results}`}
          </div>

          <div className="sort-controls">
            <label>{t.sortBy}:</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="sort-select"
            >
              <option value="name_asc">{t.sortOptions.name_asc}</option>
              <option value="name_desc">{t.sortOptions.name_desc}</option>
              <option value="newest">{t.sortOptions.newest}</option>
              <option value="oldest">{t.sortOptions.oldest}</option>
              <option value="random">{t.sortOptions.random}</option>
            </select>
          </div>
        </div>

        {results.length === 0 && !loading ? (
          <p className="no-results">{t.noResults}</p>
        ) : (
          <div className="results-grid">
            {results.map((place, index) => {
              const isLastElement = index === results.length - 1
              return (
                <Link
                  ref={isLastElement ? lastElementRef : null}
                  to={`/place/${place.id}`}
                  key={place.id}
                  className="result-card"
                >
                  <div className="result-card-image">
                    {place.primary_image ? (
                      <img
                        src={place.primary_image}
                        alt={place.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>{t.noImage}</span>
                      </div>
                    )}
                  </div>
                  <div className="result-card-content">
                    <h3>{place.name}</h3>
                    <p className="location">
                      {[place.municipality, place.province].filter(Boolean).join(', ')}
                    </p>
                    {place.recognition_type && <p className="type">{place.recognition_type}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {loading && <p className="loading-more">{t.loading}</p>}
      </div>
    </div>
  )
}

export default Search
