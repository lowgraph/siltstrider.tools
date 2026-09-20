/**
 * Silt Strider Cloudflare API: Entitlements Route
 *
 * Implements:
 * - GET /api/entitlements (Fetch user tier quotas and current consumption from v_user_entitlements)
 */

import { json, getCorsHeaders } from '../cors.mjs';

export async function handleGetEntitlements(request, env, userId) {
  const cors = getCorsHeaders(request, env);

  try {
    const row = await env.DB.prepare(`
      SELECT
        tier, max_saves, max_loadouts, max_challenges,
        current_saves, current_loadouts, current_challenges
      FROM v_user_entitlements
      WHERE clerk_user_id = ?
    `).bind(userId).first();

    if (row) {
      const tier = row.tier || 'free';
      const maxSaves = row.max_saves ?? 5;
      const maxLoadouts = row.max_loadouts ?? 5;
      const maxChallenges = row.max_challenges ?? 5;
      const currentSaves = row.current_saves ?? 0;
      const currentLoadouts = row.current_loadouts ?? 0;
      const currentChallenges = row.current_challenges ?? 0;

      return json({
        tier,
        maxSaves,
        max_saves: maxSaves,
        maxLoadouts,
        max_loadouts: maxLoadouts,
        maxChallenges,
        max_challenges: maxChallenges,
        currentSaves,
        current_saves: currentSaves,
        currentLoadouts,
        current_loadouts: currentLoadouts,
        currentChallenges,
        current_challenges: currentChallenges,
        remainingSaves: Math.max(0, maxSaves - currentSaves),
        remaining_saves: Math.max(0, maxSaves - currentSaves),
        remainingLoadouts: Math.max(0, maxLoadouts - currentLoadouts),
        remaining_loadouts: Math.max(0, maxLoadouts - currentLoadouts),
        remainingChallenges: Math.max(0, maxChallenges - currentChallenges),
        remaining_challenges: Math.max(0, maxChallenges - currentChallenges),
      }, 200, cors);
    }

    // Default to Free tier if user has no row in user_tiers table yet
    const counts = await env.DB.prepare(`
      SELECT
        (SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?) AS current_saves,
        (SELECT count(*) FROM saved_loadouts WHERE clerk_user_id = ?) AS current_loadouts,
        (SELECT count(*) FROM saved_challenges WHERE clerk_user_id = ?) AS current_challenges
    `).bind(userId, userId, userId).first();

    const currentSaves = counts?.current_saves ?? 0;
    const currentLoadouts = counts?.current_loadouts ?? 0;
    const currentChallenges = counts?.current_challenges ?? 0;
    const maxSaves = 5;
    const maxLoadouts = 5;
    const maxChallenges = 5;

    return json({
      tier: 'free',
      maxSaves,
      max_saves: maxSaves,
      maxLoadouts,
      max_loadouts: maxLoadouts,
      maxChallenges,
      max_challenges: maxChallenges,
      currentSaves,
      current_saves: currentSaves,
      currentLoadouts,
      current_loadouts: currentLoadouts,
      currentChallenges,
      current_challenges: currentChallenges,
      remainingSaves: Math.max(0, maxSaves - currentSaves),
      remaining_saves: Math.max(0, maxSaves - currentSaves),
      remainingLoadouts: Math.max(0, maxLoadouts - currentLoadouts),
      remaining_loadouts: Math.max(0, maxLoadouts - currentLoadouts),
      remainingChallenges: Math.max(0, maxChallenges - currentChallenges),
      remaining_challenges: Math.max(0, maxChallenges - currentChallenges),
    }, 200, cors);
  } catch (err) {
    return json({ error: 'DATABASE_ERROR', message: 'Failed to fetch user entitlements: ' + (err?.message || 'unknown error') }, 500, cors);
  }
}
