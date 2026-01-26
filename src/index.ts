/**
 * Canadian Historic Places - Full Stack Worker
 * Serves both static frontend and API routes
 * Built with Cloudflare Workers, D1, and R2
 */

interface Env {
	DB: D1Database;
	IMAGES: R2Bucket;
	ASSETS: Fetcher; // Assets binding for static files
}

// CORS headers for API routes
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: any, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const url = new URL(request.url);
			const path = url.pathname;

			// Handle API routes
			if (path.startsWith('/api/')) {
				// Handle CORS preflight
				if (request.method === 'OPTIONS') {
					return new Response(null, { headers: corsHeaders });
				}

				return await handleApiRequest(request, env, url, path);
			}

			// Serve static assets for all other routes
			let response = await env.ASSETS.fetch(request);

			// SPA Fallback: If asset not found, serve index.html
			if (response.status === 404 && request.method === 'GET') {
				const indexUrl = new URL('/index.html', request.url);
				const indexResponse = await env.ASSETS.fetch(indexUrl);

				// Return index.html if found, otherwise return original 404
				if (indexResponse.status === 200) {
					return indexResponse;
				}
			}

			return response;
		} catch (error) {
			console.error('Worker Error:', error);
			return new Response(`Worker Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	},
} satisfies ExportedHandler<Env>;

async function handleApiRequest(request: Request, env: Env, url: URL, path: string): Promise<Response> {
	try {
		// GET /api/places - List places with optional filters
		if (path === '/api/places' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';
			const province = url.searchParams.get('province');
			const type = url.searchParams.get('type');
			const limit = parseInt(url.searchParams.get('limit') || '100');
			const offset = parseInt(url.searchParams.get('offset') || '0');

			let query = `SELECT
					id, name, province, municipality, latitude, longitude,
					recognition_type, jurisdiction
					FROM places
					WHERE language = ?`;

			const params: any[] = [lang];

			if (province) {
				query += ` AND province = ?`;
				params.push(province);
			}

			if (type) {
				query += ` AND recognition_type = ?`;
				params.push(type);
			}

			query += ` ORDER BY name LIMIT ? OFFSET ?`;
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return jsonResponse({ places: results, count: results.length });
		}

		// GET /api/places/:id - Get specific place
		if (path.match(/^\/api\/places\/\d+$/) && request.method === 'GET') {
			const id = path.split('/').pop();
			const lang = url.searchParams.get('lang') || 'en';

			const place = await env.DB.prepare(`
					SELECT * FROM places WHERE id = ? AND language = ?
				`).bind(id, lang).first();

			if (!place) {
				return jsonResponse({ error: 'Place not found' }, 404);
			}

			// Get images for this place
			const { results: images } = await env.DB.prepare(`
					SELECT r2_url, alt, title FROM images
					WHERE place_id = ?
					ORDER BY display_order
				`).bind(id).all();

			return jsonResponse({ place, images });
		}

		// GET /api/search - Unified search with filters
		if (path === '/api/search' && request.method === 'GET') {
			const q = url.searchParams.get('q') || '';
			const lang = url.searchParams.get('lang') || 'en';
			const limit = parseInt(url.searchParams.get('limit') || '50');
			const offset = parseInt(url.searchParams.get('offset') || '0');

			// Filters
			const province = url.searchParams.get('province');
			const municipality = url.searchParams.get('municipality');
			const type = url.searchParams.get('type');
			const jurisdiction = url.searchParams.get('jurisdiction');
			const theme = url.searchParams.get('theme');
			const minYear = parseInt(url.searchParams.get('min_year') || '0');
			const maxYear = parseInt(url.searchParams.get('max_year') || '0');
			const architect = url.searchParams.get('architect');

			// Base query
			let query = `SELECT
						id, name, province, municipality, latitude, longitude,
						description, recognition_type, jurisdiction, recognition_date, architect
					FROM places
					WHERE language = ?`;

			const params: any[] = [lang];

			// Text Search
			if (q && q.length >= 2) {
				query += ` AND (
					name LIKE ?
					OR description LIKE ?
					OR municipality LIKE ?
					OR architect LIKE ?
				)`;
				const term = `%${q}%`;
				params.push(term, term, term, term);
			}

			// Apply Filters
			if (province) {
				query += ` AND province = ?`;
				params.push(province);
			}

			if (municipality) {
				query += ` AND municipality LIKE ?`;
				params.push(`%${municipality}%`);
			}

			if (type) {
				query += ` AND recognition_type = ?`;
				params.push(type);
			}

			if (jurisdiction) {
				query += ` AND jurisdiction = ?`;
				params.push(jurisdiction);
			}

			if (theme) {
				query += ` AND themes LIKE ?`;
				params.push(`%${theme}%`);
			}

			if (architect) {
				query += ` AND architect LIKE ?`;
				params.push(`%${architect}%`);
			}

			if (minYear > 0) {
				query += ` AND substr(recognition_date, 1, 4) >= ?`;
				params.push(minYear.toString());
			}

			if (maxYear > 0) {
				query += ` AND substr(recognition_date, 1, 4) <= ?`;
				params.push(maxYear.toString());
			}

			// Sort and Limit
			query += ` ORDER BY name LIMIT ? OFFSET ?`;
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();

			return jsonResponse({ results, count: results.length });
		}

		// GET /api/filters - Get options for filters
		if (path === '/api/filters' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';

			const provinces = await env.DB.prepare(`
				SELECT province, COUNT(*) as count 
				FROM places 
				WHERE language = ? AND province IS NOT NULL 
				GROUP BY province 
				ORDER BY province
			`).bind(lang).all();

			const types = await env.DB.prepare(`
				SELECT recognition_type, COUNT(*) as count 
				FROM places 
				WHERE language = ? AND recognition_type IS NOT NULL 
				GROUP BY recognition_type 
				ORDER BY recognition_type
			`).bind(lang).all();

			const jurisdictions = await env.DB.prepare(`
				SELECT jurisdiction, COUNT(*) as count 
				FROM places 
				WHERE language = ? AND jurisdiction IS NOT NULL 
				GROUP BY jurisdiction 
				ORDER BY jurisdiction
			`).bind(lang).all();

			return jsonResponse({
				provinces: provinces.results,
				types: types.results,
				jurisdictions: jurisdictions.results
			});
		}

		// GET /api/map - Get places with coordinates (for map view)
		if (path === '/api/map' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';
			const bounds = url.searchParams.get('bounds'); // format: "minLat,minLng,maxLat,maxLng"

			let query = `
					SELECT id, name, province, municipality, latitude, longitude
					FROM places
					WHERE language = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
				`;
			const params: any[] = [lang];

			if (bounds) {
				const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
				query += ` AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`;
				params.push(minLat, maxLat, minLng, maxLng);
			}

			query += ` LIMIT 5000`;

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return jsonResponse({ places: results, count: results.length });
		}

		// GET /api/provinces - Get list of provinces
		if (path === '/api/provinces' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';

			const { results } = await env.DB.prepare(`
					SELECT DISTINCT province, COUNT(*) as count
					FROM places
					WHERE language = ? AND province IS NOT NULL
					GROUP BY province
					ORDER BY province
				`).bind(lang).all();

			return jsonResponse({ provinces: results });
		}

		// GET /api/stats - Get statistics
		if (path === '/api/stats' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';

			const totalPlaces = await env.DB.prepare(`
					SELECT COUNT(*) as count FROM places WHERE language = ?
				`).bind(lang).first();

			const withCoords = await env.DB.prepare(`
					SELECT COUNT(*) as count FROM places
					WHERE language = ? AND latitude IS NOT NULL
				`).bind(lang).first();

			const provinces = await env.DB.prepare(`
					SELECT COUNT(DISTINCT province) as count FROM places WHERE language = ?
				`).bind(lang).first();

			return jsonResponse({
				totalPlaces: totalPlaces?.count || 0,
				placesWithCoordinates: withCoords?.count || 0,
				provinces: provinces?.count || 0,
			});
		}

		// Default response
		return jsonResponse({
			message: 'Canadian Historic Places API',
			version: '1.0.0',
			endpoints: [
				'GET /api/places?lang=en&province=Ontario&limit=100&offset=0',
				'GET /api/places/:id?lang=en',
				'GET /api/search?q=term&lang=en&limit=50',
				'GET /api/map?lang=en&bounds=minLat,minLng,maxLat,maxLng',
				'GET /api/provinces?lang=en',
				'GET /api/stats?lang=en',
			],
		});

	} catch (error) {
		console.error('API Error:', error);
		return jsonResponse({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
}
