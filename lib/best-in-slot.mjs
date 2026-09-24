/**
 * Best-in-slot resolution and scoring engine for Morrowind constant-effect late game gear.
 *
 * Implements the contract defined in best-in-slot-types.ts, resolving pre-computed
 * BestInSlot catalog records for known builds and evaluating custom characters client-side
 * using the model shipped in catalog metadata.
 */

export const SLOT_ORDER = [
  'helmet', 'cuirass', 'left_pauldron', 'right_pauldron',
  'left_hand', 'right_hand', 'greaves', 'boots', 'shield',
  'weapon', 'shirt', 'pants', 'skirt', 'robe', 'belt', 'amulet', 'ring'
];

export const SLOT_LABELS = {
  helmet: 'Helmet',
  cuirass: 'Cuirass',
  left_pauldron: 'Left Pauldron',
  right_pauldron: 'Right Pauldron',
  left_hand: 'Left Gauntlet / Bracer',
  right_hand: 'Right Gauntlet / Bracer',
  greaves: 'Greaves',
  boots: 'Boots',
  shield: 'Shield',
  weapon: 'Primary Weapon',
  shirt: 'Shirt',
  pants: 'Pants',
  skirt: 'Skirt',
  robe: 'Robe',
  belt: 'Belt',
  amulet: 'Amulet',
  ring: 'Ring'
};

const ARMOUR_SKILLS = {
  light: 'light_armor',
  medium: 'medium_armor',
  heavy: 'heavy_armor'
};

const CASTING_SCHOOLS = ['alteration', 'conjuration', 'destruction', 'illusion', 'mysticism', 'restoration'];
const WEAPON_SKILLS = ['long_blade', 'short_blade', 'blunt_weapon', 'axe', 'spear', 'marksman', 'hand_to_hand'];

export const BEAST_RACES = ['argonian', 'khajiit'];

