const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { JSDOM } = require('jsdom');

// The header's Calculators and More menus: opened from the keyboard (Enter, Space, a screen
// reader's activation, the arrow keys), focus moves into the menu; opened with the mouse, it
// stays on the button.
function component(file) {
  const built = require('esbuild').buildSync({ entryPoints: [path.resolve(file)], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom'] });
  const m = new Module(path.resolve(file), module); m.paths = module.paths; m._compile(built.outputFiles[0].text, path.resolve(file));
  return m.exports.default;
}
const SiteHeader = component('components/site-header.jsx');

async function header(check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const shell = { ready: true, world: 'vanilla', arce: false, profile: 'vanilla', view: 'home', navigate() {}, setProfile() {} };
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(SiteHeader, { shell })));
    await check();
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}
const calc = () => document.getElementById('react-btn-dropdown-calc');
const more = () => document.getElementById('react-btn-dropdown-more');
const focused = () => document.activeElement?.textContent.trim();
// A keyboard or screen reader activation is a click with detail 0; the mouse counts clicks.
const keyboardClick = (el) => React.act(async () => { el.focus(); el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 })); });
const mouseClick = (el) => React.act(async () => { el.focus(); el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })); });
const key = (el, k) => React.act(async () => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })));

test('Enter or Space (a click with detail 0) opens a menu on its first item; the mouse leaves focus on the button', async () => {
  await header(async () => {
    await keyboardClick(calc());
    assert.equal(calc().getAttribute('aria-expanded'), 'true');
    assert.equal(focused(), 'Enchanting', 'the first item of Calculators');
    await key(document.activeElement, 'Escape');
    assert.equal(calc().getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, calc(), 'Escape returns to the button');

    await mouseClick(calc());
    assert.equal(calc().getAttribute('aria-expanded'), 'true');
    assert.equal(document.activeElement, calc(), 'a mouse click does not move focus');
    await mouseClick(calc());
    assert.equal(calc().getAttribute('aria-expanded'), 'false');
  });
});

test('the arrow keys open on the first or last item, and on an open menu move straight to it', async () => {
  await header(async () => {
    calc().focus();
    await key(calc(), 'ArrowUp');
    assert.equal(focused(), 'Spellmaking', 'ArrowUp: the last item');
    calc().focus();
    await key(calc(), 'ArrowDown');
    assert.equal(calc().getAttribute('aria-expanded'), 'true', 'still open');
    assert.equal(focused(), 'Enchanting', 'ArrowDown on the open menu: its first item');
    await key(document.activeElement, 'ArrowDown');
    assert.equal(focused(), 'Spellmaking', 'and the menu moves as before');
  });
});

test('a keyboard click on an open menu closes it where you are; opening the other closes the first', async () => {
  await header(async () => {
    await keyboardClick(calc());
    assert.equal(focused(), 'Enchanting');
    await keyboardClick(calc());
    assert.equal(calc().getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, calc(), 'closing does not move focus anywhere else');

    await keyboardClick(calc());
    await keyboardClick(more());
    assert.equal(calc().getAttribute('aria-expanded'), 'false');
    assert.equal(more().getAttribute('aria-expanded'), 'true');
    assert.equal(focused(), 'About Silt Strider', 'the first item of More');
    await key(document.activeElement, 'End');
    assert.equal(focused(), 'Changelog');
    await key(document.activeElement, 'Tab');
    assert.equal(more().getAttribute('aria-expanded'), 'false', 'Tab leaves and closes it');
  });
});
