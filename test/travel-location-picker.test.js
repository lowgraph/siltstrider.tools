const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');

// React DOM checks input-event support on import, before any test mounts a picker.
const bootstrap = new JSDOM('', { url: 'http://localhost/' });
global.window = bootstrap.window;
global.document = bootstrap.window.document;
const { createRoot } = require('react-dom/client');
const { act } = React;

let TravelLocationPicker;
function loadPicker() {
  if (TravelLocationPicker) return TravelLocationPicker;
  const file = path.resolve(__dirname, '../components/calculators/travel/travel-location-picker.jsx');
  const result = require('esbuild').buildSync({
    entryPoints: [file],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime']
  });
  const compiled = new Module(file, module);
  compiled.paths = module.paths;
  compiled._compile(result.outputFiles[0].text, file);
  TravelLocationPicker = compiled.exports.default;
  return TravelLocationPicker;
}

const OPTIONS = [
  { id: 'Balmora', label: 'Balmora', kind: 'stop', badge: 'Transit stop', detail: 'West Gash' },
  { id: 'Vivec', label: 'Vivec', kind: 'stop', badge: 'Transit stop', detail: 'Ascadian Isles' },
  { id: 'place:exterior:0,-7', label: 'Pelagiad', kind: 'exterior', badge: 'Town', detail: 'Ascadian Isles' },
  { id: 'place:interior:balmora, council club', label: 'Balmora › Council Club', kind: 'interior', badge: 'Interior', detail: 'Balmora' }
];

async function setup(overrides = {}) {
  const dom = new JSDOM('<div id="root"></div><button id="outside">Outside the picker</button>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  const Picker = loadPicker();
  const calls = [];
  let update;
  function Harness() {
    const [state, setState] = React.useState({
      from: 'Balmora', to: 'Vivec', options: OPTIONS, disabled: false, ...overrides
    });
    update = patch => setState(previous => ({ ...previous, ...patch }));
    return React.createElement(React.Fragment, null, ...['from', 'to'].map(end =>
      React.createElement(Picker, {
        key: end,
        id: `travel-${end}`,
        label: end === 'from' ? 'From' : 'To',
        value: state[end],
        valueLabel: state[`${end}Label`] ?? state.options.find(option => option.id === state[end])?.label ?? '',
        options: state.options,
        disabled: state.disabled,
        onChange(id) {
          calls.push({ end, id });
          setState(previous => ({ ...previous, [end]: id }));
        }
      })
    ));
  }
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(Harness)));
  const input = (end = 'from') => document.getElementById(`travel-${end}`);
  const focus = async (end = 'from') => act(async () => input(end).focus());
  const type = async (text, end = 'from') => {
    await focus(end);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input(end), text);
    await act(async () => input(end).dispatchEvent(new window.Event('input', { bubbles: true })));
  };
  const key = async (name, end = 'from') => {
    const event = new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
    await act(async () => input(end).dispatchEvent(event));
    return event;
  };
  const listbox = (end = 'from') => document.getElementById(input(end).getAttribute('aria-controls'));
  const options = (end = 'from') => [...(listbox(end)?.querySelectorAll('[role="option"]') ?? [])];
  const active = (end = 'from') => {
    const activeId = input(end).getAttribute('aria-activedescendant');
    return activeId ? document.getElementById(activeId) : null;
  };
  const patch = async fields => act(async () => update(fields));
  const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
  return { calls, input, focus, type, key, listbox, options, active, patch, cleanup };
}

function assertClosed(t, label, end = 'from') {
  assert.equal(t.input(end).getAttribute('aria-expanded'), 'false');
  assert.equal(t.input(end).value, label, 'the committed route end is visible again');
  assert.equal(t.active(end), null, 'a closed popup never points at an active result');
  assert.equal(t.options(end).length, 0, 'closed results are removed');
}

