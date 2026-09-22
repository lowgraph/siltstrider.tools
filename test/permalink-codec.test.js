const { test } = require('node:test');
const assert = require('node:assert/strict');

const modulePromise = import('../lib/permalink-codec.mjs');

test('toBase64Url and fromBase64Url correctly round-trip UTF-8 strings', async () => {
  const { toBase64Url, fromBase64Url } = await modulePromise;

  const samples = [
    'hello',
    'Morrowind Build Planner',
    'Dunmer · Redoran · Tribunal Temple',
    'Special characters: !@#$%^&*()_+-=[]{}|;:",.<>?/`~',
    'Unicode: ⚔️ 🛡️ 📜 🗡️',
    '{"race":"Dark Elf","className":"Assassin","sign":"The Lady"}'
  ];

  for (const s of samples) {
    const encoded = toBase64Url(s);
    assert.ok(!encoded.includes('+'), `encoded should not contain +: ${encoded}`);
    assert.ok(!encoded.includes('/'), `encoded should not contain /: ${encoded}`);
    assert.ok(!encoded.includes('='), `encoded should not contain =: ${encoded}`);
    const decoded = fromBase64Url(encoded);
    assert.equal(decoded, s);
  }
});

test('encodeShareHash and decodeShareHash round-trip all 12 canonical views', async () => {
  const { KNOWN_VIEWS, encodeShareHash, decodeShareHash } = await modulePromise;

  assert.equal(KNOWN_VIEWS.length, 12);

  for (const view of KNOWN_VIEWS) {
    const hash = encodeShareHash({ view, world: 'vanilla', arce: false });
    assert.ok(hash.startsWith('#'), `hash should start with #: ${hash}`);

    const decoded = decodeShareHash(hash);
    assert.equal(decoded.view, view, `view mismatch for ${view}`);
    assert.equal(decoded.world, 'vanilla');
    assert.equal(decoded.arce, false);
    assert.equal(decoded.profile, 'vanilla');
  }
});

test('decodeShareHash normalizes view aliases correctly', async () => {
  const { decodeShareHash } = await modulePromise;

  assert.equal(decodeShareHash('#optimizer').view, 'builder');
  assert.equal(decodeShareHash('#build').view, 'builder');
  assert.equal(decodeShareHash('#level').view, 'leveler');
  assert.equal(decodeShareHash('#faction').view, 'factions');
  assert.equal(decodeShareHash('#enchant').view, 'enchanting');
  assert.equal(decodeShareHash('#spell').view, 'spellmaking');
});

test('profile normalization respects Morrowind rules and handles legacy tokens', async () => {
  const { encodeShareHash, decodeShareHash } = await modulePromise;

  // 1. Vanilla
  const vHash = encodeShareHash({ view: 'builder', profile: 'vanilla' });
  const vDecoded = decodeShareHash(vHash);
  assert.equal(vDecoded.world, 'vanilla');
  assert.equal(vDecoded.arce, false);
  assert.equal(vDecoded.profile, 'vanilla');

  // 2. Tamriel Rebuilt
  const trHash = encodeShareHash({ view: 'builder', profile: 'tr' });
  const trDecoded = decodeShareHash(trHash);
  assert.equal(trDecoded.world, 'tr');
  assert.equal(trDecoded.arce, false);
  assert.equal(trDecoded.profile, 'tr');
  assert.ok(trHash.includes('TR') || trHash.includes('world=tr'));

  // 3. TR + ARCE
  const arceHash = encodeShareHash({ view: 'builder', profile: 'tr_arce' });
  const arceDecoded = decodeShareHash(arceHash);
  assert.equal(arceDecoded.world, 'tr');
  assert.equal(arceDecoded.arce, true);
  assert.equal(arceDecoded.profile, 'tr_arce');

  // 4. Legacy hash tokens (#TR and #ARCE)
  const legacy1 = decodeShareHash('#challenge&TR');
  assert.equal(legacy1.world, 'tr');
  assert.equal(legacy1.arce, false);
  assert.equal(legacy1.profile, 'tr');

  const legacy2 = decodeShareHash('#home&TR&ARCE');
  assert.equal(legacy2.world, 'tr');
  assert.equal(legacy2.arce, true);
  assert.equal(legacy2.profile, 'tr_arce');

  // 5. Rule: ARCE is disallowed on Vanilla world (remains Vanilla, arce false)
  const invalidCombo = decodeShareHash('#builder&world=vanilla&arce=1');
  assert.equal(invalidCombo.world, 'vanilla');
  assert.equal(invalidCombo.arce, false);
  assert.equal(invalidCombo.profile, 'vanilla');
});

