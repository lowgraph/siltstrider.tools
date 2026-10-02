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
        { from: a, to: b, mode: 'silt_strider', provider: 'driver', price: 5, hours: 1, fromPos: [4096,4096], toPos: [69632,4096] },
        { from: b, to: a, mode: 'silt_strider', provider: 'driver', price: 5, hours: 1, fromPos: [69632,4096], toPos: [4096,4096] }
      ],
      Places: [
        { key: a, name: 'Seyda Neen', interior: false, grid: [0, 0] },
        { key: b, name: 'Vivec', interior: false, grid: [8, 0] }
      ],
      Access: [], Intervention: [], GameSettings: [],
      Teleports: [{ kind: 'propylon', from: [a], to: b, requires: ['test_index'], fromPos:[[4096,4096]], toPos:[69632,4096] }]
    },
    metadata: {
      Travel: { nodes: { [a]: { key: a, name: 'Seyda Neen' }, [b]: { key: b, name: 'Vivec' } },
        providers: { driver: { name: 'Driver', barter: { haggles: false } } } },
      Places: { settlements: [] }, Access: { land: {} },
      Intervention: { markers: {} }, Teleports: { items: { test_index: 'Test Propylon Index' } }
    }
  };
}

async function mount({ data = fixture(), status = 'ready', activeSave = null, storage = null, carryingData = null, preferences = null, search = '' } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/travel' + search });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage || dom.window.localStorage });
  let retries = 0;
  const state = { data, status, world: 'vanilla', activeSave, preferences, carrying: carryingData || { status: 'ready', data: { catalogs: {} } } };
  // Picker keyboard behavior has its own tests. These adapters exercise the real
  // workstation's state, route engine and map callback without rendering SVG.
  function Picker({ id, label, value, options, onChange, disabled }) {
    return React.createElement('label', null, label, React.createElement('select', {
      id, value, disabled, role: 'combobox', onChange: event => onChange(event.target.value)
    }, ...options.map(option => React.createElement('option', { key: option.id, value: option.id }, option.label))));
  }
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: { race: 'Breton', className: 'Custom' }, sheet: null, activeSave: state.activeSave }) },
    '../../shell-context': { useShell: () => ({ world: state.world, profile: state.profile || state.world }) },
    '../../account-settings-context': { useAccountSettings: () => state.preferences },
    '../../use-game-data': { useGameData: tool => tool === 'carrying'
      ? state.carrying
      : { status: state.status, data: state.data, retry: () => retries++ } },
    '../../use-search-intent': { useSearchIntent: () => null },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),
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
    cleanup: async () => { await React.act(async () => root.unmount()); delete globalThis.localStorage; dom.window.close(); }
  };
}

const click = element => React.act(async () => element.click());
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text);
const input = text => [...document.querySelectorAll('label')].find(element => element.textContent.trim().startsWith(text))?.querySelector('input');
const summary = () => document.querySelector('#travel-options > summary').textContent;
const route = () => document.getElementById('travel-results');

for(const scenario of ['catalog-late','save-late','index-absent'])test(`FLOW-04: ${scenario} keeps exact chamber links until prerequisites settle`,async()=>{
  const data=fixture(),a='interior:berandas, propylon chamber',b='interior:andasreth, propylon chamber';
  data.catalogs.Places.push({key:a,name:'Berandas, Propylon Chamber',interior:true},{key:b,name:'Andasreth, Propylon Chamber',interior:true});
  data.catalogs.Teleports=[{kind:'propylon',from:[a],to:b,requires:['index_andra'],objectName:'Andasreth Propylon',fromPos:[[0,0]],toPos:[0,0]}];
  data.metadata.Teleports.items={index_andra:'Andasreth Propylon Index'};
  const save={token:'qa-index',save:{identity:{name:'QA – Traveller'},stuff:{inventory:scenario==='index-absent'?[]:[{id:'index_andra',count:1}]}}};
  const from='stop:'+a,to='stop:'+b;
  const t=await mount({data:scenario==='catalog-late'?null:data,status:scenario==='catalog-late'?'loading':'ready',activeSave:scenario==='save-late'?null:save,search:'?'+new URLSearchParams({from,to,walk:'0'})});
  try{
    t.state.data=data;t.state.status='ready';t.state.activeSave=save;await t.render();
    const query=new URLSearchParams(window.location.search);assert.equal(query.get('from'),from);assert.equal(query.get('to'),to);
    if(scenario==='index-absent'){assert.match(route().textContent,/No Route/);assert.doesNotMatch(route().textContent,/Moonmoth|Seyda Neen|Vivec/);}
    else assert.match(route().textContent,/Use the Andasreth Propylon/);
  }finally{await t.cleanup();}
});

