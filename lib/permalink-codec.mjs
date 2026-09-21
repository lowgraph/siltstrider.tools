/**
 * Pure ESM permalink codec for Silt Strider.
 * Encodes and decodes URL hash strings representing active view, world mode,
 * ARCE flag, character build payloads, and challenge run payloads.
 *
 * Full bidirectional compatibility with classic URL formats (#TR, #ARCE, #optimizer,
 * #c=..., #r=..., explicit world=/arce= parameters, base64url payloads).
 */

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
  'about',
  'changelog'
]);

export const VIEW_ALIASES = Object.freeze({
  build: 'builder',
  optimizer: 'builder',
  level: 'leveler',
  faction: 'factions',
  enchant: 'enchanting',
  spell: 'spellmaking'
});

/**
 * Universal safe UTF-8 Base64URL encoder.
 * Works seamlessly across modern browser runtimes and Node.js test runners.
 */
export function toBase64Url(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!str) return '';

  if (typeof Buffer !== 'undefined') {
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
    if (typeof Buffer !== 'undefined') {
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
 * Normalizes a view key against known canonical views and aliases.
 */
export function normalizeView(viewKey) {
  if (typeof viewKey !== 'string') return 'home';
  const clean = viewKey.trim().toLowerCase();
  if (KNOWN_VIEWS.includes(clean)) return clean;
  if (VIEW_ALIASES[clean]) return VIEW_ALIASES[clean];
  return 'home';
}

/**
 * Encodes application state into a canonical URL hash string.
 *
 * @param {Object} state
 * @param {string} [state.view='home']
 * @param {string} [state.world='vanilla']
 * @param {boolean} [state.arce=false]
 * @param {string} [state.profile]
 * @param {Object|string|null} [state.build=null]
 * @param {Object|string|null} [state.run=null]
 * @returns {string} URL hash string beginning with '#'
 */
export function encodeShareHash(state) {
  const s = (state && typeof state === 'object') ? state : {};
  const { view = 'home', world = 'vanilla', arce = false, profile, build = null, run = null } = s;
  const canonicalView = normalizeView(view);
  const { world: w, arce: a } = normalizeProfile({ profile, world, arce });

  const parts = [canonicalView];

  if (w === 'tr') parts.push('TR');
  if (a) parts.push('ARCE');

  if (canonicalView === 'challenge' && run) {
    const encodedRun = typeof run === 'string' ? run : toBase64Url(JSON.stringify(run));
    if (encodedRun) parts.push('run=' + encodedRun);
  }

  if (['builder', 'leveler', 'enchanting', 'spellmaking', 'alchemy', 'travel', 'factions'].includes(canonicalView) && build) {
    const encodedBuild = typeof build === 'string' ? build : toBase64Url(JSON.stringify(build));
    if (encodedBuild) parts.push('build=' + encodedBuild);
  }

  // Explicit parameters make links invariant regardless of recipient's local preferences
  parts.push('world=' + w, 'arce=' + (a ? '1' : '0'));

  if (canonicalView === 'home' && parts.length === 3 && w === 'vanilla' && !a) {
    return '#home';
  }

  return canonicalView === 'home' && parts.slice(1).length === 0
    ? '#home'
    : '#' + parts.join('&');
}

/**
 * Decodes a URL hash string into structured application state.
 *
 * @param {string} rawHash
 * @param {Object} [options]
 * @param {string} [options.defaultWorld='vanilla']
 * @param {boolean} [options.defaultArce=false]
 * @returns {Object} { view, world, arce, profile, build, rawBuild, run, rawRun }
 */
export function decodeShareHash(rawHash, options = {}) {
  const hash = (typeof rawHash === 'string' ? rawHash : '').replace(/^#/, '').trim();

  // 1. Extract payload parameters
  const runMatch = hash.match(/[?&#]run=([^&]+)/i);
  const buildMatch = hash.match(/[?&#]build=([^&]+)/i);

  const rawRun = runMatch ? runMatch[1] : null;
  const rawBuild = buildMatch ? buildMatch[1] : null;

  const run = rawRun ? safeJsonParse(fromBase64Url(rawRun)) : null;
  const build = rawBuild ? safeJsonParse(fromBase64Url(rawBuild)) : null;

  // 2. Strip payloads to parse flags and view safely
  const clean = hash.replace(/[?&#](run|build)=[^&]*/gi, '').toLowerCase();

  // 3. World and ARCE detection (explicit parameters take precedence over legacy tokens)
  const explicitWorld = clean.match(/(?:^|[&#])world=(vanilla|tr)(?:&|$)/);
  const explicitArce = clean.match(/(?:^|[&#])arce=([01])(?:&|$)/);

  const legacyTr = /(?:^|[&#])tr(?:&|$)|tamriel/.test(clean);
  const legacyArce = /(?:^|[&#])arce(?:&|$)/.test(clean);

  let w = explicitWorld
    ? explicitWorld[1]
    : (legacyTr || legacyArce ? 'tr' : (options.defaultWorld || 'vanilla'));

  let a = explicitArce
    ? explicitArce[1] === '1'
    : (legacyArce || Boolean(options.defaultArce));

  const { world, arce, profile } = normalizeProfile({ world: w, arce: a });

  // 4. Resolve canonical view
  let view = 'home';
  if (/\benchanting\b|\benchant\b/.test(clean)) {
    view = 'enchanting';
  } else if (/\bspellmaking\b|\bspell\b/.test(clean)) {
    view = 'spellmaking';
  } else if (/\balchemy\b/.test(clean)) {
    view = 'alchemy';
  } else if (/\btravel\b/.test(clean)) {
    view = 'travel';
  } else if (/\bleveler\b|\blevel\b/.test(clean)) {
    view = 'leveler';
  } else if (/\bfactions\b|\bfaction\b/.test(clean)) {
    view = 'factions';
  } else if (/\bvault\b/.test(clean)) {
    view = 'vault';
  } else if (/\babout\b/.test(clean)) {
    view = 'about';
  } else if (/\bchangelog\b/.test(clean)) {
    view = 'changelog';
  } else if (/\b(builder|build|optimizer)\b/.test(clean) || rawBuild) {
    view = 'builder';
  } else if (/challenge/.test(clean) || rawRun) {
    view = 'challenge';
  } else {
    view = 'home';
  }

  return {
    view,
    world,
    arce,
    profile,
    build,
    rawBuild,
    run,
    rawRun
  };
}

/**
 * Resolves profile preference from window hash with localStorage fallback.
 */
export function profileFromLocation(hash, storage) {
  let defaultWorld = 'vanilla';
  let defaultArce = false;

  if (!hash || hash === '#') {
    try {
      if (storage?.getItem('mw-world') === 'tr') defaultWorld = 'tr';
      if (storage?.getItem('mw-arce') === '1') defaultArce = true;
    } catch {}
  }

  const decoded = decodeShareHash(hash, { defaultWorld, defaultArce });
  return decoded.profile;
}
