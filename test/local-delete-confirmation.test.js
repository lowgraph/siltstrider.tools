const {test} = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const {React, load} = require('./helpers/launch-render.cjs');
const {createRoot} = require('react-dom/client');

const KEY = 'siltstrider-saved-characters';
const records = ['a', 'b', 'c'].map(id => ({id, name: `QA – ${id}`, character: {race: 'Nord'}}));
const click = button => React.act(async () => button.click());
const key = (key, shiftKey = false) => React.act(async () => document.dispatchEvent(
  new window.KeyboardEvent('keydown', {key, shiftKey, bubbles: true, cancelable: true})));
const action = label => [...document.querySelectorAll('[role=alertdialog] button')].find(button => button.textContent === label);
const opener = id => document.querySelector(`button[aria-label="Delete QA – ${id}"]`);

async function mount(saved, check) {
  const dom = new JSDOM('<div id="root"></div>', {url: 'http://localhost/builder'});
  Object.assign(global, {window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true});
  const storage = dom.window.localStorage;
  storage.setItem(KEY, JSON.stringify(saved));
  let events = 0;
  window.addEventListener('silt-local-saves-changed', () => events++);
  const dialog = await load('components/confirmation-dialog.jsx', {'./use-modal-dialog': await load('components/use-modal-dialog.js')});
  const Panel = (await load('components/character-builder/local-characters-panel.jsx', {
    '../character-context': {DEFAULT_BUILD: {}, useActiveCharacter: () => null},
    '../confirmation-dialog': dialog.default,
  })).default;
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(Panel, {build: {name: 'QA – Active'}})));
    await check({root, storage, events: () => events});
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('QA-31 opening and cancelling local deletion preserves storage and restores keyboard focus', async () => {
  await mount(records, async ({storage, events}) => {
    const before = storage.getItem(KEY), button = opener('a');
    button.focus(); await click(button);
    assert.equal(storage.getItem(KEY), before, 'Opening must not delete the only local copy');
    const dialog = document.querySelector('[role=alertdialog]');
    assert.ok(dialog);
    assert.match(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent, /Delete character/);
    assert.match(document.getElementById(dialog.getAttribute('aria-describedby')).textContent, /QA – a.*cannot be undone/);
    assert.equal(document.activeElement, action('Cancel'));
    await key('Tab', true); assert.equal(document.activeElement, action('Delete character'));
    await key('Tab'); assert.equal(document.activeElement, action('Cancel'));
    await key('Escape');
    assert.equal(document.querySelector('[role=alertdialog]'), null);
    assert.equal(document.activeElement, button);
    await click(button); await click(action('Cancel'));
    assert.equal(document.activeElement, button);
    assert.equal(storage.getItem(KEY), before);
    assert.equal(events(), 0);
  });
});

for (const [saved, selected, next] of [[records, 'a', 'b'], [records, 'c', 'b'], [[records[0]], 'a', null]]) {
  test(`QA-31 confirmed deletion of ${selected} focuses ${next || 'Save this character'} and preserves other records`, async () => {
    await mount(saved, async ({storage, events}) => {
      opener(selected).focus(); await click(opener(selected)); await click(action('Delete character'));
      assert.deepEqual(JSON.parse(storage.getItem(KEY)), saved.filter(record => record.id !== selected));
      assert.equal(events(), 1);
      assert.equal(document.querySelector('[role=alertdialog]'), null);
      assert.equal(document.activeElement, next ? opener(next) : document.getElementById('btn-save-local-character'));
    });
  });
}

for (const failure of ['read', 'write']) {
  test(`QA-31 storage ${failure} failure keeps deletion announced and retryable without losing data`, async () => {
    await mount(records, async ({storage, events}) => {
      const before = storage.getItem(KEY);
      opener('b').focus(); await click(opener('b'));
      Object.defineProperty(window, 'localStorage', {configurable: true, get() {
        if (failure === 'read') throw Error('SecurityError');
        return {getItem: storage.getItem.bind(storage), setItem() {throw Error('Storage write refused');}};
      }});
      await click(action('Delete character'));
      assert.ok(document.querySelector('[role=alertdialog] [role=alert]'));
      assert.equal(storage.getItem(KEY), before);
      assert.equal(events(), 0);
      assert.equal(document.activeElement, action('Cancel'));
      Object.defineProperty(window, 'localStorage', {configurable: true, get: () => storage});
      await click(action('Delete character'));
      assert.deepEqual(JSON.parse(storage.getItem(KEY)), records.filter(record => record.id !== 'b'));
      assert.equal(events(), 1);
      assert.equal(document.activeElement, opener('c'));
    });
  });
}

test('QA-31 a character removed in another tab cannot delete a different saved character', async () => {
  await mount(records, async ({storage, events}) => {
    opener('a').focus(); await click(opener('a'));
    const remaining = records.slice(1);
    storage.setItem(KEY, JSON.stringify(remaining));
    await React.act(async () => window.dispatchEvent(new Event('storage')));
    await click(action('Delete character'));
    assert.match(document.querySelector('[role=alertdialog] [role=alert]').textContent, /no longer saved/);
    assert.deepEqual(JSON.parse(storage.getItem(KEY)), remaining);
    assert.equal(events(), 0);
  });
});
