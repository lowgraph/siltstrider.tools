/**
 * OpenMW Alchemy Mechanics & Brewing Calculations
 */

export const APPARATUS_TIERS = {
  mortar: [
    { id: "apparatus_a_mortar_01", name: "Apprentice's Mortar and Pestle", quality: 0.5, weight: 5, value: 100 },
    { id: "apparatus_j_mortar_01", name: "Journeyman's Mortar and Pestle", quality: 1.0, weight: 4, value: 400 },
    { id: "apparatus_m_mortar_01", name: "Master's Mortar and Pestle", quality: 1.2, weight: 3, value: 2400 },
    { id: "apparatus_g_mortar_01", name: "Grandmaster's Mortar and Pestle", quality: 1.5, weight: 2, value: 4000 }
  ],
  alembic: [
    { id: "none", name: "None", quality: 0, weight: 0, value: 0 },
    { id: "apparatus_a_alembic_01", name: "Apprentice's Alembic", quality: 0.5, weight: 10, value: 50 },
    { id: "apparatus_j_alembic_01", name: "Journeyman's Alembic", quality: 1.0, weight: 7, value: 200 },
    { id: "apparatus_m_alembic_01", name: "Master's Alembic", quality: 1.2, weight: 5, value: 1200 },
    { id: "apparatus_g_alembic_01", name: "Grandmaster's Alembic", quality: 1.5, weight: 3, value: 4000 }
  ],
  calcinator: [
    { id: "none", name: "None", quality: 0, weight: 0, value: 0 },
    { id: "apparatus_a_calcinator_01", name: "Apprentice's Calcinator", quality: 0.5, weight: 25, value: 10 },
    { id: "apparatus_j_calcinator_01", name: "Journeyman's Calcinator", quality: 1.0, weight: 18, value: 40 },
    { id: "apparatus_m_calcinator_01", name: "Master's Calcinator", quality: 1.2, weight: 13, value: 240 },
    { id: "apparatus_g_calcinator_01", name: "Grandmaster's Calcinator", quality: 1.5, weight: 8, value: 4000 }
  ],
  retort: [
    { id: "none", name: "None", quality: 0, weight: 0, value: 0 },
    { id: "apparatus_a_retort_01", name: "Apprentice's Retort", quality: 0.5, weight: 8, value: 20 },
    { id: "apparatus_j_retort_01", name: "Journeyman's Retort", quality: 1.0, weight: 6, value: 80 },
    { id: "apparatus_m_retort_01", name: "Master's Retort", quality: 1.2, weight: 4, value: 480 },
    { id: "apparatus_g_retort_01", name: "Grandmaster's Retort", quality: 1.5, weight: 3, value: 1600 }
  ]
};

export function getEffectKey(effect) {
  if (!effect) return "";
  const name = effect.n || effect.name || "";
  const arg = effect.arg || "";
  return arg ? `${name}:${arg}` : name;
}

export function formatEffectLabel(effect) {
  if (!effect) return "";
  const name = effect.n || effect.name || "";
  const arg = effect.arg || "";
  if (arg && / Attribute$/.test(name)) return name.replace(/ Attribute$/, "") + " " + arg;
  if (arg && / Skill$/.test(name)) return name.replace(/ Skill$/, "") + " " + arg;
  if (arg && name.includes(arg)) return name;
  return arg ? `${name} ${arg}` : name;
}

/**
 * Given 2 to 4 ingredient objects, find effects shared by at least 2 ingredients.
 */
export function findSharedEffects(ingredients = []) {
  const activeIngs = ingredients.filter(Boolean);
  if (activeIngs.length < 2) return [];

  const effectCounts = new Map();
  const effectMap = new Map();

  for (let i = 0; i < activeIngs.length; i++) {
    const ing = activeIngs[i];
    const effects = ing.effects || [];
    const seenInThisIng = new Set();

    for (let j = 0; j < effects.length; j++) {
      const eff = effects[j];
      const k = getEffectKey(eff);
      if (!k || seenInThisIng.has(k)) continue;
      seenInThisIng.add(k);

      effectCounts.set(k, (effectCounts.get(k) || 0) + 1);
      if (!effectMap.has(k)) {
        effectMap.set(k, eff);
      }
    }
  }

  const shared = [];
  for (const [key, count] of effectCounts.entries()) {
    if (count >= 2) {
      shared.push({
        key,
        count,
        effect: effectMap.get(key)
      });
    }
  }

  return shared;
}

/**
 * Calculates potion properties using OpenMW formulas.
 */
export function calculatePotion({
  ingredients = [],
  alchemySkill = 50,
  intelligence = 40,
  luck = 40,
  mortarQuality = 1.0,
  alembicQuality = 0,
  calcinatorQuality = 0,
  retortQuality = 0
}) {
  const shared = findSharedEffects(ingredients);
  const alchemyFactor = alchemySkill + (0.1 * intelligence) + (0.1 * luck);
  const brewChance = Math.max(0, Math.min(100, Math.round(alchemyFactor)));

  if (shared.length === 0) {
    return {
      isValid: false,
      brewChance,
      effects: [],
      goldValue: 0,
      name: "Failed Brew",
      message: "No shared effects between chosen ingredients. At least two ingredients must share an effect."
    };
  }

  const fPotionStrengthMult = 0.5;
  const fPotionT1MagMult = 1.0;
  const fPotionT1DurMult = 0.5;

  let totalGold = 0;
  const calculatedEffects = [];

  for (const item of shared) {
    const eff = item.effect;
    const baseCost = eff.b || 1;
    const isBad = Boolean(eff.bad || eff.harmful);

    // Modifiers from apparatus
    let appMod = mortarQuality;
    if (calcinatorQuality > 0) {
      appMod += calcinatorQuality * 0.5;
    }
    if (isBad && alembicQuality > 0) {
      appMod = Math.max(0.1, appMod - (alembicQuality * 0.5));
    }
    if (!isBad && retortQuality > 0) {
      appMod += retortQuality * 0.5;
    }

    const strength = (alchemyFactor / baseCost) * appMod * fPotionStrengthMult;
    const mag = Math.max(1, Math.round(strength * fPotionT1MagMult));
    const dur = Math.max(1, Math.round(strength * fPotionT1DurMult));

    const goldContribution = Math.round(strength * 2.5);
    totalGold += goldContribution;

    calculatedEffects.push({
      key: item.key,
      label: formatEffectLabel(eff),
      magnitude: mag,
      duration: dur,
      isBad
    });
  }

  // Potion name derived from first shared effect
  const primaryEffect = calculatedEffects[0];
  const potionName = primaryEffect ? `Potion of ${primaryEffect.label}` : "Custom Potion";

  return {
    isValid: true,
    name: potionName,
    brewChance,
    goldValue: Math.max(5, totalGold),
    effects: calculatedEffects,
    sharedCount: shared.length
  };
}
