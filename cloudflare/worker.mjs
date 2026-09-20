/**
 * Silt Strider Cloudflare Worker
 *
 * Master entry point hosting the Silt Strider Cloud Save Vault API
 * and serving static assets for the application.
 */

import { authenticateUser } from './auth.mjs';
import { getCorsHeaders, json } from './cors.mjs';
import {
  handleListSaves,
  handleGetSave,
  handleCreateSave,
  handleUpdateSave,
  handleDeleteSave
} from './routes/saves.mjs';
import { handleGetEntitlements } from './routes/entitlements.mjs';
import { insertTestCharacter } from './test-route.mjs';

export {
  authenticateUser,
  handleListSaves,
  handleGetSave,
  handleCreateSave,
  handleUpdateSave,
  handleDeleteSave,
  handleGetEntitlements,
  insertTestCharacter
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
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

    // 2. Development test character endpoint
    if (pathname === '/api/test-character') {
      return insertTestCharacter(request, env);
    }

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
