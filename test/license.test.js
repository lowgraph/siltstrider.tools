const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the site is licensed AGPL-3.0-or-later, and says so everywhere it is declared', () => {
  const license = read('LICENSE');
  assert.match(license, /^\s*GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3, 19 November 2007/);
  assert.match(license, /END OF TERMS AND CONDITIONS/, 'the full text, not a stub');
  assert.equal(JSON.parse(read('package.json')).license, 'AGPL-3.0-or-later');
  const readme = read('README.md');
  assert.match(readme, /## Licence[\s\S]*GNU Affero General Public License[\s\S]*AGPL-3\.0-or-later/);
});

test('the licence section keeps out what is not ours to license', () => {
  const section = read('README.md').split('## Licence')[1] || '';
  assert.match(section, /Pelagiad[\s\S]*SIL Open\s+Font License 1\.1/, 'the font keeps its own licence');
  assert.match(section, /Bethesda Softworks/);
  assert.match(section, /Tamriel Rebuilt, Project Tamriel and ARCE/);
  assert.match(section, /name, logo and social card image\*\*, which are not licensed/);
  assert.match(read('app/globals.css'), /SIL Open Font License, Version 1\.1/, 'the OFL notice still ships with the font');
});

test('"open source" is only claimed while the licence file is there', () => {
  const claims = [read('app/about/page.jsx'), read('lib/seo-breadcrumbs.mjs')].join('\n');
  if (/open[- ]source/i.test(claims)) {
    assert.ok(fs.existsSync(path.join(ROOT, 'LICENSE')), 'an open-source claim needs a licence');
  }
});
