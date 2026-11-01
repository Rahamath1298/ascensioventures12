/**
 * API client for interacting with backend endpoints.
 */

/**
 * Executes travel query search.
 * @param {string} query - Raw search query text
 * @param {Record<string, unknown>} [overrides={}] - Optional parameter overrides
 * @returns {Promise<Object>} Search response payload
 */
export async function searchTrip(query, overrides = {}) {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, overrides })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches rotating example queries.
 * @returns {Promise<string[]>} List of example queries
 */
export async function fetchExamples() {
  try {
    const res = await fetch('/api/examples');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

/**
 * Fetches server health and AI status.
 * @returns {Promise<Object>} Health response
 */
export async function fetchHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { status: 'down', aiConfigured: false };
    return await res.json();
  } catch (e) {
    return { status: 'error', aiConfigured: false };
  }
}

export default {
  searchTrip,
  fetchExamples,
  fetchHealth
};