function normalizeSlug(val) {
  return String(val || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
}

/**
 * Returns pre-calculated record for one build and toggle setting from BestInSlot catalog.
 */
export function picksForBuild(catalogData, buildName, allowFormidableSources = false) {
  const records = catalogData?.catalogs?.BestInSlot || catalogData?.records || (Array.isArray(catalogData) ? catalogData : []);
  if (!records.length || !buildName) return null;

  const targetName = buildName.toLowerCase().trim();
  const allow = Boolean(allowFormidableSources);

  return records.find(r =>
    r.build.toLowerCase().trim() === targetName &&
    Boolean(r.toggles?.allowFormidableSources) === allow
  ) || records.find(r =>
    r.build.toLowerCase().trim() === targetName
  ) || null;
}

/**
 * Derives traits from a character build.
 */
export function deriveBuildTraits(build, model = null) {
  const raceSlug = normalizeSlug(build?.race);
  const isBeast = BEAST_RACES.some(b => raceSlug.includes(b));

  const major = (build?.maj || []).map(normalizeSlug);
  const minor = (build?.min || []).map(normalizeSlug);
  const classed = new Set([...major, ...minor]);

  const skillTier = {};
  for (const s of classed) {
    skillTier[s] = major.includes(s) ? 'major' : 'minor';
  }

  // Favoured attributes
  const favRaw = [];
  if (build?.fav1) favRaw.push(build.fav1);
  if (build?.fav2) favRaw.push(build.fav2);
  if (build?.fav && typeof build.fav === 'string') {
    favRaw.push(...build.fav.split(',').map(s => s.trim()));
  }
  const favoured = new Set(favRaw.map(normalizeSlug));

  // Archetypes
  const casterHitCount = CASTING_SCHOOLS.filter(s => classed.has(s)).length;
  const isCaster = casterHitCount >= 2;
  const isFighter = WEAPON_SKILLS.some(s => classed.has(s));

  // Critical attributes
  const critical = new Set(['endurance']);
  if (isCaster) {
    critical.add('intelligence');
    critical.add('willpower');
  }
  if (isFighter) {
    critical.add('strength');
    critical.add('agility');
  }

  return {
    race: build?.race || '',
    beast: isBeast,
    major,
    minor,
    classed,
    skillTier,
    favoured,
    caster: isCaster,
    fighter: isFighter,
    critical
  };
}

function saturate(value, cap) {
  return Math.max(0, Math.min(value, cap)) / cap;
}

/**
 * Evaluates drawback severity for this build.
 */
function evaluateSeverity(effect, rule, traits) {
  const kind = rule.rule;
  if (kind === 'flat') return rule.severity;
  if (kind === 'archetype') return traits.caster ? rule.caster : rule.other;

  const zeroes = rule.zeroesAt;
  if (kind === 'attribute') {
    const attr = normalizeSlug(effect.attribute);
    const critical = traits.critical.has(attr);
    let level;
    if (traits.favoured.has(attr)) {
      level = rule.favoured;
    } else if (critical) {
      level = rule.critical || rule.governing;
    } else {
      level = rule.other;
    }
    if (zeroes && critical && (effect.magnitude || 0) >= zeroes) {
      return 'disqualifying';
    }
    return level;
  }

  if (kind === 'skill') {
    const skill = normalizeSlug(effect.skill);
    const tier = traits.skillTier[skill] || 'misc';
    if (zeroes && (tier === 'major' || tier === 'minor') && (effect.magnitude || 0) >= zeroes) {
      return 'disqualifying';
    }
    return rule[tier];
  }

  return 'none';
}

function formatEffectLabel(effect) {
  const target = effect.skill || effect.attribute;
  let name = effect.name;
  if (target && name.startsWith('Fortify ')) {
    const formatted = target.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    name = 'Fortify ' + formatted;
  } else if (target) {
    const formatted = target.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    name = `${name} (${formatted})`;
  }
  return `${name} ${effect.magnitude}`;
}

/**
 * Scores an individual gear item against build traits using the bundle scoring model.
 */
export function scoreItem(item, traits, model, allowFormidable = false) {
  if (!item || !model) return null;
  const source = item.source || { kind: 'unconfirmed' };
  if (source.kind === 'unconfirmed') return null;
  if (traits.beast && !item.beastWearable) return null;

  const formidableLevel = model.toggles?.allowFormidableSources?.formidableLevel ?? 30;
  const hasQuest = Array.isArray(source.questGrants) && source.questGrants.length > 0;
  if (!allowFormidable && !hasQuest && (source.easiestLevel || 0) > formidableLevel) {
    return null;
  }

  const tiers = model.tiers || { essential: 10, strong: 6, qol: 3, low: 1 };
  const parts = [];
  const warnings = [];

  for (const effect of item.effects || []) {
    const name = effect.name;
    const rule = model.drawbacks?.[name];
    if (rule) {
      const sev = evaluateSeverity(effect, rule, traits);
      if (sev === 'disqualifying') return null;
      if (sev === 'significant') {
        const mit = rule.mitigation ? ` (cancelled by ${rule.mitigation})` : '';
        warnings.push(`${formatEffectLabel(effect)}${mit}`);
      }
      continue;
    }

    if (name === 'Fortify Skill') {
      const derived = model.derived?.[name] || { major: 8, minor: 5, misc: 1, cap: 25 };
      const skill = normalizeSlug(effect.skill);
      const tier = traits.skillTier[skill] || 'misc';
      const weight = derived[tier] ?? 1;
      const val = weight * saturate(effect.magnitude, derived.cap || 25);
      if (val > 0) parts.push([formatEffectLabel(effect), val]);
    } else if (name === 'Fortify Attribute') {
      const derived = model.derived?.[name] || { favoured: 8, luck: 3, floor: 2, cap: 25 };
      const attr = normalizeSlug(effect.attribute);
      let weight = derived.floor ?? 2;
      if (traits.favoured.has(attr)) {
        weight = derived.favoured ?? 8;
      } else if (attr === 'luck') {
        weight = derived.luck ?? 3;
      }
      const val = weight * saturate(effect.magnitude, derived.cap || 25);
      if (val > 0) parts.push([formatEffectLabel(effect), val]);
    } else {
      const effectRule = model.effects?.[name];
      if (!effectRule) continue;
      if (effectRule.fit === 'caster' && !traits.caster) continue;
      if (effectRule.fit === 'fighter' && !traits.fighter) continue;
      const tierWeight = tiers[effectRule.tier] ?? 1;
      const val = tierWeight * saturate(effect.magnitude, effectRule.cap);
      if (val > 0) parts.push([formatEffectLabel(effect), val]);
    }
  }

  // Armor Rating contribution
  if (item.armorRating != null && item.armorClass) {
    const armour = model.armour || { major: 8, minor: 5, misc: 2, ratingCap: 80 };
    const skillKey = ARMOUR_SKILLS[item.armorClass];
    const tier = traits.skillTier[skillKey] || 'misc';
    const weight = armour[tier] ?? 2;
    const val = weight * saturate(item.armorRating, armour.ratingCap || 80);
    if (val > 0) {
      parts.push([`${item.armorClass.charAt(0).toUpperCase() + item.armorClass.slice(1)} armour ${item.armorRating}`, val]);
    }
  }

  // Weapon damage contribution
  if (item.weaponSkill && item.damage != null) {
    const weapons = model.weapons || { major: 8, minor: 5, misc: 1, damageCap: 60 };
    const tier = traits.skillTier[normalizeSlug(item.weaponSkill)] || 'misc';
    const weight = weapons[tier] ?? 1;
    const val = weight * saturate(item.damage, weapons.damageCap || 60);
    if (val > 0) {
      const wLabel = item.weaponSkill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      parts.push([`${wLabel} damage ${item.damage}`, val]);
    }
  }

  if (parts.length === 0) return null;

  parts.sort((a, b) => b[1] - a[1]);
  const totalScore = Math.round(parts.reduce((sum, p) => sum + p[1], 0) * 100) / 100;

  return {
    score: totalScore,
    reasons: parts.slice(0, 3).map(([lbl, val]) => [lbl, Math.round(val * 100) / 100]),
    warnings
  };
}

/**
 * Finds the closest matching premade build in catalog records for a custom character.
 */
export function findClosestBuildRecord(records, build, allowFormidable = false) {
  if (!records?.length) return null;
  const allow = Boolean(allowFormidable);
  const candidates = records.filter(r => Boolean(r.toggles?.allowFormidableSources) === allow);

  const race = normalizeSlug(build?.race);
  const buildMaj = (build?.maj || []).map(normalizeSlug);
  const buildMin = (build?.min || []).map(normalizeSlug);
  const buildSkills = new Set([...buildMaj, ...buildMin]);

  let bestMatch = candidates[0] || records[0];
  let bestScore = -1;

  for (const cand of candidates) {
    let score = 0;
    if (normalizeSlug(cand.race) === race) score += 10;
    // Category match
    if (cand.category && build?.spec && cand.category.toLowerCase().includes(build.spec.toLowerCase())) {
      score += 5;
    }
    if (cand.caster && buildMaj.some(s => CASTING_SCHOOLS.includes(s))) score += 3;
    if (cand.fighter && buildMaj.some(s => WEAPON_SKILLS.includes(s))) score += 3;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cand;
    }
  }

  return bestMatch;
}

