const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the Privacy Policy discloses cookies, browser storage and analytics', () => {
  const policy = read('app/privacy/page.jsx');
  assert.match(policy, /Cookies, local files and browser storage/);
  assert.match(policy, /no advertising or tracking cookies/);
  assert.match(policy, /loaded only when you choose to sign in, or when the browser is already signed in/);
  assert.match(policy, /Visiting the tools without signing in sets no cookies/);
  assert.match(policy, /Cloudflare Web Analytics/);
  assert.match(policy, /sets no cookies and stores nothing in your browser/);
  assert.match(policy, /provides its page-view analytics/);
});

test('each legal page states its own revision date', () => {
  assert.match(read('app/privacy/page.jsx'), /<LegalPage title="Privacy Policy" updated="September 29, 2026">/);
  assert.doesNotMatch(read('app/terms/page.jsx'), /updated=/, 'the Terms did not change');
  assert.match(read('components/legal-page.jsx'), /updated = 'September 26, 2026'/);
  assert.match(read('components/legal-page.jsx'), /Last updated: \{updated\}/);
});
