/**
 * Hand-off from a search result to the tool it opens ("plan a trip to Balmora",
 * "add Bread to Alchemy"). The palette sets an intent and navigates; the tool
 * applies it once its data can take it, then clears it. Intents expire so an
 * unused one cannot fire on a later visit.
 */
const MAX_AGE_MS = 60_000;
const listeners = new Set();
let pending = null;

const emit = () => listeners.forEach(fn => fn());

/** intent: { view, kind, value }. Replaces any intent still pending. */
export function setSearchIntent(intent, now = Date.now()) {
  pending = Object.freeze({ ...intent, at: now });
  emit();
  return pending;
}

export function getSearchIntent() {
  return pending;
}

/** The pending intent for `view`, if it is still fresh. */
export function intentFor(view, intent = pending, now = Date.now()) {
  return intent && intent.view === view && now - intent.at <= MAX_AGE_MS ? intent : null;
}

/** Clears `intent` if it is still the pending one (or anything, when omitted). */
export function clearSearchIntent(intent) {
  if (!pending || (intent && pending !== intent)) return;
  pending = null;
  emit();
}

export function subscribeSearchIntent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
