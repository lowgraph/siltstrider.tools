import { createClerkClient } from '@clerk/backend';

// Fixed canonical v1 fixture. This endpoint accepts no owner or character input.
export const TEST_CHARACTER = Object.freeze({
  version: 1, world: 'vanilla', arce: false,
  race: 'Dark Elf', gender: 'Male', className: 'Custom', sign: 'The Warrior',
  spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Athletics'],
  min: ['Alchemy', 'Alteration', 'Mysticism', 'Restoration', 'Speechcraft'],
});
const json = (data, status) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store' },
});

// Configure DB, APP_ORIGIN, and matching Clerk public/secret keys on the Worker.
// Leave TEST_INSERT_ENABLED unset in production. Never infer APP_ORIGIN from headers.
export async function insertTestCharacter(request, env) {
  if (env.TEST_INSERT_ENABLED !== 'true' || !env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
    return json({ error: 'Not found' }, 404);
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!env.APP_ORIGIN || !env.CLERK_SECRET_KEY || !env.DB) {
    return json({ error: 'Service not configured' }, 503);
  }
  // Explicit bearer authentication avoids cookie-only mutation requests.
  if (!/^Bearer \S+$/i.test(request.headers.get('Authorization') || '')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const origin = request.headers.get('Origin');
  if (origin && origin !== env.APP_ORIGIN) return json({ error: 'Forbidden origin' }, 403);
  let userId;
  try {
    const clerk = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });
    const state = await clerk.authenticateRequest(request, {
      acceptsToken: 'session_token', authorizedParties: [env.APP_ORIGIN],
      ...(env.CLERK_JWT_KEY ? { jwtKey: env.CLERK_JWT_KEY } : {}),
    });
    if (!state.isAuthenticated) return json({ error: 'Unauthorized' }, 401);
    userId = state.toAuth().userId;
    if (!userId) return json({ error: 'Unauthorized' }, 401);
  } catch {
    return json({ error: 'Unauthorized' }, 401);
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO saved_characters
        (id, clerk_user_id, version, name, character_json, revision, created_at, updated_at)
      VALUES (?, ?, 1, ?, ?, 1, ?, ?)
    `).bind(id, userId, 'Authentication test character', JSON.stringify(TEST_CHARACTER), now, now).run();
    return json({ id, version: 1, revision: 1, createdAt: now, updatedAt: now }, 201);
  } catch {
    return json({ error: 'Could not save test character' }, 500);
  }
}
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/api/test-character') {
      return insertTestCharacter(request, env);
    }
    return json({ error: 'Not found' }, 404);
  },
};
