import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Search from './pages/Search'
import Map from './pages/Map'
import PlaceDetail from './pages/PlaceDetail'
import About from './pages/About'
import './App.css'

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
                ? 'Community preservation project - Data from Parks Canada'
                : 'Projet communautaire de préservation - Données de Parcs Canada'}
            </p>
            <p>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
