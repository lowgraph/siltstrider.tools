const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const load = file => import(pathToFileURL(path.join(ROOT, file)).href);

// One short name per tool on screen (SITE-1; the owner's decision in docs/LAUNCH_CHECKLIST.md).
// The long SEO names stay where nobody reads them as the tool's name: page titles, the
// hidden h1 (lib/view-headings.mjs), the pages' hidden guides and the structured data.
const TOOL_NAMES = Object.freeze({
  builder: 'Character Builder',
  leveler: 'Level Simulator',
  alchemy: 'Alchemy',
  enchanting: 'Enchanting',
  spellmaking: 'Spellmaking',
  travel: 'Travel Planner',
  factions: 'Faction Journal',
  challenge: 'Challenge Runs',
  vault: 'Cloud Vault'
});

const OLD_NAMES = /Build Optimi[sz]er|Class Planner|Travel Optimi[sz]er|Route Planner|Level Optimi[sz]er|Progression Optimi[sz]er|Character Level Simulator|Character Vault|Challenge Run Generator|Alchemy (Potion Recipe )?Calculator|Enchanting (Calculator|&amp; Soul Gem)|Spellmaking (Calculator|&amp; Casting)|Save File Inspector/;

const TOOL_HEADINGS = {
  builder: 'components/character-builder/character-builder-root.jsx',
  leveler: 'components/level-simulator/level-simulator-root.jsx',
  alchemy: 'components/calculators/alchemy/alchemy-workstation.jsx',
  enchanting: 'components/calculators/enchanting/enchanting-workstation.jsx',
  spellmaking: 'components/calculators/spellmaking/spellmaking-workstation.jsx',
  travel: 'components/calculators/travel/travel-workstation.jsx',
  factions: 'components/journal-factions/journal-factions-root.jsx',
  challenge: 'components/challenge-runs/challenge-runs-root.jsx',
  vault: 'components/character-vault/cloud-vault-workstation.jsx'
};

test('each tool\'s visible heading is its name', () => {
  assert.deepEqual(Object.keys(TOOL_HEADINGS).sort(), Object.keys(TOOL_NAMES).sort());
  for (const [view, file] of Object.entries(TOOL_HEADINGS)) {
    const heading = read(file).match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
    assert.ok(heading, `${file} has a heading`);
    assert.equal(heading[1].trim(), TOOL_NAMES[view], `${view}: ${file}`);
  }
});

test('the nav, home cards, search palette and breadcrumbs use the same names', async () => {
  const header = read('components/site-header.jsx');
  const menu = name => header.slice(header.indexOf(`const ${name} = [`), header.indexOf('];', header.indexOf(`const ${name} = [`)));
  const navLabels = {};
  for (const [, view, label] of (menu('PRIMARY_VIEWS') + menu('CALC_MENU')).matchAll(/view: '(\w+)', label: '([^']+)'/g)) navLabels[view] = label;
  assert.ok(Object.keys(navLabels).length >= 8, 'the nav and the Calculators menu were read');

  const { HOME_TOOLS } = await load('lib/home-data.mjs');
  const { SEARCH_PAGES } = await load('lib/site-search.mjs');
  const { BREADCRUMB_MAP } = await load('lib/seo-breadcrumbs.mjs');
  const sources = {
    nav: navLabels,
    'home card': Object.fromEntries(HOME_TOOLS.map(tool => [tool.view, tool.title])),
    search: Object.fromEntries(SEARCH_PAGES.map(page => [page.view, page.title])),
    breadcrumb: Object.fromEntries(Object.entries(BREADCRUMB_MAP).map(([view, crumb]) => [view, crumb.name]))
  };
  for (const [where, names] of Object.entries(sources)) {
    for (const [view, name] of Object.entries(names)) {
      if (view in TOOL_NAMES) assert.equal(name, TOOL_NAMES[view], `${where}: ${view}`);
    }
  }
  // Every tool is on the home page and in search; Cloud Vault is the account button, not a nav item.
  for (const view of Object.keys(TOOL_NAMES)) {
    assert.ok(view in sources['home card'], `home card for ${view}`);
    assert.ok(view in sources.search, `search entry for ${view}`);
  }
});

test('no old name is left on screen', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx|js|mjs)$/.test(entry.name)) files.push(rel);
    }
  };
  walk('components');
  files.push('app/not-found.jsx', 'lib/home-data.mjs', 'lib/site-search.mjs', 'lib/challenge-math.mjs');
  const found = [];
  for (const file of files) {
    if (file === 'components/views/changelog-view.jsx') continue; // past entries keep the names of their day
    read(file).split(/\r?\n/).forEach((line, i) => { if (OLD_NAMES.test(line)) found.push(`${file}:${i + 1}: ${line.trim().slice(0, 90)}`); });
  }
  assert.deepEqual(found, []);
});

test('the old names still find their tools in search', async () => {
  const { pageEntries, searchEntries } = await load('lib/site-search.mjs');
  const entries = pageEntries();
  const top = query => searchEntries(entries, query)[0]?.items[0]?.entry.ref.view;
  assert.equal(top('build optimizer'), 'builder');
  assert.equal(top('travel optimizer'), 'travel');
  assert.equal(top('character builder'), 'builder');
  assert.equal(top('travel planner'), 'travel');
  assert.equal(top('cloud vault'), 'vault');
});

test('the guard itself: it catches each old name and passes the new ones', () => {
  for (const old of ['Build Optimizer', 'Travel Optimizer', 'Level Optimizer →', 'Cloud Character Vault', 'Morrowind Challenge Run Generator &amp; Permalinks',
    'Morrowind Travel &amp; Transport Route Planner', 'Morrowind Alchemy Potion Recipe Calculator', 'Morrowind Enchanting &amp; Soul Gem Calculator', 'Progression Optimizer Presets']) {
    assert.match(old, OLD_NAMES, old);
  }
  for (const name of Object.values(TOOL_NAMES)) assert.doesNotMatch(name, OLD_NAMES, name);
  // In-game words that only look like tool names
  for (const word of ['Ranked Spellmakers', 'Spellmaker gold', 'Journal', 'Character Builder']) assert.doesNotMatch(word, OLD_NAMES, word);
});
