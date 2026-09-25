/**
 * Turn a parsed .omwsave into what each Silt Strider tool reads.
 *
 * A save names things by record id -- "Hara", "LongBlade", "khajiit" -- and often
 * names records from mods the site's data does not carry. Everything here resolves
 * ids against one profile's catalogs and lists what it could not resolve, instead of
 * substituting a default: a Warrior's skills standing in for an unknown class would
 * be worse than saying the class is unknown.
 *
 * Pure functions only. character-context.jsx loads the catalogs and applies the result.
 */
import { SKILL_IDS } from "./cloud-save-codec.mjs";
import { computeSheet } from "./character-math.mjs";
import { EQUIP_SLOTS } from "./equipment-math.mjs";
import { parseOmwSave } from "./omwsave-parser.mjs";

const ATTRIBUTES = ["Strength", "Intelligence", "Willpower", "Agility", "Speed", "Endurance", "Personality", "Luck"];
const TR_FILES = ["tamriel_data.esm", "tr_mainland.esm"];
const ARCE_PREFIX = "arce - all races and classes enabled";

/** Validate converted saves before any shared state changes. Unknown mod fields survive. */
export function validateSave(save) {
 const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
 const fail = (path) => { throw new Error(`Invalid OpenMW save: ${path}.`); };
 if (!object(save) || !object(save.identity) || !object(save.stuff)) fail('identity and stuff must be objects');
 for (const key of ['build','progress','vitals']) if (save[key] != null && !object(save[key])) fail(key);
 for (const [parent,key] of [[save,'contentFiles'],[save.build,'attributes'],[save.build,'skills'],[save.stuff,'inventory'],[save.progress,'factions'],[save.progress,'quests']]) {
  if (parent?.[key] == null) continue;
  if (!Array.isArray(parent[key])) fail(`${key} must be an array`);
  if (key !== 'contentFiles' && parent[key].some(v=>!object(v))) fail(`${key} entries must be objects`);
 }
 const numbers = (v,path) => {
  if (!object(v) && !Array.isArray(v)) return;
  for (const [k,x] of Object.entries(v)) {
   if (['level','base','modifier','current','max','rank','count','index'].includes(k) && x != null && (typeof x !== 'number' || !Number.isFinite(x))) fail(`${path}.${k} must be finite`);
   if (x && typeof x === 'object') numbers(x,`${path}.${k}`);
  }
 };
 numbers(save,'save');
 return save;
}

/**
 * Parse a save the player picked or dropped: a .omwsave, or one already converted to JSON.
 * A Morrowind.exe .ess also starts with a TES3 header, so it is refused by name before
 * the OpenMW parser can misread it.
 */
export async function readSaveFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".ess")) {
    throw new Error("That is a Morrowind.exe save (.ess). Silt Strider reads OpenMW saves (.omwsave).");
  }
  if (name.endsWith(".json")) {
    const data = JSON.parse(await file.text());
    if (!data?.identity || !data?.stuff) throw new Error("That JSON is not a converted OpenMW save.");
    return validateSave(data);
  }
  if (!name.endsWith(".omwsave")) {
    throw new Error("Choose an OpenMW save: a file ending in .omwsave.");
  }
  return parseOmwSave(await file.arrayBuffer());
}

/** Which of the site's three profiles a save belongs to, from the content files it loads. */
export function profileForSave(save) {
  const files = (save?.contentFiles || []).map((f) => String(f).toLowerCase());
  const tr = TR_FILES.every((f) => files.includes(f));
  const arce = tr && files.some((f) => f.startsWith(ARCE_PREFIX));
  const profile = arce ? "tr_arce" : tr ? "tr" : "vanilla";
  const reason = arce
    ? "It loads Tamriel Rebuilt and ARCE."
    : tr
      ? "It loads Tamriel_Data and TR_Mainland."
      : "It loads neither Tamriel_Data nor TR_Mainland.";
  return { profile, reason, contentFileCount: files.length };
}

