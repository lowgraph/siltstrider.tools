import { handlePremiumCode, handleKofiWebhook } from './routes/premium.mjs';
import { handleAccount } from './routes/account.mjs';
import { handleSettings } from './routes/settings.mjs';
/**
 * Silt Strider Cloudflare Worker
 *
 * Master entry point hosting the Silt Strider Cloud Save Vault API
 * and serving static assets for the application.
 */

import { authenticateUser } from './auth.mjs';
import { getCorsHeaders, json } from './cors.mjs';
import { withErrorReporting } from './error-reporting.mjs';
import {
  handleListSaves,
  handleGetSave,
  handleCreateSave,
  handleUpdateSave,
  handleDeleteSave
} from './routes/saves.mjs';
import { handleGetEntitlements } from './routes/entitlements.mjs';

export {
  authenticateUser,
  handleListSaves,
  handleGetSave,
  handleCreateSave,
  handleUpdateSave,
  handleDeleteSave,
  handleGetEntitlements
};

// wrangler.jsonc routes only /api/* through this Worker ("run_worker_first"); pages, scripts
// and game data are served straight from the asset store and never invoke it, so they do
// not count against the Worker request allowance. www → apex for those is a Cloudflare
// redirect rule (docs/DEPLOYMENT.md); the redirect below still covers /api/* on www.
const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'www.siltstrider.tools') {
      url.hostname = 'siltstrider.tools';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    const rawPathname = url.pathname;
    const pathname = rawPathname.length > 1 && rawPathname.endsWith('/') ? rawPathname.slice(0, -1) : rawPathname;
    const cors = getCorsHeaders(request, env);

    // 1. CORS Preflight options
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    if (pathname === '/api/webhooks/kofi') return handleKofiWebhook(request, env);

    // 3. API Routes (/api/*)
    if (pathname.startsWith('/api/')) {
      if (!env.DB) {
        return json({ error: 'SERVICE_UNAVAILABLE', message: 'D1 database binding not configured' }, 503, cors);
      }

      // Authenticate via Clerk session token
      const auth = await authenticateUser(request, env);
      if (!auth.authenticated) {
        return auth.response;
      }
      const userId = auth.userId;

      if (pathname === '/api/premium/code') return handlePremiumCode(request, env, userId);
      if (pathname === '/api/account') return handleAccount(request, env, userId);
      if (pathname === '/api/settings') return handleSettings(request, env, userId);

      // Collection route: /api/saves
      if (pathname === '/api/saves') {
        if (request.method === 'GET') {
          return handleListSaves(request, env, userId);
        }
        if (request.method === 'POST') {
          return handleCreateSave(request, env, userId);
        }
        return json({ error: 'METHOD_NOT_ALLOWED', message: `Method ${request.method} not allowed on /api/saves` }, 405, cors);
      }

      // Member route: /api/saves/:id
      const saveMatch = pathname.match(/^\/api\/saves\/([^/?#]+)$/);
      if (saveMatch) {
        const saveId = decodeURIComponent(saveMatch[1]);
        if (request.method === 'GET') {
          return handleGetSave(request, env, userId, saveId);
        }
        if (request.method === 'PUT') {
          return handleUpdateSave(request, env, userId, saveId);
        }
        if (request.method === 'DELETE') {
          return handleDeleteSave(request, env, userId, saveId);
        }
        return json({ error: 'METHOD_NOT_ALLOWED', message: `Method ${request.method} not allowed on /api/saves/:id` }, 405, cors);
      }

      // Entitlements route: /api/entitlements
      if (pathname === '/api/entitlements') {
        if (request.method === 'GET') {
          return handleGetEntitlements(request, env, userId);
        }
        return json({ error: 'METHOD_NOT_ALLOWED', message: `Method ${request.method} not allowed on /api/entitlements` }, 405, cors);
      }

      return json({ error: 'NOT_FOUND', message: 'API endpoint not found' }, 404, cors);
    }

    // 4. Static assets (when running in Cloudflare with Assets binding)
    if (env?.ASSETS?.fetch) {
      return env.ASSETS.fetch(request);
    }

    return json({ error: 'NOT_FOUND', message: 'Resource not found' }, 404, cors);
  }
};

export default { fetch: withErrorReporting(worker.fetch) };
