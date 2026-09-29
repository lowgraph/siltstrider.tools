const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const facts = () => import('../scripts/social-card/facts.mjs');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'scripts', 'social-card', 'card.html'), 'utf8');

// Just enough of adaptCharacterCatalogs' shape for computeSheet.
function tinyCatalogs(overrides = {}) {
  const attrs = { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 };
  return {
    skills: ['Long Blade', 'Block', 'Destruction', 'Restoration', 'Alteration', 'Armorer', 'Sneak', 'Security', 'Alchemy', 'Enchant'],
    specSkills: { Combat: ['Long Blade', 'Block', 'Armorer'], Magic: ['Destruction', 'Restoration', 'Alteration', 'Alchemy', 'Enchant'], Stealth: ['Sneak', 'Security'] },
    races: { 'Dark Elf': { M: attrs, F: attrs, skills: {}, mag: 0 } },
    signs: { 'The Lady': { mag: 0, attrs: { Endurance: 25, Personality: 25 } } },
    classes: { Spellsword: { spec: 'Combat', fav: ['Willpower', 'Endurance'], maj: ['Block', 'Restoration', 'Long Blade', 'Destruction', 'Alteration'], min: ['Armorer', 'Enchant', 'Alchemy', 'Sneak', 'Security'] } },
    raceSpells: {}, signSpells: {},
    ...overrides
  };
}

test('placeholders are escaped, raw only in triple braces, and none may be left unfilled', async () => {
  const { fillCard } = await facts();
  assert.equal(fillCard('<b>{{name}}</b>', { name: '<Vivec & "Almalexia">' }), '<b>&lt;Vivec &amp; &quot;Almalexia&quot;&gt;</b>');
  assert.equal(fillCard('<p>{{{chips}}}</p>', { chips: '<span>×5</span>' }), '<p><span>×5</span></p>');
  assert.equal(fillCard('{{zero}}', { zero: 0 }), '0', 'a zero is a value, not a missing one');
  assert.throws(() => fillCard('{{health}} / {{magicka}}', { health: 45 }), /placeholder without a value: \{\{magicka\}\}/);
  assert.throws(() => fillCard('{{{chips}}}', {}), /placeholder without a value/);
});

test('the card refuses a sample it cannot compute rather than printing blanks', async () => {
  const { cardFacts, SAMPLE } = await facts();
  assert.throws(() => cardFacts(tinyCatalogs(), { ...SAMPLE, className: 'Nerevarine Hero' }), /Unknown class/);
  assert.throws(() => cardFacts(tinyCatalogs({ races: {} }), SAMPLE), /does not resolve/);
  assert.throws(() => cardFacts(tinyCatalogs({ signs: {} }), SAMPLE), /does not resolve/);
  assert.throws(() => cardFacts(null, SAMPLE), /Unknown class/);
});

test('the template makes no claim the launch copy removed', () => {
  const text = TEMPLATE.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ');
  for (const claim of [/verified/i, /\bexact\b/i, /parity/i, /zero[- ]tracking/i, /cookie-free/i, /100%/]) {
    assert.doesNotMatch(text, claim);
  }
  assert.match(text, /follow OpenMW 0\.51's source/);
  for (const key of ['health', 'magicka', 'fatigue', 'healthFrom', 'healthTo', 'nextLevel']) {
    assert.match(TEMPLATE, new RegExp(`\{\{${key}\}\}`), `${key} must come from the maths, not be typed in`);
  }
});

test('with the staged bundle, the card shows what the builder and Level Simulator compute', async (t) => {
  if (!fs.existsSync(path.join(ROOT, 'public', 'game-data', 'current.json'))) return t.skip('no staged game bundle');
  const { cardFacts, loadCharacterCatalogs, SAMPLE } = await facts();
  const { computeSheet } = await import('../lib/character-math.mjs');
  const catalogs = await loadCharacterCatalogs(ROOT, SAMPLE.world);
  const card = cardFacts(catalogs);
  const cls = catalogs.classes[SAMPLE.className];
  const sheet = computeSheet({ race: SAMPLE.race, gender: SAMPLE.gender, sign: SAMPLE.sign, className: SAMPLE.className, spec: cls.spec, fav1: cls.fav[0], fav2: cls.fav[1], maj: cls.maj, min: cls.min }, catalogs);
  const v = e => (e && typeof e === 'object' ? Number(e.v ?? e.value ?? 0) : Number(e));
  assert.deepEqual([card.health, card.magicka, card.fatigue], [v(sheet.health), v(sheet.magicka), v(sheet.fatigue)]);
  assert.equal(card.magicka, v(sheet.attrs.Intelligence), 'a Dark Elf Spellsword has no magicka bonus');
  assert.equal(card.bonuses.length, 3);
  assert.ok(card.healthTo > card.healthFrom);
});
