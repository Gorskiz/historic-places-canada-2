import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'
import './Search.css'

function Search({ language }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Filters State
  const [filters, setFilters] = useState({
    province: '',
    municipality: '',
    type: '',
    jurisdiction: '',
    theme: '',
    architect: '',
    min_year: '',
    max_year: ''
  })

  // Options State
  const [options, setOptions] = useState({
    provinces: [],
    types: [],
    jurisdictions: []
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
          jurisdictions: data.jurisdictions || []
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
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
      max_year: ''
    })
    setSearchTerm('')
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
      noResults: 'No results found. Try adjusting your search.',
      loading: 'Loading...',
      advanced: 'Advanced Filters',
      clear: 'Clear All'
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
      noResults: 'Aucun résultat trouvé.',
      loading: 'Chargement...',
      advanced: 'Filtres avancés',
      clear: 'Effacer tout'
    }
  }

  const t = text[language]

  return (
    <div className="search-page">
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
                <input
                  type="text"
                  value={filters.theme}
                  onChange={(e) => handleFilterChange('theme', e.target.value)}
                  className="filter-input"
                  placeholder={t.theme}
                />
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

        <div className="results-count">
          {loading && results.length === 0 ? '' : `${results.length} ${t.results}`}
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
                  <h3>{place.name}</h3>
                  <p className="location">
                    {[place.municipality, place.province].filter(Boolean).join(', ')}
                  </p>
                  {place.recognition_type && <p className="type">{place.recognition_type}</p>}
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
