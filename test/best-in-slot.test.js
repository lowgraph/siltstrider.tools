const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const modulePromise = import('../lib/best-in-slot.mjs');

// Dynamically resolve the active bundle via public/game-data/current.json
const currentPath = join(__dirname, '../public/game-data/current.json');
let bisData = null;

if (existsSync(currentPath)) {
  try {
    const current = JSON.parse(readFileSync(currentPath, 'utf-8'));
    const bundlePath = join(__dirname, '../public/game-data', current.bundleId, 'vanilla/BestInSlot.json');
    if (existsSync(bundlePath)) {
      bisData = JSON.parse(readFileSync(bundlePath, 'utf-8'));
    }
  } catch {}
}

// Fallback synthetic fixture if staged bundle is absent (e.g. fresh clone or CI before data:stage)
if (!bisData) {
  bisData = {
    schemaVersion: '1.0.0',
    profile: { id: 'vanilla' },
    catalog: 'BestInSlot',
    kind: 'full',
    toggles: { allowFormidableSources: { default: false, formidableLevel: 30 } },
    model: {
      tiers: { essential: 10, strong: 6, qol: 3, low: 1 },
      effects: {
        'Restore Health': { tier: 'essential', cap: 5, fit: 'all' },
        'Spell Absorption': { tier: 'essential', cap: 100, fit: 'all' },
        'Reflect': { tier: 'essential', cap: 100, fit: 'all' },
        'Resist Magicka': { tier: 'essential', cap: 100, fit: 'all' },
        'Resist Fire': { tier: 'qol', cap: 100, fit: 'all' },
        'Shield': { tier: 'qol', cap: 30, fit: 'all' },
        'Feather': { tier: 'low', cap: 100, fit: 'all' },
        'Fortify Magicka': { tier: 'strong', cap: 50, fit: 'caster' },
        'Fortify Maximum Magicka': { tier: 'strong', cap: 20, fit: 'caster' }
      },
      derived: {
        'Fortify Skill': { cap: 25, major: 8, minor: 5, misc: 1 },
        'Fortify Attribute': { cap: 25, favoured: 8, luck: 3, floor: 2 }
      },
      armour: { major: 8, minor: 5, misc: 2, ratingCap: 80 },
      weapons: { major: 8, minor: 5, misc: 1, damageCap: 60 },
      archetypes: {
        caster: { skills: ['alteration','conjuration','destruction','illusion','mysticism','restoration'], atLeast: 2 },
        fighter: { skills: ['long_blade','short_blade','blunt_weapon','axe','spear','marksman','hand_to_hand'], atLeast: 1 }
      },
      criticalAttributes: {
        all: ['endurance'],
        caster: ['intelligence','willpower'],
        fighter: ['strength','agility']
      },
      drawbacks: {
        'Drain Magicka': { rule: 'archetype', caster: 'disqualifying', other: 'minor' },
        'Blind': { rule: 'flat', severity: 'significant', mitigation: 'Resist Magicka' },
        'Weakness to Normal Weapons': { rule: 'flat', severity: 'significant' },
        'Drain Attribute': { rule: 'attribute', favoured: 'disqualifying', critical: 'significant', other: 'minor', zeroesAt: 100 }
      },
      picksPerSlot: 3
    },
    items: {
      'daedric_helm_clavicusvile': {
        key: 'daedric_helm_clavicusvile',
        name: 'Masque of Clavicus Vile',
        slot: 'helmet',
        beastWearable: false,
        armorRating: 80,
        armorClass: 'heavy',
        source: { kind: 'placed', routes: 1, easiestLevel: 12, questGrants: [] },
        effects: [{ name: 'Fortify Attribute', attribute: 'personality', magnitude: 30 }]
      },
      'mantle of woe': {
        key: 'mantle of woe',
        name: 'Mantle of Woe',
        slot: 'robe',
        beastWearable: true,
        source: { kind: 'placed', routes: 1, easiestLevel: 30, questGrants: [] },
        effects: [
          { name: 'Fortify Maximum Magicka', magnitude: 50 },
          { name: 'Fortify Skill', skill: 'conjuration', magnitude: 50 },
          { name: 'Drain Attribute', attribute: 'personality', magnitude: 100 },
          { name: 'Weakness to Normal Weapons', magnitude: 20 }
        ]
      },
      'keening': {
        key: 'keening',
        name: 'Keening',
        slot: 'weapon',
        weaponSkill: 'short_blade',
        damage: 18,
        beastWearable: true,
        source: { kind: 'placed', routes: 1, easiestLevel: 0, questGrants: [] },
        effects: [
          { name: 'Fortify Magicka', magnitude: 50 },
          { name: 'Fortify Health', magnitude: 30 },
          { name: 'Fortify Speed', attribute: 'speed', magnitude: 20 }
        ]
      },
      'boots of blinding speed_x': {
        key: 'boots of blinding speed_x',
        name: 'Boots of Blinding Speed',
        slot: 'boots',
        beastWearable: false,
        armorRating: 5,
        armorClass: 'light',
        source: { kind: 'placed', routes: 1, easiestLevel: 0, questGrants: [] },
        effects: [
          { name: 'Blind', magnitude: 100 },
          { name: 'Fortify Attribute', attribute: 'speed', magnitude: 200 }
        ]
      },
      'darksun_shield_unique': {
        key: 'darksun_shield_unique',
        name: 'Darksun Shield',
        slot: 'shield',
        beastWearable: true,
        armorRating: 60,
        armorClass: 'heavy',
        source: { kind: 'placed', routes: 1, easiestLevel: 20, questGrants: [] },
        effects: [
          { name: 'Drain Magicka', magnitude: 100 },
          { name: 'Reflect', magnitude: 20 }
        ]
      },
      "helseth's ring": {
        key: "helseth's ring",
        name: 'Royal Signet Ring',
        slot: 'ring',
        beastWearable: true,
        source: { kind: 'placed', routes: 1, easiestLevel: 35, questGrants: [] },
        effects: [
          { name: 'Reflect', magnitude: 100 },
          { name: 'Resist Magicka', magnitude: 100 },
          { name: 'Restore Health', magnitude: 10 }
        ]
      },
      'ring_1': {
        key: 'ring_1',
        name: "Mentor's Ring",
        slot: 'ring',
        beastWearable: true,
        source: { kind: 'placed', routes: 1, easiestLevel: 4, questGrants: [] },
        effects: [{ name: 'Fortify Attribute', attribute: 'intelligence', magnitude: 10 }]
      },
      'ring_2': {
        key: 'ring_2',
        name: 'Ring of Phynaster',
        slot: 'ring',
        beastWearable: true,
        source: { kind: 'placed', routes: 1, easiestLevel: 1, questGrants: [] },
        effects: [{ name: 'Resist Magicka', magnitude: 20 }]
      }
    },
    records: [
      {
        key: 'Altmer Atronach Spellweaver/0',
        build: 'Altmer Atronach Spellweaver',
        category: 'Pure mage',
        set: 'BUILDS',
        race: 'high elf',
        beast: false,
        caster: true,
        fighter: false,
        toggles: { allowFormidableSources: false },
        slots: {
          helmet: [{ item: 'daedric_helm_clavicusvile', score: 7.0, reasons: [['Heavy armour 80', 2.0]], warnings: [] }],
          robe: [{ item: 'mantle of woe', score: 11.0, reasons: [['Fortify Maximum Magicka 50', 6.0]], warnings: ['Weakness to Normal Weapons 20'] }],
          weapon: [{ item: 'keening', score: 14.3, reasons: [['Fortify Magicka 50', 6.0]], warnings: [] }],
          ring: [
            { item: 'ring_1', score: 6.4, reasons: [], warnings: [] },
            { item: 'ring_2', score: 2.0, reasons: [], warnings: [] }
          ]
        }
      },
      {
        key: 'Altmer Atronach Spellweaver/1',
        build: 'Altmer Atronach Spellweaver',
        category: 'Pure mage',
        set: 'BUILDS',
        race: 'high elf',
        beast: false,
        caster: true,
        fighter: false,
        toggles: { allowFormidableSources: true },
        slots: {
          helmet: [{ item: 'daedric_helm_clavicusvile', score: 7.0, reasons: [['Heavy armour 80', 2.0]], warnings: [] }],
          robe: [{ item: 'mantle of woe', score: 11.0, reasons: [['Fortify Maximum Magicka 50', 6.0]], warnings: ['Weakness to Normal Weapons 20'] }],
          weapon: [{ item: 'keening', score: 14.3, reasons: [['Fortify Magicka 50', 6.0]], warnings: [] }],
          ring: [
            { item: "helseth's ring", score: 46.0, reasons: [['Reflect 100', 10.0]], warnings: [] },
            { item: 'ring_1', score: 6.4, reasons: [], warnings: [] }
          ]
        }
      }
    ]
  };
}

