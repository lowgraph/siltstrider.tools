const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

// CALC-2 review: the typed skill and attribute numbers in Alchemy, Enchanting and
// Spellmaking. Gemini's test/editable-calculator-skills.test.js covers negatives, text and
// 1000; this adds the ceiling, scientific notation, decimals, an empty field, the reset
// button and a world switch.

test('statNumber reads typed stats as whole numbers from 0 to 1000', async () => {
  const { statNumber, STAT_MAX } = await import('../lib/calculator-stats.mjs');
  assert.equal(STAT_MAX, 1000);
  for (const [input, expected] of [['45', 45], ['150', 150], ['1000', 1000], ['5000', 1000], ['1e3', 1000], ['2e2', 200],
    ['45.9', 45], ['-5', 0], ['', 0], ['   ', 0], ['abc', 0], [null, 0], [undefined, 0], ['Infinity', 0], [NaN, 0], [72, 72]]) {
    assert.equal(statNumber(input), expected, JSON.stringify(input));
  }
});

const SHEET = {
  skills: { Alchemy: { v: 25 }, Enchant: { v: 35 }, Destruction: { v: 30 }, Alteration: { v: 20 }, Conjuration: { v: 15 },
    Illusion: { v: 10 }, Mysticism: { v: 12 }, Restoration: { v: 18 }, Mercantile: { v: 10 } },
  attrs: { Intelligence: { v: 60 }, Luck: { v: 40 }, Willpower: { v: 50 }, Personality: { v: 45 } }
};
const shell = { profile: 'vanilla', world: 'vanilla' };

async function workstation(tool) {
  const setting = (key, v) => ({ key: key.toLowerCase(), value: v });
  const data = { profile: 'vanilla', catalogs: { Attributes: [], Skills: [],
    MagicEffects: [{ key: '14', name: 'Fire Damage', baseCost: 2 }],
    EffectRules: [{ key: '14', noMagnitude: false, noDuration: false, harmful: true }],
    Ingredients: [{ key: 'a', name: 'Fire Salts', effects: [{ slot: 0, effectId: 14 }] }],
    Apparatus: [{ key: 'apparatus_j_mortar_01', type: 'mortar_and_pestle', name: 'Mortar', quality: 1 }],
    GameSettings: [setting('fPotionStrengthMult', 0.5), setting('iAlchemyMod', 2), setting('fPotionT1MagMult', 1.5), setting('fPotionT1DurMult', 0.5)] } };
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: { race: 'Breton', className: 'Custom' }, sheet: SHEET }) },
    '../../shell-context': { useShell: () => ({ ...shell }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),'./ingredient-combobox': require('./helpers/ingredient-combobox.cjs'),
    '../../use-game-data': { useGameData: () => ({ status: 'ready', data }) },
    '../../use-search-intent': { useSearchIntent: () => null },
  };
  const file = path.resolve(`components/calculators/${tool}/${tool}-workstation.jsx`);
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

async function mount(Component, check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const { forgetTypedStats } = await import('../lib/calculator-stats.mjs');
  for (const tool of ['alchemy', 'enchanting', 'spellmaking']) forgetTypedStats(tool);
  const { createRoot } = require('react-dom/client');
  let root = createRoot(document.getElementById('root'));
  const render = () => React.act(async () => root.render(React.createElement(Component)));
  // As the app does to Alchemy on a world switch (key={shell.profile}): a new instance.
  const remount = async () => {
    await React.act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await render();
  };
  try {
    await render();
    await check(render, remount);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    shell.profile = 'vanilla'; shell.world = 'vanilla';
    SHEET.attrs.Luck.v = 40;
  }
}

const type = (id, text) => React.act(async () => {
  const input = document.getElementById(id);
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, text);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
});
const value = id => document.getElementById(id).value;
const click = el => React.act(async () => el.click());
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const customNote = () => /Custom numbers applied/.test(document.body.textContent);

const TOOLS = [
  ['alchemy', 'alc', 'alc-skill-input', '25', 'alc-int-input', '60'],
  ['enchanting', 'ench', 'ench-skill-input', '35', 'ench-int-input', '60'],
  ['spellmaking', 'spell', 'spell-skill-input', '30', 'spell-wil-input', '50'],
];

