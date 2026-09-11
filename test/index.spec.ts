import { env, SELF } from 'cloudflare:test';
import { beforeAll, describe, it, expect } from 'vitest';

beforeAll(async () => {
	await env.DB.exec(`CREATE TABLE places (id INTEGER, language TEXT, name TEXT, province TEXT, municipality TEXT, latitude REAL, longitude REAL, description TEXT, recognition_type TEXT, jurisdiction TEXT, recognition_date TEXT, architect TEXT, themes TEXT, PRIMARY KEY (id, language));
CREATE TABLE images (place_id INTEGER, r2_url TEXT, display_order INTEGER, alt TEXT, title TEXT);`);
});

describe('Canadian Historic Places API', () => {
	it('GET /api/stats returns statistics structure', async () => {
		const request = new Request('http://example.com/api/stats');
		// Use SELF for integration style testing which goes through the worker's fetch handler
		const response = await SELF.fetch(request);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('totalPlaces');
		expect(data).toHaveProperty('placesWithCoordinates');
		expect(data).toHaveProperty('provinces');
		expect(data).toHaveProperty('themes');
	});

	it('GET /api/places returns empty list when DB is empty', async () => {
		const request = new Request('http://example.com/api/places?limit=10');
		const response = await SELF.fetch(request);
		expect(response.status).toBe(200);

		const data = await response.json<{ places: unknown[] }>();
		expect(data).toHaveProperty('places');
		expect(Array.isArray(data.places)).toBe(true);
	});

	it('GET /api/search returns valid structure', async () => {
		const request = new Request('http://example.com/api/search?q=ottawa');
		const response = await SELF.fetch(request);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('results');
		expect(data).toHaveProperty('count');
		expect(data).toHaveProperty('total');
	});

	it('GET / unknown route returns index.html (SPA)', async () => {
		const request = new Request('http://example.com/some-random-page');
		const response = await SELF.fetch(request);
		expect(response.status).toBe(200);
		// Check headers to ensure it's HTML, not JSON
		expect(response.headers.get('Content-Type')).toContain('text/html');
	});

	it('Rate limiter headers are present with global limit on non-data endpoint', async () => {
		const request = new Request('http://example.com/api/provinces');
		const response = await SELF.fetch(request);
		expect(response.headers.get('X-RateLimit-Limit')).toBe('30');
		expect(response.headers.get('X-RateLimit-Remaining')).toBe('29');
	});

	it('Data endpoints report the tighter per-endpoint rate limit', async () => {
		const request = new Request('http://example.com/api/search?q=test');
		const response = await SELF.fetch(request);
		expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
		expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
	});

	it('returns every map location beyond the first 500, including within bounds', async () => {
		await env.DB.exec(`WITH RECURSIVE ids(id) AS (SELECT 1 UNION ALL SELECT id + 1 FROM ids WHERE id < 13001) INSERT INTO places (id, language, name, latitude, longitude) SELECT id, 'en', 'Place ' || id, 45, -63 FROM ids;`);
		for (const suffix of ['', '&bounds=44,-64,46,-62']) {
			const response = await SELF.fetch(`http://example.com/api/map?lang=en${suffix}`);
			expect(response.status).toBe(200);
			const data = await response.json<{ places: { id: number }[]; count: number }>();
			expect(data.count).toBe(13001);
			expect(data.places).toHaveLength(13001);
			expect(new Set(data.places.map(place => place.id)).size).toBe(13001);
			expect(data.places).toContainEqual(expect.objectContaining({ id: 13001 }));
		}
	});

	it('filters map locations by language, coordinates, and bounds', async () => {
		await env.DB.exec(`INSERT INTO places (id, language, name, latitude, longitude) VALUES (1, 'en', 'Halifax', 44.65, -63.57), (1, 'fr', 'Halifax FR', 44.65, -63.57), (2, 'en', 'Ottawa', 45.42, -75.7), (3, 'en', 'No latitude', NULL, -63), (4, 'en', 'No longitude', 45, NULL);`);
		const english = await SELF.fetch('http://example.com/api/map');
		expect(await english.json()).toMatchObject({ count: 2 });
		const french = await SELF.fetch('http://example.com/api/map?lang=fr');
		expect(await french.json()).toMatchObject({ count: 1, places: [{ name: 'Halifax FR' }] });
		const bounded = await SELF.fetch('http://example.com/api/map?bounds=44,-64,45,-63');
		expect(await bounded.json()).toMatchObject({ count: 1, places: [{ name: 'Halifax' }] });
		const empty = await SELF.fetch('http://example.com/api/map?bounds=0,0,1,1');
		expect(await empty.json()).toEqual({ count: 0, places: [] });
	});

	it('serves filters and statistics for recovered comma-separated themes', async () => {
		await env.DB.batch([
			env.DB.prepare('INSERT INTO places (id, language, themes) VALUES (?, ?, ?)').bind(1, 'en', 'Developing Economies, Trade and Commerce'),
			env.DB.prepare('INSERT INTO places (id, language, themes) VALUES (?, ?, ?)').bind(2, 'en', 'Trade and Commerce,The "Modern" Era'),
		]);
		const filters = await SELF.fetch('http://example.com/api/filters');
		expect(filters.status).toBe(200);
		const data = await filters.json<{ themes: { theme: string; count: number }[] }>();
		expect(data.themes).toHaveLength(3);
		expect(data.themes).toEqual(expect.arrayContaining([
			{ theme: 'Developing Economies', count: 1 },
			{ theme: 'The "Modern" Era', count: 1 },
			{ theme: 'Trade and Commerce', count: 2 },
		]));
		const stats = await SELF.fetch('http://example.com/api/stats');
		expect(stats.status).toBe(200);
		expect(await stats.json()).toMatchObject({ totalPlaces: 2, themes: 3 });
	});

	it('enforces the data rate limit on the map endpoint', async () => {
		const options = { headers: { 'CF-Connecting-IP': '192.0.2.10' } };
		for (let i = 0; i < 10; i++) {
			expect((await SELF.fetch('http://example.com/api/map', options)).status).toBe(200);
		}
		const limited = await SELF.fetch('http://example.com/api/map', options);
		expect(limited.status).toBe(429);
		expect(limited.headers.get('Retry-After')).toBe('60');
	});
});
