const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

// SITE-4: every tool uses the one active character; wherever a tool names it, the name
// opens the Character Builder, where it is changed.
const ROOT = path.join(__dirname, '..');
const bundled = require('esbuild').buildSync({
  stdin: { contents: `export { default as ActiveCharacterLink } from './components/active-character-link.jsx'; export * from './components/shell-context.jsx';`, resolveDir: ROOT },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*']
});
const fixture = new Module(path.join(ROOT, 'active-character-link-fixture.cjs'), module);
fixture.paths = module.paths;
fixture._compile(bundled.outputFiles[0].text, path.join(ROOT, 'active-character-link-fixture.cjs'));
const { ActiveCharacterLink, ShellProvider } = fixture.exports;

async function mount(url, element, check) {
  const dom = new JSDOM('<div id="root"></div>', { url });
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  // What the page did with each click; then no browser navigation (jsdom has none).
  const clicks = [];
  dom.window.document.addEventListener('click', (e) => { clicks.push(e.defaultPrevented); e.preventDefault(); });
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(element));
    await check({ link: document.querySelector('a.active-character-link'), clicks, dom });
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}
const click = (el, init = {}) => React.act(async () => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })));
const NAMED = { name: '  Tuls Valen ', race: 'Dark Elf', className: 'Nightblade' };
const PREMADE = { name: 'Redguard female — Long Blade duelist', race: 'Redguard', className: 'Custom' };

test('the name every tool shows: its own name trimmed, or race and class, as on Home', async () => {
  const { characterName } = await import('../lib/character-name.mjs');
  const { characterSummary } = await import('../lib/home-data.mjs');
  assert.equal(characterName(NAMED), 'Tuls Valen');
  assert.equal(characterName({ name: '   ', race: 'Breton', className: 'Mage' }), 'Breton Mage', 'a blank name is no name');
  assert.equal(characterName({ race: 'Nord' }), 'Nord Custom');
  assert.equal(characterName({}), 'Dark Elf Custom');
  assert.equal(characterName(null), 'Dark Elf Custom', 'nothing at all does not throw');
  assert.equal(characterName({ name: 42, race: 'Orc', className: 'Knight' }), 'Orc Knight', 'a stored name that is not text');
  for (const build of [NAMED, PREMADE, { race: 'Khajiit (Suthay)', className: 'Thief' }]) {
    assert.equal(characterSummary(build).name, characterName(build), 'Home and the tools agree');
  }
});

test('a plain click opens the Builder in the page', async () => {
  await mount('https://siltstrider.tools/alchemy', React.createElement(ShellProvider, null, React.createElement(ActiveCharacterLink, { build: PREMADE })), async ({ link, clicks }) => {
    assert.equal(link.getAttribute('href'), '/builder');
    assert.match(link.textContent, /^Redguard female — Long Blade duelist · change in the Character Builder$/);
    assert.equal(link.querySelector('.sr-only').textContent, ' in the Character Builder', 'screen readers hear where it goes');
    await click(link);
    assert.deepEqual(clicks, [true], 'the shell handled it');
    assert.equal(window.location.pathname, '/builder');
  });
});

test('a modified or middle click is left to the browser, like any link', async () => {
  await mount('https://siltstrider.tools/travel', React.createElement(ShellProvider, null, React.createElement(ActiveCharacterLink, { build: NAMED })), async ({ link, clicks }) => {
    await click(link, { ctrlKey: true });
    await click(link, { metaKey: true });
    await click(link, { shiftKey: true });
    await click(link, { button: 1 });
    assert.deepEqual(clicks, [false, false, false, false], 'a new tab or window opens /builder');
    assert.equal(window.location.pathname, '/travel', 'this page stays');
  });
});

test('without the site shell (a page rendered alone) it is an ordinary link', async () => {
  await mount('https://siltstrider.tools/factions', React.createElement(ActiveCharacterLink, { build: NAMED }), async ({ link, clicks }) => {
    assert.match(link.textContent, /^Tuls Valen · change/);
    await click(link);
    assert.deepEqual(clicks, [false]);
  });
});

// The Faction Journal's character was "hidden sm:block", and Travel's separators "hidden
// sm:inline": the legacy `.hidden { display: none !important }` in globals.css beats sm:,
// so they never showed. max-sm:hidden is not touched by it.
test('"hidden sm:…" never shows, so the character strips use max-sm:hidden', () => {
  const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
  assert.match(css, /\.hidden \{ display: none !important; \}/, 'the rule that wins');
  const files = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.posix.join(dir, e.name)) : /\.jsx?$/.test(e.name) ? [path.posix.join(dir, e.name)] : []));
  const offenders = files('components').filter((f) => /["'`\s]hidden (sm|md|lg|xl|2xl):/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert.deepEqual(offenders, ['components/character-vault/cloud-vault-modal.jsx'],
    'only the Cloud Vault header is left (signed in only; reported to the owner)');
  const journal = fs.readFileSync(path.join(ROOT, 'components/journal-factions/journal-factions-root.jsx'), 'utf8');
  assert.match(journal, /<div className="max-sm:hidden text-right">\s*<span[^>]*>Active Character:<\/span>\s*<ActiveCharacterLink build=\{build\} \/>/);
});

test('every tool that names the character links it, and the calculators do not say "change" twice', () => {
  const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
  const tools = [
    'components/calculators/alchemy/alchemy-workstation.jsx',
    'components/calculators/enchanting/enchanting-workstation.jsx',
    'components/calculators/spellmaking/spellmaking-workstation.jsx',
    'components/calculators/travel/travel-workstation.jsx',
    'components/journal-factions/journal-factions-root.jsx',
    'components/level-simulator/level-simulator-root.jsx'
  ];
  for (const file of tools) {
    const source = read(file);
    assert.match(source, /import ActiveCharacterLink from "(\.\.\/)+active-character-link";/, file);
    assert.match(source, /<ActiveCharacterLink build=\{build\} \/>/, file);
    assert.doesNotMatch(source, /\{build\.race \|\| "Adventurer"\} \{build\.className \|\| "Custom"\}/, `${file}: no unlinked name`);
    assert.doesNotMatch(source, /\{build\.name \|\| "Adventurer"\}/, `${file}: no unlinked name`);
  }
  for (const file of tools.slice(0, 3)) {
    assert.match(read(file), /"— hide inputs" : "— type your own"/, `${file}: the numbers toggle says what it does`);
  }
});