test('ordinary journeys prefer restricted routes for every objective and expose no long-walk switch or warning', async () => {
  const t = await mount({ search: '?from=Seyda%20Neen&to=Vivec' });
  try {
    assert.equal(input('Include long walks and swims'), undefined);
    assert.equal(document.querySelector('.travel-long-journeys-note'), null);
    for (const objective of ['Fewest legs', 'Cheapest', 'Fastest', 'Least real time']) {
      await click(button(objective));
      assert.match(route().textContent, /Take the Silt Strider/);
      assert.match(route().textContent, /5 gold/);
      assert.match(route().textContent, /no outdoor movement/);
      assert.doesNotMatch(route().textContent, /sec swimming/);
    }
    assert.equal(new URLSearchParams(window.location.search).has('long'), false);
  } finally { await t.cleanup(); }
});

function remoteIsland() {
  const data = fixture();
  data.catalogs.Places.push({ key: 'exterior:20,0', name: 'Far Island', interior: false, grid: [20, 0] });
  return data;
}

test('an unreachable remote island automatically retries with long walks and swims, retaining walking-off', async () => {
  const t = await mount({ data: remoteIsland(), search: '?from=Seyda%20Neen&to=place:exterior:20,0&long=0' });
  try {
    assert.match(route().textContent, /real movement.*walking.*swimming/s);
    assert.doesNotMatch(route().textContent, /No Route|switch them off|unreachable/);
    assert.equal(input('Include long walks and swims'), undefined);
    assert.equal(new URLSearchParams(window.location.search).has('long'), false, 'obsolete opt-outs cannot suppress automatic fallback');
    await click(input('Walk between places'));
    assert.match(route().textContent, /No Route/);
    await click(input('Walk between places'));
    assert.doesNotMatch(route().textContent, /No Route/);
    await click(button('Least real time'));
    assert.match(route().textContent, /sec swimming/);
  } finally { await t.cleanup(); }
});

test('the automatic fallback keeps Water Walking and overload constraints', async () => {
  const t = await mount({ data: remoteIsland(), search: '?from=Seyda%20Neen&to=place:exterior:20,0' });
  try {
    assert.match(route().textContent, /sec swimming/);
    await click(input('Constant Water Walking'));
    assert.doesNotMatch(route().textContent, /sec swimming/);
    assert.match(route().textContent, /walking on the water/);
    await type(input('Carrying'), '1000000');
    assert.match(route().textContent, /cannot move.*No Route/s);
  } finally { await t.cleanup(); }
});

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
    assert.ok(fields[1].contains(input('Walk between places')));
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
    await click(input('Walk between places'));
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
    assert.equal(input('Walk between places').checked, false);
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
    assert.match(route().textContent, /Loading route/);
    assert.doesNotMatch(route().textContent, /No Route|not in the active network/);
    assert.equal(route().querySelector('.text-danger-7'), null);
    assert.equal(document.getElementById('travel-origin').disabled, true);
    t.state.status = 'error';
    await t.render();
    assert.match(task.querySelector('[role="alert"]').textContent, /Travel network unavailable/);
    await click(button('Retry'));
    assert.equal(t.retries(), 1);
    assert.equal(document.getElementById('travel-options').open, false);
  } finally { await t.cleanup(); }
});

