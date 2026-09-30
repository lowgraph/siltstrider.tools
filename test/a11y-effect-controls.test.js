const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

async function editor(tool) {
  const data = { status: 'ready', data: { profile: 'vanilla', catalogs: {
    Attributes: [], Skills: [], MagicEffects: [], GameSettings: [],
    EffectRules: [{ key: 'fire', name: 'Fire Damage', baseCost: 5, school: 'destruction',
      allowEnchanting: true, allowSpellmaking: true, castSelf: true, castTouch: true, castTarget: true }],
  } } };
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: {}, sheet: {} }) },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),
    '../../use-game-data': { useGameData: () => data },
  };
  const file = path.resolve(`components/calculators/${tool}/${tool}-workstation.jsx`);
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  }
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

test('effect labels stay attached to unique controls across retained editors and removed rows', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const Enchanting = await editor('enchanting');
  const Spellmaking = await editor('spellmaking');
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const select = async (control, value) => React.act(async () => {
    control.value = value;
    control.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  const labels = scope => [...scope.querySelectorAll('label[for]')]
    .filter(label => ['Range', 'Min Mag', 'Max Mag', 'Duration', 'Area'].includes(label.textContent));
  function checkLabels(expected) {
    const fields = labels(document);
    assert.equal(fields.length, expected);
    assert.equal(new Set(fields.map(label => label.htmlFor)).size, fields.length);
    for (const label of fields) {
      assert.ok(label.control, `${label.textContent} has a real control`);
      assert.equal(label.control.parentElement, label.parentElement, 'the label targets its own row');
      label.control.focus();
      assert.equal(document.activeElement, label.control);
    }
  }
  try {
    await React.act(async () => root.render(React.createElement(React.Fragment, null,
      React.createElement(Enchanting), React.createElement(Spellmaking))));
    const editors = [...document.querySelectorAll('.enchanting-workstation, .spellmaking-workstation')];
    assert.equal(editors.length, 2);
    for (const scope of editors) {
      await select(scope.querySelector('select[aria-label="Effect 1"]'), 'fire');
      await select(labels(scope).find(label => label.textContent === 'Range').control, 'target');
      const vendors = scope.classList.contains('enchanting-workstation') ? 'enchanters' : 'spellmakers';
      assert.ok(scope.querySelector(`input[aria-label="Search ${vendors}"]`), `the ${vendors} search is named for what it searches`);
      const list = scope.querySelector(`[role="region"][aria-label="Ranked ${vendors}"]`);
      assert.ok(list, `the ${vendors} list is a named region`);
      assert.equal(list.tabIndex, 0, 'a scrolling list a keyboard can reach');
    }
    checkLabels(10);
    const scope = editors[0];
    await React.act(async () => [...scope.querySelectorAll('button')].find(button => button.textContent.trim() === 'Add Effect').click());
    await select(scope.querySelector('select[aria-label="Effect 2"]'), 'fire');
    await select(labels(scope).filter(label => label.textContent === 'Range')[1].control, 'target');
    checkLabels(15);
    await React.act(async () => [...scope.querySelectorAll('button')].find(button => button.textContent.trim() === 'Remove').click());
    checkLabels(10);
    await React.act(async () => [...scope.querySelectorAll('button')].find(button => button.textContent.trim() === 'Constant').click());
    checkLabels(7);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});
