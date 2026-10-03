const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const load = () => import('../scripts/browser-plan.mjs');
const commands = plan => plan.runs.map(item => item.kind === 'vault' ? 'vault' : `${item.suite}:${item.filter}`);

test('docs, tests and changelog copy need no browser run', async () => {
  const { planBrowserRuns } = await load();
  const plan = planBrowserRuns(['docs/LAUNCH_CHECKLIST.md', 'README.md', 'test/qa-copy.test.js', 'components/views/changelog-view.jsx', 'CHANGELOG.md']);
  assert.equal(plan.full, false);
  assert.deepEqual(plan.runs, []);
  assert.deepEqual(plan.unmatched, []);
});

test('an empty or missing change list plans nothing', async () => {
  const { planBrowserRuns } = await load();
  for (const files of [[], null, undefined, ['', '   ']]) {
    const plan = planBrowserRuns(files);
    assert.equal(plan.full, false);
    assert.deepEqual(plan.runs, []);
  }
});

test('an Enchanting change runs only the Enchanting groups', async () => {
  const { planBrowserRuns } = await load();
  const plan = planBrowserRuns(['lib/enchant-math.mjs', 'components/calculators/enchanting/enchanting-workstation.jsx']);
  assert.equal(plan.full, false);
  assert.deepEqual(plan.areas, ['Enchanting']);
  assert.deepEqual(commands(plan), ['qa:/enchanting/', 'launch:FLOW-01', 'polish:Polish Enchanting', 'qa:QA-44/']);
});

test('two files in one area are not planned twice, and Windows paths match', async () => {
  const { planBrowserRuns } = await load();
  const plan = planBrowserRuns(['lib\\alchemy-catalogs.mjs', './components/calculators/alchemy/alchemy-workstation.jsx', 'lib/alchemy-catalogs.mjs']);
  const list = commands(plan);
  assert.equal(new Set(list).size, list.length);
  assert.ok(list.includes('tools:Alchemy'));
  assert.ok(list.includes('qa:QA-06/'));
});

test('global CSS, the layout and the shell run the full set', async () => {
  const { planBrowserRuns } = await load();
  for (const file of ['app/globals.css', 'app/theme-morrowind.css', 'app/layout.jsx', 'components/shell-context.jsx', 'package.json', 'lib/bundle-loader.mjs']) {
    const plan = planBrowserRuns(['lib/enchant-math.mjs', file]);
    assert.equal(plan.full, true, file);
    assert.ok(commands(plan).includes('all:'), file);
    assert.ok(commands(plan).includes('hydration:'), file);
    assert.ok(commands(plan).includes('vault'), file);
  }
});

test('an app file in no known area is treated as shared, not skipped', async () => {
  const { planBrowserRuns } = await load();
  const plan = planBrowserRuns(['components/some-new-widget.jsx']);
  assert.equal(plan.full, true);
  assert.match(plan.areas[0], /unmapped app file/);
});

test('files outside the app are listed for a manual check', async () => {
  const { planBrowserRuns } = await load();
  const plan = planBrowserRuns(['tools/notes.txt']);
  assert.equal(plan.full, false);
  assert.deepEqual(plan.unmatched, ['tools/notes.txt']);
});

test('QA-31 and QA-32 files reach their dedicated cases and existing integration groups', async () => {
  const { planBrowserRuns } = await load();
  const local = planBrowserRuns(['components/character-builder/local-characters-panel.jsx']);
  assert.ok(commands(local).includes('vault'));
  assert.ok(commands(local).includes('qa:QA-31/'));
  assert.ok(commands(local).includes('qa:QA-05/'));
  const search = planBrowserRuns(['lib/site-search.mjs']);
  assert.equal(search.full, false);
  assert.ok(commands(search).includes('qa:QA-32/'));
  assert.ok(commands(search).includes('launch:SS-10/'));
  assert.deepEqual(search.notes, []);
});

test('beginner clarity and contained fixes reach their dedicated browser groups', async () => {
  const { planBrowserRuns } = await load();
  for (const [file, filters] of [
    ['lib/choice-help.mjs', ['Clarity-Beginner/', 'Clarity-F04-F11/', 'Clarity-Copy/']],
    ['lib/travel-budget.mjs', ['Clarity-Copy/', 'Clarity-FLOW04/']],
    ['components/calculators/alchemy/reverse-alchemy.jsx', ['Clarity-CALC4/']],
    ['lib/faction-memberships.mjs', ['Clarity-FLOW03/']],
  ]) {
    const plan = planBrowserRuns([file]);
    assert.equal(plan.full, false, file);
    for (const filter of filters) assert.ok(commands(plan).includes(`qa:${filter}`), `${file}: ${filter}`);
  }
  const account = planBrowserRuns(['components/character-vault/cloud-vault-card.jsx']);
  assert.ok(commands(account).includes('vault'));
  assert.ok(account.notes.some(note => note.includes('test:vault -- --clarity')));
});

test('weapon scoring, Health gains and Travel inventory reach their dedicated browser cases', async () => {
  const { planBrowserRuns } = await load();
  for (const [file, filter] of [
    ['lib/best-in-slot.mjs', 'QA-40/'],
    ['components/level-simulator/progression-sheet.jsx', 'QA-41/'],
    ['lib/travel-options.mjs', 'FLOW-04/save-check/'],
  ]) {
    const plan = planBrowserRuns([file]);
    assert.equal(plan.full, false, file);
    assert.ok(commands(plan).includes(`qa:${filter}`), `${file}: ${filter}`);
  }
});

test('every planned filter names cases that exist in the browser runners', async () => {
  const { planBrowserRuns, commandFor } = await load();
  const source = fs.readdirSync(path.join(__dirname, '..', 'scripts'))
    .filter(name => name.endsWith('.cjs'))
    .map(name => fs.readFileSync(path.join(__dirname, '..', 'scripts', name), 'utf8')).join('\n');
  // Built at run time from `QA-17/${route||'home'}/…`.
  const generated = new Set(['QA-17/home']);
  const areaFiles = ['lib/alchemy-catalogs.mjs', 'lib/enchant-math.mjs', 'components/calculators/spellmaking/x.jsx',
    'lib/travel-search.mjs', 'lib/level-math.mjs', 'lib/best-in-slot.mjs', 'components/character-builder/configurator.jsx',
    'components/journal-factions/faction-roster.jsx', 'components/challenge-runs/challenge-runs-root.jsx',
    'components/views/about-view.jsx', 'lib/site-search.mjs', 'components/home-hub/home-tools.jsx', 'components/account-page.jsx'];
  for (const file of areaFiles) {
    const plan = planBrowserRuns([file]);
    assert.equal(plan.full, false, file);
    assert.ok(plan.runs.length, file);
    for (const item of plan.runs) {
      if (item.kind === 'vault' || !item.filter || generated.has(item.filter)) continue;
      assert.ok(source.includes(item.filter), `${file}: no browser case contains "${item.filter}"`);
      assert.match(commandFor(item), /^node scripts\/test-browser\.cjs --suite \w+ --filter '/);
    }
  }
});
