const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

const bootstrap = new JSDOM('', { url: 'http://localhost/travel' });
global.window = bootstrap.window;
global.document = bootstrap.window.document;
const { createRoot } = require('react-dom/client');

function fixture() {
  const a = 'exterior:0,0', b = 'exterior:8,0';
  return {
    profile: 'vanilla',
    catalogs: {
      Travel: [
        { from: a, to: b, mode: 'silt_strider', provider: 'driver', price: 5, hours: 1 },
        { from: b, to: a, mode: 'silt_strider', provider: 'driver', price: 5, hours: 1 }
      ],
      Places: [
        { key: a, name: 'Seyda Neen', interior: false, grid: [0, 0] },
        { key: b, name: 'Vivec', interior: false, grid: [8, 0] }
      ],
      Access: [], Intervention: [], GameSettings: [],
      Teleports: [{ kind: 'propylon', from: [a], to: b, requires: ['test_index'] }]
    },
    metadata: {
      Travel: { nodes: { [a]: { key: a, name: 'Seyda Neen' }, [b]: { key: b, name: 'Vivec' } },
        providers: { driver: { name: 'Driver', barter: { haggles: false } } } },
      Places: { settlements: [] }, Access: { land: {} },
      Intervention: { markers: {} }, Teleports: { items: { test_index: 'Test Propylon Index' } }
    }
  };
}

async function mount({ data = fixture(), status = 'ready', activeSave = null } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/travel' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  let retries = 0;
  const state = { data, status, world: 'vanilla' };
  const carrying = { status: 'ready', data: { catalogs: {} } };
  // Picker keyboard behavior has its own tests. These adapters exercise the real
  // workstation's state, route engine and map callback without rendering SVG.
  function Picker({ id, label, value, options, onChange, disabled }) {
    return React.createElement('label', null, label, React.createElement('select', {
      id, value, disabled, role: 'combobox', onChange: event => onChange(event.target.value)
    }, ...options.map(option => React.createElement('option', { key: option.id, value: option.id }, option.label))));
  }
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: { race: 'Breton', className: 'Custom' }, sheet: null, activeSave }) },
    '../../shell-context': { useShell: () => ({ world: state.world }) },
    '../../use-game-data': { useGameData: tool => tool === 'carrying'
      ? carrying
      : { status: state.status, data: state.data, retry: () => retries++ } },
    '../../use-search-intent': { useSearchIntent: () => null },
    './travel-location-picker': Picker,
    './transit-map': props => React.createElement('div', { 'data-testid': 'map' },
      React.createElement('button', { onClick: () => props.onSelectStop('Seyda Neen') }, 'Select Seyda Neen on map'))
  };
  const file = path.resolve(__dirname, '../components/calculators/travel/travel-workstation.jsx');
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  }
  const compiled = new Module(file, module);
  compiled.paths = module.paths;
  compiled.require = id => deps[id] || require(id);
  compiled._compile(code, file);
  const root = createRoot(document.getElementById('root'));
  const render = () => React.act(async () => root.render(React.createElement(compiled.exports.default)));
  await render();
  return {
    state, render, retries: () => retries,
    cleanup: async () => { await React.act(async () => root.unmount()); dom.window.close(); }
  };
}

const click = element => React.act(async () => element.click());
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text);
const input = text => [...document.querySelectorAll('label')].find(element => element.textContent.trim().startsWith(text))?.querySelector('input');
const summary = () => document.querySelector('#travel-options > summary').textContent;
const route = () => document.getElementById('travel-results');
function before(a, b) {
  assert.ok(a.compareDocumentPosition(b) & window.Node.DOCUMENT_POSITION_FOLLOWING, 'reading and focus order must put the task before optional settings');
}
async function type(element, value) {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(element, value);
  await React.act(async () => element.dispatchEvent(new window.Event('input', { bubbles: true })));
}

test('route inputs and objective precede the answer, with options closed and rules last', async () => {
  const t = await mount();
  try {
    const task = document.querySelector('section[aria-label="Plan a journey"]');
    const options = document.getElementById('travel-options');
    const rules = document.querySelector('details.calculation-notes');
    assert.ok(task.contains(document.getElementById('travel-origin')));
    assert.ok(task.contains(document.getElementById('travel-destination')));
    assert.ok(task.contains(button('Fewest legs')));
    before(task, route()); before(route(), options); before(options, rules);
    assert.equal(options.open, false);
    assert.equal(rules.open, false);
    assert.equal(rules.querySelector('summary').textContent, 'How routes are worked out');
    assert.equal(rules, document.querySelector('.travel-workstation').lastElementChild);
    assert.equal(route().closest('details'), null, 'the answer is visible while settings are closed');
    assert.match(route().textContent, /5 gold/);
    const fields = [...options.querySelectorAll('fieldset')];
    assert.deepEqual(fields.map(field => field.querySelector('legend').textContent), ['Your character', 'Route style']);
    assert.ok(fields[0].contains(input('Mages Guild member')));
    assert.ok(fields[0].contains(input('Carrying')));
    assert.ok(fields[0].contains(input('Test Propylon Index')));
    assert.ok(fields[1].contains(input('Walk between nearby places')));
    assert.ok(fields[1].contains(input('Include quest teleports')));
  } finally { await t.cleanup(); }
});