/** The display label a table uses for a record id, matched on label, key or id. */
export function findLabel(table, value) {
  if (value === null || value === undefined || value === "") return null;
  const wanted = String(value).toLowerCase();
  for (const [label, row] of Object.entries(table || {})) {
    if (label.toLowerCase() === wanted
      || String(row?.key ?? "").toLowerCase() === wanted
      || String(row?.id ?? "").toLowerCase() === wanted) return label;
  }
  return null;
}

/** A save skill's builder label. The engine's skill order, the codec's and the catalog's
 *  are the same 27, so the index carries across; a mod-added skill has no label here. */
function skillLabel(skill, catalogs) {
  const index = SKILL_IDS.indexOf(skill?.id);
  return index >= 0 ? catalogs.skills?.[index] ?? null : null;
}

function attributeValue(save, name, field = "base") {
  const attribute = (save.build?.attributes || []).find((a) => a.id === name);
  return attribute ? attribute[field] : null;
}

/**
 * The Character Builder's build for a save.
 *
 * A field the catalogs cannot resolve keeps `current`'s value and is listed in
 * `unresolved`, so nothing the save did not say is presented as if it had.
 */
export function buildFromSave(save, catalogs, { current = {}, profile = "vanilla" } = {}) {
  const identity = save?.identity || {};
  const unresolved = [];
  const keep = (field, value, why) => {
    unresolved.push({ field, value: value ?? null, why, kept: current[field] ?? null });
    return current[field];
  };

  const race = findLabel(catalogs.identity?.races, identity.race)
    ?? keep("race", identity.race, "not a playable race in this profile's data");
  const sign = findLabel(catalogs.identity?.signs, identity.birthsign)
    ?? keep("sign", identity.birthsign, "not a birthsign in this profile's data");
  const gender = identity.gender === "Female" || identity.gender === "Male"
    ? identity.gender
    : keep("gender", identity.gender, "the save does not record it");

  const byKind = (kind) => (save.build?.skills || [])
    .filter((s) => s.kind === kind).map((s) => skillLabel(s, catalogs)).filter(Boolean);
  let className, spec, favoured, maj, min;
  if (identity.class?.custom) {
    // Made at character creation, so the save itself holds its definition.
    className = "Custom";
    spec = identity.class.specialization;
    favoured = identity.class.favoredAttributes || [];
    maj = byKind("Major");
    min = byKind("Minor");
  } else {
    const label = findLabel(catalogs.identity?.classes, identity.class?.id);
    const known = label ? catalogs.classes?.[label] : null;
    if (known) {
      className = label;
      spec = known.spec;
      favoured = known.fav || [];
      maj = known.maj || [];
      min = known.min || [];
    } else {
      className = keep("className", identity.class?.id, "a class from content this profile does not carry");
      spec = current.spec;
      favoured = [current.fav1, current.fav2];
      maj = current.maj;
      min = current.min;
      unresolved.push({ field: "skills", value: identity.class?.id ?? null,
        why: "its major and minor skills are defined by that class", kept: "your current choices" });
    }
  }
  if (!["Combat", "Magic", "Stealth"].includes(spec)) spec = keep("spec", spec, "the class does not record a specialization");
  if (!Array.isArray(maj) || maj.length !== 5) maj = keep("maj", maj, "the class does not give five major skills");
  if (!Array.isArray(min) || min.length !== 5) min = keep("min", min, "the class does not give five minor skills");
  const [fav1, fav2] = (favoured || []).filter((a) => ATTRIBUTES.includes(a));
  const world = profile === "vanilla" ? "vanilla" : "tr";

  return {
    build: {
      version: 1,
      world,
      arce: profile === "tr_arce",
      name: identity.name || "",
      race,
      gender,
      className,
      sign,
      spec,
      fav1: fav1 ?? keep("fav1", favoured?.[0], "the class does not record it"),
      fav2: fav2 ?? keep("fav2", favoured?.[1], "the class does not record it"),
      maj,
      min,
      bitterCup: false
    },
    unresolved
  };
}

/**
 * The Level Simulator's starting sheet: the save's own level, attributes and skills,
 * so progression is planned from where the character actually is rather than level 1.
 * Base values, because level-ups are computed on those, not on fortified ones.
 */
