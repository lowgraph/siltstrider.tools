const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const codecPromise = import('../lib/permalink-codec.mjs');
const sitemapPromise = import('../app/sitemap.js');
const robotsPromise = import('../app/robots.js');

test('decodeShareHash respects defaultView when hash contains no explicit view', async () => {
  const { decodeShareHash } = await codecPromise;

  // Empty hash defaults to defaultView
  const alc = decodeShareHash('', { defaultView: 'alchemy' });
  assert.equal(alc.view, 'alchemy');
  assert.equal(alc.world, 'vanilla');

  // Hash with only world parameters still resolves defaultView
  const trTravel = decodeShareHash('#world=tr&arce=0', { defaultView: 'travel' });
  assert.equal(trTravel.view, 'travel');
  assert.equal(trTravel.world, 'tr');
  assert.equal(trTravel.profile, 'tr');

  // Explicit view in hash overrides defaultView
  const explicitOverride = decodeShareHash('#spellmaking', { defaultView: 'alchemy' });
  assert.equal(explicitOverride.view, 'spellmaking');

  // Explicit #home overrides defaultView
  const homeOverride = decodeShareHash('#home', { defaultView: 'alchemy' });
  assert.equal(homeOverride.view, 'home');
});

test('decodeShareHash adversarial edge cases for defaultView', async () => {
  const { decodeShareHash } = await codecPromise;

  // 1. Unknown or malformed defaultView falls back to 'home'
  assert.equal(decodeShareHash('', { defaultView: 'nonexistent_tool' }).view, 'home');
  assert.equal(decodeShareHash('', { defaultView: null }).view, 'home');
  assert.equal(decodeShareHash('', { defaultView: undefined }).view, 'home');
  assert.equal(decodeShareHash('', { defaultView: 12345 }).view, 'home');
  assert.equal(decodeShareHash('', { defaultView: {} }).view, 'home');

  // 2. Corrupted hash syntax with multiple ampersands and leading question mark
  const corrupted = decodeShareHash('#?&&&world=tr&&&junk=corrupt_payload_data', { defaultView: 'leveler' });
  assert.equal(corrupted.view, 'leveler');
  assert.equal(corrupted.world, 'tr');

  // Payload presence (run= or build=) takes precedence over defaultView
  const runPayload = decodeShareHash('#run=any_data', { defaultView: 'leveler' });
  assert.equal(runPayload.view, 'challenge');
  const buildPayload = decodeShareHash('#build=any_data', { defaultView: 'leveler' });
  assert.equal(buildPayload.view, 'builder');

  // 3. View aliases in hash take precedence over defaultView
  assert.equal(decodeShareHash('#optimizer', { defaultView: 'factions' }).view, 'builder');
  assert.equal(decodeShareHash('#spell', { defaultView: 'builder' }).view, 'spellmaking');
  assert.equal(decodeShareHash('#enchant', { defaultView: 'builder' }).view, 'enchanting');

  // 4. Clean HTML5 pathnames and query strings
  assert.equal(decodeShareHash('/builder').view, 'builder');
  assert.equal(decodeShareHash('/leveler').view, 'leveler');
  assert.equal(decodeShareHash('/alchemy').view, 'alchemy');
  assert.equal(decodeShareHash('/travel').view, 'travel');
  assert.equal(decodeShareHash('/travel?world=tr').world, 'tr');
  assert.equal(decodeShareHash('/challenge?run=any_data').view, 'challenge');
  assert.equal(decodeShareHash('/builder?build=any_data').view, 'builder');
});

test('all static route files exist, force static export, and provide SEO metadata', async () => {
  const routes = [
    'builder',
    'leveler',
    'alchemy',
    'travel',
    'enchanting',
    'spellmaking',
    'factions',
    'challenge',
    'vault',
    'about',
    'changelog',
    'privacy',
    'terms'
  ];

  for (const route of routes) {
    const pagePath = path.resolve(`app/${route}/page.jsx`);
    assert.ok(fs.existsSync(pagePath), `app/${route}/page.jsx must exist`);

    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes("export const dynamic = 'force-static'"), `${route} must export dynamic = 'force-static'`);
    assert.ok(content.includes('metadata = {'), `${route} must export metadata`);
    assert.ok(content.includes(`https://siltstrider.tools/${route}`), `${route} must declare canonical URL`);
  }
});

test('sitemap.js includes all 14 canonical indexable routes with valid priority and changefreq', async () => {
  const { default: sitemap } = await sitemapPromise;
  const entries = sitemap();

  assert.equal(entries.length, 14, 'sitemap must have exactly 14 canonical URLs');

  const expectedUrls = [
    'https://siltstrider.tools/',
    'https://siltstrider.tools/builder',
    'https://siltstrider.tools/leveler',
    'https://siltstrider.tools/alchemy',
    'https://siltstrider.tools/travel',
    'https://siltstrider.tools/spellmaking',
    'https://siltstrider.tools/enchanting',
    'https://siltstrider.tools/factions',
    'https://siltstrider.tools/challenge',
    'https://siltstrider.tools/vault',
    'https://siltstrider.tools/about',
    'https://siltstrider.tools/changelog',
    'https://siltstrider.tools/privacy',
    'https://siltstrider.tools/terms'
  ];

  const actualUrls = entries.map(e => e.url);
  assert.deepEqual(actualUrls, expectedUrls);

  for (const entry of entries) {
    assert.ok(entry.lastModified instanceof Date, `lastModified must be Date for ${entry.url}`);
    assert.ok(['weekly', 'monthly'].includes(entry.changeFrequency), `valid changeFrequency for ${entry.url}`);
    assert.ok(typeof entry.priority === 'number' && entry.priority > 0 && entry.priority <= 1.0, `valid priority for ${entry.url}`);
  }
});

test('robots.js allows all crawling and references sitemap.xml', async () => {
  const { default: robots } = await robotsPromise;
  const config = robots();

  assert.ok(config.rules);
  assert.equal(config.rules.userAgent, '*');
  assert.equal(config.rules.allow, '/');
  assert.equal(config.sitemap, 'https://siltstrider.tools/sitemap.xml');
});