test('each route end has one labelled combobox and its own result list', async () => {
  const t = await setup();
  try {
    assert.equal(document.querySelectorAll('input[role="combobox"]').length, 2);
    assert.equal(document.querySelectorAll('select').length, 0, 'there is no second native stop selector');
    for (const [end, label] of [['from', 'From'], ['to', 'To']]) {
      assert.equal(document.querySelector(`label[for="${t.input(end).id}"]`).textContent.trim(), label);
    }
    assertClosed(t, 'Balmora');
    assertClosed(t, 'Vivec', 'to');

    await t.focus();
    assert.equal(t.input().value, '', 'opening starts a new search without clearing the route');
    const fromListId = t.listbox().id;
    assert.equal(t.listbox().getAttribute('role'), 'listbox');
    await t.key('ArrowDown');
    assert.ok(t.listbox().contains(t.active()));

    await t.focus('to');
    assertClosed(t, 'Balmora');
    const toListId = t.listbox('to').id;
    assert.notEqual(toListId, fromListId, 'the two inputs never share a popup id');
    await t.key('ArrowDown', 'to');
    assert.ok(t.listbox('to').contains(t.active('to')));
    assert.deepEqual(t.calls, [], 'opening either end does not reroute');
  } finally { await t.cleanup(); }
});

test('arrows navigate the unified results and Enter commits only the highlighted route end', async () => {
  const t = await setup();
  try {
    await t.focus();
    const rows = t.options();
    assert.equal(rows.length, OPTIONS.length);
    await t.key('ArrowDown');
    assert.equal(t.active(), rows[0]);
    await t.key('ArrowDown');
    assert.equal(t.active(), rows[1]);
    await t.key('ArrowUp');
    assert.equal(t.active(), rows[0]);
    assert.deepEqual(t.calls, [], 'highlighting leaves the route unchanged');

    await t.type('Council');
    assert.equal(t.options().length, 1, 'interiors use the same search as transit stops');
    assert.match(t.options()[0].textContent, /Balmora › Council Club/);
    assert.equal(t.active(), null, 'editing starts with no implicit selection');
    await t.key('Enter');
    assert.deepEqual(t.calls, [], 'Enter cannot choose a match that has not been highlighted');
    await t.key('ArrowDown');
    await t.key('Enter');
    assert.deepEqual(t.calls, [{ end: 'from', id: 'place:interior:balmora, council club' }]);
    assertClosed(t, 'Balmora › Council Club');
    assertClosed(t, 'Vivec', 'to');
  } finally { await t.cleanup(); }
});

test('ArrowUp from a closed field opens at the last result', async () => {
  const t = await setup();
  try {
    await t.key('ArrowUp');
    assert.equal(t.input().getAttribute('aria-expanded'), 'true');
    assert.equal(t.active(), t.options().at(-1));
    assert.deepEqual(t.calls, []);
  } finally { await t.cleanup(); }
});

test('Escape and Tab cancel unfinished queries and Tab remains available to move focus', async () => {
  const t = await setup();
  try {
    await t.type('Council');
    await t.key('ArrowDown');
    await t.key('Escape');
    assertClosed(t, 'Balmora');
    assert.equal(document.activeElement, t.input(), 'Escape keeps focus in the field');

    await t.type('Vivec');
    await t.key('ArrowDown');
    const tab = await t.key('Tab');
    assert.equal(tab.defaultPrevented, false, 'the combobox does not trap the Tab key');
    assertClosed(t, 'Balmora');
    assert.deepEqual(t.calls, [], 'neither cancellation selects the highlighted result');
  } finally { await t.cleanup(); }
});

test('an empty match set cannot commit or expose a dangling active-descendant', async () => {
  const t = await setup();
  try {
    await t.type('Council');
    await t.key('ArrowDown');
    assert.ok(t.active());
    await t.type('no-such-morrowind-place-xyz');
    assert.equal(t.options().length, 0);
    assert.equal(t.input().getAttribute('aria-activedescendant'), null);
    await t.key('ArrowDown');
    await t.key('ArrowUp');
    await t.key('Enter');
    assert.equal(t.input().getAttribute('aria-activedescendant'), null);
    assert.deepEqual(t.calls, []);
    await t.key('Escape');
    assertClosed(t, 'Balmora');
  } finally { await t.cleanup(); }
});