test('folded settings retain edits and refresh the summary and route fare', async () => {
  const t = await mount();
  try {
    const options = document.getElementById('travel-options');
    options.open = true;
    await click(input('Mages Guild member'));
    await click(input('Divine Intervention'));
    await click(input('Test Propylon Index'));
    await click(input('Walk between nearby places'));
    await click(input('Include quest teleports'));
    await type(input('Followers'), '2');
    assert.match(summary(), /no Mages Guild/);
    assert.match(summary(), /Divine Intervention/);
    assert.match(summary(), /1 teleport item/);
    assert.match(summary(), /2 followers/);
    assert.match(summary(), /transport only/);
    assert.match(summary(), /quest teleports on/);
    // Remove the free item route to observe the original paid transport.
    await click(input('Test Propylon Index'));
    assert.match(route().textContent, /15 gold/);
    options.open = false;
    options.open = true;
    assert.equal(input('Mages Guild member').checked, false);
    assert.equal(input('Followers').value, '2');
    assert.equal(input('Walk between nearby places').checked, false);
    await click(button('Fastest'));
    assert.equal(button('Fastest').getAttribute('aria-pressed'), 'true');
    assert.equal(button('Fewest legs').getAttribute('aria-pressed'), 'false');
  } finally { await t.cleanup(); }
});

test('swap and map selection still change route endpoints outside folded settings', async () => {
  const t = await mount();
  try {
    await click(button('Swap Origin and Destination'));
    assert.equal(document.getElementById('travel-origin').value, 'Vivec');
    assert.equal(document.getElementById('travel-destination').value, 'Seyda Neen');
    await click(button('Swap Origin and Destination'));
    await click(button('Select Seyda Neen on map'));
    assert.equal(document.getElementById('travel-destination').value, 'Seyda Neen');
    assert.match(route().textContent, /You are already at Seyda Neen/);
    assert.equal(document.getElementById('travel-options').open, false);
  } finally { await t.cleanup(); }
});

test('guild membership and overload warnings remain visible beside the route', async () => {
  const activeSave = { token: 'non-member', save: { identity: { name: 'Traveller' }, progress: { factions: [] } } };
  const t = await mount({ activeSave });
  try {
    const guild = document.querySelector('.guild-guide-notice');
    assert.ok(route().contains(guild));
    assert.equal(guild.closest('details'), null);
    assert.match(guild.textContent, /not in the Mages Guild/);
    assert.match(summary(), /Traveller/);
    assert.match(input('Mages Guild member').closest('label').textContent, /from your save/);
    await type(input('Carrying'), '500');
    const alert = route().querySelector('[role="alert"]');
    assert.match(alert.textContent, /you cannot move/);
    assert.equal(alert.closest('details'), null);
    assert.match(summary(), /carrying 500/);
  } finally { await t.cleanup(); }
});

test('loading and unavailable networks expose status and retry above closed settings', async () => {
  const t = await mount({ data: null, status: 'loading' });
  try {
    const task = document.querySelector('section[aria-label="Plan a journey"]');
    assert.match(task.querySelector('[role="status"]').textContent, /Loading travel network/);
    assert.equal(document.getElementById('travel-origin').disabled, true);
    t.state.status = 'error';
    await t.render();
    assert.match(task.querySelector('[role="alert"]').textContent, /Travel network unavailable/);
    await click(button('Retry'));
    assert.equal(t.retries(), 1);
    assert.equal(document.getElementById('travel-options').open, false);
  } finally { await t.cleanup(); }
});

test('older unpriced and empty bundles do not show unsupported objectives or stale controls', async () => {
  const data = fixture();
  data.catalogs.Travel.forEach(record => { delete record.price; });
  delete data.catalogs.Access;
  delete data.catalogs.Intervention;
  delete data.catalogs.Teleports;
  const t = await mount({ data });
  try {
    assert.equal(button('Cheapest'), undefined);
    assert.equal(input('Walk between nearby places'), undefined);
    assert.equal(input('Divine Intervention'), undefined);
    assert.equal(input('Include quest teleports'), undefined);
    assert.match(summary(), /transport only/);
    assert.match(route().textContent, /Take the Silt Strider/);
    t.state.data = { catalogs: { Travel: [] }, metadata: {} };
    await t.render();
    assert.match(route().textContent, /No Route/);
    assert.equal(document.getElementById('travel-options').open, false);
    assert.equal(document.querySelector('[data-testid="map"]'), null);
  } finally { await t.cleanup(); }
});
