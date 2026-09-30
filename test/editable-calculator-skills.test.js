const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

async function loadWorkstation(tool, character = { build: { race: 'Dark Elf', className: 'Custom' }, sheet: { skills: { Alchemy: { v: 5 }, Enchant: { v: 10 }, Destruction: { v: 15 } }, attrs: { Intelligence: { v: 40 }, Willpower: { v: 45 }, Luck: { v: 40 } } } }) {
  const fakeData = {
    status: 'ready',
    data: {
      profile: 'vanilla',
      catalogs: {
        Attributes: [],
        Skills: [],
        MagicEffects: [],
        GameSettings: [],
        EffectRules: [
          {
            key: 'fire_damage',
            name: 'Fire Damage',
            baseCost: 5,
            school: 'destruction',
            allowEnchanting: true,
            allowSpellmaking: true,
            castSelf: true,
            castTouch: true,
            castTarget: true
          }
        ],
        Ingredients: [
          {
            key: 'ing_1',
            id: 'ing_1',
            n: 'Ingredient One',
            effects: [{ n: 'Restore Health', b: 1 }, { n: 'Drain Fatigue', b: 1 }]
          },
          {
            key: 'ing_2',
            id: 'ing_2',
            n: 'Ingredient Two',
            effects: [{ n: 'Restore Health', b: 1 }, { n: 'Fortify Strength', b: 1 }]
          }
        ],
        Apparatus: [
          { id: 'apparatus_j_mortar_01', n: "Apprentice's Mortar and Pestle", q: 0.5, type: 'mortar' }
        ]
      }
    }
  };

  const deps = {
    '../../character-context': { useActiveCharacter: () => character },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),
    '../../use-game-data': { useGameData: () => fakeData },
    '../../use-search-intent': { useSearchIntent: () => null }
  };

  if (tool === 'alchemy') {
    deps['../../../lib/alchemy-catalogs.mjs'] = {
      adaptAlchemy: () => ({
        ingredients: fakeData.data.catalogs.Ingredients,
        apparatus: {
          mortar: fakeData.data.catalogs.Apparatus,
          alembic: [],
          retort: [],
          calcinator: []
        },
        settings: {}
      })
    };
  }

  const file = path.resolve(`components/calculators/${tool}/${tool}-workstation.jsx`);
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    if (!deps[match[1]]) deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  }

  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (id) => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

function setupDom() {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

function typeInput(element, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(global.window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(element, value);
  element.dispatchEvent(new global.window.Event('input', { bubbles: true }));
  element.dispatchEvent(new global.window.Event('change', { bubbles: true }));
}

test('CALC-2: Alchemy workstation displays "Using Dark Elf Custom · change: Alchemy 5 — type your own" and allows typing custom skill', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Alchemy = await loadWorkstation('alchemy');

  try {
    await React.act(async () => root.render(React.createElement(Alchemy)));

    // Verify initial banner text
    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Alchemy 5/);
    assert.match(document.body.textContent, /— type your own/);

    // Toggle custom inputs
    const toggleBtn = document.getElementById('alc-toggle-custom-stats');
    assert.ok(toggleBtn, 'toggle custom stats button must exist');
    await React.act(async () => toggleBtn.click());

    // Verify editable input is visible
    const skillInput = document.getElementById('alc-skill-input');
    assert.ok(skillInput, 'alc-skill-input must be present');
    assert.equal(skillInput.value, '5');

    // Type custom skill "45"
    await React.act(async () => {
      typeInput(skillInput, '45');
    });

    // Verify updated banner reflection
    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Alchemy 45/);
    assert.match(document.body.textContent, /Custom numbers applied/);

    // Click "Reset to character sheet"
    const resetBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Reset to character sheet'));
    assert.ok(resetBtn, 'Reset button must exist');
    await React.act(async () => resetBtn.click());

    assert.equal(skillInput.value, '5');
    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Alchemy 5/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});

test('CALC-2: Enchanting workstation allows typing custom skill and attribute directly', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Enchanting = await loadWorkstation('enchanting');

  try {
    await React.act(async () => root.render(React.createElement(Enchanting)));

    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Enchant 10/);
    const toggleBtn = document.getElementById('ench-toggle-custom-stats');
    assert.ok(toggleBtn);
    await React.act(async () => toggleBtn.click());

    const skillInput = document.getElementById('ench-skill-input');
    const intInput = document.getElementById('ench-int-input');
    assert.ok(skillInput);
    assert.ok(intInput);

    // Type custom Enchant 75 and INT 80
    await React.act(async () => {
      typeInput(skillInput, '75');
      typeInput(intInput, '80');
    });

    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Enchant 75/);
    assert.match(document.body.textContent, /INT: 80/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});

test('CALC-2: Spellmaking workstation allows typing custom magic school skill directly', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Spellmaking = await loadWorkstation('spellmaking');

  try {
    await React.act(async () => root.render(React.createElement(Spellmaking)));

    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Destruction 15/);
    const toggleBtn = document.getElementById('spell-toggle-custom-stats');
    assert.ok(toggleBtn);
    await React.act(async () => toggleBtn.click());

    const skillInput = document.getElementById('spell-skill-input');
    assert.ok(skillInput);
    assert.equal(skillInput.value, '15');

    // Type custom skill "80"
    await React.act(async () => {
      typeInput(skillInput, '80');
    });

    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Destruction 80/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 1: Robust handling of empty/missing character and default fallbacks
test('Adversarial QA 1: Calculator skill inputs function safely without prebuilt character', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Alchemy = await loadWorkstation('alchemy', { build: {}, sheet: null });

  try {
    await React.act(async () => root.render(React.createElement(Alchemy)));

    // Falls back to Dark Elf Custom (the name Home shows) and default stats 50/40/40
    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Alchemy 50/);

    const toggleBtn = document.getElementById('alc-toggle-custom-stats');
    await React.act(async () => toggleBtn.click());

    const skillInput = document.getElementById('alc-skill-input');
    await React.act(async () => {
      typeInput(skillInput, '35');
    });

    assert.match(document.body.textContent, /Using Dark Elf Custom · change in the Character Builder:\s*Alchemy 35/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 2: Non-numeric and negative values clamp safely
test('Adversarial QA 2: Negative and non-numeric inputs clamp safely to non-negative integers', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Alchemy = await loadWorkstation('alchemy');

  try {
    await React.act(async () => root.render(React.createElement(Alchemy)));
    await React.act(async () => document.getElementById('alc-toggle-custom-stats').click());

    const skillInput = document.getElementById('alc-skill-input');

    // Type negative number
    await React.act(async () => {
      typeInput(skillInput, '-25');
    });
    assert.equal(skillInput.value, '0');

    // Type NaN / empty
    await React.act(async () => {
      typeInput(skillInput, 'invalid');
    });
    assert.equal(skillInput.value, '0');
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 3: High boundary values (e.g. Fortified to 1000) calculate without errors
test('Adversarial QA 3: Large fortified attribute numbers (1000) compute without throwing', async () => {
  const dom = setupDom();
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Enchanting = await loadWorkstation('enchanting');

  try {
    await React.act(async () => root.render(React.createElement(Enchanting)));
    await React.act(async () => document.getElementById('ench-toggle-custom-stats').click());

    const intInput = document.getElementById('ench-int-input');
    await React.act(async () => {
      typeInput(intInput, '1000');
    });

    assert.match(document.body.textContent, /INT: 1000/);
    assert.doesNotMatch(document.body.textContent, /NaN/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});
