/**
 * API Configuration
 *
 * In production, the API is served from the same Worker (no CORS needed)
 * In development, you can point to localhost:8787 for local testing
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const config = {
  apiUrl: API_BASE_URL,

  // API endpoints
  endpoints: {
    places: `${API_BASE_URL}/api/places`,
    place: (id) => `${API_BASE_URL}/api/places/${id}`,
    search: `${API_BASE_URL}/api/search`,
    map: `${API_BASE_URL}/api/map`,
    provinces: `${API_BASE_URL}/api/provinces`,
    filters: `${API_BASE_URL}/api/filters`,
    stats: `${API_BASE_URL}/api/stats`,
  }
};
