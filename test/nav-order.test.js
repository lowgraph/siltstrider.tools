const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// SITE-3: the nav leads with the most used tools: Character Builder, Level Simulator,
// Travel Planner, Alchemy, then the rest; Home's cards and its footer columns agree.
const ROOT = path.join(__dirname, '..');
const header = fs.readFileSync(path.join(ROOT, 'components/site-header.jsx'), 'utf8');
const list = (name) => {
  const body = header.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\];`))[1];
  return [...body.matchAll(/view: '(\w+)', label: '([^']+)'/g)].map(([, view, label]) => ({ view, label }));
};

test('the nav row starts Build, Level, Travel, Alchemy, and Challenge Runs stays in it, last', () => {
  const row = list('PRIMARY_VIEWS');
  assert.deepEqual(row.map((t) => t.label), ['Character Builder', 'Level Simulator', 'Travel Planner', 'Alchemy', 'Faction Journal', 'Challenge Runs']);
  assert.equal(new Set(row.map((t) => t.view)).size, row.length, 'no tool twice');
});

test('reordering lost no tool: the row, the Calculators menu and the account button cover all nine', () => {
  const reachable = [...list('PRIMARY_VIEWS'), ...list('CALC_MENU')].map((t) => t.view);
  assert.deepEqual([...reachable].sort(), ['alchemy', 'builder', 'challenge', 'enchanting', 'factions', 'leveler', 'spellmaking', 'travel']);
  assert.match(header, /id="react-nav-vault"[\s\S]*?onClick=\{e => navigate\(e, 'account'\)\}/, 'the Cloud Vault is the account button');
});

// The phone tab bar kept Alchemy until Travel's phone layout led with the journey (TRV-4/5);
// with that on main, Travel takes the fourth tab (owner, 30 September).
test('the phone tab bar is Home, Build, Level, Travel; Alchemy is one tap into the menu', () => {
  const tabs = list('PHONE_TABS');
  assert.deepEqual(tabs.map((t) => t.view), ['home', 'builder', 'leveler', 'travel']);
  assert.deepEqual(tabs.map((t) => t.label), ['Home', 'Build', 'Level', 'Travel']);
  const icons = header.match(/const TAB_ICON = \{([\s\S]*?)\n\};/)[1];
  for (const { view } of tabs) assert.match(icons, new RegExp(`\\n  ${view}: <`), `${view} has an icon`);
  assert.doesNotMatch(icons, /\n  alchemy: </, 'no icon left for a tab that is gone');
  assert.ok(list('PRIMARY_VIEWS').some((t) => t.view === 'alchemy'), 'Alchemy stays in the phone menu (PRIMARY_VIEWS)');
  assert.match(header, /'Open menu: calculators, vault and more'/, 'the menu no longer promises Travel');
});

test("Home's cards and footer columns follow the same order", async () => {
  const { HOME_TOOLS } = await import('../lib/home-data.mjs');
  const views = HOME_TOOLS.map((t) => t.view);
  assert.deepEqual(views.slice(0, 4), ['builder', 'leveler', 'travel', 'alchemy']);
  assert.ok(views.indexOf('challenge') > views.indexOf('factions'), 'the occasional tools come after the everyday ones');
  const calculators = HOME_TOOLS.filter((t) => t.group === 'Calculators').map((t) => t.view);
  assert.deepEqual(calculators, ['travel', 'alchemy', 'enchanting', 'spellmaking'], 'the footer column Home builds from them');
  // Travel and Alchemy share a row of Home's grid at the same width, so the swap moves no card.
  const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
  assert.match(css, /\.home-tool--alchemy,\s*\.home-hub-root \.home-tool--travel \{ grid-column: span 6; \}/);
});
