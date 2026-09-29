const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const math = () => import('../lib/level-math.mjs');

/** The site's default character, read from its source so the test follows it. */
function defaultBuild() {
  const src = fs.readFileSync(path.join(ROOT, 'components', 'character-context.jsx'), 'utf8');
  const start = src.indexOf('export const DEFAULT_BUILD');
  const block = src.slice(start, src.indexOf('};', start));
  const list = key => JSON.parse(block.match(new RegExp(`\\b${key}: (\\[[^\\]]*\\])`))[1]);
  const text = key => block.match(new RegExp(`\\b${key}: "([^"]*)"`))[1];
  return { race: text('race'), gender: text('gender'), className: text('className'), sign: text('sign'),
    spec: text('spec'), fav1: text('fav1'), fav2: text('fav2'), maj: list('maj'), min: list('min') };
}

const FIGHTER = { className: 'Custom', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Athletics'], min: ['Restoration', 'Medium Armor', 'Spear', 'Axe', 'Blunt Weapon'] };

test('the default character is read as the warrior it is, not a Diplomat', async () => {
  const { explainArchetype } = await math();
  const build = defaultBuild();
  assert.ok(build.min.includes('Mercantile') && build.min.includes('Speechcraft'), 'the default takes both social skills as minors');
  const { archetype, reason } = explainArchetype(build);
  assert.equal(archetype.id, 'warrior');
  assert.equal(reason, 'major skills Long Blade, Heavy Armor and Block');
  assert.notEqual(archetype.priority[1], 'Personality', 'no Personality right after Endurance');
});

test('Mercantile and Speechcraft make a Diplomat only as majors, or one major with Personality and the other', async () => {
  const { explainArchetype } = await math();
  const withSkills = (maj, min, fav1 = 'Strength') => explainArchetype({ ...FIGHTER, fav1,
    maj: [...maj, ...FIGHTER.maj].slice(0, 5), min: [...min, ...FIGHTER.min].slice(0, 5) });
  // Below the line (score under 8): the fighter stays a fighter.
  assert.equal(withSkills([], ['Mercantile', 'Speechcraft']).archetype.id, 'warrior', 'both as minors: 3');
  assert.equal(withSkills([], ['Mercantile', 'Speechcraft'], 'Personality').archetype.id, 'warrior', 'both minors and Personality: 6');
  assert.equal(withSkills(['Speechcraft'], [], 'Personality').archetype.id, 'warrior', 'one major and Personality: 7');
  // On or over the line.
  const both = withSkills(['Mercantile', 'Speechcraft'], []);
  assert.equal(both.archetype.id, 'diplomat', 'both as majors: 13');
  assert.equal(both.reason, 'Mercantile and Speechcraft as major skills');
  const edge = withSkills(['Speechcraft'], ['Mercantile'], 'Personality');
  assert.equal(edge.archetype.id, 'diplomat', 'one major, the other minor and Personality: 8.5');
  assert.equal(edge.reason, 'Speechcraft as major skill, Mercantile as a minor skill and favoured Personality');
});

test('the reason names the class, or up to three skills of the detected focus, never others', async () => {
  const { explainArchetype, detectArchetype } = await math();
  assert.deepEqual(explainArchetype({ className: ' Spellsword ' }), { archetype: detectArchetype({ className: 'Spellsword' }), reason: 'the Spellsword class' });
  assert.equal(explainArchetype(null).archetype.id, 'warrior');
  assert.equal(explainArchetype(null).reason, 'the defaults, with no character');
  const caster = explainArchetype({ className: 'Custom', spec: 'Magic', fav1: 'Intelligence', fav2: 'Willpower',
    maj: ['Destruction', 'Alteration', 'Mysticism', 'Restoration', 'Conjuration'], min: ['Enchant', 'Alchemy', 'Illusion', 'Unarmored', 'Short Blade'] });
  assert.equal(caster.archetype.id, 'mage');
  assert.equal(caster.reason, 'major skills Destruction, Alteration and Conjuration', 'three at most, spells in a fixed order');
  // A sheet lists skills in the game's order, a build in the player's: the reason is the same.
  const sheetOrder = { ...defaultBuild(), maj: ['Block', 'Armorer', 'Heavy Armor', 'Long Blade', 'Athletics'] };
  assert.equal(explainArchetype(sheetOrder).reason, 'major skills Long Blade, Heavy Armor and Block', 'the weapon comes first whatever the order');
  const minorsOnly = explainArchetype({ className: 'Custom', spec: 'Stealth', maj: [], min: ['Sneak', 'Security'] });
  assert.equal(minorsOnly.archetype.id, 'stealth');
  assert.equal(minorsOnly.reason, 'minor skills Sneak and Security');
  assert.equal(explainArchetype({ className: 'Custom', spec: 'Magic', maj: [], min: [] }).reason, 'Magic specialization');
  // Every build gets the same archetype from both functions.
  for (const build of [FIGHTER, defaultBuild(), { className: 'Merchant' }, { className: 'Custom', spec: 'Stealth', maj: ['Sneak'] }, null]) {
    assert.equal(detectArchetype(build), explainArchetype(build).archetype);
  }
});

test('with the staged bundle, the default character is no longer told to raise Personality first', async (t) => {
  if (!fs.existsSync(path.join(ROOT, 'public', 'game-data', 'current.json'))) return t.skip('no staged game bundle');
  const { loadCharacterCatalogs } = await import('../scripts/social-card/facts.mjs');
  const { nextLevelUp } = await import('../lib/home-data.mjs');
  const catalogs = await loadCharacterCatalogs(ROOT, 'vanilla');
  const up = nextLevelUp(defaultBuild(), catalogs);
  assert.ok(up, 'the home page gets a level-up');
  assert.ok(!up.bonuses.some(b => b.attribute === 'Personality'), `bonuses: ${up.bonuses.map(b => b.attribute).join(', ')}`);
  assert.ok(up.bonuses.some(b => b.attribute === 'Endurance'));
});

test('the Level Simulator shows why it chose the archetype', async () => {
  const full = path.join(ROOT, 'components', 'level-simulator', 'attribute-priority-ranker.jsx');
  const code = require('esbuild').transformSync(fs.readFileSync(full, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  const { pathToFileURL } = require('node:url');
  const deps = { '../../lib/level-math.mjs': await import(pathToFileURL(path.join(ROOT, 'lib', 'level-math.mjs'))) };
  const mod = new Module(full, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, full);
  const Ranker = mod.exports.default;
  const { ARCHETYPES } = deps['../../lib/level-math.mjs'];
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const props = { priority: [...ARCHETYPES.warrior.priority], archetypeId: 'warrior', onSelectArchetype() {}, onReorderPriority() {} };
  try {
    await React.act(async () => root.render(React.createElement(Ranker, { ...props, detectedArchetype: { ...ARCHETYPES.warrior, reason: 'major skills Long Blade, Heavy Armor and Block' } })));
    assert.equal(document.querySelector('.archetype-reason').textContent, 'Detected from major skills Long Blade, Heavy Armor and Block.');
    await React.act(async () => root.render(React.createElement(Ranker, { ...props, detectedArchetype: ARCHETYPES.warrior })));
    assert.equal(document.querySelector('.archetype-reason'), null, 'no empty line when there is no reason');
  } finally {
    await React.act(async () => root.unmount());
  }
});