const { records, ...bisMetadata } = bisData;
const featureData = {
  catalogs: { BestInSlot: records },
  metadata: { BestInSlot: bisMetadata },
  profile: 'vanilla'
};

test('SLOT_ORDER and SLOT_LABELS contain all standard equipment slots', async () => {
  const { SLOT_ORDER, SLOT_LABELS } = await modulePromise;
  assert.ok(SLOT_ORDER.includes('helmet'));
  assert.ok(SLOT_ORDER.includes('cuirass'));
  assert.ok(SLOT_ORDER.includes('weapon'));
  assert.ok(SLOT_ORDER.includes('ring'));
  assert.equal(SLOT_LABELS.helmet, 'Helmet');
  assert.equal(SLOT_LABELS.cuirass, 'Cuirass');
  assert.equal(SLOT_LABELS.ring, 'Ring');
});

test('deriveBuildTraits correctly identifies beast race, archetypes, and critical attributes', async () => {
  const { deriveBuildTraits } = await modulePromise;
  const argonianMage = {
    race: 'Argonian',
    maj: ['Destruction', 'Mysticism', 'Alteration'],
    min: ['Illusion', 'Restoration'],
    fav1: 'Intelligence',
    fav2: 'Willpower'
  };
  const traits = deriveBuildTraits(argonianMage);
  assert.equal(traits.beast, true);
  assert.equal(traits.caster, true);
  assert.equal(traits.fighter, false);
  assert.ok(traits.critical.has('endurance'));
  assert.ok(traits.critical.has('intelligence'));
  assert.ok(traits.critical.has('willpower'));
  assert.equal(traits.critical.has('strength'), false);

  const nordWarrior = {
    race: 'Nord',
    maj: ['Long Blade', 'Heavy Armor', 'Block'],
    min: ['Armorer', 'Medium Armor'],
    fav1: 'Strength',
    fav2: 'Endurance'
  };
  const wTraits = deriveBuildTraits(nordWarrior);
  assert.equal(wTraits.beast, false);
  assert.equal(wTraits.caster, false);
  assert.equal(wTraits.fighter, true);
  assert.ok(wTraits.critical.has('endurance'));
  assert.ok(wTraits.critical.has('strength'));
  assert.ok(wTraits.critical.has('agility'));
});