export function sheetFromSave(save, catalogs, build) {
  const attrs = {};
  for (const name of ATTRIBUTES) {
    const value = attributeValue(save, name);
    if (value !== null) attrs[name] = { v: value, parts: ["from save"] };
  }
  const skills = {};
  for (const skill of save.build?.skills || []) {
    const label = skillLabel(skill, catalogs);
    if (label) skills[label] = { v: skill.base, parts: ["from save"] };
  }
  const magMult = (catalogs.races?.[build.race]?.mag || 0) + (catalogs.signs?.[build.sign]?.mag || 0);
  const vitals = save.vitals || {};
  return {
    fromSave: true,
    level: save.identity?.level || 1,
    attrs,
    skills,
    health: vitals.health?.max ?? null,
    magicka: vitals.magicka?.max ?? null,
    fatigue: vitals.fatigue?.max ?? null,
    magMult,
    maj: build.maj,
    min: build.min,
    race: build.race,
    gender: build.gender,
    sign: build.sign,
    spec: build.spec,
    fav1: build.fav1,
    fav2: build.fav2,
    className: build.className,
    bitterCup: null
  };
}

/**
 * Where the save disagrees with the site's own rules, measured rather than assumed.
 *
 * Mods change race values, class bonuses and levelling. Fatigue and magicka follow from
 * attributes at any level, so they are always checked; starting attributes, skills and
 * health can only be checked at level 1, before level-ups have moved them.
 */
export function rulesCheck(save, catalogs, build) {
  const differences = [];
  const unchecked = [];
  const value = (name) => (attributeValue(save, name, "base") ?? 0) + (attributeValue(save, name, "modifier") ?? 0);
  const compare = (what, saved, rules) => {
    if (saved === null || saved === undefined || rules === null || rules === undefined) return;
    if (Math.round(saved) !== Math.round(rules)) differences.push({ what, save: Math.round(saved), rules: Math.round(rules) });
  };
  const vitals = save.vitals || {};
  compare("Maximum fatigue", vitals.fatigue?.max,
    value("Strength") + value("Willpower") + value("Agility") + value("Endurance"));
  const magMult = (catalogs.races?.[build.race]?.mag || 0) + (catalogs.signs?.[build.sign]?.mag || 0);
  compare("Maximum magicka", vitals.magicka?.max, Math.floor(value("Intelligence") * (1 + magMult)));

  if ((save.identity?.level || 1) === 1) {
    const sheet = computeSheet(build, catalogs);
    if (sheet) {
      compare("Maximum health", vitals.health?.max,
        Math.floor(((sheet.attrs.Strength?.v ?? 0) + (sheet.attrs.Endurance?.v ?? 0)) / 2));
      for (const name of ATTRIBUTES) compare(name, attributeValue(save, name), sheet.attrs[name]?.v);
      for (const skill of save.build?.skills || []) {
        const label = skillLabel(skill, catalogs);
        if (label) compare(label, skill.base, sheet.skills[label]?.v);
      }
    }
  } else {
    unchecked.push("Starting attributes, skills and health can only be compared at level 1; this save is level "
      + save.identity.level + ".");
  }
  return { differences, unchecked };
}

/**
 * An Equipment Studio loadout of what the character is wearing, as catalog records, the
 * same shape the item picker equips. Items from content the profile does not carry are
 * listed, not faked.
 */
export function loadoutFromSave(save, catalogs, { id = "loadout-1", name } = {}) {
  const index = new Map();
  for (const table of ["Weapons", "Armor", "Clothing"]) {
    for (const record of catalogs?.[table] || []) index.set(String(record.key ?? record.id).toLowerCase(), record);
  }
  const items = {};
  const unresolved = [];
  for (const entry of save.stuff?.inventory || []) {
    if (!entry.equipped || !entry.slot) continue;
    const record = index.get(String(entry.id).toLowerCase());
    if (record && EQUIP_SLOTS.includes(entry.slot)) items[entry.slot] = record;
    else unresolved.push({ slot: entry.slot, id: entry.id });
  }
  return {
    loadout: { id, name: name || `Worn by ${save.identity?.name || "save"}`, items },
    unresolved
  };
}
