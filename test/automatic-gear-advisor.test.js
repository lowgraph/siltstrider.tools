const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

function component(file, exportName = "default") {
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
  return m.exports[exportName];
}

const mockCatalogs = {
  Armor: [
    { key: 'iron_cuirass', name: 'Iron Cuirass', armorRating: 10, armorClass: 'heavy', bodyParts: [{ slot: 2 }] },
    { key: 'chitin_cuirass', name: 'Chitin Cuirass', armorRating: 5, armorClass: 'light', bodyParts: [{ slot: 2 }] }
  ],
  Clothing: [],
  GearRows: [
    {
      key: 'heavy_cuirass',
      category: 'armor',
      slot: 'cuirass',
      armorClass: 'heavy',
      toggles: { theft: false, endgame: false, nearStart: false },
      primary: { key: 'iron_cuirass', name: 'Iron Cuirass', strength: 10, nearStart: true, acquisition: 'purchase' }
    },
    {
      key: 'light_cuirass',
      category: 'armor',
      slot: 'cuirass',
      armorClass: 'light',
      toggles: { theft: false, endgame: false, nearStart: false },
      primary: { key: 'chitin_cuirass', name: 'Chitin Cuirass', strength: 5, nearStart: true, acquisition: 'purchase' }
    },
    {
      key: 'long_blade_wep',
      category: 'weapon',
      skill: 'long_blade',
      hands: 1,
      toggles: { theft: false, endgame: false, nearStart: false },
      primary: { key: 'iron_longsword', name: 'Iron Longsword', strength: 10, nearStart: true, acquisition: 'purchase' }
    },
    {
      key: 'short_blade_wep',
      category: 'weapon',
      skill: 'short_blade',
      hands: 1,
      toggles: { theft: false, endgame: false, nearStart: false },
      primary: { key: 'iron_dagger', name: 'Iron Dagger', strength: 6, nearStart: true, acquisition: 'purchase' }
    }
  ]
};

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

test('BLD-2: Gear recommendations compute automatically on mount without clicking Optimize Gear', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const GearAdvisorView = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');

  const build = {
    race: 'Nord',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Heavy Armor', 'Long Blade'],
    min: ['Block', 'Armorer']
  };

  try {
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build,
          attrs: { Strength: 50, Endurance: 50 },
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'ready', data: { groups: [] } },
          onLoad() {}
        })
      );
    });

    const rootEl = document.getElementById('root');
    // Early game equipment table should be automatically rendered
    assert.match(rootEl.textContent, /Iron Cuirass/);
    assert.match(rootEl.textContent, /Iron Longsword/);
    // Container should have id="gear-advisor"
    const container = document.getElementById('gear-advisor');
    assert.ok(container, 'gear-advisor container must exist with id="gear-advisor"');
    // Header should mention detected archetype
    assert.match(rootEl.textContent, /closest archetype: Melee Tank \/ Warrior/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('BLD-2: Gear recommendations automatically re-compute when character skills change', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const GearAdvisorView = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');

  const warriorBuild = {
    race: 'Nord',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Heavy Armor', 'Long Blade'],
    min: ['Block']
  };

  const rogueBuild = {
    race: 'Bosmer',
    spec: 'Stealth',
    fav1: 'Agility',
    fav2: 'Speed',
    maj: ['Light Armor', 'Short Blade'],
    min: ['Sneak']
  };

  try {
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build: warriorBuild,
          attrs: { Strength: 50, Endurance: 50 },
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'ready', data: { groups: [] } },
          onLoad() {}
        })
      );
    });

    assert.match(document.getElementById('root').textContent, /Iron Longsword/);
    assert.match(document.getElementById('root').textContent, /closest archetype: Melee Tank \/ Warrior/);

    // Switch build to rogue/stealth
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build: rogueBuild,
          attrs: { Agility: 50, Speed: 50 },
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'ready', data: { groups: [] } },
          onLoad() {}
        })
      );
    });

    const content = document.getElementById('root').textContent;
    assert.match(content, /Iron Dagger/);
    assert.match(content, /Chitin Cuirass/);
    assert.match(content, /closest archetype: Stealth \/ Assassin \/ Marksman/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('BLD-2: Quick-jump link "Early gear for this build ↓" is rendered on Builder tab and scrolls to #gear-advisor', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const CharacterBuilderRoot = component('components/character-builder/character-builder-root.jsx');
  const ShellProvider = component('components/shell-context.jsx', 'ShellProvider');

  try {
    await act(async () => {
      root.render(
        React.createElement(
          ShellProvider,
          null,
          React.createElement(CharacterBuilderRoot)
        )
      );
    });

    // Check jump link presence
    const jumpLink = document.getElementById('jump-to-gear-advisor');
    assert.ok(jumpLink, 'jump-to-gear-advisor link must be rendered');
    assert.equal(jumpLink.getAttribute('href'), '#gear-advisor');
    assert.match(jumpLink.textContent, /Early gear for this build ↓/);

    // Check scrollIntoView invocation on click
    let scrolled = false;
    const gearEl = document.getElementById('gear-advisor');
    assert.ok(gearEl, '#gear-advisor must be present');
    gearEl.scrollIntoView = (opts) => {
      scrolled = true;
      assert.equal(opts?.behavior, 'smooth');
    };

    await act(async () => {
      jumpLink.click();
    });

    assert.equal(scrolled, true, 'Clicking jump link must trigger scrollIntoView on #gear-advisor');

    // Switch to Premade tab and verify jump link is not shown
    const premadeTabBtn = document.getElementById('btn-tab-premade');
    await act(async () => {
      premadeTabBtn.click();
    });
    assert.equal(document.getElementById('jump-to-gear-advisor'), null, 'jump link must not be shown on Premade tab');
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 1: Robust handling of null, undefined, and empty build structures
test('Adversarial QA 1: Robust handling of null, undefined, and malformed build objects', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const GearAdvisorView = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');

  try {
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build: null,
          attrs: null,
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'idle' },
          onLoad() {}
        })
      );
    });

    const content = document.getElementById('root').textContent;
    assert.ok(content.length > 0);
    assert.ok(document.getElementById('gear-advisor'));

    // Malformed build with invalid arrays
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build: { maj: 'not-an-array', min: 12345, race: undefined },
          attrs: undefined,
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'idle' },
          onLoad() {}
        })
      );
    });
    assert.ok(document.getElementById('gear-advisor'));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 2: Pure non-combat archetype (no weapon or armor skills)