test('build and run payloads encode and decode cleanly', async () => {
  const { encodeShareHash, decodeShareHash } = await modulePromise;

  // Build payload
  const buildPayload = {
    v: 1,
    race: 'Dark Elf',
    gender: 'Male',
    className: 'Custom',
    sign: 'The Lady',
    spec: 'Stealth',
    fav1: 'Agility',
    fav2: 'Endurance',
    maj: ['Short Blade', 'Marksman', 'Sneak', 'Light Armor', 'Security'],
    min: ['Acrobatics', 'Athletics', 'Alchemy', 'Mercantile', 'Speechcraft']
  };

  const buildHash = encodeShareHash({ view: 'builder', world: 'tr', arce: false, build: buildPayload });
  assert.ok(buildHash.includes('build='));
  const buildDecoded = decodeShareHash(buildHash);
  assert.equal(buildDecoded.view, 'builder');
  assert.equal(buildDecoded.world, 'tr');
  assert.deepEqual(buildDecoded.build, buildPayload);

  // Challenge run payload
  const runPayload = {
    race: 'Nord',
    gender: 'Female',
    sign: 'The Warrior',
    cls: 'Barbarian',
    major: 'Defeat Dagoth Ur without armor',
    minors: ['Collect 5 glass weapons', 'Never barter with Telvanni'],
    rests: ['No alchemy']
  };

  const runHash = encodeShareHash({ view: 'challenge', run: runPayload });
  assert.ok(runHash.includes('run='));
  const runDecoded = decodeShareHash(runHash);
  assert.equal(runDecoded.view, 'challenge');
  assert.deepEqual(runDecoded.run, runPayload);
});

// ---------------------------------------------------------------------------
// Adversarial QA Test Suites
// ---------------------------------------------------------------------------

test('Adversarial QA 1: Corrupted, invalid, and malformed Base64 payloads', async () => {
  const { decodeShareHash, fromBase64Url } = await modulePromise;

  // 1. fromBase64Url on non-strings
  assert.equal(fromBase64Url(null), '');
  assert.equal(fromBase64Url(undefined), '');
  assert.equal(fromBase64Url(12345), '');
  assert.equal(fromBase64Url({}), '');

  // 2. Corrupted Base64 in build parameter
  const badB64 = decodeShareHash('#builder&build=%%%NOT_BASE64@@@&world=tr');
  assert.equal(badB64.view, 'builder');
  assert.equal(badB64.world, 'tr');
  assert.equal(badB64.build, null);
  assert.equal(badB64.rawBuild, '%%%NOT_BASE64@@@');

  // 3. Valid Base64 but corrupted JSON
  const corruptedJsonB64 = Buffer.from('{"race":"Dark Elf", className: INVALID_JSON}', 'utf-8').toString('base64url');
  const badJson = decodeShareHash(`#builder&build=${corruptedJsonB64}`);
  assert.equal(badJson.view, 'builder');
  assert.equal(badJson.build, null);
  assert.equal(badJson.rawBuild, corruptedJsonB64);

  // 4. Valid Base64 containing non-object JSON (primitive number)
  const numberB64 = Buffer.from('42', 'utf-8').toString('base64url');
  const numberPayload = decodeShareHash(`#builder&build=${numberB64}`);
  assert.equal(numberPayload.build, null);
});

