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

// Found live after the 15:46 release, when the random start drew a beast race: the Boots slot
// was faded to half (2.2:1) and its reason, in danger-8, to 1.9:1.
test('a slot a beast race cannot use is not faded, and its reason reads on its panel', async () => {
  const file = path.join(ROOT, 'components/equipment-studio/equipment-slot-card.jsx');
  const built = require('esbuild').buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const m = new Module(file, module); m.paths = module.paths; m._compile(built.outputFiles[0].text, file);
  const Card = m.exports.default;
  const { renderToStaticMarkup } = require('react-dom/server');
  const render = (props) => {
    const host = new JSDOM(`<div>${renderToStaticMarkup(React.createElement(Card, { onSelectSlot() {}, onUnequipSlot() {}, ...props }))}</div>`).window.document.body.firstChild.firstChild;
    return { card: host, reason: host.querySelector('.italic') };
  };
  // Boots, which no beast race can wear: nothing faded, the reason in a red that passes.
  const boots = render({ slot: 'Boots', isRestricted: true, restrictionReason: 'Beast races cannot wear boots' });
  assert.doesNotMatch(boots.card.className, /opacity-\d+/);
  assert.equal(boots.reason.textContent.trim(), 'Beast races cannot wear boots');
  assert.match(boots.reason.className, /\btext-danger-7\b/);
  // A closed helmet already worn by a beast race: the item's name is shown, not faded either.
  const helmet = render({ slot: 'Helmet', item: { id: 'iron_helmet', name: 'Iron Helmet' }, isRestricted: true, restrictionReason: 'Closed helmets incompatible with beast races' });
  assert.doesNotMatch(helmet.card.className, /opacity-\d+/);
  assert.match(helmet.card.textContent, /Iron Helmet/);
  assert.equal(helmet.card.getAttribute('title'), 'Closed helmets incompatible with beast races');
  // No reason given: the fallback still reads.
  assert.equal(render({ slot: 'Boots', isRestricted: true }).reason.textContent.trim(), 'Beast Restricted');
  for (const [theme, file] of THEMES) {
    const surface = token(file, 'danger-surface-1');
    assert.ok(ratio(token(file, 'danger-7'), surface) >= 4.5, `${theme} danger-7 on the restricted slot`);
    assert.ok(ratio(token(file, 'fg-14'), surface) >= 4.5, `${theme} the slot's name there`);
    assert.ok(ratio(token(file, 'danger-8'), surface) < 4.5, `${theme} danger-8 there is why it changed`);
  }
});

test('each minor objective checkbox is named by its objective, and a ticked one is not faded', async () => {
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
    // Ticked, it is struck through, not faded: at 75% it measured 4.05 to 4.37:1 live.
    await React.act(async () => boxes[0].click());
    const done = boxes[0].closest('li');
    assert.equal(boxes[0].checked, true);
    assert.doesNotMatch(done.className, /opacity-\d+/);
    assert.match(done.querySelector('.line-through').className, /\btext-success-6\b/);
    for (const [theme, file] of THEMES) {
      assert.ok(ratio(token(file, 'success-6'), token(file, 'surface-5')) >= 4.5, `${theme} success-6 on a ticked objective`);
    }
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});
