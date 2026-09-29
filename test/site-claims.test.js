const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
// Claims the launch copy dropped as unverified or broader than the truth (docs/LAUNCH_POSTS.md).
const REMOVED = [
  /inter-faction (standing|conflicts?)/i,
  /verified (engine|openmw|against)/i,
  /engine mechanics verified/i,
  /exact (potions?|brew|engine)/i,
  /absolute (engine )?parity/i,
  /every formula verified/i,
  /zero[- ]tracking/i
];

function files(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) files(rel, out);
    else if (/\.(jsx|mjs|js)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('no page, card or search description repeats a claim the launch copy removed', () => {
  // Past changelog entries are history and stay as written.
  const sources = [...files('app'), ...files('components'), 'lib/home-data.mjs', 'lib/seo-breadcrumbs.mjs', 'lib/view-headings.mjs']
    .filter(file => !file.endsWith(path.join('views', 'changelog-view.jsx')));
  assert.ok(sources.length > 50, 'the scan covers the site');
  const hits = [];
  for (const file of sources) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const claim of REMOVED) if (claim.test(text)) hits.push(`${file}: ${text.match(claim)[0]}`);
  }
  assert.deepEqual(hits, []);
});

test('structured data describes the source of the maths without claiming to have verified it', async () => {
  const { TOOL_SCHEMAS, TOOL_FAQS } = await import('../lib/seo-breadcrumbs.mjs');
  const text = JSON.stringify({ TOOL_SCHEMAS, TOOL_FAQS });
  assert.doesNotMatch(text, /\bverified\b/i);
  assert.doesNotMatch(text, /\bexact\b/i);
  assert.match(TOOL_SCHEMAS.alchemy.featureList.join(' '), /OpenMW 0\.51\.0 mwmechanics/, 'the source is still named');
  assert.ok(TOOL_SCHEMAS.factions.featureList.some(f => /faction reactions/.test(f)), 'the Journal\'s real feature is described as what it is');
});

test('the Faction Journal no longer puts a fixed number on how reactions move disposition', () => {
  const view = fs.readFileSync(path.join(ROOT, 'components', 'journal-factions', 'faction-detail-view.jsx'), 'utf8');
  assert.doesNotMatch(view, /disposition by up to ±?\d/, 'the effect scales with rank, so no single range');
  assert.match(view, /larger effect at higher ranks/);
  assert.match(view, />\s*Inter-Faction Relations\s*</, 'the section keeps its accurate heading');
  assert.doesNotMatch(view, /Diplomatic Standing/);
});