test('picksForBuild retrieves pre-computed record and respects allowFormidableSources toggle', async () => {
  const { picksForBuild } = await modulePromise;
  const normalPick = picksForBuild(records, 'Altmer Atronach Spellweaver', false);
  assert.ok(normalPick, 'Expected record for Altmer Atronach Spellweaver');
  assert.equal(normalPick.toggles?.allowFormidableSources, false);

  const ringItemsNormal = (normalPick.slots.ring || []).map(r => r.item);
  assert.ok(!ringItemsNormal.includes("helseth's ring"), 'Royal signet ring should not appear when formidable sources disabled');

  const formidablePick = picksForBuild(records, 'Altmer Atronach Spellweaver', true);
  assert.ok(formidablePick, 'Expected record for Altmer Atronach Spellweaver with formidable sources');
  assert.equal(formidablePick.toggles?.allowFormidableSources, true);

  const ringItemsFormidable = (formidablePick.slots.ring || []).map(r => r.item);
  assert.ok(ringItemsFormidable.includes("helseth's ring"), 'Royal signet ring should appear when formidable sources enabled');
  const helsethEntry = formidablePick.slots.ring.find(r => r.item === "helseth's ring");
  assert.equal(helsethEntry.score, 46.0);
});

test('scoreItem disqualifies Drain Magicka on casters but allows on non-casters', async () => {
  const { deriveBuildTraits, scoreItem } = await modulePromise;
  const model = bisMetadata.model;
  const darksunShield = bisMetadata.items['darksun_shield_unique'];
  assert.ok(darksunShield, 'darksun_shield_unique must exist in metadata');

  const casterTraits = deriveBuildTraits({
    race: 'Breton',
    maj: ['Destruction', 'Mysticism'],
    min: ['Alteration']
  }, model);
  const fighterTraits = deriveBuildTraits({
    race: 'Nord',
    maj: ['Long Blade', 'Block', 'Heavy Armor'],
    min: ['Athletics']
  }, model);

  // Caster should be disqualified due to Drain Magicka 100
  const casterScore = scoreItem(darksunShield, casterTraits, model, false);
  assert.equal(casterScore, null, 'Caster should disqualify Drain Magicka item');

  // Fighter can wear it (easiestLevel is 20, which is <= 30)
  const fighterScore = scoreItem(darksunShield, fighterTraits, model, false);
  assert.ok(fighterScore, 'Fighter should be able to equip Darksun Shield');
  assert.ok(fighterScore.score > 0);
});

