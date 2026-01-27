import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

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

		const data = await response.json();
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

	it('Rate limiter headers are present', async () => {
		const request = new Request('http://example.com/api/provinces');
		const response = await SELF.fetch(request);
		expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
		expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
	});
});
