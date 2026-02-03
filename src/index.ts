/**
 * Canadian Historic Places - Full Stack Worker
 * Serves both static frontend and API routes
 * Built with Cloudflare Workers, D1, and R2
 */

interface Env {
	DB: D1Database;
	IMAGES: R2Bucket;
	ASSETS: Fetcher; // Assets binding for static files
	RATE_LIMITER: RateLimit; // Global rate limit (30 req/min)
	DATA_RATE_LIMITER: RateLimit; // Tighter limit for data endpoints (10 req/min)
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

/**
 * Rate Limiting Configuration
 * Data is licensed for non-commercial, educational use only.
 * Global limit applies to all endpoints; the tighter DATA limit
 * applies additionally to bulk-data endpoints (search, list, map).
 */
const RATE_LIMIT_CONFIG = {
	REQUESTS_PER_MINUTE: 30,
	DATA_REQUESTS_PER_MINUTE: 10,
	WINDOW_SECONDS: 60,
	HEADERS: {
		LIMIT: 'X-RateLimit-Limit',
		REMAINING: 'X-RateLimit-Remaining',
		RESET: 'X-RateLimit-Reset',
		RETRY_AFTER: 'Retry-After'
	}
};

/**
 * Build a 429 Rate Limit Exceeded response with the appropriate limit value
 */
function buildRateLimitResponse(limit: number): Response {
	const now = Math.floor(Date.now() / 1000);
	const resetTime = now + RATE_LIMIT_CONFIG.WINDOW_SECONDS;

	return new Response(
		JSON.stringify({
			error: 'Rate limit exceeded',
			message: 'Too many requests. This API is restricted to non-commercial, educational use only. Please try again later.',
			retryAfter: RATE_LIMIT_CONFIG.WINDOW_SECONDS
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				[RATE_LIMIT_CONFIG.HEADERS.LIMIT]: limit.toString(),
				[RATE_LIMIT_CONFIG.HEADERS.REMAINING]: '0',
				[RATE_LIMIT_CONFIG.HEADERS.RESET]: resetTime.toString(),
				[RATE_LIMIT_CONFIG.HEADERS.RETRY_AFTER]: RATE_LIMIT_CONFIG.WINDOW_SECONDS.toString(),
				...corsHeaders
			}
		}
	);
}

/**
 * Check rate limits for incoming requests.
 * All requests are checked against the global limit (30 req/min).
 * Data-heavy endpoints (search, list, map) are additionally checked
 * against the tighter data limit (10 req/min).
 * Returns either null (allowed) or a 429 Response (rate limited).
 */
async function checkRateLimit(
	request: Request,
	env: Env,
	isDataEndpoint: boolean = false
): Promise<Response | null> {
	const identifier = request.headers.get('CF-Connecting-IP') || 'unknown';

	try {
		// Global rate limit applies to every API request
		const { success } = await env.RATE_LIMITER.limit({ key: `ip:${identifier}` });
		if (!success) {
			return buildRateLimitResponse(RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE);
		}

		// Data endpoints have an additional, tighter per-endpoint limit
		if (isDataEndpoint) {
			const { success: dataSuccess } = await env.DATA_RATE_LIMITER.limit({ key: `data:ip:${identifier}` });
			if (!dataSuccess) {
				return buildRateLimitResponse(RATE_LIMIT_CONFIG.DATA_REQUESTS_PER_MINUTE);
			}
		}

		return null;
	} catch (error) {
		// On error, allow request (fail open)
		console.error('Rate limit check failed:', error);
		return null;
	}
}

/**
 * Add rate limit headers to successful responses.
 * limit should be the effective limit for the endpoint tier.
 */
function addRateLimitHeaders(response: Response, limit: number): Response {
	const now = Math.floor(Date.now() / 1000);
	const resetTime = now + RATE_LIMIT_CONFIG.WINDOW_SECONDS;

	const headers = new Headers(response.headers);
	headers.set(RATE_LIMIT_CONFIG.HEADERS.LIMIT, limit.toString());
	headers.set(RATE_LIMIT_CONFIG.HEADERS.REMAINING, (limit - 1).toString());
	headers.set(RATE_LIMIT_CONFIG.HEADERS.RESET, resetTime.toString());

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

async function handleApiRequest(request: Request, env: Env, url: URL, path: string): Promise<Response> {
	// Data-heavy endpoints get the tighter per-endpoint rate limit on top of the global limit
	const isDataEndpoint = path === '/api/search' || path === '/api/places' || path === '/api/map';
	const activeLimit = isDataEndpoint ? RATE_LIMIT_CONFIG.DATA_REQUESTS_PER_MINUTE : RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE;

	// Check rate limit FIRST (before any processing)
	const rateLimitResponse = await checkRateLimit(request, env, isDataEndpoint);
	if (rateLimitResponse) {
		return rateLimitResponse; // Return 429 response
	}

	try {
		// GET /api/places - List places with optional filters
		if (path === '/api/places' && request.method === 'GET') {
			const lang = url.searchParams.get('lang') || 'en';
			const province = url.searchParams.get('province');
			const type = url.searchParams.get('type');
			const random = url.searchParams.get('random') === 'true';
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 50);
			const offset = parseInt(url.searchParams.get('offset') || '0');

			let query = `SELECT DISTINCT
					p.id,
					p.name,
					p.province,
					p.municipality,
					p.latitude,
					p.longitude,
					p.recognition_type,
					p.jurisdiction,
					(SELECT r2_url FROM images WHERE place_id = p.id ORDER BY display_order LIMIT 1) as primary_image
					FROM places p`;

			const conditions: string[] = ['p.language = ?'];
			const params: any[] = [lang];

			if (province) {
				conditions.push(`p.province = ?`);
				params.push(province);
			}

			if (type) {
				conditions.push(`p.recognition_type = ?`);
				params.push(type);
			}

			// Only include places with images
			conditions.push(`(SELECT COUNT(*) FROM images WHERE place_id = p.id) > 0`);

			query += ` WHERE ` + conditions.join(' AND ');

			// Use random order if requested, otherwise sort by name
			if (random) {
				query += ` ORDER BY RANDOM() LIMIT ? OFFSET ?`;
			} else {
				query += ` ORDER BY p.name LIMIT ? OFFSET ?`;
			}
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return addRateLimitHeaders(jsonResponse({ places: results, count: results.length }), activeLimit);
		}

		// GET /api/places/:id - Get specific place
		if (path.match(/^\/api\/places\/\d+$/) && request.method === 'GET') {
			const id = path.split('/').pop();
			const lang = url.searchParams.get('lang') || 'en';

			const place = await env.DB.prepare(`
					SELECT * FROM places WHERE id = ? AND language = ?
				`).bind(id, lang).first();

			if (!place) {
				return addRateLimitHeaders(jsonResponse({ error: 'Place not found' }, 404), activeLimit);
			}

			// Get images for this place
			const { results: images } = await env.DB.prepare(`
					SELECT r2_url, alt, title FROM images
					WHERE place_id = ?
					ORDER BY display_order
				`).bind(id).all();

			return addRateLimitHeaders(jsonResponse({ place, images }), activeLimit);
		}

		// GET /api/search - Unified search with filters
		if (path === '/api/search' && request.method === 'GET') {
			const q = url.searchParams.get('q') || '';
			const lang = url.searchParams.get('lang') || 'en';
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 50);
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
			const sort = url.searchParams.get('sort') || 'name_asc';

			// Base conditions
			let whereClause = `WHERE language = ?`;
			const params: any[] = [lang];

			// Text Search
			if (q && q.length >= 2) {
				whereClause += ` AND (
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
				whereClause += ` AND province = ?`;
				params.push(province);
			}

			if (municipality) {
				whereClause += ` AND municipality LIKE ?`;
				params.push(`%${municipality}%`);
			}

			if (type) {
				whereClause += ` AND recognition_type = ?`;
				params.push(type);
			}

			if (jurisdiction) {
				whereClause += ` AND jurisdiction = ?`;
				params.push(jurisdiction);
			}

			if (theme) {
				whereClause += ` AND themes LIKE ?`;
				params.push(`%${theme}%`);
			}

			if (architect) {
				whereClause += ` AND architect LIKE ?`;
				params.push(`%${architect}%`);
			}

			if (minYear > 0) {
				whereClause += ` AND substr(recognition_date, 1, 4) >= ?`;
				params.push(minYear.toString());
			}

			if (maxYear > 0) {
				whereClause += ` AND substr(recognition_date, 1, 4) <= ?`;
				params.push(maxYear.toString());
			}

			// Determine Sort Order
			let orderBy = 'ORDER BY name ASC';
			switch (sort) {
				case 'newest':
					orderBy = 'ORDER BY recognition_date DESC, name ASC';
					break;
				case 'oldest':
					orderBy = 'ORDER BY recognition_date ASC, name ASC';
					break;
				case 'name_desc':
					orderBy = 'ORDER BY name DESC';
					break;
				case 'random':
					orderBy = 'ORDER BY RANDOM()';
					break;
				case 'name_asc':
				default:
					orderBy = 'ORDER BY name ASC';
					break;
			}

			// Get Total Count
			const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM places ${whereClause}`).bind(...params).first();
			const total = countResult?.total || 0;

			// Get Data
			const query = `SELECT
						id, name, province, municipality, latitude, longitude,
						description, recognition_type, jurisdiction, recognition_date, architect,
						(SELECT r2_url FROM images WHERE place_id = places.id ORDER BY display_order LIMIT 1) as primary_image
					FROM places
					${whereClause}
					${orderBy} LIMIT ? OFFSET ?`;

			const dataParams = [...params, limit, offset];
			const { results } = await env.DB.prepare(query).bind(...dataParams).all();

			return addRateLimitHeaders(jsonResponse({ results, count: results.length, total }), activeLimit);
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

			const themes = await env.DB.prepare(`
				SELECT TRIM(value) as theme, COUNT(*) as count
				FROM places, json_each('["' || REPLACE(REPLACE(themes, ', ', '","'), ',', '","') || '"]')
				WHERE language = ? AND themes IS NOT NULL AND themes != ''
				GROUP BY theme
				ORDER BY count DESC
			`).bind(lang).all();

			return addRateLimitHeaders(jsonResponse({
				provinces: provinces.results,
				types: types.results,
				jurisdictions: jurisdictions.results,
				themes: themes.results
			}), activeLimit);
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

			query += ` LIMIT 500`;

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return addRateLimitHeaders(jsonResponse({ places: results, count: results.length }), activeLimit);
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

			return addRateLimitHeaders(jsonResponse({ provinces: results }), activeLimit);
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

			const totalImages = await env.DB.prepare(`
					SELECT COUNT(*) as count FROM images
				`).first();

			const themes = await env.DB.prepare(`
					SELECT COUNT(DISTINCT theme) as count
					FROM (
						SELECT TRIM(value) as theme
						FROM places, json_each('["' || REPLACE(REPLACE(themes, ', ', '","'), ',', '","') || '"]')
						WHERE language = ? AND themes IS NOT NULL AND themes != ''
					)
				`).bind(lang).first();

			return addRateLimitHeaders(jsonResponse({
				totalPlaces: totalPlaces?.count || 0,
				placesWithCoordinates: withCoords?.count || 0,
				provinces: provinces?.count || 0,
				totalImages: totalImages?.count || 0,
				themes: themes?.count || 0,
			}), activeLimit);
		}

		// Default response
		return addRateLimitHeaders(jsonResponse({
			message: 'Canadian Historic Places API',
			version: '1.0.0',
			endpoints: [
				'GET /api/places?lang=en&province=Ontario&limit=50&offset=0',
				'GET /api/places/:id?lang=en',
				'GET /api/search?q=term&lang=en&limit=50',
				'GET /api/map?lang=en&bounds=minLat,minLng,maxLat,maxLng',
				'GET /api/provinces?lang=en',
				'GET /api/stats?lang=en',
			],
		}), activeLimit);

	} catch (error) {
		console.error('API Error:', error);
		return addRateLimitHeaders(jsonResponse({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500), activeLimit);
	}
}
