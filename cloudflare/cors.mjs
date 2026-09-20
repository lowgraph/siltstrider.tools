/**
 * Silt Strider Cloudflare API: CORS and JSON Response Helpers
 */

export function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  // When APP_ORIGIN is set, match exact origin or return APP_ORIGIN.
  const allowedOrigin = env?.APP_ORIGIN || origin || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, If-Match, If-None-Match, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export const json = (data, status = 200, extraHeaders = {}) => Response.json(data, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    ...extraHeaders,
  },
});
