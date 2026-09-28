export const KNOWN_VIEWS = Object.freeze([
  'home',
  'builder',
  'challenge',
  'leveler',
  'factions',
  'enchanting',
  'spellmaking',
  'alchemy',
  'travel',
  'vault',
  'account',
  'about',
  'changelog'
]);

// The Web APIs come first: Next.js gives the browser a Buffer polyfill that has no
// 'base64url' encoding, so a Buffer-first codec threw there. Node has both.
const hasWebBase64 = () => typeof btoa === 'function' && typeof atob === 'function' && typeof TextEncoder !== 'undefined';

/**
 * Universal safe UTF-8 Base64URL encoder.
 * Works seamlessly across modern browser runtimes and Node.js test runners.
 */
export function toBase64Url(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!str) return '';

  if (!hasWebBase64() && typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }

  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Universal safe UTF-8 Base64URL decoder.
 * Returns empty string on corrupted, malformed, or invalid inputs.
 */
export function fromBase64Url(str) {
  if (typeof str !== 'string' || !str.trim()) return '';
  const clean = str.trim();

  try {
    if (!hasWebBase64() && typeof Buffer !== 'undefined') {
      return Buffer.from(clean, 'base64url').toString('utf-8');
    }

    let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Safely parse JSON string with prototype pollution defense.
 */
export function safeJsonParse(jsonString) {
  if (typeof jsonString !== 'string' || !jsonString.trim()) return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(parsed, '__proto__')) {
      delete parsed.__proto__;
    }
    if (Object.prototype.hasOwnProperty.call(parsed, 'constructor')) {
      delete parsed.constructor;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Normalize profile, world, and ARCE choices according to Morrowind rules.
 * ARCE requires Tamriel Rebuilt (world === 'tr').
 */
export function normalizeProfile({ profile, world, arce }) {
  let w = 'vanilla';
  let a = false;

  if (profile === 'tr_arce') {
    w = 'tr';
    a = true;
  } else if (profile === 'tr') {
    w = 'tr';
    a = false;
  } else if (profile === 'vanilla') {
    w = 'vanilla';
    a = false;
  } else {
    w = world === 'tr' ? 'tr' : 'vanilla';
    a = w === 'tr' ? Boolean(arce) : false;
  }

  const p = w === 'tr' ? (a ? 'tr_arce' : 'tr') : 'vanilla';
  return { world: w, arce: a, profile: p };
}

/**
 * Normalizes a view key against known canonical views.
 */
export function normalizeView(viewKey) {
  if (typeof viewKey !== 'string') return 'home';
  const clean = viewKey.trim().toLowerCase();
  if (KNOWN_VIEWS.includes(clean)) return clean;
  return 'home';
}

/** Current share format: a canonical path and explicit query parameters. */
export function encodeShareUrl(state = {}) {
  const view = normalizeView(state.view);
  const { world, arce } = normalizeProfile(state);
  const params = new URLSearchParams({world, arce: arce ? '1' : '0'});
  for (const kind of ['build', 'run']) if (state[kind]) params.set(kind, toBase64Url(JSON.stringify(state[kind])));
  return (view === 'home' ? '/' : '/' + view) + '?' + params;
}

export function decodeShareUrl(raw, options = {}) {
  let url;
  try { url = new URL(typeof raw === 'string' ? raw : '/', 'https://siltstrider.tools/'); }
  catch { url = new URL('https://siltstrider.tools/'); }
  const params = url.searchParams;
  const {world, arce, profile} = normalizeProfile({
    world: params.get('world') ?? options.defaultWorld,
    arce: params.has('arce') ? params.get('arce') === '1' : options.defaultArce,
  });
  const rawBuild = params.get('build'), rawRun = params.get('run');
  const view = normalizeView(url.pathname.replace(/^\/|\/$/g, '') || options.defaultView);
  return {view, world, arce, profile, rawBuild, rawRun,
    build: rawBuild ? safeJsonParse(fromBase64Url(rawBuild)) : null,
    run: rawRun ? safeJsonParse(fromBase64Url(rawRun)) : null};
}
