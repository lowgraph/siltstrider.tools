const { test } = require('node:test');
const assert = require('node:assert/strict');
const mod = import('../lib/build-traits.mjs');

// Vanilla's class definitions, as the builder's catalogs label them.
const MAGE = { className: 'Mage', spec: 'Magic', fav1: 'Intelligence', fav2: 'Willpower',
  maj: ['Mysticism', 'Destruction', 'Alteration', 'Illusion', 'Restoration'],
  min: ['Enchant', 'Alchemy', 'Unarmored', 'Conjuration', 'Short Blade'] };
const NIGHTBLADE = { className: 'Nightblade', spec: 'Magic', fav1: 'Willpower', fav2: 'Speed',
  maj: ['Mysticism', 'Illusion', 'Alteration', 'Sneak', 'Short Blade'],
  min: ['Light Armor', 'Unarmored', 'Destruction', 'Marksman', 'Security'] };
const WARRIOR = { className: 'Warrior', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Athletics', 'Block'],
  min: ['Armorer', 'Spear', 'Blunt Weapon', 'Axe', 'Hand-to-hand'] };
const AGENT = { className: 'Agent', spec: 'Stealth', fav1: 'Personality', fav2: 'Agility',
  maj: ['Speechcraft', 'Sneak', 'Acrobatics', 'Light Armor', 'Short Blade'],
  min: ['Mercantile', 'Conjuration', 'Block', 'Unarmored', 'Illusion'] };
const fortify = (attribute, share) => ({ name: 'Fortify Attribute', attribute, skill: null, value: share, worth: share, range: 'self', drawback: false });
const MENTOR = { key: 'ring_mentor_unique', name: "Mentor's Ring",
  enchanted: { castType: 'constant_effect', value: 100.1, worth: 100.1, effects: [fortify('intelligence', 50), fortify('willpower', 50)] } };

test('a caster trains magic, whatever the leveler calls the class', async () => {
  const { buildTraits, castingWeight } = await mod;
  assert.equal(castingWeight(MAGE), 11);
  assert.equal(buildTraits(MAGE).caster, true);
  assert.equal(buildTraits(NIGHTBLADE).caster, true, 'three schools as majors, one as a minor');
  assert.equal(buildTraits(AGENT).archetype, 'nightblade', "the leveler's own grouping");
  assert.equal(buildTraits(AGENT).caster, false, 'two minor schools do not make a caster');
  assert.equal(buildTraits(WARRIOR).caster, false);
  assert.equal(buildTraits(WARRIOR).fighter, true);
});

test('attributes count by the archetype queue, favoured ones fully, and magicka for every caster', async () => {
  const { buildTraits } = await mod;
  const mage = buildTraits(MAGE).attributeWeight;
  assert.equal(mage.Intelligence, 1);
  assert.equal(mage.Willpower, 1);
  const warrior = buildTraits(WARRIOR).attributeWeight;
  assert.equal(warrior.Strength, 1);
  assert.ok(warrior.Intelligence < 0.5 && warrior.Willpower < 0.5);
  const nightblade = buildTraits(NIGHTBLADE).attributeWeight;
  assert.equal(nightblade.Intelligence, 1, "a hybrid caster's magicka still counts in full");
  assert.equal(nightblade.Speed, 1, 'favoured');
});

test('effects fit the build that can use them', async () => {
  const { buildTraits, effectFit } = await mod;
  const mage = buildTraits(MAGE), warrior = buildTraits(WARRIOR);
  assert.equal(effectFit({ name: 'Fortify Skill', skill: 'long_blade' }, warrior), 1, 'a major skill');
  assert.equal(effectFit({ name: 'Fortify Skill', skill: 'hand_to_hand' }, warrior), 0.6, 'a minor, labelled as the builder does');
  assert.equal(effectFit({ name: 'Fortify Skill', skill: 'mercantile' }, warrior), 0.15);
  assert.equal(effectFit({ name: 'Fortify Magicka' }, mage), 1);
  assert.equal(effectFit({ name: 'Fortify Magicka' }, warrior), 0.3);
  assert.equal(effectFit({ name: 'Poison', range: 'touch' }, mage), 0.5, 'a caster has attack spells of their own');
  assert.equal(effectFit({ name: 'Poison', range: 'touch' }, warrior), 1);
  assert.equal(effectFit({ name: 'Shield', range: 'self' }, mage), 1);
  assert.equal(effectFit({ name: 'Drain Attribute', attribute: 'intelligence', drawback: true }, warrior), 1, 'a curse counts in full');
  assert.equal(effectFit({ name: 'Fortify Attribute', attribute: 'nonsense' }, mage), 0.2);
  assert.equal(effectFit({ name: 'Anything' }, null), 1);
  assert.equal(effectFit(null, mage), 1);
});

test("Mentor's Ring is worth more to a mage than to a warrior", async () => {
  const { buildTraits, buildWorth } = await mod;
  assert.equal(buildWorth(MENTOR, buildTraits(MAGE)), 100);
  assert.ok(buildWorth(MENTOR, buildTraits(WARRIOR)) < 40);
  assert.equal(buildWorth(MENTOR, null), 100.1, 'no build: the whole value');
  const older = { enchanted: { value: 80, effects: [{ name: 'Fortify Attribute', attribute: 'intelligence' }] } };
  assert.equal(buildWorth(older, buildTraits(MAGE)), 80, 'rows without per-effect shares keep their value');
  const cursed = { enchanted: { effects: [{ name: 'Drain Attribute', attribute: 'strength', value: -12.5, drawback: true }] } };
  assert.equal(buildWorth(cursed, buildTraits(MAGE)), -12.5);
  assert.equal(buildWorth({}, buildTraits(MAGE)), 0);
});

test('a note says why a piece suits the build, and only when it does', async () => {
  const { buildTraits, fitNote } = await mod;
  assert.equal(fitNote(MENTOR, buildTraits(MAGE)), 'Suits a Pure Mage / Caster: Fortify Intelligence, Fortify Willpower.');
  assert.equal(fitNote(MENTOR, buildTraits(WARRIOR)), '');
  assert.equal(fitNote({ enchanted: { effects: [{ name: 'Poison', value: 144, range: 'touch' }] } }, buildTraits(WARRIOR)), '',
    'an attack spell is not a trait of the build');
  assert.equal(fitNote(MENTOR, null), '');
  assert.equal(fitNote(null, buildTraits(MAGE)), '');
  const older = { enchanted: { effects: [{ name: 'Fortify Attribute', attribute: 'intelligence' }, { name: 'Fortify Attribute', attribute: 'willpower', value: 0 }] } };
  assert.equal(fitNote(older, buildTraits(MAGE)), 'Suits a Pure Mage / Caster: Fortify Intelligence.',
    'rows without per-effect shares still say why; an effect worth nothing does not');
});

test('odd builds do not throw', async () => {
  const { buildTraits, castingWeight } = await mod;
  for (const build of [undefined, null, {}, { maj: 'Destruction', min: null }, { maj: [7, null, 'Alteration'], fav: ['Luck'] }]) {
    const traits = buildTraits(build);
    assert.equal(typeof traits.caster, 'boolean');
    assert.equal(Object.keys(traits.attributeWeight).length, 8);
    assert.ok(Number.isFinite(castingWeight(build)));
  }
  assert.equal(buildTraits({ fav: ['Luck'] }).attributeWeight.Luck, 1);
});
