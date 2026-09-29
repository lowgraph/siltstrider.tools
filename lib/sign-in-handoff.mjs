/**
 * Keeps the builder's character across a sign-in round trip, and nothing else.
 *
 * Signing in with Google or Discord leaves the site and comes back: a full page load,
 * which resets an unsaved character to the default (on 29 September a TR + ARCE
 * Khajiit came back as the default Dark Elf and was saved that way). The sign-in
 * buttons announce themselves with SIGN_IN_EVENT; the character is kept in this tab's
 * session storage, taken back once on the return if a sign-in actually happened, and
 * deleted either way. An email sign-in happens inside Clerk's window with no reload;
 * the account drops the kept character when it sees that (account-context.jsx). A
 * normal refresh still starts over.
 */
export const SIGN_IN_EVENT = 'silt-before-sign-in';
export const HANDOFF_KEY = 'silt-sign-in-character';
export const HANDOFF_MAX_AGE_MS = 15 * 60 * 1000;

function sessionStore(storage) {
  if (storage !== undefined) return storage;
  try { return (globalThis.window ?? globalThis).sessionStorage ?? null; } catch { return null; }
}

/** Remember the character for the round trip. Silent when storage is unavailable. */
export function keepCharacterForSignIn(build, { storage, now = Date.now() } = {}) {
  const store = sessionStore(storage);
  if (!store || !build || typeof build !== 'object') return false;
  try {
    store.setItem(HANDOFF_KEY, JSON.stringify({ at: now, build }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Drop the kept character without using it: signing in with email happens inside
 * Clerk's window, with no reload, so there is nothing to restore and nothing should
 * outlive the sign-in.
 */
export function forgetCharacterForSignIn({ storage } = {}) {
  const store = sessionStore(storage);
  try { store?.removeItem(HANDOFF_KEY); } catch { /* storage blocked: nothing kept */ }
}

/**
 * The character kept before signing in, or null. Always removes what was kept: it is
 * given back only once, only when the return found a signed-in session, and only
 * within HANDOFF_MAX_AGE_MS, so a cancelled sign-in or a later refresh never brings
 * an old character back.
 */
export function takeCharacterAfterSignIn({ signedIn, storage, now = Date.now() } = {}) {
  const store = sessionStore(storage);
  if (!store) return null;
  let raw = null;
  try {
    raw = store.getItem(HANDOFF_KEY);
    store.removeItem(HANDOFF_KEY);
  } catch {
    return null;
  }
  if (!raw || !signedIn) return null;
  try {
    const { at, build } = JSON.parse(raw);
    const fresh = Number.isFinite(at) && now - at >= 0 && now - at <= HANDOFF_MAX_AGE_MS;
    const whole = build && typeof build === 'object' && !Array.isArray(build)
      && typeof build.race === 'string' && build.race && typeof build.sign === 'string' && build.sign;
    return fresh && whole ? build : null;
  } catch {
    return null;
  }
}
