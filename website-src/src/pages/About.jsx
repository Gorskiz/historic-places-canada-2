import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'
import SEO from '../components/SEO'
import './About.css'

const GITHUB_REPO = 'https://github.com/Gorskiz/historic-places-canada-2'

function About({ language }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${config.endpoints.stats}?lang=${language}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error loading stats:', err))
  }, [language])

  const text = {
    en: {
      title: 'About This Project',
      subtitle: '🌟 This is an open source community project',
      crisis: 'The Crisis',
      crisisText: `In early 2026, Parks Canada announced the closure of HistoricPlaces.ca, citing the "end of technological life" for their 15-year-old database system. While the system may be outdated, the data it contains is irreplaceable - over ${stats?.totalPlaces?.toLocaleString() || '11,000'} historic places across Canada, representing our collective cultural heritage.`,
      problem: 'The Problem',
      problemText: 'Without this central database, there is no comprehensive, publicly accessible registry of Canadian historic places. Individual provinces maintain some records, but nothing approaches the scope and detail of the Canadian Register of Historic Places. The loss of this data would be a cultural tragedy.',
      solution: 'Our Solution',
      solutionText: `This community-led open source project was created to preserve the entire database before it disappears. We scraped all ${stats?.totalPlaces?.toLocaleString() || '11,000+'} entries, both in English and French, including:`,
      dataPoints: [
        'Complete descriptions and heritage values',
        'Character-defining elements',
        'Geographic coordinates for mapping',
        `${stats?.totalImages?.toLocaleString() || '55,000+'} historical photographs`,
        'Recognition and jurisdiction information',
        'Full bilingual content'
      ],
      technology: 'Technology',
      technologyText: 'Built with modern web technologies to ensure longevity and accessibility:',
      techPoints: [
        'React for a fast, responsive interface',
        'Leaflet for interactive mapping',
        'Full-text database search for modern performance',
        'Database-driven architecture for efficient data management',
        'Mobile-responsive design',
        'Fast search with optimized database queries'
      ],
      openSource: 'Open Source & Preservation',
      openSourceText: 'This project is completely open source and free. The code, data, and deployment tools are all publicly available on GitHub. Anyone can:',
      openSourcePoints: [
        'Download the complete database (January 2026 snapshot)',
        'Host their own mirror of the site',
        'Contribute improvements and features',
        'Build alternative interfaces',
        'Ensure the data never disappears',
        'Fork the project for their own use'
      ],
      apiAccess: 'API Access',
      apiAccessText: 'Developers and researchers can access the complete dataset programmatically through our free, public API. Build applications, conduct research, or integrate historic places data into your projects.',
      viewApiDocs: 'View API Documentation',
      contribute: 'Contribute',
      contributeText: 'Found an issue? Want to help? This is an open source project and we welcome contributions! Visit our GitHub repository to contribute code, report bugs, or suggest improvements. Together, we can preserve Canadian heritage for future generations.',
      github: 'View on GitHub',
      licensing: 'Licensing',
      licensingText: 'This project utilizes data from the Canadian Register of Historic Places (historicplaces.ca), provided by the Government of Canada. This data is available under the ',
      licensingLinkText: 'Open Government Licence - Canada',
      licensingUrl: 'https://open.canada.ca/en/open-government-licence-canada',
      credits: 'Credits',
      creditsText: 'Original data: Parks Canada and the Canadian Register of Historic Places. This is a preservation project created by concerned citizens who believe cultural heritage data should be accessible to all.',
      contact: 'Contact',
      contactText: 'Questions or concerns? Open an issue on GitHub or contact the project maintainers.'
    },
    fr: {
      title: 'À propos de ce projet',
      subtitle: '🌟 Ceci est un projet communautaire open source',
      crisis: 'La crise',
      crisisText: `Au début de 2026, Parcs Canada a annoncé la fermeture de LieuxPatrimoniaux.ca, citant la "fin de vie technologique" de leur système de base de données vieux de 15 ans. Bien que le système puisse être obsolète, les données qu'il contient sont irremplaçables - plus de ${stats?.totalPlaces?.toLocaleString() || '11 000'} lieux historiques à travers le Canada, représentant notre patrimoine culturel collectif.`,
      problem: 'Le problème',
      problemText: 'Sans cette base de données centrale, il n\'existe aucun registre complet et accessible au public des lieux patrimoniaux canadiens. Les provinces individuelles maintiennent certains dossiers, mais rien n\'approche la portée et les détails du Registre canadien des lieux patrimoniaux. La perte de ces données serait une tragédie culturelle.',
      solution: 'Notre solution',
      solutionText: `Ce projet communautaire open source a été créé pour préserver l'ensemble de la base de données avant qu'elle ne disparaisse. Nous avons extrait plus de ${stats?.totalPlaces?.toLocaleString() || '11 000'} entrées, en anglais et en français, incluant:`,
      dataPoints: [
        'Descriptions complètes et valeurs patrimoniales',
        'Éléments caractéristiques',
        'Coordonnées géographiques pour la cartographie',
        `Plus de ${stats?.totalImages?.toLocaleString() || '55 000'} photographies historiques`,
        'Informations sur la reconnaissance et la juridiction',
        'Contenu bilingue complet'
      ],
      technology: 'Technologie',
      technologyText: 'Construit avec des technologies web modernes pour assurer la longévité et l\'accessibilité:',
      techPoints: [
        'React pour une interface rapide et réactive',
        'Leaflet pour la cartographie interactive',
        'Recherche en texte intégral dans la base de données pour des performances modernes',
        'Architecture pilotée par base de données pour une gestion efficace des données',
        'Design adaptatif pour mobile',
        'Recherche rapide avec des requêtes de base de données optimisées'
      ],
      openSource: 'Source ouverte et préservation',
      openSourceText: 'Ce projet est entièrement open source et gratuit. Le code, les données et les outils de déploiement sont tous accessibles publiquement sur GitHub. Tout le monde peut:',
      openSourcePoints: [
        'Télécharger la base de données complète (instantané de janvier 2026)',
        'Héberger son propre miroir du site',
        'Contribuer des améliorations et des fonctionnalités',
        'Créer des interfaces alternatives',
        'Assurer que les données ne disparaissent jamais',
        'Forker le projet pour leur propre usage'
      ],
      apiAccess: 'Accès API',
      apiAccessText: 'Les développeurs et chercheurs peuvent accéder à l\'ensemble de données complet par programmation via notre API publique gratuite. Créez des applications, menez des recherches ou intégrez des données de lieux patrimoniaux dans vos projets.',
      viewApiDocs: 'Voir la documentation API',
      contribute: 'Contribuer',
      contributeText: 'Vous avez trouvé un problème? Vous voulez aider? Ceci est un projet open source et nous accueillons les contributions! Visitez notre dépôt GitHub pour contribuer du code, signaler des bogues ou suggérer des améliorations. Ensemble, nous pouvons préserver le patrimoine canadien pour les générations futures.',
      github: 'Voir sur GitHub',
      licensing: 'Licence',
      licensingText: 'Ce projet utilise des données du Registre canadien des lieux patrimoniaux (historicplaces.ca), fournies par le gouvernement du Canada. Ces données sont disponibles sous la ',
      licensingLinkText: 'Licence du gouvernement ouvert – Canada',
      licensingUrl: 'https://open.canada.ca/fr/licence-du-gouvernement-ouvert-canada',
      credits: 'Crédits',
      creditsText: 'Données originales: Parcs Canada et le Registre canadien des lieux patrimoniaux. Il s\'agit d\'un projet de préservation créé par des citoyens concernés qui croient que les données du patrimoine culturel devraient être accessibles à tous.',
      contact: 'Contact',
      contactText: 'Questions ou préoccupations? Ouvrez un problème sur GitHub ou contactez les mainteneurs du projet.'
    }
  }

  const t = text[language]

  return (
    <div className="about-page">
      <SEO
        title={language === 'en' ? 'About - Historic Places Canada' : 'À propos - Lieux patrimoniaux du Canada'}
        description={language === 'en'
          ? 'Learn about our community-led open source project to preserve over 11,000 historic places across Canada.'
          : 'Découvrez notre projet communautaire open source visant à préserver plus de 11 000 lieux patrimoniaux à travers le Canada.'
        }
      />
      <div className="container">
        <h1>{t.title}</h1>
        <p className="about-subtitle">{t.subtitle}</p>

        <section className="about-section">
          <h2>{t.crisis}</h2>
          <p>{t.crisisText}</p>
        </section>

        <section className="about-section">
          <h2>{t.problem}</h2>
          <p>{t.problemText}</p>
        </section>

        <section className="about-section">
          <h2>{t.solution}</h2>
          <p>{t.solutionText}</p>
          <ul>
            {t.dataPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="about-section">
          <h2>{t.technology}</h2>
          <p>{t.technologyText}</p>
          <ul>
            {t.techPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="about-section">
          <h2>{t.openSource}</h2>
          <p>{t.openSourceText}</p>
          <ul>
            {t.openSourcePoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="about-section">
          <h2>{t.apiAccess}</h2>
          <p>{t.apiAccessText}</p>
          <Link to="/docs" className="github-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {t.viewApiDocs}
          </Link>
        </section>

        <section className="about-section">
          <h2>{t.contribute}</h2>
          <p>{t.contributeText}</p>
          <a href={GITHUB_REPO} className="github-button" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t.github}
          </a>
        </section>

        <section className="about-section">
          <h2>{t.licensing}</h2>
          <p>
            {t.licensingText}
            <a
              href={t.licensingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="license-link"
            >
              {t.licensingLinkText}
            </a>.
          </p>
        </section>

        <section className="about-section">
          <h2>{t.credits}</h2>
          <p>{t.creditsText}</p>
        </section>

        <section className="about-section">
          <h2>{t.contact}</h2>
          <p>{t.contactText}</p>
        </section>
      </div>
    </div>
  )
}

export default About