test('scoreItem enforces beast race footwear and closed helmet exclusion', async () => {
  const { deriveBuildTraits, scoreItem } = await modulePromise;
  const model = bisMetadata.model;
  const boots = bisMetadata.items['boots of blinding speed_x'];
  assert.ok(boots, 'boots of blinding speed_x must exist');
  assert.equal(boots.beastWearable, false);

  const beastTraits = deriveBuildTraits({ race: 'Khajiit', maj: ['Sneak'], min: ['Short Blade'] }, model);
  const humanTraits = deriveBuildTraits({ race: 'Imperial', maj: ['Sneak'], min: ['Short Blade'] }, model);

  assert.equal(scoreItem(boots, beastTraits, model, false), null, 'Beast race cannot wear non-beast footwear');
  const humanScore = scoreItem(boots, humanTraits, model, false);
  assert.ok(humanScore, 'Human race can wear boots');
  assert.ok(humanScore.warnings.some(w => w.includes('Blind 100 (cancelled by Resist Magicka)')));
});

test('resolveBestInSlotPicks generates grouped slots with picks and item metadata', async () => {
  const { resolveBestInSlotPicks } = await modulePromise;
  const build = {
    name: 'Altmer Atronach Spellweaver',
    race: 'High Elf',
    maj: ['Destruction', 'Alteration', 'Mysticism'],
    min: ['Illusion', 'Restoration']
  };

  const resolved = resolveBestInSlotPicks(featureData, build, { allowFormidableSources: false });
  assert.ok(resolved);
  assert.equal(resolved.matchedBuild, 'Altmer Atronach Spellweaver');
  assert.ok(Array.isArray(resolved.groups));
  assert.equal(resolved.groups.length, 3); // Armor & Shield, Weapons, Clothing & Jewelry

  const armorGroup = resolved.groups.find(g => g.label === 'Optimized Armor & Shield');
  assert.ok(armorGroup);
  const helmRow = armorGroup.rows.find(r => r.slotKey === 'helmet');
  assert.ok(helmRow);
  assert.ok(helmRow.picks.length > 0);
  assert.equal(helmRow.picks[0].item.name, 'Masque of Clavicus Vile');

  const clothGroup = resolved.groups.find(g => g.label === 'Constant-Effect Clothing & Jewelry');
  assert.ok(clothGroup);
  const ring1 = clothGroup.rows.find(r => r.slotKey === 'ring_1');
  const ring2 = clothGroup.rows.find(r => r.slotKey === 'ring_2');
  assert.ok(ring1, 'Ring 1 slot should exist');
  assert.ok(ring2, 'Ring 2 slot should exist');
  assert.notEqual(ring1.picks[0].item.key, ring2.picks[0].item.key, 'Ring 1 and Ring 2 must be distinct items');
});

test('resolveBestInSlotPicks dynamically scores custom builds when no exact record matches', async () => {
  const { resolveBestInSlotPicks } = await modulePromise;
  const customBuild = {
    name: 'Custom Spellblade',
    race: 'Dunmer',
    maj: ['Long Blade', 'Destruction', 'Light Armor'],
    min: ['Mysticism', 'Alteration'],
    fav1: 'Strength',
    fav2: 'Intelligence'
  };

  const resolved = resolveBestInSlotPicks(featureData, customBuild, { allowFormidableSources: false });
  assert.ok(resolved);
  assert.ok(resolved.groups.length > 0);
  const weaponGroup = resolved.groups.find(g => g.label === 'Optimized Weapons');
  assert.ok(weaponGroup);
  assert.ok(weaponGroup.rows[0].picks.length > 0);
});

// React UI Tests
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
const path = require('node:path');
const Module = require('node:module');

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
  return exportName === 'default' ? m.exports.default : m.exports[exportName];
}

