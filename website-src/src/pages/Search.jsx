import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'
import './Search.css'

function Search({ language }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [filters, setFilters] = useState({
    province: '',
    type: ''
  })
  const [loading, setLoading] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const observer = useRef()
  const LIMIT = 50

  // Load provinces for filter
  useEffect(() => {
    fetch(`${config.endpoints.provinces}?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        setProvinces(data.provinces || [])
      })
      .catch(err => {
        console.error('Error loading provinces:', err)
      })
  }, [language])

  const performSearch = useCallback((currentOffset, isNewSearch) => {
    // Determine which API endpoint to use
    // If searchTerm is >= 2 chars, use /api/search
    // Otherwise use /api/places (unless term is 1 char, then we might want to wait or show nothing?)

    // Logic from original:
    // 1. If no search term and no filters -> fetch all (now /api/places with limit)
    // 2. If search term >= 2 -> /api/search
    // 3. If filters active -> /api/places

    let url = ''
    const hasSearchTerm = searchTerm && searchTerm.length >= 2

    if (hasSearchTerm) {
      url = `${config.endpoints.search}?q=${encodeURIComponent(searchTerm)}&lang=${language}&limit=${LIMIT}&offset=${currentOffset}`
      if (filters.province) url += `&province=${encodeURIComponent(filters.province)}`
      if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`
    } else {
      // If we have a 1-char search term and no filters, maybe we shouldn't search?
      // Original code cleared results if else.
      if (searchTerm && searchTerm.length < 2 && !filters.province && !filters.type) {
        if (isNewSearch) setResults([])
        return
      }

      url = `${config.endpoints.places}?lang=${language}&limit=${LIMIT}&offset=${currentOffset}`
      if (filters.province) url += `&province=${encodeURIComponent(filters.province)}`
      if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`
    }

    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const newResults = data.results || data.places || []

        setResults(prev => {
          if (isNewSearch) return newResults
          // Filter out duplicates just in case
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

  // Trigger search on inputs change
  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    performSearch(0, true)
  }, [performSearch])

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

  const text = {
    en: {
      title: 'Search Historic Places',
      searchPlaceholder: 'Search by name or location...',
      province: 'Province/Territory',
      jurisdiction: 'Jurisdiction',
      type: 'Type',
      all: 'All',
      results: 'results',
      noResults: 'No results found. Try adjusting your search.',
      loading: 'Loading...'
    },
    fr: {
      title: 'Rechercher des lieux patrimoniaux',
      searchPlaceholder: 'Rechercher par nom ou emplacement...',
      province: 'Province/Territoire',
      jurisdiction: 'Juridiction',
      type: 'Type',
      all: 'Tous',
      results: 'résultats',
      noResults: 'Aucun résultat trouvé. Essayez d\'ajuster votre recherche.',
      loading: 'Chargement...'
    }
  }

  const t = text[language]

  return (
    <div className="search-page">
      <div className="container">
        <h2>{t.title}</h2>

        <div className="search-controls">
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="filters">
            <select
              value={filters.province}
              onChange={(e) => setFilters({ ...filters, province: e.target.value })}
              className="filter-select"
            >
              <option value="">{t.province} - {t.all}</option>
              {provinces.map(prov => (
                <option key={prov.province} value={prov.province}>{prov.province} ({prov.count})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="results-count">
          {/* Note: This count might be misleading now as it's the fetched count, not total. 
               The API returns 'count' which is usually the page count or total? 
               In index.ts:
               jsonResponse({ results, count: results.length });
               So it's just the length of current page. 
               If we want total count, we'd need a separate query, but let's just show loaded count or nothing.
               Let's show "Showing X results"
           */}
          Showing {results.length} {t.results}
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
