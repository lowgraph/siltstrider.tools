const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const TOOL_VIEWS = ['builder', 'leveler', 'alchemy', 'enchanting', 'spellmaking', 'travel', 'factions', 'challenge', 'vault', 'about', 'changelog'];

test('each tool heading is rendered first inside <main>, for the view on screen', async () => {
  const { VIEW_HEADINGS } = await import('../lib/view-headings.mjs');
  assert.deepEqual(Object.keys(VIEW_HEADINGS).sort(), [...TOOL_VIEWS].sort(), 'one heading per tool view, none for home or account');
  for (const [view, heading] of Object.entries(VIEW_HEADINGS)) {
    assert.ok(heading.length > 10 && heading === heading.trim(), `${view} has a real heading`);
    assert.doesNotMatch(heading, /&amp;|<|>/, `${view} heading is text, not markup`);
  }
  const shell = read('components/app-shell.jsx');
  const main = shell.indexOf('<main id="main-content"');
  const firstChild = shell.slice(shell.indexOf('>', main) + 1).trimStart();
  assert.ok(firstChild.startsWith('{VIEW_HEADINGS[activeView] && <h1 className="sr-only">{VIEW_HEADINGS[activeView]}</h1>}'),
    'the heading is the first thing in <main>, so the skip link lands on it');
  assert.equal(new Set(Object.values(VIEW_HEADINGS)).size, TOOL_VIEWS.length, 'no two views share a heading');
});

test('an unknown address gets a real page: landmark, heading, a way back, and noindex', () => {
  const page = read('app/not-found.jsx');
  assert.match(page, /<main id="main-content" tabIndex=\{-1\}/, 'the skip link has a target');
  assert.equal((page.match(/<h1>/g) || []).length, 1);
  assert.match(page, /<a href="\/">/, 'a link home');
  assert.match(page, /title: 'Page not found'/);
  assert.match(page, /robots: \{ index: false/);
});

test('every asset response carries the security headers, and none that could break sign-in', () => {
  const lines = read('public/_headers').split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'));
  assert.equal(lines[0], '/*', 'one rule for every path');
  const headers = Object.fromEntries(lines.slice(1).map(line => {
    assert.match(line, /^ {2}[A-Za-z-]+: \S/, `"${line}" is an indented header line`);
    const at = line.indexOf(':');
    return [line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim()];
  }));
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['content-security-policy'], "frame-ancestors 'none'", 'framing only: a script-src would need Clerk and the analytics beacon tested first');
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.match(headers['strict-transport-security'], /^max-age=\d{7,}$/, 'HSTS for this host only: no includeSubDomains or preload');
  assert.doesNotMatch(headers['permissions-policy'], /clipboard|fullscreen/, 'features the tools use stay allowed');
});