/**
 * Resolves best-in-slot picks for a character build using the loaded bestInSlot feature bundle.
 */
export function resolveBestInSlotPicks(featureData, build, { allowFormidableSources = false, beast = false, weaponSetup = null } = {}) {
  if (!featureData || !build) return null;

  const bisCatalog = featureData.catalogs?.BestInSlot;
  const bisMetadata = featureData.metadata?.BestInSlot || {};
  const itemsMap = bisMetadata.items || {};
  const model = bisMetadata.model;
  const matchesSetup = item => {
    if (!weaponSetup) return true;
    if (item?.slot === 'shield') return weaponSetup !== 'two-handed';
    if (item?.slot !== 'weapon') return true;
    const types = weaponSetup === 'two-handed' ? ['AX2H','SP2H','LB2H','BL2W','BL2C','BOW','CROSSBOW'] : ['SB1H','LB1H','BL1H','AX1H','THROWN'];
    return types.includes(item.type);
  };

  const records = Array.isArray(bisCatalog) ? bisCatalog : [];
  const buildName = build.name || build.className || '';

  // 1. Try exact premade match
  let record = picksForBuild(records, buildName, allowFormidableSources);

  // 2. If not found or if custom build with model present, evaluate dynamically or use closest
  let slots = {};
  if (record && !(weaponSetup && model && Object.keys(itemsMap).length)) {
    slots = record.slots || {};
  } else if (model && Object.keys(itemsMap).length > 0) {
    // Dynamic client-side evaluation
    const traits = deriveBuildTraits(build, model);
    traits.beast = Boolean(beast || traits.beast);

    const slotCandidates = {};
    for (const item of Object.values(itemsMap)) {
      if (!matchesSetup(item)) continue;
      const scored = scoreItem(item, traits, model, allowFormidableSources);
      if (!scored || scored.score <= 0) continue;
      if (!slotCandidates[item.slot]) slotCandidates[item.slot] = [];
      slotCandidates[item.slot].push({ item: item.key, scored, details: item });
    }

    for (const [slot, entries] of Object.entries(slotCandidates)) {
      entries.sort((a, b) => b.scored.score - a.scored.score || (a.details.source?.easiestLevel || 0) - (b.details.source?.easiestLevel || 0));
      // Deduplicate by name
      const seen = new Set();
      const unique = [];
      for (const e of entries) {
        const lowerName = (e.details.name || '').toLowerCase();
        if (seen.has(lowerName)) continue;
        seen.add(lowerName);
        unique.push(e);
      }
      slots[slot] = unique.slice(0, 3).map(u => ({
        item: u.item,
        score: u.scored.score,
        reasons: u.scored.reasons,
        warnings: u.scored.warnings
      }));
    }
  } else {
    // Fallback to closest record
    record = findClosestBuildRecord(records, build, allowFormidableSources);
    slots = record?.slots || {};
  }

  // 3. Resolve each slot to full item data
  // Hand preference changes weapons and shields, not the premade's other picks.
  if (record && weaponSetup && model) slots = { ...record.slots, weapon: slots.weapon || [], shield: slots.shield || [] };
  if (weaponSetup) slots = Object.fromEntries(Object.entries(slots).map(([slot, picks]) => [slot,
    slot === 'shield' && weaponSetup === 'two-handed' ? [] : picks.filter(p => slot !== 'weapon' || (itemsMap[p.item] && matchesSetup(itemsMap[p.item])))
  ]));
  const groups = [];

  // Group 1: Armor & Shield
  const armorSlots = ['helmet', 'cuirass', 'left_pauldron', 'right_pauldron', 'left_hand', 'right_hand', 'greaves', 'boots', 'shield'];
  const armorRows = [];
  for (const s of armorSlots) {
    const picks = slots[s] || [];
    if (picks.length > 0) {
      armorRows.push({
        slotKey: s,
        slotLabel: SLOT_LABELS[s] || s,
        picks: picks.map(p => ({
          pick: p,
          item: itemsMap[p.item] || { key: p.item, name: p.item }
        }))
      });
    }
  }
  if (armorRows.length > 0) {
    groups.push({ label: weaponSetup === 'two-handed' ? 'Optimized Armor' : 'Optimized Armor & Shield', rows: armorRows });
  }

  // Group 2: Weapons
  const wepPicks = slots.weapon || [];
  if (wepPicks.length > 0) {
    groups.push({
      label: 'Optimized Weapons',
      rows: [{
        slotKey: 'weapon',
        slotLabel: 'Primary Weapon',
        picks: wepPicks.map(p => ({
          pick: p,
          item: itemsMap[p.item] || { key: p.item, name: p.item }
        }))
      }]
    });
  }

  // Group 3: Clothing & Jewelry
  const clothSlots = ['shirt', 'pants', 'skirt', 'robe', 'belt', 'amulet', 'ring'];
  const clothRows = [];
  for (const s of clothSlots) {
    const picks = slots[s] || [];
    if (picks.length > 0) {
      // If ring, show up to 2 distinct ring picks as Ring 1 and Ring 2
      if (s === 'ring') {
        const ring1 = picks[0];
        const ring2 = picks[1];
        if (ring1) {
          clothRows.push({
            slotKey: 'ring_1',
            slotLabel: 'Ring 1',
            picks: [{ pick: ring1, item: itemsMap[ring1.item] || { key: ring1.item, name: ring1.item } }]
          });
        }
        if (ring2) {
          clothRows.push({
            slotKey: 'ring_2',
            slotLabel: 'Ring 2',
            picks: [{ pick: ring2, item: itemsMap[ring2.item] || { key: ring2.item, name: ring2.item } }]
          });
        }
      } else {
        clothRows.push({
          slotKey: s,
          slotLabel: SLOT_LABELS[s] || s,
          picks: picks.map(p => ({
            pick: p,
            item: itemsMap[p.item] || { key: p.item, name: p.item }
          }))
        });
      }
    }
  }
  if (clothRows.length > 0) {
    groups.push({ label: 'Constant-Effect Clothing & Jewelry', rows: clothRows });
  }

  return {
    matchedBuild: record?.build || buildName,
    toggles: { allowFormidableSources },
    groups
  };
}
