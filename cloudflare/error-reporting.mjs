import { getCorsHeaders, json } from './cors.mjs';

const API_ROUTES = new Set(['/api/saves', '/api/account', '/api/entitlements', '/api/premium/code', '/api/webhooks/kofi']);
const METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']);

function routeLabel(request) {
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  if (API_ROUTES.has(path)) return path;
  if (/^\/api\/saves\/[^/]+$/.test(path)) return '/api/saves/:id';
  return path.startsWith('/api/') ? '/api/other' : 'assets';
}

/** Record both rejected handlers and handled 5xx responses without logging payloads. */
export function withErrorReporting(handler) {
  return async (request, env, ctx) => {
    const started = Date.now();
    let response;
    let failure = 'http';
    try {
      response = await handler(request, env, ctx);
      if (response.status < 500) return response;
    } catch {
      // Exception messages/stacks can contain SQL values, save names, or tokens.
      failure = 'exception';
    }

    const requestId = crypto.randomUUID();
    const status = response?.status ?? 500;
    console.error({
      event: 'request_failed',
      requestId,
      route: routeLabel(request),
      method: METHODS.has(request.method) ? request.method : 'OTHER',
      status,
      failure,
      durationMs: Math.max(0, Date.now() - started),
    });
    // Discard any database diagnostics in the original response, including streams.
    try { await response?.body?.cancel(); } catch { /* Already closed. */ }
    const message = `The service could not complete this request. Please try again. Reference: ${requestId}`;
    const headers = { ...getCorsHeaders(request, env), 'X-Request-Id': requestId, 'Access-Control-Expose-Headers': 'X-Request-Id' };
    if (response?.headers.has('Retry-After')) headers['Retry-After'] = response.headers.get('Retry-After');
    if (request.method === 'HEAD') return new Response(null, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
    return json({ error: status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR', message, requestId }, status, headers);
  };
}