test('an unsaved visit starts in Seyda Neen with Balmora as its destination', async () => {
  const data=fixture();
  data.catalogs.Places[1].name='Balmora';
  data.metadata.Travel.nodes['exterior:8,0'].name='Balmora';
  const t=await mount({data});
  try {
    assert.equal(document.getElementById('travel-origin').value,'Seyda Neen');
    assert.equal(document.getElementById('travel-destination').value,'Balmora');
    assert.ok(button('Least real time'));
    await click(button('Least real time'));
    assert.match(window.location.search,/plan=real/);
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
    assert.equal(input('Walk between places'), undefined);
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

function memoryStorage() {
  const records = new Map();
  return { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
}
function savedTraveller(name = 'Traveller', spells = ['divine intervention'], inventory = []) {
  return { token: 1, sheet: { skills: { Mysticism: { v: 40 } }, attrs: { Willpower: { v: 40 }, Luck: { v: 40 } } },
    save: { identity: { name }, vitals: { magicka: { current: 40, max: 40 }, fatigue: { current: 100, max: 100 } },
      progress: { factions: [{ id: 'Mages Guild', rank: 0 }] }, stuff: { spells, inventory } } };
}
const spellCatalog = { status: 'ready', data: { catalogs: { Spells: [{ key: 'divine intervention', type: 'spell', cost: 8 }] } } };

test('account overrides retain per-save choices and turning the policy off restores them', async () => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const { travelSaveKey, writeTravelOverrides } = await import('../lib/travel-options.mjs');
  const activeSave = savedTraveller(), storage = memoryStorage();
  const original = JSON.stringify(activeSave.save);
  writeTravelOverrides(travelSaveKey(activeSave.save), { mageGuild: false, carried: 12 }, storage);
  const settings = { ...defaultAccountSettings(), overrideSaveToggles: true, toolDefaults: { travel: { mageGuild: true } } };
  const t = await mount({ activeSave, storage, preferences: { ready: true, owner: 'one', settings } });
  try {
    assert.equal(input('Mages Guild member').checked, true);
    assert.match(input('Mages Guild member').closest('label').textContent, /account default/);
    assert.equal(input('Carrying').value, '12');
    t.state.preferences = { ...t.state.preferences, settings: { ...settings, overrideSaveToggles: false } };
    await t.render();
    assert.equal(input('Mages Guild member').checked, false);
    assert.equal(input('Carrying').value, '12');
    assert.equal(JSON.stringify(activeSave.save), original);
  } finally { await t.cleanup(); }
});

test('account Intervention choices do not invent an unavailable spell or scroll', async () => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const activeSave = savedTraveller('No spells', [], []);
  const settings = { ...defaultAccountSettings(), overrideSaveToggles: true, toolDefaults: { travel: { divine: true, almsivi: true } } };
  const t = await mount({ activeSave, preferences: { ready: true, owner: 'one', settings } });
  try {
    assert.equal(input('Divine Intervention').checked, false);
    assert.equal(input('Divine Intervention').disabled, true);
    assert.equal(input('Almsivi Intervention').checked, false);
    assert.equal(input('Almsivi Intervention').disabled, true);
    assert.deepEqual(activeSave.save.stuff.inventory, []);
  } finally { await t.cleanup(); }
});

test('current edits and all shared-route defaults survive late account settings', async () => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const t = await mount({ preferences: { ready: false, owner: 'one', settings: defaultAccountSettings() }, search: '?from=Seyda%20Neen&to=Vivec' });
  try {
    await click(input('Mages Guild member'));
    t.state.preferences = { ready: true, owner: 'one', settings: { ...defaultAccountSettings(), toolDefaults: { travel: { mageGuild: true, objective: 'gold', walking: false, questTeleports: true } } } };
    await t.render();
    assert.equal(input('Mages Guild member').checked, false);
    assert.equal(input('Walk between places').checked, true);
    assert.equal(input('Include quest teleports').checked, false);
    assert.equal(button('Fewest legs').getAttribute('aria-pressed'), 'true');
  } finally { await t.cleanup(); }
});

test('TRV-6 retains unchecked spells, removed items and carrying edits through reload and new load tokens', async () => {
  const storage = memoryStorage(), activeSave = savedTraveller('Traveller', ['divine intervention'], [{ id: 'test_index', count: 1 }]);
  let t = await mount({ activeSave, storage, carryingData: spellCatalog });
  try {
    assert.equal(input('Divine Intervention').checked, true);
    assert.equal(input('Test Propylon Index').checked, true);
    await click(input('Divine Intervention'));
    await click(input('Test Propylon Index'));
    await click(input('Mages Guild member'));
    await type(input('Carrying'), '12.5');
    assert.match(summary(), /remembered choices/);
  } finally { await t.cleanup(); }
  t = await mount({ activeSave: { ...activeSave, token: 99 }, storage, carryingData: spellCatalog });
  try {
    assert.equal(input('Divine Intervention').checked, false);
    assert.equal(input('Test Propylon Index').checked, false);
    assert.equal(input('Mages Guild member').checked, false);
    assert.equal(input('Carrying').value, '12.5');
    assert.doesNotMatch(input('Divine Intervention').closest('label').textContent, /from your save/);
    await click(button('Use save defaults'));
    assert.equal(input('Divine Intervention').checked, true);
    assert.equal(input('Test Propylon Index').checked, true);
    assert.equal(input('Mages Guild member').checked, true);
    assert.equal(input('Carrying').value, '0');
    assert.doesNotMatch(summary(), /remembered choices/);
  } finally { await t.cleanup(); }
});

test('TRV-6 isolates another save and profile, and late catalogs do not overwrite edits', async () => {
  const activeSave = savedTraveller(), storage = memoryStorage();
  const t = await mount({ activeSave, storage, carryingData: { status: 'loading', data: null } });
  try {
    await click(input('Mages Guild member'));
    await type(input('Carrying'), '14');
    t.state.carrying = spellCatalog;
    await t.render();
    assert.equal(input('Mages Guild member').checked, false);
    assert.equal(input('Carrying').value, '14');
    t.state.activeSave = savedTraveller('Another traveller');
    await t.render();
    assert.equal(input('Mages Guild member').checked, true);
    assert.equal(input('Carrying').value, '0');
    t.state.activeSave = activeSave;
    await t.render();
    assert.equal(input('Mages Guild member').checked, false);
    t.state.world = 'tr';
    await t.render();
    assert.equal(input('Mages Guild member').checked, true);
    t.state.world = 'vanilla';
    await t.render();
    assert.equal(input('Mages Guild member').checked, false);
    t.state.activeSave = null;
    await t.render();
    assert.equal(input('Mages Guild member').checked, true, 'clearing the save returns planner defaults');
    assert.equal(input('Divine Intervention').checked, false);
  } finally { await t.cleanup(); }
});

test('TRV-6 scroll routes show a finite use and recomputing does not spend the save inventory', async () => {
  const data = fixture(), cell = 'exterior:0,0';
  data.catalogs.Intervention = [{ key: cell, divine: 0 }];
  data.metadata.Intervention.markers.divine = [{ town: 'Vivec', cell: 'exterior:8,0', name: 'Vivec, Shrine', pos: [69632,4096] }];
  const activeSave = savedTraveller('Scroll traveller', [], [{ id: 'sc_divineintervention', count: 1 }]);
  const t = await mount({ data, activeSave });
  try {
    const box = input('Divine Intervention');
    assert.equal(box.checked, false);
    assert.match(box.closest('label').textContent, /1 use per journey/);
    await click(box);
    assert.match(route().textContent, /Use a Divine Intervention scroll/);
    assert.match(route().textContent, /Uses 1 scroll; 0 remaining/);
    await click(button('Fastest'));
    assert.match(route().textContent, /Uses 1 scroll; 0 remaining/);
    assert.equal(activeSave.save.stuff.inventory[0].count, 1);
  } finally { await t.cleanup(); }
});

test('TRV-6 denied storage keeps choices in this session across catalog updates and explains the limit', async () => {
  const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const t = await mount({ activeSave: savedTraveller(), storage: denied, carryingData: spellCatalog });
  try {
    await click(input('Divine Intervention'));
    t.state.carrying = { ...spellCatalog, data: { catalogs: { ...spellCatalog.data.catalogs } } };
    await t.render();
    assert.equal(input('Divine Intervention').checked, false);
    assert.match(document.getElementById('travel-options').textContent, /These changes last until the page reloads/);
  } finally { await t.cleanup(); }
});

function mixedJourney() {
  const data = fixture(), a = 'exterior:0,0', b = 'exterior:8,0', c = 'exterior:2,0';
  data.catalogs.Travel[0] = { ...data.catalogs.Travel[0], price: 10, fromPos: [4096, 4096], toPos: [69632, 4096] };
  data.catalogs.Travel.push({ from: c, to: b, mode: 'boat', provider: 'driver', price: 5, hours: 2,
    fromPos: [20480, 4096], toPos: [69632, 4096] });
  data.metadata.Travel.nodes[c] = { key: c, name: 'Balmora' };
  data.metadata.Access.land = Object.fromEntries([0, 1, 2].map(x => [`exterior:${x},0`, 'ffffffffffffffff']));
  return data;
}

test('TRV-7 shows real movement and clock time together, and Cheapest compares the same options', async () => {
  const t = await mount({ data: mixedJourney(), search: '?from=Seyda%20Neen&to=Vivec' });
  try {
    assert.match(route().textContent, /1 h in-game/);
    assert.match(route().textContent, /Real Time Approximation: no outdoor movement \+ 1 transport\/spell transition/);
    assert.equal(document.querySelector('.travel-tradeoff'), null);
    await click(button('Cheapest'));
    assert.match(document.querySelector('.travel-real-time').textContent, /~1 min 5 sec movement \+ 1 transport\/spell transition/);
    const note = document.querySelector('.travel-tradeoff');
    assert.match(note.textContent, /saves 5 gold, adds ~1 min 5 sec of movement, 1 more leg/);
    assert.equal(note.closest('details'), null);
    assert.match(route().textContent, /excludes combat, menus, loading screens and time indoors/);
    await type(input('Followers'), '2');
    assert.match(document.querySelector('.travel-tradeoff').textContent, /saves 15 gold/);
    await type(input('Carrying'), '100');
    assert.match(document.querySelector('.travel-real-time').textContent, /~1 min 16 sec movement/);
    await click(button('Fastest'));
    assert.equal(document.querySelector('.travel-tradeoff'), null);
    assert.match(document.querySelector('.travel-real-time').textContent, /no outdoor movement/);
  } finally { await t.cleanup(); }
});

test('TRV-7 unknown fares stay explicit and comparisons clear on endpoint changes or older catalogs', async () => {
  const data = mixedJourney();
  delete data.catalogs.Travel.at(-1).price;
  const t = await mount({ data, search: '?from=Seyda%20Neen&to=Vivec' });
  try {
    await click(button('Cheapest'));
    assert.match(document.querySelector('.travel-tradeoff').textContent, /fare comparison unavailable/);
    assert.doesNotMatch(document.querySelector('.travel-tradeoff').textContent, /saves/);
    await click(button('Select Seyda Neen on map'));
    assert.equal(document.querySelector('.travel-tradeoff'), null);
    assert.equal(document.querySelector('.travel-real-time'), null);
    t.state.data = { catalogs: { Travel: [] }, metadata: {} };
    await t.render();
    assert.equal(document.querySelector('.travel-tradeoff'), null);
  } finally { await t.cleanup(); }
});

test('TRV-7 baseline comparison leaves selected single-use scroll routes intact', async () => {
  const data = fixture(), cell = 'exterior:0,0';
  data.catalogs.Intervention = [{ key: cell, divine: 0 }];
  data.metadata.Intervention.markers.divine = [{ town: 'Vivec', cell: 'exterior:8,0', name: 'Vivec, Shrine', pos: [69632,4096] }];
  const activeSave = savedTraveller('Scroll traveller', [], [{ id: 'sc_divineintervention', count: 1 }]);
  const t = await mount({ data, activeSave });
  try {
    await click(input('Divine Intervention'));
    await click(button('Cheapest'));
    assert.match(document.querySelector('.travel-tradeoff').textContent, /same fare, same outdoor movement time/);
    assert.match(document.querySelector('.travel-real-time').textContent, /1 transport\/spell transition/);
    assert.match(route().textContent, /Uses 1 scroll; 0 remaining/);
    assert.equal(activeSave.save.stuff.inventory[0].count, 1);
  } finally { await t.cleanup(); }
});

test('TRV-8 names each network once and keeps empty ready catalogs distinct from loading', async () => {
  const t = await mount();
  try {
    const status = () => document.getElementById('travel-network-status');
    const oneStatus = () => assert.equal(document.querySelectorAll('#travel-network-status').length, 1);
    oneStatus();
    assert.match(status().textContent, /Network: Vvardenfell \(Vanilla\) · 2 routing stops/);
    assert.doesNotMatch(document.querySelector('.travel-workstation').textContent, /Live:/);
    t.state.world = 'tr'; t.state.profile = 'tr';
    await t.render(); oneStatus();
    assert.match(status().textContent, /Network: Tamriel Rebuilt · 2 routing stops/);
    t.state.profile = 'tr_arce';
    await t.render(); oneStatus();
    assert.match(status().textContent, /Network: Tamriel Rebuilt \+ ARCE · 2 routing stops/);
    t.state.data = { catalogs: { Travel: [] }, metadata: {} };
    await t.render(); oneStatus();
    assert.match(status().textContent, /0 routing stops/);
    assert.equal(status().getAttribute('role'), 'status');
    assert.equal(button('Retry'), undefined);
  } finally { await t.cleanup(); }
});

test('TRV-8 does not announce a stop count while loading, even with stale data', async () => {
  const t = await mount({ status: 'loading' });
  try {
    for (const data of [fixture(), null]) {
      t.state.data = data; await t.render();
      const status = document.getElementById('travel-network-status');
      assert.equal(document.querySelectorAll('#travel-network-status').length, 1);
      assert.equal(status.getAttribute('role'), 'status');
      assert.match(status.textContent, /Loading travel network/);
      assert.doesNotMatch(status.textContent, /\d+ stops/);
      assert.equal(button('Retry'), undefined);
    }
  } finally { await t.cleanup(); }
});

test('TRV-8 keeps Retry in its single failure alert and replaces it when recovered', async () => {
  const t = await mount({ status: 'error', data: null });
  try {
    const status = () => document.getElementById('travel-network-status');
    assert.equal(document.querySelectorAll('#travel-network-status').length, 1);
    assert.equal(status().getAttribute('role'), 'alert');
    assert.ok(status().contains(button('Retry')));
    await click(button('Retry'));
    assert.equal(t.retries(), 1);
    t.state.status = 'ready'; t.state.data = fixture();
    await t.render();
    assert.equal(document.querySelectorAll('#travel-network-status').length, 1);
    assert.match(status().textContent, /2 routing stops/);
    assert.equal(status().getAttribute('role'), 'status');
    assert.equal(button('Retry'), undefined);
  } finally { await t.cleanup(); }
});

// SITE-4 on the TRV-8 layout: the character is named once as a link, in the header, before the
// journey; the live network status and the folded options' <summary> cannot hold a link.
test('SITE-4: the header names the character as a link to the Builder, outside the status and the folded options', async () => {
  for (const status of ['ready', 'loading', 'error']) {
    const t = await mount({ status, data: status === 'ready' ? fixture() : null });
    try {
      const links = [...document.querySelectorAll('.travel-workstation a.active-character-link')];
      assert.equal(links.length, 1, `${status}: one character link`);
      const [link] = links;
      assert.equal(link.getAttribute('href'), '/builder');
      assert.match(link.closest('p').textContent, /^\s*Planning for Breton Custom · change in the Character Builder\s*$/, status);
      assert.equal(link.closest('#travel-network-status, #travel-options, summary'), null, `${status}: not in the status line, a live region, or the options`);
      before(link, document.querySelector('section[aria-label="Plan a journey"]'));
      if (status === 'ready') assert.match(summary(), /Breton Custom/, 'the folded summary names the same character');
    } finally { await t.cleanup(); }
  }
});
