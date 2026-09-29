const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const h = React.createElement;

async function load(file, deps = {}) {
  const full = path.join(ROOT, file);
  const code = require('esbuild').transformSync(fs.readFileSync(full, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    deps[match[1]] ??= await import(pathToFileURL(path.resolve(path.dirname(full), match[1])));
  }
  const mod = new Module(full, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, full);
  return mod.exports;
}

function mount() {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return require('react-dom/client').createRoot(document.getElementById('root'));
}
const key = (k, shiftKey = false) => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }));

async function harness(controls = true, autoFocus = false) {
  const { useModalDialog } = await load('components/use-modal-dialog.js');
  const root = mount();
  const closed = [];
  function Harness({ open }) {
    const ref = React.useRef(null);
    useModalDialog(open, ref, () => closed.push(Date.now()));
    return h(React.Fragment, null,
      h('button', { id: 'opener' }, 'open'),
      open && h('div', { ref, role: 'dialog', 'aria-modal': 'true', tabIndex: -1, id: 'dialog' },
        controls ? [h('button', { id: 'first', key: 1 }, 'first'), h('input', { id: 'middle', key: 2, autoFocus }), h('button', { id: 'last', key: 3 }, 'last')] : h('p', null, 'Nothing to press')),
      h('div', { className: 'cl-modalBackdrop' }, h('button', { id: 'clerk' }, 'Continue with Google')));
  }
  const render = open => React.act(async () => root.render(h(Harness, { open })));
  return { root, render, closed };
}

test('opening moves focus into the dialog, and closing gives it back to the opener', async () => {
  const { root, render } = await harness();
  try {
    await render(false);
    document.getElementById('opener').focus();
    await render(true);
    assert.equal(document.activeElement.id, 'first');
    await render(false);
    assert.equal(document.activeElement.id, 'opener');
  } finally { await React.act(async () => root.unmount()); }
});

test('an autofocused field inside does not make the dialog forget its opener', async () => {
  const { root, render } = await harness(true, true);
  try {
    await render(false);
    document.getElementById('opener').focus();
    await render(true);
    assert.equal(document.activeElement.id, 'middle', 'the field asked for focus and got it');
    await render(false);
    assert.equal(document.activeElement.id, 'opener');
  } finally { await React.act(async () => root.unmount()); }
});

test('Tab and Shift+Tab wrap inside, and focus that strays outside is brought back', async () => {
  const { root, render } = await harness();
  try {
    await render(true);
    document.getElementById('last').focus();
    key('Tab');
    assert.equal(document.activeElement.id, 'first', 'Tab from the last control wraps to the first');
    key('Tab', true);
    assert.equal(document.activeElement.id, 'last', 'Shift+Tab from the first wraps to the last');
    document.getElementById('middle').focus();
    assert.equal(key('Tab'), true, 'inside the dialog the browser moves focus as usual');
    document.getElementById('opener').focus();
    assert.equal(document.activeElement.id, 'first', 'the page behind cannot take focus');
  } finally { await React.act(async () => root.unmount()); }
});

test('Escape closes the dialog once and is not seen by the page behind it', async () => {
  const { root, render, closed } = await harness();
  let behind = 0;
  const listener = e => { if (e.key === 'Escape') behind++; };
  try {
    await render(true);
    document.addEventListener('keydown', listener);
    key('Escape');
    assert.equal(closed.length, 1);
    assert.equal(behind, 0);
    key('a');
    assert.equal(closed.length, 1, 'other keys do not close it');
  } finally { document.removeEventListener('keydown', listener); await React.act(async () => root.unmount()); }
});

test('a layer opened on top, like Clerk sign-in, keeps focus, Tab and Escape', async () => {
  const { root, render, closed } = await harness();
  try {
    await render(true);
    document.getElementById('clerk').focus();
    assert.equal(document.activeElement.id, 'clerk', 'focus is not pulled back out of sign-in');
    assert.equal(key('Tab'), true, 'Tab is left to the sign-in window');
    assert.equal(document.activeElement.id, 'clerk');
    key('Escape');
    assert.equal(closed.length, 0, 'Escape closes sign-in, not the vault under it');
  } finally { await React.act(async () => root.unmount()); }
});

test('a dialog with nothing to press takes focus itself and keeps it', async () => {
  const { root, render } = await harness(false);
  try {
    await render(true);
    assert.equal(document.activeElement.id, 'dialog');
    key('Tab');
    assert.equal(document.activeElement.id, 'dialog');
  } finally { await React.act(async () => root.unmount()); }
});

test('the pool browser is a labelled modal dialog with a scroll region a keyboard can reach', async () => {
  const { default: PoolBrowserModal } = await load('components/challenge-runs/pool-browser-modal.jsx', {
    '../use-modal-dialog': await load('components/use-modal-dialog.js')
  });
  const root = mount();
  const closed = [];
  try {
    await React.act(async () => root.render(h(PoolBrowserModal, { isOpen: true, onClose: () => closed.push(1), world: 'vanilla' })));
    const dialog = document.querySelector('[role="dialog"]');
    assert.equal(dialog.getAttribute('aria-modal'), 'true');
    assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent.trim(), 'Challenge Runs Pool Browser');
    assert.ok(dialog.contains(document.activeElement), 'focus moved in');
    const region = dialog.querySelector('[role="region"][aria-label="Pool entries"]');
    assert.equal(region?.tabIndex, 0);
    key('Escape');
    assert.equal(closed.length, 1);
  } finally { await React.act(async () => root.unmount()); }
});
