import { useState, useEffect } from 'react'
import { config } from '../config'
import SEO from '../components/SEO'
import './ApiDocs.css'

function ApiDocs({ language }) {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Initialize ReDoc when the reference tab is active
    if (activeTab === 'reference' && window.Redoc) {
      const container = document.getElementById('redoc-container')
      if (container) {
        // Clear any previous content
        container.innerHTML = ''

        // Fetch and initialize with JSON spec
        fetch('/openapi.json')
          .then(response => response.json())
          .then(spec => {
            window.Redoc.init(
              spec,
              {
                scrollYOffset: () => {
                  // Dynamically calculate offset in case header heights change
                  const mainHeader = document.querySelector('.header')
                  const apiHeader = document.querySelector('.api-docs-header')
                  return (mainHeader?.offsetHeight || 0) + (apiHeader?.offsetHeight || 0)
                },
                hideDownloadButton: false,
                disableSearch: false,
                expandResponses: '200,201',
                jsonSampleExpandLevel: 2,
                hideSingleRequestSampleTab: true,
                menuToggle: true,
                nativeScrollbars: true,
                pathInMiddlePanel: false,
                requiredPropsFirst: true,
                sortPropsAlphabetically: false,
                suppressWarnings: true,
                payloadSampleIdx: 0,
                theme: {
                  colors: {
                    primary: {
                      main: '#c82333'
                    },
                    success: {
                      main: '#28a745'
                    },
                    warning: {
                      main: '#ffc107'
                    },
                    error: {
                      main: '#dc3545'
                    }
                  },
                  typography: {
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    headings: {
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: '600'
                    },
                    code: {
                      fontSize: '13px',
                      fontFamily: '"Courier New", Consolas, Monaco, monospace'
                    }
                  },
                  sidebar: {
                    backgroundColor: '#fafafa',
                    width: '260px',
                    textColor: '#333'
                  },
                  rightPanel: {
                    backgroundColor: '#263238',
                    width: '40%'
                  }
                }
              },
              container
            )

            // Fix scroll behavior after ReDoc initializes
            setTimeout(() => {
              console.log('Setting up custom scroll handlers for ReDoc')

              // Get all menu items with links
              const menuItems = container.querySelectorAll('.menu-content a[href^="#"]')
              console.log('Found menu items:', menuItems.length)

              menuItems.forEach(link => {
                link.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  // Get the target ID from href
                  const href = link.getAttribute('href')
                  const targetId = href.substring(1) // Remove the #

                  console.log('Clicked menu item, target ID:', targetId)

                  // Try multiple selectors to find the target
                  let target = document.getElementById(targetId) ||
                    document.querySelector(`[data-section-id="${targetId}"]`) ||
                    document.querySelector(`[id="${targetId}"]`)

                  if (target) {
                    console.log('Found target element:', target)

                    // Calculate the offset
                    const mainHeader = document.querySelector('.header')
                    const apiHeader = document.querySelector('.api-docs-header')
                    const offset = (mainHeader?.offsetHeight || 0) + (apiHeader?.offsetHeight || 0) + 20 // +20 for padding

                    console.log('Calculated offset:', offset)

                    // Get target position
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset

                    console.log('Scrolling to position:', targetPosition)

                    // Scroll to target
                    window.scrollTo({
                      top: targetPosition,
                      behavior: 'smooth'
                    })
                  } else {
                    console.log('Target not found for ID:', targetId)
                    // List all elements with IDs for debugging
                    const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id)
                    console.log('Available IDs:', allIds.filter(id => id.includes('operation') || id.includes('tag')))
                  }
                })
              })
            }, 1000)

          })
          .catch(error => {
            console.error('Error loading OpenAPI spec:', error)
            container.innerHTML = '<p style="padding: 2rem; color: #c82333;">Error loading API specification. Please refresh the page.</p>'
          })
      }
    }
  }, [activeTab])

  const text = {
    en: {
      title: 'API Documentation',
      subtitle: 'API for educational and research use — Canadian historic places data',

      // Tabs
      overviewTab: 'Overview',
      referenceTab: 'API Reference',
      examplesTab: 'Code Examples',
      dictionaryTab: 'Data Dictionary',

      // Overview content
      gettingStarted: 'Getting Started',
      gettingStartedText: 'The Historic Places Canada API provides free, programmatic access to our complete database of over 11,000 nationally recognized historic places across Canada.',

      quickStart: 'Quick Start',
      quickStartTitle: 'Fetch 10 places from Ontario',

      rateLimit: 'Rate Limiting',
      rateLimitText: 'To ensure fair usage and API stability, we implement rate limiting for all requests:',
      rateLimitPoints: [
        'Anonymous users: 100 requests per minute per IP address',
        'Rate limit headers included in all responses',
        'Requests exceeding the limit receive a 429 status code',
        'Retry-After header indicates when to retry'
      ],

      rateLimitHeaders: 'Rate Limit Headers',
      rateLimitHeadersList: [
        'X-RateLimit-Limit: Maximum requests per minute',
        'X-RateLimit-Remaining: Requests remaining in current window',
        'X-RateLimit-Reset: Unix timestamp when limit resets'
      ],

      bilingual: 'Bilingual Support',
      bilingualText: 'All content is available in both English and French. Use the lang parameter in your requests:',
      bilingualExample: 'Add ?lang=en or ?lang=fr to any endpoint',

      usageTermsTitle: 'Usage Terms',
      usageTermsIntro: 'By using this API or any data it provides, you agree to the following terms. Failure to comply may result in access being revoked.',
      usageTermsPoints: [
        { title: 'Educational and Research Use Only', text: 'This API and its data may only be used for educational, academic, journalistic, or non-commercial research purposes.' },
        { title: 'No Commercial Use', text: 'You may not use the data, or any work derived from the data, for any commercial purpose, including selling, advertising, or monetising access to the data in any form.' },
        { title: 'Attribution Required', text: 'All uses of this data must include clear attribution to the Canadian Register of Historic Places as the original source.' }
      ],
      usageTermsAttribution: 'Required attribution:',
      usageTermsAttributionQuote: 'Data sourced from the Canadian Register of Historic Places (historicplaces.ca), Government of Canada.',

      // Examples content
      example1Title: 'Example 1: Fetch Places by Province',
      example1Desc: 'Retrieve historic places from a specific province with pagination',

      example2Title: 'Example 2: Search Historic Places',
      example2Desc: 'Full-text search with filters for province and recognition type',

      example3Title: 'Example 3: Get Place Details with Images',
      example3Desc: 'Fetch detailed information about a specific place including all images',

      example4Title: 'Example 4: Get Map Data with Bounds',
      example4Desc: 'Retrieve places within geographic bounds for map display',

      // Data Dictionary
      dictionaryIntro: 'Complete reference of all database fields and their descriptions',
      fieldName: 'Field Name',
      fieldType: 'Type',
      fieldDescription: 'Description',

      fields: [
        { name: 'id', type: 'Integer', description: 'Unique identifier for the historic place' },
        { name: 'name', type: 'String', description: 'Name of the historic place' },
        { name: 'province', type: 'String', description: 'Canadian province or territory' },
        { name: 'municipality', type: 'String', description: 'City, town, or municipality' },
        { name: 'latitude', type: 'Number', description: 'Geographic latitude coordinate' },
        { name: 'longitude', type: 'Number', description: 'Geographic longitude coordinate' },
        { name: 'description', type: 'Text', description: 'Full historical description of the place' },
        { name: 'recognition_type', type: 'String', description: 'Type of historic recognition (e.g., National Historic Site)' },
        { name: 'jurisdiction', type: 'String', description: 'Level of government jurisdiction (Federal, Provincial, Municipal)' },
        { name: 'recognition_date', type: 'String', description: 'Date when the place received historic recognition' },
        { name: 'architect', type: 'String', description: 'Name of architect(s) if known' },
        { name: 'themes', type: 'String', description: 'Historical themes associated with the place' },
        { name: 'language', type: 'String', description: 'Content language (en or fr)' },
        { name: 'primary_image', type: 'URL', description: 'URL of the primary image for the place' }
      ],

      downloadSpec: 'Download OpenAPI Specification',
      endpoints: 'Available Endpoints',
      endpointsList: [
        'GET /api/places - List historic places with filters',
        'GET /api/places/{id} - Get specific place details',
        'GET /api/search - Full-text search with advanced filters',
        'GET /api/filters - Get available filter options',
        'GET /api/map - Get places for map display',
        'GET /api/provinces - List provinces with counts',
        'GET /api/stats - Database statistics'
      ]
    },
    fr: {
      title: 'Documentation API',
      subtitle: 'API pour usage éducatif et de recherche — données des lieux patrimoniaux canadiens',

      // Tabs
      overviewTab: 'Aperçu',
      referenceTab: 'Référence API',
      examplesTab: 'Exemples de Code',
      dictionaryTab: 'Dictionnaire de Données',

      // Overview content
      gettingStarted: 'Pour Commencer',
      gettingStartedText: 'L\'API des Lieux Patrimoniaux du Canada offre un accès gratuit et programmable à notre base de données complète de plus de 11 000 lieux patrimoniaux reconnus à travers le Canada.',

      quickStart: 'Démarrage Rapide',
      quickStartTitle: 'Récupérer 10 lieux de l\'Ontario',

      rateLimit: 'Limitation de Débit',
      rateLimitText: 'Pour garantir une utilisation équitable et la stabilité de l\'API, nous mettons en œuvre une limitation de débit pour toutes les requêtes:',
      rateLimitPoints: [
        'Utilisateurs anonymes: 100 requêtes par minute par adresse IP',
        'En-têtes de limitation inclus dans toutes les réponses',
        'Les requêtes dépassant la limite reçoivent un code d\'état 429',
        'L\'en-tête Retry-After indique quand réessayer'
      ],

      rateLimitHeaders: 'En-têtes de Limitation',
      rateLimitHeadersList: [
        'X-RateLimit-Limit: Requêtes maximales par minute',
        'X-RateLimit-Remaining: Requêtes restantes dans la fenêtre actuelle',
        'X-RateLimit-Reset: Horodatage Unix de réinitialisation de la limite'
      ],

      bilingual: 'Support Bilingue',
      bilingualText: 'Tout le contenu est disponible en anglais et en français. Utilisez le paramètre lang dans vos requêtes:',
      bilingualExample: 'Ajoutez ?lang=en ou ?lang=fr à n\'importe quel point de terminaison',

      usageTermsTitle: 'Conditions d\'utilisation',
      usageTermsIntro: 'En utilisant cette API ou les données qu\'elle fournit, vous acceptez les conditions suivantes. Le non-respect de ces conditions peut entraîner la révocation de votre accès.',
      usageTermsPoints: [
        { title: 'Usage éducatif et de recherche uniquement', text: 'Cette API et ses données ne peuvent être utilisées qu\'à des fins éducatives, académiques, journalistiques ou de recherche non commerciale.' },
        { title: 'Pas d\'usage commercial', text: 'Vous ne pouvez pas utiliser les données, ni tout travail dérivé de ces données, à des fins commerciales, notamment la vente, la publicité ou la monétisation de l\'accès aux données sous quelque forme que ce soit.' },
        { title: 'Attribution requise', text: 'Tout usage de ces données doit inclure une attribution claire au Registre canadien des lieux patrimoniaux comme source originale.' }
      ],
      usageTermsAttribution: 'Attribution requise :',
      usageTermsAttributionQuote: 'Données provenant du Registre canadien des lieux patrimoniaux (historicplaces.ca), Gouvernement du Canada.',

      // Examples content
      example1Title: 'Exemple 1: Récupérer des Lieux par Province',
      example1Desc: 'Récupérer les lieux patrimoniaux d\'une province spécifique avec pagination',

      example2Title: 'Exemple 2: Rechercher des Lieux Patrimoniaux',
      example2Desc: 'Recherche en texte intégral avec filtres pour la province et le type de reconnaissance',

      example3Title: 'Exemple 3: Obtenir les Détails d\'un Lieu avec Images',
      example3Desc: 'Récupérer des informations détaillées sur un lieu spécifique, y compris toutes les images',

      example4Title: 'Exemple 4: Obtenir des Données de Carte avec Limites',
      example4Desc: 'Récupérer des lieux dans des limites géographiques pour affichage sur carte',

      // Data Dictionary
      dictionaryIntro: 'Référence complète de tous les champs de la base de données et leurs descriptions',
      fieldName: 'Nom du Champ',
      fieldType: 'Type',
      fieldDescription: 'Description',

      fields: [
        { name: 'id', type: 'Entier', description: 'Identifiant unique pour le lieu patrimonial' },
        { name: 'name', type: 'Chaîne', description: 'Nom du lieu patrimonial' },
        { name: 'province', type: 'Chaîne', description: 'Province ou territoire canadien' },
        { name: 'municipality', type: 'Chaîne', description: 'Ville ou municipalité' },
        { name: 'latitude', type: 'Nombre', description: 'Coordonnée géographique de latitude' },
        { name: 'longitude', type: 'Nombre', description: 'Coordonnée géographique de longitude' },
        { name: 'description', type: 'Texte', description: 'Description historique complète du lieu' },
        { name: 'recognition_type', type: 'Chaîne', description: 'Type de reconnaissance patrimoniale (ex: Lieu historique national)' },
        { name: 'jurisdiction', type: 'Chaîne', description: 'Niveau de juridiction gouvernementale (Fédéral, Provincial, Municipal)' },
        { name: 'recognition_date', type: 'Chaîne', description: 'Date de reconnaissance patrimoniale du lieu' },
        { name: 'architect', type: 'Chaîne', description: 'Nom du ou des architectes si connu' },
        { name: 'themes', type: 'Chaîne', description: 'Thèmes historiques associés au lieu' },
        { name: 'language', type: 'Chaîne', description: 'Langue du contenu (en ou fr)' },
        { name: 'primary_image', type: 'URL', description: 'URL de l\'image principale du lieu' }
      ],

      downloadSpec: 'Télécharger la Spécification OpenAPI',
      endpoints: 'Points de Terminaison Disponibles',
      endpointsList: [
        'GET /api/places - Lister les lieux patrimoniaux avec filtres',
        'GET /api/places/{id} - Obtenir les détails d\'un lieu spécifique',
        'GET /api/search - Recherche en texte intégral avec filtres avancés',
        'GET /api/filters - Obtenir les options de filtre disponibles',
        'GET /api/map - Obtenir des lieux pour affichage sur carte',
        'GET /api/provinces - Lister les provinces avec comptes',
        'GET /api/stats - Statistiques de la base de données'
      ]
    }
  }

  const t = text[language]

  // Code examples
  const examples = {
    example1: {
      javascript: `// Fetch places from Ontario
const response = await fetch(
  'https://historicplaces2.ca/api/places?lang=en&province=Ontario&limit=10'
);
const data = await response.json();

// Check rate limits
console.log('Remaining requests:', response.headers.get('X-RateLimit-Remaining'));

// Display results
data.places.forEach(place => {
  console.log(\`\${place.name} - \${place.municipality}\`);
});`,
      python: `import requests

# Fetch places from Ontario
response = requests.get(
    'https://historicplaces2.ca/api/places',
    params={'lang': 'en', 'province': 'Ontario', 'limit': 10}
)
data = response.json()

# Check rate limits
print('Remaining requests:', response.headers.get('X-RateLimit-Remaining'))

# Display results
for place in data['places']:
    print(f"{place['name']} - {place['municipality']}")`,
      curl: `curl -i "https://historicplaces2.ca/api/places?lang=en&province=Ontario&limit=10"`
    },
    example2: {
      javascript: `// Search for castles in Quebec
const response = await fetch(
  'https://historicplaces2.ca/api/search?q=castle&province=Quebec&lang=en&limit=20'
);
const data = await response.json();

console.log(\`Found \${data.total} total matches\`);
console.log(\`Showing \${data.count} results\`);

data.results.forEach(place => {
  console.log(\`\${place.name} - \${place.recognition_type}\`);
});`,
      python: `import requests

# Search for castles in Quebec
response = requests.get(
    'https://historicplaces2.ca/api/search',
    params={'q': 'castle', 'province': 'Quebec', 'lang': 'en', 'limit': 20}
)
data = response.json()

print(f"Found {data['total']} total matches")
print(f"Showing {data['count']} results")

for place in data['results']:
    print(f"{place['name']} - {place['recognition_type']}")`,
      curl: `curl "https://historicplaces2.ca/api/search?q=castle&province=Quebec&lang=en&limit=20"`
    },
    example3: {
      javascript: `// Get detailed information about a specific place
const placeId = 123;
const response = await fetch(
  \`https://historicplaces2.ca/api/places/\${placeId}?lang=en\`
);
const data = await response.json();

console.log('Place:', data.place.name);
console.log('Description:', data.place.description);
console.log('Images:', data.images.length);

// Display all images
data.images.forEach((img, index) => {
  console.log(\`Image \${index + 1}: \${img.r2_url}\`);
  console.log(\`  Alt: \${img.alt}\`);
});`,
      python: `import requests

# Get detailed information about a specific place
place_id = 123
response = requests.get(
    f'https://historicplaces2.ca/api/places/{place_id}',
    params={'lang': 'en'}
)
data = response.json()

print('Place:', data['place']['name'])
print('Description:', data['place']['description'])
print('Images:', len(data['images']))

# Display all images
for i, img in enumerate(data['images']):
    print(f"Image {i + 1}: {img['r2_url']}")
    print(f"  Alt: {img['alt']}")`,
      curl: `curl "https://historicplaces2.ca/api/places/123?lang=en"`
    },
    example4: {
      javascript: `// Get places within geographic bounds (Ottawa area)
const bounds = '45.0,-76.0,46.0,-75.0'; // minLat,minLng,maxLat,maxLng
const response = await fetch(
  \`https://historicplaces2.ca/api/map?lang=en&bounds=\${bounds}\`
);
const data = await response.json();

console.log(\`Found \${data.count} places in bounds\`);

// Display first 5 places
data.places.slice(0, 5).forEach(place => {
  console.log(\`\${place.name} at [\${place.latitude}, \${place.longitude}]\`);
});`,
      python: `import requests

# Get places within geographic bounds (Ottawa area)
bounds = '45.0,-76.0,46.0,-75.0'  # minLat,minLng,maxLat,maxLng
response = requests.get(
    'https://historicplaces2.ca/api/map',
    params={'lang': 'en', 'bounds': bounds}
)
data = response.json()

print(f"Found {data['count']} places in bounds")

# Display first 5 places
for place in data['places'][:5]:
    print(f"{place['name']} at [{place['latitude']}, {place['longitude']}]")`,
      curl: `curl "https://historicplaces2.ca/api/map?lang=en&bounds=45.0,-76.0,46.0,-75.0"`
    }
  }

  const quickStartCode = {
    javascript: `const response = await fetch('https://historicplaces2.ca/api/places?lang=en&province=Ontario&limit=10');
const data = await response.json();
console.log(data.places);`,
    python: `import requests
response = requests.get('https://historicplaces2.ca/api/places', params={'lang': 'en', 'province': 'Ontario', 'limit': 10})
data = response.json()
print(data['places'])`,
    curl: `curl "https://historicplaces2.ca/api/places?lang=en&province=Ontario&limit=10"`
  }

  return (
    <div className="api-docs-page">
      <SEO
        title={t.title}
        description={t.subtitle}
        language={language}
      />

      <header className="api-docs-header">
        <div className="container">
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>

          <div className="tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              {t.overviewTab}
            </button>
            <button
              className={activeTab === 'reference' ? 'active' : ''}
              onClick={() => setActiveTab('reference')}
            >
              {t.referenceTab}
            </button>
            <button
              className={activeTab === 'examples' ? 'active' : ''}
              onClick={() => setActiveTab('examples')}
            >
              {t.examplesTab}
            </button>
            <button
              className={activeTab === 'dictionary' ? 'active' : ''}
              onClick={() => setActiveTab('dictionary')}
            >
              {t.dictionaryTab}
            </button>
          </div>
        </div>
      </header>

      <div className="api-docs-content container">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="terms-card">
              <div className="terms-card-header">
                <div className="terms-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3>{t.usageTermsTitle}</h3>
              </div>
              <p className="terms-card-intro">{t.usageTermsIntro}</p>
              <ul>
                {t.usageTermsPoints.map((point, i) => (
                  <li key={i}><strong>{point.title}</strong> — {point.text}</li>
                ))}
              </ul>
              <p className="terms-card-attribution">{t.usageTermsAttribution}</p>
              <blockquote>{t.usageTermsAttributionQuote}</blockquote>
            </div>

            <section className="doc-section">
              <h2>{t.gettingStarted}</h2>
              <p>{t.gettingStartedText}</p>
            </section>

            <section className="doc-section">
              <h2>{t.quickStart}</h2>
              <p>{t.quickStartTitle}</p>
              <div className="code-examples">
                <div className="code-block">
                  <div className="code-label">JavaScript</div>
                  <pre><code>{quickStartCode.javascript}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">Python</div>
                  <pre><code>{quickStartCode.python}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">cURL</div>
                  <pre><code>{quickStartCode.curl}</code></pre>
                </div>
              </div>
            </section>

            <section className="doc-section">
              <h2>{t.endpoints}</h2>
              <div className="info-card">
                <ul>
                  {t.endpointsList.map((endpoint, i) => (
                    <li key={i}><code>{endpoint}</code></li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="doc-section">
              <h2>{t.rateLimit}</h2>
              <p>{t.rateLimitText}</p>
              <ul>
                {t.rateLimitPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>

              <h3>{t.rateLimitHeaders}</h3>
              <div className="info-card">
                <ul>
                  {t.rateLimitHeadersList.map((header, i) => (
                    <li key={i}><code>{header}</code></li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="doc-section">
              <h2>{t.bilingual}</h2>
              <p>{t.bilingualText}</p>
              <div className="info-card">
                <code>{t.bilingualExample}</code>
              </div>
            </section>

          </div>
        )}

        {activeTab === 'reference' && (
          <div className="reference-tab">
            <div className="redoc-actions">
              <a href="/openapi.yaml" download className="download-button">
                {t.downloadSpec}
              </a>
            </div>
            <div id="redoc-container"></div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="examples-tab">
            <section className="example-section">
              <h2>{t.example1Title}</h2>
              <p>{t.example1Desc}</p>
              <div className="code-examples">
                <div className="code-block">
                  <div className="code-label">JavaScript</div>
                  <pre><code>{examples.example1.javascript}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">Python</div>
                  <pre><code>{examples.example1.python}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">cURL</div>
                  <pre><code>{examples.example1.curl}</code></pre>
                </div>
              </div>
            </section>

            <section className="example-section">
              <h2>{t.example2Title}</h2>
              <p>{t.example2Desc}</p>
              <div className="code-examples">
                <div className="code-block">
                  <div className="code-label">JavaScript</div>
                  <pre><code>{examples.example2.javascript}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">Python</div>
                  <pre><code>{examples.example2.python}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">cURL</div>
                  <pre><code>{examples.example2.curl}</code></pre>
                </div>
              </div>
            </section>

            <section className="example-section">
              <h2>{t.example3Title}</h2>
              <p>{t.example3Desc}</p>
              <div className="code-examples">
                <div className="code-block">
                  <div className="code-label">JavaScript</div>
                  <pre><code>{examples.example3.javascript}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">Python</div>
                  <pre><code>{examples.example3.python}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">cURL</div>
                  <pre><code>{examples.example3.curl}</code></pre>
                </div>
              </div>
            </section>

            <section className="example-section">
              <h2>{t.example4Title}</h2>
              <p>{t.example4Desc}</p>
              <div className="code-examples">
                <div className="code-block">
                  <div className="code-label">JavaScript</div>
                  <pre><code>{examples.example4.javascript}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">Python</div>
                  <pre><code>{examples.example4.python}</code></pre>
                </div>
                <div className="code-block">
                  <div className="code-label">cURL</div>
                  <pre><code>{examples.example4.curl}</code></pre>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'dictionary' && (
          <div className="dictionary-tab">
            <section className="doc-section">
              <p>{t.dictionaryIntro}</p>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.fieldName}</th>
                      <th>{t.fieldType}</th>
                      <th>{t.fieldDescription}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.fields.map((field, i) => (
                      <tr key={i}>
                        <td><code>{field.name}</code></td>
                        <td>{field.type}</td>
                        <td>{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiDocs
