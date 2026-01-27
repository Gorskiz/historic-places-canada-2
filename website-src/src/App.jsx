import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Search from './pages/Search'
import Map from './pages/Map'
import PlaceDetail from './pages/PlaceDetail'
import About from './pages/About'
import './App.css'

const GITHUB_REPO = 'https://github.com/Gorskiz/historic-places-canada-2'

function App() {
  const [language, setLanguage] = useState('en')

  const toggleLanguage = () => {
    setLanguage(lang => lang === 'en' ? 'fr' : 'en')
  }

  const text = {
    en: {
      title: 'Canadian Historic Places',
      search: 'Search',
      map: 'Map',
      about: 'About',
      home: 'Home'
    },
    fr: {
      title: 'Lieux patrimoniaux canadiens',
      search: 'Recherche',
      map: 'Carte',
      about: 'À propos',
      home: 'Accueil'
    }
  }

  const t = text[language]

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                <img src="/maple-leaf-icon.webp" alt="Canada" className="logo-icon" />
                <h1>{t.title}</h1>
              </Link>
              <nav className="nav">
                <Link to="/">{t.home}</Link>
                <Link to="/search">{t.search}</Link>
                <Link to="/map">{t.map}</Link>
                <Link to="/about">{t.about}</Link>
                <button onClick={toggleLanguage} className="lang-toggle">
                  {language === 'en' ? 'FR' : 'EN'}
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Home language={language} />} />
            <Route path="/search" element={<Search language={language} />} />
            <Route path="/map" element={<Map language={language} />} />
            <Route path="/place/:id" element={<PlaceDetail language={language} />} />
            <Route path="/about" element={<About language={language} />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>
              {language === 'en'
                ? 'Open source community preservation project - Data from Parks Canada'
                : 'Projet communautaire de préservation open source - Données de Parcs Canada'}
            </p>
            <p>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="footer-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {language === 'en' ? 'View on GitHub' : 'Voir sur GitHub'}
              </a>
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
