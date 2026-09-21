/**
 * Game-style effect lines, as the Morrowind tooltip prints them:
 * "Fortify Strength 5 to 10 pts for 30 secs in 10 ft on Target".
 * Units follow OpenMW's MagicEffect::getMagnitudeDisplayType.
 */

const PERCENT_IDS = new Set([28, 29, 30, 31, 32, 33, 34, 35, 36, 40, 47, 57, 68, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
const FEET_IDS = new Set([59, 64, 65, 66]);
const LEVEL_IDS = new Set([118, 119]);
const RANGE_LABEL = { self: "Self", touch: "Touch", target: "Target" };

export function magnitudeKind(effectId) {
  const id = Number(effectId);
  if (id === 84) return "timesInt";
  if (FEET_IDS.has(id)) return "feet";
  if (LEVEL_IDS.has(id)) return "level";
  if (PERCENT_IDS.has(id)) return "percent";
  return "points";
}

function titleCase(id) {
  return String(id).replace(/(^|[\s_-])([a-z])/g, (_, sep, c) => (sep === "_" || sep === "-" ? " " : sep) + c.toUpperCase());
}

/** Lookup maps for effect targets: attributes by id ("strength"), skills by skill id ("long blade"). */
export function effectNames(attributeRecords = [], skillRecords = []) {
  return {
    attributes: new Map(attributeRecords.map(r => [r.id, r.name])),
    skills: new Map(skillRecords.map(r => [r.skill, r.name]))
  };
}

/** "Fortify Attribute" on strength reads "Fortify Strength". */
export function effectName(effect, names = {}) {
  const name = effect?.name || "";
  if (effect?.attribute != null && / Attribute$/.test(name)) {
    return name.replace(/ Attribute$/, " " + (names.attributes?.get(effect.attribute) || titleCase(effect.attribute)));
  }
  if (effect?.skill != null && / Skill$/.test(name)) {
    return name.replace(/ Skill$/, " " + (names.skills?.get(effect.skill) || titleCase(effect.skill)));
  }
  return name;
}

/**
 * One effect line. `rule` is the EffectRules record (noMagnitude, noDuration, appliedOnce).
 * constant: constant-effect enchantments print no duration or range; noTarget: potions print no range.
 */
export function describeEffect(effect, rule, names = {}, { constant = false, noTarget = false } = {}) {
  let line = effectName(effect, names);
  const min = Number(effect?.magnitude?.min) || 0;
  const max = Number(effect?.magnitude?.max) || 0;
  if (!rule?.noMagnitude && max > 0) {
    const kind = magnitudeKind(effect.effectId);
    const single = min === max;
    if (kind === "timesInt") {
      line += " " + (min / 10).toFixed(1) + (single ? "" : " to " + (max / 10).toFixed(1)) + "x INT";
    } else {
      line += " " + min + (single ? "" : " to " + max);
      const one = single && Math.abs(min) === 1;
      if (kind === "percent") line += "%";
      else if (kind === "feet") line += " ft";
      else if (kind === "level") line += one ? " level" : " levels";
      else line += one ? " pt" : " pts";
    }
  }
  if (!constant) {
    let duration = Number(effect?.durationSeconds) || 0;
    if (!rule?.appliedOnce) duration = Math.max(1, duration);
    if (duration > 0 && !rule?.noDuration) line += " for " + duration + (duration === 1 ? " sec" : " secs");
    const area = Number(effect?.areaFeet) || 0;
    if (area > 0) line += " in " + area + " ft";
    if (!noTarget && RANGE_LABEL[effect?.range]) line += " on " + RANGE_LABEL[effect.range];
  }
  return line;
}
