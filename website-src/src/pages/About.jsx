import './About.css'

function About({ language }) {
  const text = {
    en: {
      title: 'About This Project',
      crisis: 'The Crisis',
      crisisText: 'In early 2026, Parks Canada announced the closure of HistoricPlaces.ca, citing the "end of technological life" for their 15-year-old database system. While the system may be outdated, the data it contains is irreplaceable - over 13,000 historic places across Canada, representing our collective cultural heritage.',
      problem: 'The Problem',
      problemText: 'Without this central database, there is no comprehensive, publicly accessible registry of Canadian historic places. Individual provinces maintain some records, but nothing approaches the scope and detail of the Canadian Register of Historic Places. The loss of this data would be a cultural tragedy.',
      solution: 'Our Solution',
      solutionText: 'This community-led project was created to preserve the entire database before it disappears. We scraped all 13,000+ entries, both in English and French, including:',
      dataPoints: [
        'Complete descriptions and heritage values',
        'Character-defining elements',
        'Geographic coordinates for mapping',
        'Historical photographs and documentation',
        'Recognition and jurisdiction information',
        'Full bilingual content'
      ],
      technology: 'Technology',
      technologyText: 'Built with modern web technologies to ensure longevity and accessibility:',
      techPoints: [
        'React for a fast, responsive interface',
        'Leaflet for interactive mapping',
        'Full-text search with Fuse.js',
        'Static site generation for easy hosting',
        'Mobile-responsive design',
        'No database required - runs anywhere'
      ],
      openSource: 'Open Source & Preservation',
      openSourceText: 'This project is completely open source. The code, data, and deployment tools are all publicly available. Anyone can:',
      openSourcePoints: [
        'Download the complete dataset',
        'Host their own mirror of the site',
        'Contribute improvements',
        'Build alternative interfaces',
        'Ensure the data never disappears'
      ],
      contribute: 'Contribute',
      contributeText: 'Found an issue? Want to help? Visit our GitHub repository to contribute code, report bugs, or suggest improvements. Together, we can preserve Canadian heritage for future generations.',
      github: 'View on GitHub',
      credits: 'Credits',
      creditsText: 'Original data: Parks Canada and the Canadian Register of Historic Places. This is a preservation project created by concerned citizens who believe cultural heritage data should be accessible to all.',
      contact: 'Contact',
      contactText: 'Questions or concerns? Open an issue on GitHub or contact the project maintainers.'
    },
    fr: {
      title: 'À propos de ce projet',
      crisis: 'La crise',
      crisisText: 'Au début de 2026, Parcs Canada a annoncé la fermeture de LieuxPatrimoniaux.ca, citant la "fin de vie technologique" de leur système de base de données vieux de 15 ans. Bien que le système puisse être obsolète, les données qu\'il contient sont irremplaçables - plus de 13 000 lieux historiques à travers le Canada, représentant notre patrimoine culturel collectif.',
      problem: 'Le problème',
      problemText: 'Sans cette base de données centrale, il n\'existe aucun registre complet et accessible au public des lieux patrimoniaux canadiens. Les provinces individuelles maintiennent certains dossiers, mais rien n\'approche la portée et les détails du Registre canadien des lieux patrimoniaux. La perte de ces données serait une tragédie culturelle.',
      solution: 'Notre solution',
      solutionText: 'Ce projet communautaire a été créé pour préserver l\'ensemble de la base de données avant qu\'elle ne disparaisse. Nous avons extrait plus de 13 000 entrées, en anglais et en français, incluant:',
      dataPoints: [
        'Descriptions complètes et valeurs patrimoniales',
        'Éléments caractéristiques',
        'Coordonnées géographiques pour la cartographie',
        'Photographies historiques et documentation',
        'Informations sur la reconnaissance et la juridiction',
        'Contenu bilingue complet'
      ],
      technology: 'Technologie',
      technologyText: 'Construit avec des technologies web modernes pour assurer la longévité et l\'accessibilité:',
      techPoints: [
        'React pour une interface rapide et réactive',
        'Leaflet pour la cartographie interactive',
        'Recherche en texte intégral avec Fuse.js',
        'Génération de site statique pour un hébergement facile',
        'Design adaptatif pour mobile',
        'Aucune base de données requise - fonctionne partout'
      ],
      openSource: 'Source ouverte et préservation',
      openSourceText: 'Ce projet est entièrement open source. Le code, les données et les outils de déploiement sont tous accessibles publiquement. Tout le monde peut:',
      openSourcePoints: [
        'Télécharger l\'ensemble complet des données',
        'Héberger son propre miroir du site',
        'Contribuer des améliorations',
        'Créer des interfaces alternatives',
        'Assurer que les données ne disparaissent jamais'
      ],
      contribute: 'Contribuer',
      contributeText: 'Vous avez trouvé un problème? Vous voulez aider? Visitez notre dépôt GitHub pour contribuer du code, signaler des bogues ou suggérer des améliorations. Ensemble, nous pouvons préserver le patrimoine canadien pour les générations futures.',
      github: 'Voir sur GitHub',
      credits: 'Crédits',
      creditsText: 'Données originales: Parcs Canada et le Registre canadien des lieux patrimoniaux. Il s\'agit d\'un projet de préservation créé par des citoyens concernés qui croient que les données du patrimoine culturel devraient être accessibles à tous.',
      contact: 'Contact',
      contactText: 'Questions ou préoccupations? Ouvrez un problème sur GitHub ou contactez les mainteneurs du projet.'
    }
  }

  const t = text[language]

  return (
    <div className="about-page">
      <div className="container">
        <h1>{t.title}</h1>

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
          <h2>{t.contribute}</h2>
          <p>{t.contributeText}</p>
          <a href="https://github.com" className="github-button" target="_blank" rel="noopener noreferrer">
            {t.github}
          </a>
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