test('Adversarial QA 2: Injection, prototype pollution defense, and XSS containment', async () => {
  const { decodeShareHash, safeJsonParse } = await modulePromise;

  // 1. Prototype pollution attempt in payload
  const pollutionPayload = JSON.stringify({
    __proto__: { polluted: 'YES' },
    constructor: { prototype: { admin: true } },
    race: 'Breton',
    className: 'Mage'
  });
  const parsed = safeJsonParse(pollutionPayload);
  assert.equal(Object.prototype.polluted, undefined, 'Object.prototype must not be polluted');
  assert.equal(({}).admin, undefined, 'Object prototype admin must not be polluted');
  assert.equal(parsed.race, 'Breton');
  assert.equal(parsed.className, 'Mage');

  // 2. URI component / XSS tag injection in view and flags
  const injectedHash = '#<script>alert(1)</script>&world=<svg onload=alert(2)>&arce=true';
  const decoded = decodeShareHash(injectedHash);
  // View should safely fall back to canonical home
  assert.equal(decoded.view, 'home');
  assert.equal(decoded.world, 'vanilla');
  assert.equal(decoded.arce, false);

  // 3. Excess unknown query keys
  const noisyHash = '#factions&foo=bar&baz=123&__proto__=evil&world=tr&arce=0';
  const noisyDecoded = decodeShareHash(noisyHash);
  assert.equal(noisyDecoded.view, 'factions');
  assert.equal(noisyDecoded.world, 'tr');
  assert.equal(noisyDecoded.arce, false);
});

test('Adversarial QA 3: Extreme boundary conditions and stress inputs', async () => {
  const { encodeShareHash, decodeShareHash } = await modulePromise;

  // 1. Empty, null, undefined, or bare hashes
  assert.equal(decodeShareHash(null).view, 'home');
  assert.equal(decodeShareHash(undefined).view, 'home');
  assert.equal(decodeShareHash('').view, 'home');
  assert.equal(decodeShareHash('#').view, 'home');
  assert.equal(decodeShareHash('   ###   ').view, 'home');

  // 2. Repeated separators and junk hashes
  const repeated = decodeShareHash('####builder&&&&world=tr&&&&arce=1&&&&');
  assert.equal(repeated.view, 'builder');
  assert.equal(repeated.world, 'tr');
  assert.equal(repeated.arce, true);

  // 3. Uppercase and mixed case views
  assert.equal(decodeShareHash('#BUILDER').view, 'builder');
  assert.equal(decodeShareHash('#CHALLENGE&WORLD=TR').view, 'challenge');
  assert.equal(decodeShareHash('#FACTIONS').view, 'factions');
  assert.equal(decodeShareHash('#TRAVEL').view, 'travel');

  // 4. Oversized input (50,000 characters)
  const hugeHash = '#home&padding=' + 'a'.repeat(50000);
  const hugeDecoded = decodeShareHash(hugeHash);
  assert.equal(hugeDecoded.view, 'home');
  assert.equal(hugeDecoded.world, 'vanilla');

  // 5. encodeShareHash with empty or invalid object
  assert.equal(encodeShareHash({}), '#home');
  assert.equal(encodeShareHash(null), '#home');
  assert.equal(encodeShareHash({ view: 'unknown_view' }), '#home');
});

test('links encode and decode in browsers, whose Buffer polyfill has no base64url', async () => {
  const { toBase64Url, fromBase64Url, encodeShareHash, decodeShareHash } = await modulePromise;
  const run = { race: 'Dark Elf', rests: ['No fast travel of any kind — walk everywhere'], minors: [{ kind: 'ACTION', text: "Ald'ruhn · Ghostgate" }] };
  const nodeEncoded = toBase64Url(JSON.stringify(run));
  const realBuffer = globalThis.Buffer;
  // What Next.js ships to the browser: a Buffer that rejects the 'base64url' encoding.
  globalThis.Buffer = {
    from: (value, encoding) => {
      if (encoding === 'base64url') throw new TypeError('Unknown encoding: base64url');
      return { toString: (enc) => { if (enc === 'base64url') throw new TypeError('Unknown encoding: base64url'); return realBuffer.from(value).toString(enc); } };
    }
  };
  try {
    assert.equal(toBase64Url(JSON.stringify(run)), nodeEncoded, 'the same link text either way');
    const hash = encodeShareHash({ view: 'challenge', world: 'tr', run });
    assert.deepEqual(decodeShareHash(hash).run, run);
    assert.equal(fromBase64Url(nodeEncoded), JSON.stringify(run));
  } finally {
    globalThis.Buffer = realBuffer;
  }
});