test('BestInSlotView renders complete late-game gear tables with scores and warnings', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const BestInSlotView = component('components/character-builder/best-in-slot-view.jsx', 'BestInSlotView');
  const root = createRoot(document.getElementById('root'));

  const build = {
    name: 'Altmer Atronach Spellweaver',
    race: 'High Elf',
    maj: ['Destruction', 'Alteration', 'Mysticism'],
    min: ['Illusion', 'Restoration']
  };

  try {
    await act(async () => {
      root.render(
        React.createElement(BestInSlotView, {
          featureData,
          build,
          beast: false,
          allowFormidableSources: false
        })
      );
    });

    const summary = document.querySelector('summary');
    assert.ok(summary);
    assert.equal(summary.textContent.trim(), 'Optimized endgame kit');

    const content = document.getElementById('root').textContent;
    assert.match(content, /Masque of Clavicus Vile/);
    assert.match(content, /Mantle of Woe/);
    assert.match(content, /Keening/);
    assert.match(content, /Score: 14.3/);
    assert.match(content, /Blind 100/);

    // Toggle runner-up picks
    const altBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('runner-up'));
    assert.ok(altBtn, 'Expected runner-up button');
    await act(async () => altBtn.click());
    assert.match(document.getElementById('root').textContent, /Runner-up #2/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('GearAdvisorView wires BestInSlotView when bisResult is ready and falls back cleanly', async () => {
  const dom = new JSDOM(
    '<div id="root"></div><input id="gear-steal" type="checkbox" checked><input id="gear-endgame" type="checkbox"><button id="btn-gear"></button><div id="gear-box"></div>',
    { url: 'http://localhost/' }
  );
  global.window = dom.window;
  global.document = dom.window.document;
  global.Event = dom.window.Event;
  global.MutationObserver = dom.window.MutationObserver;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const Gear = component('components/character-builder/gear-advisor.jsx', 'GearAdvisorView');
  const root = createRoot(document.getElementById('root'));

  const build = {
    name: 'Altmer Atronach Spellweaver',
    race: 'High Elf',
    maj: ['Destruction', 'Alteration', 'Mysticism'],
    min: ['Illusion', 'Restoration']
  };

  try {
    // 1. When bisResult is ready, Optimize Gear renders BestInSlotView
    await act(async () => {
      root.render(
        React.createElement(Gear, {
          build,
          result: { status: 'loading' },
          bisResult: { status: 'ready', data: featureData },
          onLoad() {}
        })
      );
    });

    const optBtn = [...document.querySelectorAll('#root button')].find(b => b.textContent.includes('Optimize Gear'));
    assert.ok(optBtn);
    await act(async () => optBtn.click());

    const content = document.getElementById('root').textContent;
    assert.match(content, /Optimized endgame kit/);
    assert.match(content, /Masque of Clavicus Vile/);
    assert.match(content, /Keening/);

    // 2. Fallback when bisResult is not ready uses legacy gearHtml
    document.getElementById('btn-gear').onclick = () => {
      document.getElementById('gear-box').innerHTML = '<details><summary>Optimized endgame kit</summary>Legacy HTML Gear</details>';
    };
    await act(async () => {
      root.render(
        React.createElement(Gear, {
          build: { race: 'Argonian' },
          result: { status: 'loading' },
          bisResult: { status: 'loading' },
          onLoad() {}
        })
      );
    });

    const optBtnFallback = [...document.querySelectorAll('#root button')].find(b => b.textContent.includes('Optimize Gear'));
    await act(async () => optBtnFallback.click());
    assert.match(document.getElementById('root').textContent, /Legacy HTML Gear/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial Edge-Case Tests (Rule 3)
test('Adversarial QA 1: Robust handling of null, undefined, and malformed inputs', async () => {
  const { scoreItem, deriveBuildTraits, picksForBuild, resolveBestInSlotPicks } = await modulePromise;
  const model = bisMetadata.model;

  // Null / undefined resilience
  assert.equal(picksForBuild(null, null), null);
  assert.equal(picksForBuild([], 'Warrior'), null);
  assert.equal(deriveBuildTraits(null).race, '');
  assert.equal(deriveBuildTraits({}).beast, false);
  assert.equal(scoreItem(null, null, null), null);
  assert.equal(scoreItem({}, {}, null), null);
  assert.equal(resolveBestInSlotPicks(null, null), null);
  assert.deepEqual(resolveBestInSlotPicks({}, {}), {
    matchedBuild: '',
    toggles: { allowFormidableSources: false },
    groups: []
  });

  // Malformed items without effects, source, or slot
  const traits = deriveBuildTraits({ race: 'Breton', maj: ['Destruction'], min: [] });
  assert.equal(scoreItem({ name: 'Malformed' }, traits, model), null);
  assert.equal(scoreItem({ source: { kind: 'unconfirmed' }, effects: [] }, traits, model), null);
  assert.equal(scoreItem({ source: { kind: 'placed' }, effects: [{ name: 'NonExistentEffect' }] }, traits, model), null);
});

test('Adversarial QA 2: Exact boundary conditions on formidable level and quest grant overrides', async () => {
  const { scoreItem, deriveBuildTraits } = await modulePromise;
  const model = bisMetadata.model;
  const traits = deriveBuildTraits({ race: 'Nord', maj: ['Heavy Armor'], min: [] }, model);

  // Item exactly at level 30 (formidable cutoff is > 30)
  const itemLvl30 = {
    key: 'item_30',
    name: 'Item Level 30',
    beastWearable: true,
    armorRating: 50,
    armorClass: 'heavy',
    source: { kind: 'placed', easiestLevel: 30, questGrants: [] },
    effects: [{ name: 'Shield', magnitude: 20 }]
  };
  const score30 = scoreItem(itemLvl30, traits, model, false);
  assert.ok(score30, 'Item at level 30 should not be excluded by default formidableLevel (30)');

  // Item at level 31 without quest (excluded when allowFormidable is false, allowed when true)
  const itemLvl31 = {
    ...itemLvl30,
    key: 'item_31',
    source: { kind: 'placed', easiestLevel: 31, questGrants: [] }
  };
  assert.equal(scoreItem(itemLvl31, traits, model, false), null, 'Level 31 item must be excluded when formidable disabled');
  assert.ok(scoreItem(itemLvl31, traits, model, true), 'Level 31 item must be included when formidable enabled');

  // Item at level 50 WITH quest grant (must NOT be excluded even when formidable disabled)
  const questItemLvl50 = {
    ...itemLvl30,
    key: 'item_quest_50',
    source: { kind: 'quest', easiestLevel: 50, questGrants: ['some_quest_id'] }
  };
  assert.ok(scoreItem(questItemLvl50, traits, model, false), 'Quest-granted item must be included regardless of formidable level');
});

test('Adversarial QA 3: Empty custom character produces valid fallbacks without throwing', async () => {
  const { resolveBestInSlotPicks } = await modulePromise;
  const emptyBuild = {
    name: '',
    race: '',
    maj: [],
    min: [],
    attrs: {}
  };

  const resolved = resolveBestInSlotPicks(featureData, emptyBuild, { allowFormidableSources: false });
  assert.ok(resolved);
  assert.ok(Array.isArray(resolved.groups));
  assert.ok(resolved.groups.length > 0);
  for (const grp of resolved.groups) {
    assert.ok(grp.label);
    assert.ok(Array.isArray(grp.rows));
    for (const row of grp.rows) {
      assert.ok(row.slotKey);
      assert.ok(Array.isArray(row.picks));
      assert.ok(row.picks.length > 0);
    }
  }
});


for (const setup of ['one-handed','two-handed']) test('endgame weapon setup filters exact premade picks: '+setup,async()=>{
 const {resolveBestInSlotPicks}=await modulePromise;
 const items={one:{key:'one',name:'Sword',slot:'weapon',type:'LB1H'},two:{key:'two',name:'Spear',slot:'weapon',type:'SP2H'},unknown:{key:'unknown',slot:'weapon'},shield:{key:'shield',slot:'shield'}};
 const data={catalogs:{BestInSlot:[{build:'Fixture',toggles:{allowFormidableSources:false},slots:{weapon:[{item:'two'},{item:'unknown'},{item:'one'}],shield:[{item:'shield'}]}}]},metadata:{BestInSlot:{items}}};
 const result=resolveBestInSlotPicks(data,{name:'Fixture'},{weaponSetup:setup});
 const rows=result.groups.flatMap(g=>g.rows);
 assert.deepEqual(rows.find(r=>r.slotKey==='weapon').picks.map(p=>p.item.key),[setup==='one-handed'?'one':'two']);
 assert.equal(rows.some(r=>r.slotKey==='shield'),setup==='one-handed');
});
