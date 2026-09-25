/**
 * Domain calculations and promotion requirement solver for Morrowind factions.
 * Mirrors the canonical FADT subrecord structure from components/esm3/loadfact.hpp.
 */

/** Normalize attribute and skill names to a canonical alphanumeric lowercase key. */
export function normalizeStatKey(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Standard Morrowind attribute names. */
export const ATTRIBUTE_NAMES = [
  'Strength', 'Intelligence', 'Willpower', 'Agility',
  'Speed', 'Endurance', 'Personality', 'Luck'
];

/** Standard Morrowind 27 skill display names. */
export const SKILL_NAMES = [
  'Block', 'Armorer', 'Medium Armor', 'Heavy Armor', 'Blunt Weapon',
  'Long Blade', 'Axe', 'Spear', 'Athletics', 'Enchant',
  'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism',
  'Restoration', 'Alchemy', 'Unarmored', 'Security', 'Sneak',
  'Acrobatics', 'Light Armor', 'Short Blade', 'Marksman', 'Mercantile',
  'Speechcraft', 'Hand-to-hand'
];

/** Extract numeric value for an attribute or skill from various character representations. */
export function getStatValue(source, key) {
  if (!source || !key) return 0;
  const targetNorm = normalizeStatKey(key);

  // If source is an array (e.g. from omwsave-parser skills/attributes)
  if (Array.isArray(source)) {
    const found = source.find(item => {
      const id = item?.id ?? item?.name ?? '';
      return normalizeStatKey(id) === targetNorm;
    });
    if (!found) return 0;
    return Number(found.value ?? found.base ?? 0);
  }

  // If source is an object (e.g. computeSheet or plain dictionary)
  if (typeof source === 'object') {
    // Check direct key match
    if (source[key] !== undefined) {
      const val = source[key];
      if (typeof val === 'number') return val;
      if (val && typeof val.v === 'number') return val.v;
      if (val && typeof val.value === 'number') return val.value;
      if (val && typeof val.base === 'number') return val.base;
    }

    // Check normalized keys
    for (const [k, val] of Object.entries(source)) {
      if (normalizeStatKey(k) === targetNorm) {
        if (typeof val === 'number') return val;
        if (val && typeof val.v === 'number') return val.v;
        if (val && typeof val.value === 'number') return val.value;
        if (val && typeof val.base === 'number') return val.base;
      }
    }
  }

  return 0;
}

/**
 * Filter factions that a player character can join (having at least 1 named rank).
 * Non-joinable factions (Sixth House, Skaal, Talos Cult, Hands of Almalexia) have ranks: [].
 */
export function joinableFactions(factions) {
  if (!Array.isArray(factions)) return [];
  return factions.filter(f => Array.isArray(f.ranks) && f.ranks.length > 0);
}

/**
 * Check whether a character satisfies all numeric requirements for a given rank index.
 *
 * Returns null if the faction has no such rank.
 * Returns true if all criteria are met, false otherwise.
 */
export function meetsRank(faction, rankIndex, character) {
  if (!faction || !Array.isArray(faction.ranks)) return null;
  const rank = faction.ranks.find(r => r.index === rankIndex);
  if (!rank) return null;

  const charAttrs = character?.attributes ?? {};
  const charSkills = character?.skills ?? {};
  const rep = Number(character?.factionReputation ?? character?.reputation ?? 0);

  // 1. Favoured Attributes
  const [firstAttr, secondAttr] = faction.favouredAttributes ?? [];
  if (firstAttr && getStatValue(charAttrs, firstAttr) < rank.attribute1) return false;
  if (secondAttr && getStatValue(charAttrs, secondAttr) < rank.attribute2) return false;

  // 2. Faction Reputation
  if (rep < rank.reputation) return false;

  // 3. Favoured Skills: 1 at primarySkill, and 2 more at favouredSkill
  const skillVals = (faction.skills ?? [])
    .map(sk => getStatValue(charSkills, sk))
    .sort((a, b) => b - a);

  if ((skillVals[0] ?? 0) < rank.primarySkill) return false;
  if ((skillVals[1] ?? 0) < rank.favouredSkill) return false;
  if ((skillVals[2] ?? 0) < rank.favouredSkill) return false;

  return true;
}

/**
 * Find the highest rank index (0 to 9) that the character currently satisfies.
 * Returns -1 if the character does not even qualify for Rank 0 (Initiate/Associate).
 */
export function getHighestEligibleRank(faction, character) {
  if (!faction || !Array.isArray(faction.ranks) || faction.ranks.length === 0) return -1;
  const sortedRanks = [...faction.ranks].sort((a, b) => b.index - a.index);
  for (const rank of sortedRanks) {
    if (meetsRank(faction, rank.index, character) === true) {
      return rank.index;
    }
  }
  return -1;
}

/**
 * Solve detailed promotion requirement gaps and deficits for the next rank.
 *
 * @param {Object} faction Faction record from Factions.json
 * @param {number} currentRank Current held rank index (-1 if not a member yet)
 * @param {Object} character Character attributes, skills, and factionReputation
 * @param {number} [targetRankIndex] Optional explicit target rank index
 */
export function solvePromotionGaps(faction, currentRank, character, targetRankIndex) {
  if (!faction || !Array.isArray(faction.ranks) || faction.ranks.length === 0) {
    return {
      isValid: false,
      isMaxRank: false,
      eligible: false,
      targetRank: null,
      attributes: [],
      skills: { primary: null, favoured: [], rankedSkills: [] },
      reputation: { required: 0, current: 0, gap: 0, met: false },
      deficits: ['Faction has no ranks or cannot be joined.']
    };
  }

  const targetIdx = targetRankIndex !== undefined
    ? targetRankIndex
    : (currentRank < 0 ? 0 : currentRank + 1);

  const targetRank = faction.ranks.find(r => r.index === targetIdx);
  const maxRankIdx = Math.max(...faction.ranks.map(r => r.index));

  if (!targetRank) {
    return {
      isValid: true,
      isMaxRank: currentRank >= maxRankIdx,
      eligible: false,
      targetRank: null,
      attributes: [],
      skills: { primary: null, favoured: [], rankedSkills: [] },
      reputation: { required: 0, current: 0, gap: 0, met: false },
      deficits: currentRank >= maxRankIdx ? ['Already reached highest achievable rank.'] : ['Invalid target rank.']
    };
  }

  const charAttrs = character?.attributes ?? {};
  const charSkills = character?.skills ?? {};
  const currentRep = Number(character?.factionReputation ?? character?.reputation ?? 0);
  const deficits = [];

  // Evaluate Attributes
  const [firstAttr, secondAttr] = faction.favouredAttributes ?? [];
  const attributes = [];

  if (firstAttr) {
    const curVal = getStatValue(charAttrs, firstAttr);
    const gap = Math.max(0, targetRank.attribute1 - curVal);
    const met = gap === 0;
    attributes.push({ name: firstAttr, required: targetRank.attribute1, current: curVal, gap, met });
    if (!met) deficits.push(`Need +${gap} ${firstAttr}`);
  }

  if (secondAttr) {
    const curVal = getStatValue(charAttrs, secondAttr);
    const gap = Math.max(0, targetRank.attribute2 - curVal);
    const met = gap === 0;
    attributes.push({ name: secondAttr, required: targetRank.attribute2, current: curVal, gap, met });
    if (!met) deficits.push(`Need +${gap} ${secondAttr}`);
  }

  // Evaluate Skills
  const rankedSkills = (faction.skills ?? [])
    .map(sk => ({ name: sk, value: getStatValue(charSkills, sk) }))
    .sort((a, b) => b.value - a.value);

  const primarySkillEntry = rankedSkills[0] ?? { name: 'None', value: 0 };
  const primaryGap = Math.max(0, targetRank.primarySkill - primarySkillEntry.value);
  const primaryMet = primaryGap === 0;
  if (!primaryMet) {
    deficits.push(`Need primary skill at ${targetRank.primarySkill} (${primarySkillEntry.name} is ${primarySkillEntry.value}, gap: +${primaryGap})`);
  }

  const favouredSkills = [];
  const fav1 = rankedSkills[1] ?? { name: 'None', value: 0 };
  const fav1Gap = Math.max(0, targetRank.favouredSkill - fav1.value);
  const fav1Met = fav1Gap === 0;
  favouredSkills.push({ name: fav1.name, required: targetRank.favouredSkill, current: fav1.value, gap: fav1Gap, met: fav1Met });
  if (!fav1Met) {
    deficits.push(`Need second favoured skill at ${targetRank.favouredSkill} (${fav1.name} is ${fav1.value}, gap: +${fav1Gap})`);
  }

  const fav2 = rankedSkills[2] ?? { name: 'None', value: 0 };
  const fav2Gap = Math.max(0, targetRank.favouredSkill - fav2.value);
  const fav2Met = fav2Gap === 0;
  favouredSkills.push({ name: fav2.name, required: targetRank.favouredSkill, current: fav2.value, gap: fav2Gap, met: fav2Met });
  if (!fav2Met) {
    deficits.push(`Need third favoured skill at ${targetRank.favouredSkill} (${fav2.name} is ${fav2.value}, gap: +${fav2Gap})`);
  }

  // Evaluate Faction Reputation
  const repGap = Math.max(0, targetRank.reputation - currentRep);
  const repMet = repGap === 0;
  if (!repMet) {
    deficits.push(`Need +${repGap} faction reputation (current: ${currentRep}, required: ${targetRank.reputation})`);
  }

  const eligible = attributes.every(a => a.met) && primaryMet && favouredSkills.every(f => f.met) && repMet;

  return {
    isValid: true,
    isMaxRank: false,
    eligible,
    targetRank,
    attributes,
    skills: {
      primary: {
        name: primarySkillEntry.name,
        required: targetRank.primarySkill,
        current: primarySkillEntry.value,
        gap: primaryGap,
        met: primaryMet
      },
      favoured: favouredSkills,
      rankedSkills
    },
    reputation: {
      required: targetRank.reputation,
      current: currentRep,
      gap: repGap,
      met: repMet
    },
    deficits
  };
}

/** Mutual exclusivity groups in Morrowind lore and engine scripts. */
export const MUTUAL_EXCLUSIONS = {
  great_houses: ['hlaalu', 'redoran', 'telvanni'],
  vampire_clans: ['clan aundae', 'clan berne', 'clan quarra']
};

/**
 * Check if joining a faction conflicts with already joined factions.
 */
export function getMutualExclusionConflict(targetFactionKey, joinedFactionKeys = []) {
  if (!targetFactionKey || !Array.isArray(joinedFactionKeys)) return null;
  const targetNorm = targetFactionKey.toLowerCase();
  const joinedNorm = joinedFactionKeys.map(k => k.toLowerCase());

  // Great Houses
  if (MUTUAL_EXCLUSIONS.great_houses.includes(targetNorm)) {
    const rival = joinedNorm.find(k => k !== targetNorm && MUTUAL_EXCLUSIONS.great_houses.includes(k));
    if (rival) {
      return {
        category: 'Great House',
        rival,
        description: `Joining ${targetFactionKey} is mutually exclusive with ${rival}.`
      };
    }
  }

  // Vampire Clans
  if (MUTUAL_EXCLUSIONS.vampire_clans.includes(targetNorm)) {
    const rival = joinedNorm.find(k => k !== targetNorm && MUTUAL_EXCLUSIONS.vampire_clans.includes(k));
    if (rival) {
      return {
        category: 'Vampire Clan',
        rival,
        description: `Belonging to ${targetFactionKey} is mutually exclusive with rival vampire clan ${rival}.`
      };
    }
  }

  return null;
}

/**
 * Organize reactions for a faction into Allies (positive), Hostile (negative), and Neutral.
 */
export function getFactionReactions(faction) {
  if (!faction || !Array.isArray(faction.reactions)) {
    return { allies: [], hostile: [], neutral: [] };
  }

  const allies = [];
  const hostile = [];
  const neutral = [];

  for (const r of faction.reactions) {
    if (r.adjustment > 0) allies.push(r);
    else if (r.adjustment < 0) hostile.push(r);
    else neutral.push(r);
  }

  allies.sort((a, b) => b.adjustment - a.adjustment);
  hostile.sort((a, b) => a.adjustment - b.adjustment);

  return { allies, hostile, neutral };
}

/** Known quest prefixes for Morrowind factions. */
export const FACTION_QUEST_PREFIXES = {
  'fighters guild': ['fg_'],
  'mages guild': ['mg_'],
  'thieves guild': ['tg_'],
  'imperial legion': ['il_'],
  'imperial cult': ['ic_'],
  'hlaalu': ['hh_'],
  'redoran': ['hr_'],
  'telvanni': ['ht_'],
  'temple': ['tt_'],
  'morag tong': ['mt_'],
  'east empire company': ['co_'],
  'clan aundae': ['va_'],
  'clan berne': ['vb_'],
  'clan quarra': ['vq_'],
  'blades': ['a1_'],
  'ashlanders': ['a2_', 'b1_', 'b2_', 'b3_', 'b4_']
};

/**
 * Filter quests associated with a faction and link save progress if available.
 */
export function getFactionQuests(factionKey, questCatalog, saveQuests = []) {
  if (!factionKey || !questCatalog || !Array.isArray(questCatalog.records)) return [];

  const normKey = factionKey.toLowerCase();
  const prefixes = FACTION_QUEST_PREFIXES[normKey] || [];
  const progressMap = new Map();

  if (Array.isArray(saveQuests)) {
    saveQuests.forEach(q => {
      const qk = (q.id || q.questKey || '').toLowerCase();
      if (qk) progressMap.set(qk, q);
    });
  }

  return questCatalog.records
    .filter(record => {
      const qk = (record.key || '').toLowerCase();
      // Prefix match or explicit faction name in title/key
      if (prefixes.some(p => qk.startsWith(p))) return true;
      if (record.name && record.name.toLowerCase().includes(normKey)) return true;
      return false;
    })
    .map(record => {
      const qk = (record.key || '').toLowerCase();
      const progress = progressMap.get(qk);
      const isFinished = Boolean(progress?.finished || (progress?.stage && record.finishesAt?.includes(progress.stage)));
      const isActive = Boolean(progress && !isFinished);

      return {
        key: record.key,
        name: record.name || record.key,
        trackable: Boolean(record.trackable),
        stages: record.stages || [],
        finishesAt: record.finishesAt || [],
        progress: progress ? {
          stage: progress.stage ?? 0,
          finished: isFinished,
          status: isFinished ? 'finished' : (isActive ? 'active' : 'unstarted')
        } : null
      };
    });
}

export function factionCharacter(sheet, savedSheet) {
 const source = savedSheet || sheet || {};
 return {...source, attributes: source.attrs || source.attributes || {}};
}
