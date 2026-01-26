import { useState, useEffect } from 'react'
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

  // Perform search when inputs change
  useEffect(() => {
    performSearch()
  }, [searchTerm, filters, language])

  const performSearch = () => {
    // If no search term and no filters, fetch all places
    if (!searchTerm && !filters.province && !filters.type) {
      setLoading(true)
      fetch(`${config.endpoints.places}?lang=${language}&limit=1000`)
        .then(res => res.json())
        .then(data => {
          setResults(data.places || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Error loading places:', err)
          setLoading(false)
        })
      return
    }

    // Search with API
    if (searchTerm && searchTerm.length >= 2) {
      setLoading(true)
      let url = `${config.endpoints.search}?q=${encodeURIComponent(searchTerm)}&lang=${language}`

      if (filters.province) url += `&province=${encodeURIComponent(filters.province)}`
      if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Error searching:', err)
          setLoading(false)
        })
    } else if (filters.province || filters.type) {
      // Filter only (no search term)
      setLoading(true)
      let url = `${config.endpoints.places}?lang=${language}&limit=1000`

      if (filters.province) url += `&province=${encodeURIComponent(filters.province)}`
      if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setResults(data.places || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Error filtering:', err)
          setLoading(false)
        })
    } else {
      setResults([])
    }
  }

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

  if (loading) {
    return (
      <div className="search-page">
        <div className="container">
          <p className="loading">{t.loading}</p>
        </div>
      </div>
    )
  }

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
              onChange={(e) => setFilters({...filters, province: e.target.value})}
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
          {results.length} {t.results}
        </div>

        {results.length === 0 ? (
          <p className="no-results">{t.noResults}</p>
        ) : (
          <div className="results-grid">
            {results.map(place => (
              <Link to={`/place/${place.id}`} key={place.id} className="result-card">
                <h3>{place.name}</h3>
                <p className="location">
                  {[place.municipality, place.province].filter(Boolean).join(', ')}
                </p>
                {place.type && <p className="type">{place.type}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
