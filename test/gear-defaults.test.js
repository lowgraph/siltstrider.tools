const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

function component(file, exportName = 'default') {
  const result = require('esbuild').buildSync({ entryPoints: [path.resolve(file)], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const m = new Module(path.resolve(file), module); m.paths = module.paths; m._compile(result.outputFiles[0].text, path.resolve(file)); return m.exports[exportName];
}

async function mount(build = { race: 'Breton' }) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const Gear = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(Gear, { build, result: { status: 'loading' }, onLoad() {} })));
  const box = label => [...document.querySelectorAll('#root label')].find(l => l.textContent.includes(label))?.querySelector('input');
  return { root, dom, box, Gear };
}

test('the gear rows default every option off, and cannot be changed by accident', async () => {
  const { DEFAULT_GEAR_TOGGLES } = await import('../lib/gear-rows.mjs');
  assert.deepEqual({ ...DEFAULT_GEAR_TOGGLES }, { theft: false, endgame: false, nearStart: false, darkBrotherhood: false });
  assert.ok(Object.isFrozen(DEFAULT_GEAR_TOGGLES));
  assert.throws(() => { 'use strict'; DEFAULT_GEAR_TOGGLES.theft = true; }, TypeError);
});

test('the Gear Advisor does not suggest stealing unless the player asks', async () => {
  const { root, dom, box } = await mount();
  try {
    const steal = box('Steal early gear');
    assert.ok(steal, 'the option is there');
    assert.equal(steal.checked, false, 'theft is opt-in');
    for (const other of ['Endgame gear early', 'Near starting areas', 'Dark Brotherhood armor']) {
      assert.equal(box(other)?.checked, false, `${other} starts off too`);
    }
    await act(async () => steal.click());
    assert.equal(steal.checked, true, 'and the player can still switch it on');
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

test('a character change keeps the player\'s choice instead of resetting it', async () => {
  const { root, dom, box, Gear } = await mount({ race: 'Breton' });
  try {
    await act(async () => box('Steal early gear').click());
    // The same component, re-rendered: a second compile would be a new type and remount.
    await act(async () => root.render(React.createElement(Gear, { build: { race: 'Argonian' }, result: { status: 'loading' }, onLoad() {} })));
    assert.equal(box('Steal early gear').checked, true, 'switching race does not silently turn theft back off');
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
