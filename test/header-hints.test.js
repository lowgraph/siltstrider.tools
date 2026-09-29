const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

function component(file, exportName = 'default') {
  const result = require('esbuild').buildSync({ entryPoints: [path.resolve(file)], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// MOB-3: the Ctrl K / ⌘K hints are for keyboards. Rules that hide a hint, and the media query each sits in.
function hintRules() {
  const css = read('app/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const media = /@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g;
  let m;
  const inside = new Set();
  while ((m = media.exec(css))) {
    for (const [, sel, body] of m[2].matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      rules.push({ media: m[1].trim(), selectors: sel.split(',').map(s => s.trim()), body });
      inside.add(m.index);
    }
  }
  const top = css.replace(media, '');
  for (const [, sel, body] of top.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) rules.push({ media: null, selectors: sel.split(',').map(s => s.trim()), body });
  return rules.filter(r => /display:\s*none/.test(r.body) && r.selectors.some(s => /kbd$/.test(s) && /search-trigger|home-news/.test(s)));
}

test('the Ctrl K hints hide on narrow screens and wherever the main pointer is a finger (MOB-3)', () => {
  const rules = hintRules();
  const hides = selector => rules.filter(r => r.selectors.includes(selector));
  for (const selector of ['.search-trigger kbd', '.home-hub-root .home-news kbd']) {
    const found = hides(selector);
    assert.equal(found.length, 1, `one rule hides ${selector}`);
    assert.match(found[0].media, /\(max-width:\s*899px\)/, `${selector}: narrow screens`);
    assert.match(found[0].media, /\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)/, `${selector}: touch-first devices`);
  }
  assert.ok(rules.every(r => r.media), 'no hint is hidden for everyone: a desktop with a keyboard still sees it');
  assert.doesNotMatch(rules[0].media, /any-pointer|any-hover/, 'a touchscreen laptop, whose main pointer is the mouse, keeps the hint');
});

test('both search buttons still carry their shortcut hint for keyboards (MOB-3)', () => {
  assert.match(read('components/site-header.jsx'), /<span className="search-trigger-label">[^<]*<\/span>\s*<kbd>\{searchKey\}<\/kbd>/);
  assert.match(read('components/home-hub/home-hero.jsx'), /className="home-news"[\s\S]{0,300}<kbd>\{searchKey\}<\/kbd>/);
});

test('TR + ARCE says what it is, to screen readers, in its tooltip and in the phone menu (SITE-5)', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const shell = { ready: true, world: 'tr', arce: true, profile: 'tr_arce', view: 'home', navigate() {}, setProfile() {} };
  const SiteHeader = component('components/site-header.jsx');
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(SiteHeader, { shell })));
    const arce = document.getElementById('react-world-arce');
    assert.equal(arce.textContent.trim(), 'TR + ARCE', 'the visible label stays short');
    const help = document.getElementById(arce.getAttribute('aria-describedby'));
    assert.ok(help, 'the description it points at exists');
    assert.match(help.textContent, /All Races and Classes Enabled/);
    assert.match(help.textContent, /^TR \+ ARCE is Tamriel Rebuilt with ARCE/);
    assert.ok(help.classList.contains('drawer-only'), 'visible in the phone menu, read with the button on desktop');
    assert.match(arce.title, /All Races and Classes Enabled/);
    for (const id of ['react-world-vanilla', 'react-world-tr']) {
      assert.equal(document.getElementById(id).getAttribute('aria-describedby'), null, `${id} needs no description`);
    }
    assert.match(document.querySelector('#react-menu-drawer').textContent, /Game World Profile[\s\S]*All Races and Classes Enabled/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('no page spells out ARCE any other way (SITE-5)', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx|js|mjs)$/.test(entry.name)) files.push(rel);
    }
  };
  walk('components'); walk('app'); walk('lib');
  const wrong = files.filter(file => /Aran Rebuilt|Content Ecosystem|ARCE\s*\((?!All Races and Classes Enabled)/.test(read(file)));
  assert.deepEqual(wrong, []);
});
