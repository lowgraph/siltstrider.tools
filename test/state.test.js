const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('node:path');
const plain = value => JSON.parse(JSON.stringify(value));
async function load(t, hash = '') {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  vc.on('error', e => errors.push(String(e)));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../index.html'), {
    url: 'https://state.test/' + hash, runScripts: 'dangerously',
    pretendToBeVisual: true, virtualConsole: vc
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  return dom.window;
}
function choose(w, id, value) {
  const el = w.document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}
for (const [label, world, arce, race, cls] of [
  ['premade', 'vanilla', false, 'Nord', 'Mage'],
  ['Custom', 'vanilla', false, 'Dark Elf', 'Custom'],
  ['Tamriel Rebuilt', 'tr', false, 'Breton', 'Knight'],
  ['ARCE', 'tr', true, 'Naga', 'Farmer']
]) {
  test(label + ' character JSON round trip restores state, calculations and permalink', async t => {
    const w = await load(t);
    w.setWorld(world); w.setArce(arce); w.showView('builder');
    choose(w, 'c-race', race); choose(w, 'c-class', cls);
    if (cls === 'Custom') {
      choose(w, 'c-spec', 'Magic'); choose(w, 'c-fav1', 'Intelligence');
      choose(w, 'maj0', 'Destruction'); choose(w, 'min0', 'Alchemy');
    }
    const before = plain(w.getCurrentCharacter());
    const summary = w.document.getElementById('c-summary').innerHTML;
    const sheet = plain(w.computeSheet(w.readPanelBuild('c')));
    w.setWorld('vanilla'); choose(w, 'c-race', 'Orc');
    w.loadCharacter(plain(before));
    assert.deepEqual(plain(w.getCurrentCharacter()), before);
    assert.deepEqual(plain(w.computeSheet(w.readPanelBuild('c'))), sheet);
    assert.equal(w.document.getElementById('c-summary').innerHTML, summary);
    assert.equal(w.localStorage.getItem('mw-world'), world);
    assert.equal(w.localStorage.getItem('mw-arce'), arce ? '1' : '0');
    const restored = await load(t, w.location.hash);
    assert.deepEqual(plain(restored.getCurrentCharacter()), before);
    const detached = w.getCurrentCharacter(); detached.maj[0] = 'invalid';
    assert.deepEqual(plain(w.getCurrentCharacter()), before);
  });
}
for (const custom of [false, true]) {
  test('Challenge JSON and legacy permalink round trip: ' + (custom ? 'Custom' : 'Farmer'), async t => {
    const w = await load(t); w.setWorld('tr'); w.setArce(true);
    w.applyRunPayload({ race: 'Naga', gender: 'Female', cls: 'Farmer', sign: 'The Mage' });
    if (custom) w.rollCustomClass();
    w.rollMajor(); w.rollRestrictions(); w.rollObjectives(); w.renderRun(); w.showView('challenge');
    w.setLock('race', true); w.setLock('rest', true);
    const before = plain(w.getCurrentChallengeRun());
    const summary = w.document.getElementById('run-summary').textContent;
    const encoded = w.encodeRunPayload();
    w.setWorld('vanilla'); w.applyRunPayload({});
    w.loadChallengeRun(plain(before));
    assert.deepEqual(plain(w.getCurrentChallengeRun()), before);
    assert.equal(w.document.getElementById('run-summary').textContent, summary);
    assert.equal(w.encodeRunPayload(), encoded);
    assert.equal(w.isLocked('race'), true); assert.equal(w.isLocked('rest'), true);
    assert.equal('aspectLocks' in before, false);
    const restored = await load(t, w.location.hash);
    assert.deepEqual(plain(restored.getCurrentChallengeRun()), before);
    const detached = w.getCurrentChallengeRun(); detached.restrictions.push('invalid');
    assert.deepEqual(plain(w.getCurrentChallengeRun()), before);
  });
}
test('unrolled and partly rolled runs retain hidden defaults and Not rolled cards', async t => {
  const w = await load(t);
  for (const aspect of [null, 'race', 'maj']) {
    if (aspect) w.rollAspect(aspect);
    const before = plain(w.getCurrentChallengeRun());
    const visible = w.document.getElementById('run-summary').textContent;
    w.randomizeAll(); w.loadChallengeRun(plain(before));
    assert.deepEqual(plain(w.getCurrentChallengeRun()), before);
    assert.equal(w.document.getElementById('run-summary').textContent, visible);
  }
});
test('invalid canonical state is rejected before changing either sheet, world, URL or storage', async t => {
  const w = await load(t); w.showView('builder');
  const before = plain(w.getCurrentCharacter());
  const run = plain(w.getCurrentChallengeRun());
  const hash = w.location.hash;
  const storage = JSON.stringify(w.localStorage);
  const invalid = [
    { version: 2 }, { world: 'unknown' }, { arce: true }, { race: '__proto__' },
    { race: '<img src=x onerror=alert(1)>' }, { gender: 'invalid' }, { className: 'Farmer' },
    { spec: 'invalid' }, { sign: 'invalid' }, { fav1: before.fav2 },
    { maj: [before.maj[0]] }, { min: before.maj }, { arce: 'false' },
    { maj: Object.assign(Array(5), { 1: before.maj[1], 2: before.maj[2], 3: before.maj[3], 4: before.maj[4] }) }
  ];
  for (const fields of invalid) assert.throws(() => w.loadCharacter({ ...before, ...fields }));
  for (const fields of [{ version: 2 }, { major: 'unknown' }, { minors: ['unknown'] },
    { restrictions: ['unknown'] }, { rolled: {} }, { restrictions: Array(6).fill('No magic') }, { minors: Array(1) }]) {
    assert.throws(() => w.loadChallengeRun({ ...run, ...fields }));
  }
  assert.throws(() => w.loadChallengeRun({ ...run,
    character: { ...before, world: 'tr', arce: true, race: 'Naga' }, restrictions: ['No Tribunal or Bloodmoon DLC'] }));
  assert.deepEqual(plain(w.getCurrentCharacter()), before);
  assert.deepEqual(plain(w.getCurrentChallengeRun()), run);
  assert.equal(w.location.hash, hash); assert.equal(JSON.stringify(w.localStorage), storage);
});
test('canonical loading preserves current panel and writes no character storage', async t => {
  const w = await load(t); w.showView('travel');
  w.loadCharacter(plain(w.getCurrentCharacter()));
  w.loadChallengeRun(plain(w.getCurrentChallengeRun()));
  assert.equal(w.document.querySelector('.panel.show').id, 'panel-travel');
  assert.deepEqual(Object.keys(w.localStorage).sort(), ['mw-arce', 'mw-world']);
});