test('Adversarial QA 2: Pure non-combat skills fall back gracefully to default equipment rankings', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const GearAdvisorView = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');

  const pacifistScholar = {
    race: 'Altmer',
    spec: 'Magic',
    fav1: 'Intelligence',
    fav2: 'Willpower',
    maj: ['Alchemy', 'Enchant', 'Alteration', 'Mysticism', 'Restoration'],
    min: ['Illusion', 'Conjuration', 'Speechcraft', 'Mercantile', 'Sneak']
  };

  try {
    await act(async () => {
      root.render(
        React.createElement(GearAdvisorView, {
          build: pacifistScholar,
          attrs: { Intelligence: 60, Willpower: 50 },
          result: { status: 'ready', data: { catalogs: mockCatalogs } },
          bisResult: { status: 'ready', data: { groups: [] } },
          onLoad() {}
        })
      );
    });

    const content = document.getElementById('root').textContent;
    // Should fall back to default primary equipment (Long Blade / Light Armor) safely
    assert.match(content, /Long Blade/);
    assert.match(content, /Light Armor/);
    assert.match(content, /closest archetype: Pure Mage \/ Caster/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial QA 3: Rapid sequential build updates settle without errors
test('Adversarial QA 3: Rapid sequential build updates recompute cleanly', async () => {
  const dom = setupDom();
  const root = createRoot(document.getElementById('root'));
  const GearAdvisorView = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');

  try {
    for (let i = 0; i < 5; i++) {
      const build = {
        race: i % 2 === 0 ? 'Nord' : 'Bosmer',
        spec: i % 2 === 0 ? 'Combat' : 'Stealth',
        maj: i % 2 === 0 ? ['Heavy Armor', 'Long Blade'] : ['Light Armor', 'Short Blade'],
        min: []
      };
      await act(async () => {
        root.render(
          React.createElement(GearAdvisorView, {
            build,
            attrs: { Strength: 40 + i },
            result: { status: 'ready', data: { catalogs: mockCatalogs } },
            bisResult: { status: 'idle' },
            onLoad() {}
          })
        );
      });
    }

    const finalContent = document.getElementById('root').textContent;
    assert.match(finalContent, /closest archetype: Melee Tank \/ Warrior/);
    assert.match(finalContent, /Iron Longsword/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