for (const [tool, prefix, skillId, skillBase, attrId, attrBase] of TOOLS) {
  test(`${tool}: typed numbers clamp and parse, and "Reset to character sheet" brings the sheet back`, async () => {
    const Tool = await workstation(tool);
    await mount(Tool, async () => {
      await click(document.getElementById(`${prefix}-toggle-custom-stats`));
      assert.equal(value(skillId), skillBase, 'the inputs start from the character sheet');
      assert.equal(customNote(), false);
      // The number the tool uses; a field may keep showing "1e3" for 1000, as browsers do.
      for (const [typed, used] of [['150', 150], ['5000', 1000], ['1e3', 1000], ['45.9', 45], ['-5', 0], ['', 0]]) {
        await type(skillId, typed);
        assert.equal(Number(value(skillId)), used, `${tool} skill typed ${JSON.stringify(typed)}`);
      }
      await type(attrId, '75');
      assert.equal(customNote(), true, 'the tool says it is using typed numbers');
      await click(button('Reset to character sheet'));
      assert.equal(value(skillId), skillBase);
      assert.equal(value(attrId), attrBase);
      assert.equal(customNote(), false);
    });
  });
}

// The owner's call (30 September): a world switch keeps the numbers a player typed; the sheet
// fills in the rest, and only "Reset to character sheet" lets typed numbers go.
for (const [tool, prefix, skillId, skillBase] of TOOLS) {
  test(`${tool}: typed numbers survive a world switch; the sheet sets only the rest; Reset lets them go`, async () => {
    const Tool = await workstation(tool);
    await mount(Tool, async (render, remount) => {
      const switchWorld = async () => {
        shell.profile = shell.profile === 'tr' ? 'vanilla' : 'tr'; shell.world = shell.profile;
        if (tool === 'alchemy') await remount(); else await render();
      };
      await click(document.getElementById(`${prefix}-toggle-custom-stats`));
      await type(skillId, '88');
      await switchWorld();
      assert.ok(document.getElementById(skillId), 'the inputs are still open');
      assert.equal(value(skillId), '88', 'the typed number stays');
      assert.equal(customNote(), true);

      SHEET.attrs.Luck.v = 55;
      await render();
      assert.equal(value(`${prefix}-luck-input`), '55', 'an untyped number follows the sheet');
      assert.equal(value(skillId), '88', 'a typed one does not');

      await click(button('Reset to character sheet'));
      assert.equal(value(skillId), skillBase);
      await switchWorld();
      if (tool === 'alchemy') await click(document.getElementById(`${prefix}-toggle-custom-stats`));
      assert.equal(value(skillId), skillBase, 'after Reset the sheet is back, world switch or not');
      assert.equal(customNote(), false);
    });
  });
}

test('Alchemy is rebuilt per world, which is why typed numbers are kept outside the tool', () => {
  assert.match(fs.readFileSync('components/app-shell.jsx', 'utf8'), /<AlchemyWorkstation key=\{shell\.profile\} \/>/);
});

test('the typed-number labels stay on one line on a phone (they broke mid-word at 375 px)', () => {
  for (const [tool, prefix] of [['alchemy', 'alc'], ['enchanting', 'ench'], ['spellmaking', 'spell']]) {
    const src = fs.readFileSync(`components/calculators/${tool}/${tool}-workstation.jsx`, 'utf8');
    const labels = [...src.matchAll(new RegExp(`<label htmlFor="${prefix}-(?:skill|int|luck|wil)-input" className="([^"]+)"`, 'g'))];
    assert.equal(labels.length, 3, tool);
    for (const [, cls] of labels) assert.match(cls, /\bwhitespace-nowrap\b/, `${tool}: ${cls}`);
  }
});

test('typed numbers belong to one page: a server render has none, and a new page starts empty', async () => {
  const { typedStats, typeStat, forgetTypedStats } = await import('../lib/calculator-stats.mjs');
  const saved = global.window;
  try {
    delete global.window;
    assert.deepEqual(typedStats('alchemy'), {}, 'no window, no store');
    assert.equal(typeStat('alchemy', 'skill', 42), 42, 'typing still returns the number');
    assert.deepEqual(typedStats('alchemy'), {}, 'and keeps nothing on a server');
    global.window = new JSDOM('').window;
    typeStat('alchemy', 'skill', 42);
    assert.deepEqual(typedStats('alchemy'), { skill: 42 });
    global.window = new JSDOM('').window;
    assert.deepEqual(typedStats('alchemy'), {}, 'another page starts empty');
    forgetTypedStats('alchemy');
  } finally {
    if (saved === undefined) delete global.window; else global.window = saved;
  }
});
