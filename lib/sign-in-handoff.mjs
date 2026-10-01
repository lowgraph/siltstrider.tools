/**
 * Keeps the builder's character across explicit authentication round trips.
 *
 * Signing in with Google or Discord leaves the site and comes back: a full page load,
 * which resets an unsaved character to the default (on 29 September a TR + ARCE
 * Khajiit came back as the default Dark Elf and was saved that way). The sign-in
 * buttons announce themselves with SIGN_IN_EVENT; the character is kept in this tab's
 * session storage, taken back once on the return if a sign-in actually happened, and
 * deleted either way. An email sign-in happens inside Clerk's window with no reload;
 * the account drops the kept character when it sees that (account-context.jsx). A
 * normal refresh still starts over.
 * Sign-out has its own event and storage key, accepted only on a signed-out
 * return. It expires and is consumed once too; a loaded save uses its existing
 * persistence instead. A failed sign-out discards the marker.
 */
export const SIGN_IN_EVENT = 'silt-before-sign-in';
export const SIGN_OUT_EVENT = 'silt-before-sign-out';
export const HANDOFF_KEY = 'silt-sign-in-character';
export const SIGN_OUT_HANDOFF_KEY = 'silt-sign-out-character';
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
  return takeCharacter(HANDOFF_KEY, signedIn === true, { storage, now });
}

/** A distinct marker: a cancelled sign-in must never look like a sign-out return. */
export function keepCharacterForSignOut(build, { storage, now = Date.now() } = {}) {
  const store = sessionStore(storage);
  if (!store || !build || typeof build !== 'object' || Array.isArray(build)) return false;
  try {
    store.setItem(SIGN_OUT_HANDOFF_KEY, JSON.stringify({ at: now, build }));
    return true;
  } catch {
    return false;
  }
}

export function forgetCharacterForSignOut({ storage } = {}) {
  try { sessionStore(storage)?.removeItem(SIGN_OUT_HANDOFF_KEY); } catch { /* storage blocked */ }
}

/** Restore once, only on a signed-out return within the same expiry as sign-in. */
export function takeCharacterAfterSignOut({ signedIn, storage, now = Date.now() } = {}) {
  return takeCharacter(SIGN_OUT_HANDOFF_KEY, signedIn === false, { storage, now });
}

function takeCharacter(key, allowed, { storage, now }) {
  const store = sessionStore(storage);
  if (!store) return null;
  let raw = null;
  try {
    raw = store.getItem(key);
    store.removeItem(key);
  } catch {
    return null;
  }
  if (!raw || !allowed) return null;
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
