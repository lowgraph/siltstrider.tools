const { test } = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

// MOB-1: the phone header is one row (the name, then theme, search, account and menu).
// MOB-4: below 1024 px the Builder has one row of sections instead of two levels of tabs.
const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const ashfall = fs.readFileSync(path.join(ROOT, 'app/theme-ashfall.css'), 'utf8').replace(/\r\n/g, '\n');
const block = (sheet, query, marker) => {
  const at = sheet.indexOf(marker);
  assert.ok(at > 0, marker);
  const start = sheet.lastIndexOf(`@media (${query})`, at);
  return sheet.slice(start, sheet.indexOf('\n}\n', at) + 2);
};
const bundle = (name, contents) => {
  const built = require('esbuild').buildSync({ stdin: { contents, resolveDir: ROOT }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*'] });
  const m = new Module(path.join(ROOT, name), module); m.paths = module.paths; m._compile(built.outputFiles[0].text, path.join(ROOT, name));
  return m.exports;
};
const { default: SiteHeader } = bundle('phone-header-fixture.cjs', `export { default } from './components/site-header.jsx';`);
const { CharacterBuilderRoot, CharacterProvider, ShellProvider } = bundle('phone-builder-fixture.cjs',
  `export { default as CharacterBuilderRoot } from './components/character-builder/character-builder-root.jsx'; export * from './components/character-context.jsx'; export * from './components/shell-context.jsx';`);

async function mount(element, { url = 'https://siltstrider.tools/', storage = {} } = {}, check) {
  const dom = new JSDOM('<div id="root"></div>', { url });
  for (const [key, value] of Object.entries(storage)) dom.window.localStorage.setItem(key, value);
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(element));
    await check();
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}
const click = (el) => React.act(async () => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));

test('MOB-1: the menu button follows the other header buttons in the page, as it is seen', async () => {
  const shell = { ready: true, world: 'vanilla', arce: false, profile: 'vanilla', view: 'builder', navigate() {}, setProfile() {} };
  await mount(React.createElement(SiteHeader, { shell }), {}, async () => {
    const header = document.querySelector('header.topbar');
    const kids = [...header.children].map((el) => el.className.split(' ')[0] || el.tagName);
    assert.deepEqual(kids.slice(0, 3), ['brand', 'header-actions', 'hamburger']);
    assert.ok(kids.indexOf('hamburger') < kids.indexOf('header-tools'), 'right before the menu it opens');
    const buttons = [...header.querySelectorAll('.header-actions button, .hamburger')].map((b) => b.className.split(' ')[0]);
    assert.deepEqual(buttons, ['theme-toggle', 'search-trigger', 'vault-trigger', 'hamburger'], 'the keyboard meets them left to right');
    assert.match(header.querySelector('.search-trigger').textContent, /Search items, spells, places/, 'search keeps its words for screen readers');
    await click(header.querySelector('.hamburger'));
    assert.equal(header.querySelector('.hamburger').getAttribute('aria-expanded'), 'true');
    assert.ok(document.getElementById('react-menu-drawer').classList.contains('open'));
  });
});

test('MOB-1: on phones, no taglines, search as an icon, and the account button leaves only where the name needs the room', () => {
  const phone = block(css, 'max-width: 899px', 'MOB-1: on phones the header is one row');
  assert.match(phone, /\.topbar \.kicker \{ display: none; \}/);
  assert.match(phone, /\.header-actions \.search-trigger \{[^}]*width: 44px/);
  // Hidden from sight only: a label with display: none would leave the button unnamed.
  assert.match(phone, /\.search-trigger-label \{[^}]*position: absolute;[^}]*clip: rect\(0, 0, 0, 0\)/);
  assert.doesNotMatch(phone, /\.search-trigger-label \{[^}]*display: none/);
  assert.match(css, /@media \(max-width: 359px\) \{\s*\.header-actions \.vault-trigger \{ display: none; \}/, 'the account button stays from 360 px');
  const modern = block(ashfall, 'max-width: 899px', 'MOB-1: the one-row phone header');
  assert.match(modern, /\.topbar \.brand \.brand-title \{ font-size: 1\.6rem; \}/, 'the modern theme shrinks its bigger name too');
  assert.match(modern, /\.menu-drawer :is\(#react-nav-challenge, #react-nav-build\):not\(\[aria-current="page"\]\) \{ color: var\(--color-fg-2\); \}/,
    'in the phone menu, Character Builder and Challenge Runs read like the other tools');
});

const builder = (check) => mount(
  React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(CharacterBuilderRoot))),
  { url: 'https://siltstrider.tools/builder', storage: { 'siltstrider-builder-visited': '1' } }, check);
const sections = () => [...document.querySelectorAll('.builder-phone-tabs button')];
const pressed = () => sections().filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);

test('MOB-4: one row of four sections, one pressed at a time, and each opens its part', async () => {
  await builder(async () => {
    assert.deepEqual(sections().map((b) => b.textContent), ['Configure', 'Sheet', 'Loadouts', 'Premades']);
    assert.deepEqual(pressed(), ['Configure']);
    const panes = () => [...document.querySelectorAll('.cb-pane')].map((p) => !p.classList.contains('cb-pane-mobile-hidden'));
    assert.deepEqual(panes(), [true, false], 'the configurator shows, the sheet waits');
    await click(sections()[1]);
    assert.deepEqual(pressed(), ['Sheet']);
    assert.deepEqual(panes(), [false, true]);
    await click(sections()[2]);
    assert.deepEqual(pressed(), ['Loadouts']);
    assert.equal(document.getElementById('btn-tab-equipment').getAttribute('aria-pressed'), 'true', 'the wide-screen tabs agree');
    await click(sections()[3]);
    assert.deepEqual(pressed(), ['Premades']);
    assert.ok(document.querySelector('.premade-browser'));
    // Loading a premade shows its sheet, as before.
    await click(document.querySelector('.premade-browser [aria-expanded="false"]'));
    await click([...document.querySelectorAll('.premade-browser button')].find((b) => b.textContent.trim() === 'Load Build →'));
    assert.deepEqual(pressed(), ['Sheet']);
    // Back to the configurator from another section lands on it, not on the sheet.
    await click(sections()[2]);
    await click(sections()[0]);
    assert.deepEqual(pressed(), ['Configure']);
  });
});

test('MOB-4: the sections show below 1024 px and the three wide tabs above it, never both, never neither', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components/character-builder/character-builder-root.jsx'), 'utf8');
  assert.match(source, /className="builder-phone-tabs lg:hidden /);
  assert.match(source, /className="mode-bar-grid max-lg:hidden /, 'max-lg:hidden: the legacy .hidden rule would beat a "hidden lg:grid"');
  assert.doesNotMatch(source, />\s*Configurator\s*</, 'the second tab level is gone');
  for (const tab of ['builder', 'equipment', 'premade']) assert.match(source, new RegExp(`id="btn-tab-${tab}"\\s*aria-pressed=\\{activeTab === "${tab}"\\}`), `${tab} says when it is chosen`);
});
