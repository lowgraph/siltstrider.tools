const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

// The acceptance re-run of 30 September (axe WCAG 2.2 AA + best practice, both themes, desktop
// and 375 px) found five things on pages the earlier fixes had not reached. These keep them fixed.
const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
function sourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(rel)); else if (/\.(jsx|js|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const lum = (hex) => { const c = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const token = (file, name) => read(file).match(new RegExp(`--color-${name}\\s*:\\s*(#[0-9a-fA-F]{6})`))[1];
const THEMES = [['Morrowind UI', 'app/globals.css'], ['Modern UI', 'app/theme-ashfall.css']];

test('no page uses fg-16 or fg-17 for text: they measured 2.6 to 3.1:1 on the equipment panels', () => {
  const users = sourceFiles('components').filter((f) => /\btext-fg-1[67]\b/.test(read(f)));
  assert.deepEqual(users, []);
  // The panels' surfaces as axe measured them (#191816, #111010): fg-14 passes, fg-16 does not.
  for (const [theme, file] of THEMES) {
    for (const surface of ['#191816', '#111010']) {
      assert.ok(ratio(token(file, 'fg-14'), surface) >= 4.5, `${theme} fg-14 on ${surface}`);
      assert.ok(ratio(token(file, 'fg-16'), surface) < 4.5, `${theme} fg-16 on ${surface} is why it is not used`);
    }
  }
});

test('no fading on text that is read: Faction ranks you do not meet, Travel stop labels', () => {
  const detail = read('components/journal-factions/faction-detail-view.jsx');
  const rankClasses = detail.slice(detail.indexOf('rank-stepper-btn'), detail.indexOf('Rank {r.index + 1}'));
  assert.doesNotMatch(rankClasses, /opacity-\d+/, 'the rank buttons are not faded (fg-12 fell to 4.19:1)');
  const travel = read('components/calculators/travel/travel-workstation.jsx');
  assert.doesNotMatch(travel, /<span className="text-\[10px\] opacity-\d+">/, 'the stop labels are not faded (3.96 to 4.3:1)');
  assert.equal((travel.match(/\{hub\.name\} <span className="text-\[10px\]">/g) || []).length, 1);
});

test("Level Simulator preset descriptions are fg-9, which passes on the selected preset's surface", () => {
  const editor = read('components/level-simulator/level-step-editor.jsx');
  assert.equal((editor.match(/text-\[10px\] text-fg-9 font-sans font-normal/g) || []).length, 5);
  assert.doesNotMatch(editor, /text-\[10px\] text-fg-11 font-sans font-normal/);
  for (const [theme, file] of THEMES) {
    assert.ok(ratio(token(file, 'fg-9'), '#3a2d1d') >= 4.5, `${theme} fg-9 on the selected preset (#3a2d1d)`);
    assert.ok(ratio(token(file, 'fg-11'), '#3a2d1d') < 4.5, `${theme} fg-11 there is why it changed`);
  }
});

test('each minor objective checkbox is named by its objective', async () => {
  const file = path.join(ROOT, 'components/challenge-runs/minor-objectives-checklist.jsx');
  const built = require('esbuild').buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const m = new Module(file, module); m.paths = module.paths; m._compile(built.outputFiles[0].text, file);
  const Checklist = m.exports.default;
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/challenge' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  try {
    const objectives = ['Join the Fighters Guild', { text: 'Find the Dwemer Puzzle Box', kind: 'item' }, { text: '', kind: 'empty' }];
    await React.act(async () => root.render(React.createElement(Checklist, { objectives })));
    const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
    assert.ok(boxes.length >= 2);
    assert.equal(boxes[0].getAttribute('aria-label'), 'Join the Fighters Guild', 'a plain string objective');
    assert.equal(boxes[1].getAttribute('aria-label'), 'Find the Dwemer Puzzle Box', 'an objective object');
    assert.ok(boxes.every((b) => b.hasAttribute('aria-label')), 'no checkbox is left without a name');
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});
