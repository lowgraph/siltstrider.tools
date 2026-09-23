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
  const name = effect.id ?? effect.n ?? effect.name ?? "";
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

  const shared = new Map();
  // OpenMW visits pairs in slot order, then the first ingredient's effect slots.
  for(let i=0;i<activeIngs.length-1;i++)for(let j=i+1;j<activeIngs.length;j++){
    for(const effect of activeIngs[i].effects || []){
      const key=getEffectKey(effect);
      if(key&&!shared.has(key)&&(activeIngs[j].effects || []).some(e=>getEffectKey(e)===key))
        shared.set(key,{key,effect,count:activeIngs.filter(ing=>(ing.effects||[]).some(e=>getEffectKey(e)===key)).length});
    }
  }
  return [...shared.values()];
}

export function sharesAlchemyEffect(first, candidate){
  const keys=new Set((first?.effects||[]).filter(Boolean).map(getEffectKey));
  return (candidate?.effects||[]).filter(Boolean).some(e=>keys.has(getEffectKey(e)));
}

// OpenMW 0.51.0 apps/openmw/mwmechanics/alchemy.cpp: applyTools/updateEffects.
function applyTools(e,value,alembic,calcinator,retort){
  const negative=Boolean(e.harmful ?? e.bad), both=e.mag!==0&&e.dur!==0;
  const tool=negative?alembic:retort;
  if(!tool&&!calcinator)return value;
  const quality=tool&&calcinator
    ? (negative?2*tool+3*calcinator:both?2*tool+calcinator:2/3*(tool+calcinator)+.5)
    : tool ? (negative?1+tool:both?tool:tool+.5)
    : both?calcinator:calcinator+.5;
  return !tool||!negative?value+quality:value/quality;
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
  retortQuality = 0,
  settings = {fPotionStrengthMult:.5,iAlchemyMod:2,fPotionT1MagMult:1.5,fPotionT1DurMult:.5}
}) {
  const activeIngs = ingredients.filter(Boolean);
  const shared = findSharedEffects(ingredients);
  const alchemyFactor = alchemySkill + (0.1 * intelligence) + (0.1 * luck);
  const brewChance = Math.max(0, Math.min(100, Math.round(alchemyFactor)));

  if (activeIngs.length < 2) {
    return {
      isValid: false,
      brewChance,
      effects: [],
      goldValue: 0,
      name: "",
      message: "Select at least two ingredients to brew a potion."
    };
  }

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

  const invalid=message=>({isValid:false,brewChance,effects:[],goldValue:0,name:"",message});
  if(new Set(activeIngs.map(i=>i.id)).size!==activeIngs.length)return invalid("Choose different ingredients in each slot.");
  if(!settings||!['fPotionStrengthMult','iAlchemyMod','fPotionT1MagMult','fPotionT1DurMult'].every(k=>Number.isFinite(settings[k])&&settings[k]>0))return invalid("Alchemy settings unavailable.");
  if(![alchemySkill,intelligence,luck,mortarQuality,alembicQuality,calcinatorQuality,retortQuality].every(n=>Number.isFinite(n)&&n>=0)||mortarQuality===0)return invalid("Valid stats and a mortar and pestle are required.");
  const x=alchemyFactor*mortarQuality*settings.fPotionStrengthMult;
  const totalGold=Math.trunc(x*settings.iAlchemyMod);
  const calculatedEffects=[];
  for(const item of shared){
    const eff=item.effect;
    if(eff.supported===false||!Number.isFinite(eff.b)||eff.b<=0)return invalid("Calculation rule unavailable: "+formatEffectLabel(eff));
    const mag=eff.mag===0?1:Math.round(applyTools(eff,x/settings.fPotionT1MagMult/eff.b,alembicQuality,calcinatorQuality,retortQuality));
    const dur=eff.dur===0?1:Math.round(applyTools(eff,x/settings.fPotionT1DurMult/eff.b,alembicQuality,calcinatorQuality,retortQuality));
    if(mag>0&&dur>0)calculatedEffects.push({key:item.key,label:formatEffectLabel(eff),magnitude:mag,duration:dur,isBad:Boolean(eff.harmful??eff.bad),hasMagnitude:eff.mag!==0,hasDuration:eff.dur!==0});
  }
  if(!calculatedEffects.length)return invalid("All shared effects round to zero at these stats.");

  // Potion name derived from first shared effect
  const primaryEffect = calculatedEffects[0];
  const potionName = primaryEffect ? `Potion of ${primaryEffect.label}` : "Custom Potion";

  return {
    isValid: true,
    name: potionName,
    brewChance,
    goldValue: totalGold,
    effects: calculatedEffects,
    sharedCount: shared.length
  };
}
