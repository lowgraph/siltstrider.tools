/**
 * What a character build cares about, for ranking gear for it. The archetype is the
 * leveler's own (detectArchetype); the rest is read off the build's skills and
 * favoured attributes.
 */
import { ARCHETYPES, detectArchetype } from './level-math.mjs';

const ATTRIBUTES = ['Strength', 'Intelligence', 'Willpower', 'Agility', 'Speed', 'Endurance', 'Personality', 'Luck'];
const CASTING_SCHOOLS = ['Alteration', 'Conjuration', 'Destruction', 'Illusion', 'Mysticism', 'Restoration'];
const WEAPON_SKILLS = ['Long Blade', 'Short Blade', 'Blunt Weapon', 'Axe', 'Spear', 'Marksman', 'Hand-to-hand'];
// Weight by place in the archetype's attribute queue: the leveler raises the first ones
// first, so gear that fortifies them helps most.
const PRIORITY_WEIGHTS = [1, 1, 0.8, 0.5, 0.4, 0.3, 0.2, 0.2];
const SKILL_WEIGHTS = { major: 1, minor: 0.6, misc: 0.15 };

const list = value => (Array.isArray(value) ? value.filter(v => typeof v === 'string') : []);
const titled = value => String(value).replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  .replace('Hand To Hand', 'Hand-to-hand');

/**
 * A caster is a build that trains magic: two points for each casting school among its
 * majors, one for each among its minors, four or more in all. Every caster class makes
 * it (a Healer has three schools as majors); an Agent's two minor schools, a Crusader's
 * Destruction and Restoration, and a Witchhunter's Conjuration and Mysticism do not.
 */
export function castingWeight(build) {
  const maj = list(build?.maj), min = list(build?.min);
  return 2 * maj.filter(s => CASTING_SCHOOLS.includes(s)).length + min.filter(s => CASTING_SCHOOLS.includes(s)).length;
}

export function buildTraits(build) {
  const maj = list(build?.maj), min = list(build?.min);
  const archetype = detectArchetype({ ...(build || {}), maj, min });
  const caster = castingWeight(build) >= 4;
  const fighter = [...maj, ...min].some(s => WEAPON_SKILLS.includes(s));
  const favoured = new Set([build?.fav1, build?.fav2, ...list(build?.fav)].filter(Boolean));
  const attributeWeight = {};
  for (const attribute of ATTRIBUTES) {
    const place = archetype.priority.indexOf(attribute);
    let weight = PRIORITY_WEIGHTS[place] ?? 0.2;
    if (favoured.has(attribute)) weight = 1;
    // Magicka and the chance to cast: whatever else a caster does, these two carry it.
    if (caster && (attribute === 'Intelligence' || attribute === 'Willpower')) weight = 1;
    attributeWeight[attribute] = weight;
  }
  return {
    archetype: archetype.id,
    archetypeName: archetype.name,
    caster,
    fighter,
    favoured,
    attributeWeight,
    skillTier: skill => (maj.includes(skill) ? 'major' : min.includes(skill) ? 'minor' : 'misc')
  };
}

// Effects that only help a build with the magicka to use them, and attack spells a
// caster already has of their own.
const MAGICKA_EFFECTS = new Set(['Fortify Magicka', 'Fortify Maximum Magicka', 'Restore Magicka', 'Spell Absorption']);
const ATTACK_EFFECTS = new Set(['Fire Damage', 'Frost Damage', 'Shock Damage', 'Poison', 'Damage Health', 'Absorb Health']);

/** How much one effect of an item's own enchantment helps this build, 0 to 1. */
export function effectFit(effect, traits) {
  if (!traits || !effect || effect.drawback) return 1;
  const name = String(effect.name || '');
  if (effect.attribute) return traits.attributeWeight[titled(effect.attribute)] ?? 0.2;
  if (effect.skill) return SKILL_WEIGHTS[traits.skillTier(titled(effect.skill))];
  if (MAGICKA_EFFECTS.has(name)) return traits.caster ? 1 : 0.3;
  if (ATTACK_EFFECTS.has(name) && effect.range !== 'self') return traits.caster ? 0.5 : 1;
  if (name === 'Fortify Attack') return traits.fighter ? 1 : 0.3;
  return 1;
}

/**
 * What an item's own enchantment is worth to this build: each effect's published share
 * times its fit. Rows from before per-effect shares fall back to the whole enchantment's
 * value, as the rows ranked it. A curse counts in full against anyone.
 */
export function buildWorth(pick, traits) {
  const spell = pick?.enchanted;
  if (!spell) return 0;
  const effects = Array.isArray(spell.effects) ? spell.effects : [];
  if (!traits || !effects.some(e => typeof (e.value ?? e.worth) === 'number')) return spell.value ?? spell.worth ?? 0;
  return effects.reduce((sum, e) => sum + (e.value ?? e.worth ?? 0) * effectFit(e, traits), 0);
}

/** The effects that make a piece suit this build, for saying why it was chosen. */
export function fitNote(pick, traits) {
  // Rows from before per-effect shares have none; an effect is then taken at its word.
  const counts = e => !e.drawback && ((e.value ?? e.worth) == null || (e.value ?? e.worth) > 0);
  const suited = (pick?.enchanted?.effects || []).filter(e => counts(e)
    && effectFit(e, traits) >= 0.8 && (e.attribute || e.skill || MAGICKA_EFFECTS.has(e.name)));
  if (!traits || !suited.length) return '';
  const names = suited.map(e => {
    const target = e.attribute || e.skill;
    return target ? String(e.name).replace(/(Attribute|Skill)$/, titled(target)) : e.name;
  });
  return `Suits a ${ARCHETYPES[traits.archetype]?.name || traits.archetypeName}: ${[...new Set(names)].join(', ')}.`;
}