test('pointer selection commits an interior from the same option list', async () => {
  const t = await setup();
  try {
    await t.type('Council', 'to');
    const row = t.options('to')[0];
    const down = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    await act(async () => row.dispatchEvent(down));
    assert.equal(down.defaultPrevented, true, 'pressing a result keeps input focus until selection');
    await act(async () => row.click());
    assert.deepEqual(t.calls, [{ end: 'to', id: 'place:interior:balmora, council club' }]);
    assertClosed(t, 'Balmora › Council Club', 'to');
    assertClosed(t, 'Balmora');
  } finally { await t.cleanup(); }
});

test('leaving the picker cancels a query without changing the route', async () => {
  const t = await setup();
  try {
    await t.type('Vivec');
    await t.key('ArrowDown');
    await act(async () => document.getElementById('outside').focus());
    assertClosed(t, 'Balmora');
    assert.deepEqual(t.calls, []);
    assert.equal(document.activeElement.id, 'outside');
  } finally { await t.cleanup(); }
});

test('external route and label changes replace a draft without committing it', async () => {
  const t = await setup();
  try {
    await t.type('Council');
    await t.key('ArrowDown');
    await t.patch({ from: 'Vivec', to: 'Balmora' });
    assertClosed(t, 'Vivec');
    assertClosed(t, 'Balmora', 'to');
    assert.deepEqual(t.calls, [], 'swap, save, and shared-link updates are not picker selections');

    await t.type('Council');
    await t.patch({ fromLabel: 'Vivec — from your save' });
    assertClosed(t, 'Vivec — from your save');
    assert.deepEqual(t.calls, []);
  } finally { await t.cleanup(); }
});

test('changing the available profile options closes a draft and removes stale matches', async () => {
  const t = await setup();
  try {
    await t.type('Council');
    await t.key('ArrowDown');
    const replacement = OPTIONS.filter(option => option.kind !== 'interior');
    await t.patch({ options: replacement });
    assertClosed(t, 'Balmora');
    assert.equal(document.querySelector('[role="option"]'), null);
    await t.key('Enter');
    assert.deepEqual(t.calls, [], 'a result from the previous profile cannot be selected');
    await t.type('Council');
    assert.equal(t.options().length, 0);
    await t.key('ArrowDown');
    await t.key('Enter');
    assert.deepEqual(t.calls, []);
  } finally { await t.cleanup(); }
});

test('a disabled picker cannot open, and disabling an open picker removes its old results', async () => {
  const t = await setup({ disabled: true });
  try {
    assert.equal(t.input().disabled, true);
    await t.key('ArrowDown');
    assertClosed(t, 'Balmora');
    assert.deepEqual(t.calls, []);

    await t.patch({ disabled: false });
    await t.type('Council');
    await t.key('ArrowDown');
    assert.ok(t.active());
    await t.patch({ disabled: true });
    assertClosed(t, 'Balmora');
    assert.equal(document.querySelector('[role="option"]'), null, 'loading never leaves old selectable places');
    await t.key('Enter');
    assert.deepEqual(t.calls, []);
  } finally { await t.cleanup(); }
});

test('an empty catalog remains searchable without allowing a nonexistent route selection', async () => {
  const t = await setup({ options: [], from: '', to: '' });
  try {
    await t.focus();
    assert.equal(t.options().length, 0);
    await t.key('ArrowDown');
    await t.key('ArrowUp');
    await t.key('Enter');
    assert.equal(t.input().getAttribute('aria-activedescendant'), null);
    assert.deepEqual(t.calls, []);
    await t.key('Escape');
    assertClosed(t, '');
  } finally { await t.cleanup(); }
});
