const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

function component(file) {
  const result = require('esbuild').buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime']
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports.default;
}

test('Configurator renders skill slots with ratings, attribute distribution, and customize action', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const Configurator = component('components/character-builder/configurator.jsx');
  const root = createRoot(document.getElementById('root'));

  const build = {
    race: 'Dark Elf',
    className: 'Warrior',
    gender: 'Male',
    sign: 'The Warrior',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Athletics', 'Block'],
    min: ['Armorer', 'Spear', 'Marksman', 'Axe', 'Blunt Weapon']
  };

  const catalogs = {
    skills: [
      'Block', 'Armorer', 'Medium Armor', 'Heavy Armor', 'Blunt Weapon', 'Long Blade', 'Axe', 'Spear', 'Athletics',
      'Enchant', 'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism', 'Restoration', 'Alchemy', 'Unarmored',
      'Security', 'Sneak', 'Acrobatics', 'Light Armor', 'Short Blade', 'Marksman', 'Mercantile', 'Speechcraft', 'Hand-to-hand'
    ],
    specSkills: {
      Combat: ['Block', 'Armorer', 'Medium Armor', 'Heavy Armor', 'Blunt Weapon', 'Long Blade', 'Axe', 'Spear', 'Athletics'],
      Magic: ['Enchant', 'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism', 'Restoration', 'Alchemy', 'Unarmored'],
      Stealth: ['Security', 'Sneak', 'Acrobatics', 'Light Armor', 'Short Blade', 'Marksman', 'Mercantile', 'Speechcraft', 'Hand-to-hand']
    },
    races: {
      'Dark Elf': {
        skills: { 'Long Blade': 5, Destruction: 10, 'Short Blade': 10 }
      }
    },
    classes: {
      'Warrior': {}
    },
    signs: {
      'The Warrior': {}
    }
  };

  const sheet = {
    skills: {
      'Long Blade': { v: 45 },
      'Medium Armor': { v: 35 },
      'Heavy Armor': { v: 35 },
      'Athletics': { v: 35 },
      'Block': { v: 35 },
      'Armorer': { v: 20 },
      'Spear': { v: 20 },
      'Marksman': { v: 20 },
      'Axe': { v: 20 },
      'Blunt Weapon': { v: 20 }
    }
  };

  let updatedField = null;
  let updatedVal = null;
  const props = {
    build,
    catalogs,
    sheet,
    onUpdateField(f, v) {
      updatedField = f;
      updatedVal = v;
    },
    onSwapSkill() {},
    onSelectClassPreset() {}
  };

  try {
    await act(async () => root.render(React.createElement(Configurator, props)));

    const text = document.getElementById('root').textContent;
    // Major & Minor skill section headers
    assert.match(text, /Major Skills \(\+25\)/);
    assert.match(text, /Minor Skills \(\+10\)/);

    // Attribute distribution contains abbreviations
    assert.match(text, /STR/);
    assert.match(text, /AGI/);
    assert.match(text, /END/);

    // Live rating badges rendered
    assert.match(text, /45/);

    // Customize Skills button for preset class
    assert.match(text, /Customize Skills/);
    const customizeBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Customize Skills')
    );
    assert.ok(customizeBtn);
    await act(async () => customizeBtn.click());
    assert.equal(updatedField, 'className');
    assert.equal(updatedVal, 'Custom');
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
