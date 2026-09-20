/* OpenMW .omwsave -> structured JSON: everything about the player character
 * that is actually stored in the save file. Nothing is read from content files,
 * and nothing is guessed from a built-in table of vanilla ids.
 *
 * Browser:
 *   import { parseOmwSave } from './omwsave-to-json.js';
 *   const save = parseOmwSave(await file.arrayBuffer());
 *
 * Node:
 *   import { parseOmwSave } from './omwsave-to-json.js';
 *   const save = parseOmwSave(fs.readFileSync(path));
 *
 * CLI:
 *   node omwsave-to-json.js <save.omwsave> [-o out.json]
 *
 * Framing is ESM3: a 16-byte record header (name, size, unknown, flags) and an
 * 8-byte subrecord header (name, size). Save games carry a FORM subrecord in the
 * TES3 header giving the format version, which decides how ids and strings are
 * encoded and whether skills/attributes are positional or keyed. Field layouts
 * below cite the OpenMW source under components/esm3/.
 */

/* ---- format version gates (components/esm3/formatversion.hpp) ---- */
const MAX_INT_FALLBACK_VERSION = 10; // <= this: stats are int32, not float
const MAX_STRING_REFID_VERSION = 23; // <= this: RefIds are plain strings
const MAX_CELL_NAME_AS_REFID_VERSION = 24; // <= this: PLCE is a RefId, not a string
const MAX_FIXED_STATS_VERSION = 39; // <= this: skills/attributes are positional
const CURRENT_SAVE_VERSION = 40;

/* Skill and attribute ids in save order (components/esm3/loadskil.cpp,
 * components/esm/attr.cpp). Only used for format <= 39, where the save stores
 * these positionally and the id is implied by the index. */
const SKILL_IDS = [
  "Block", "Armorer", "MediumArmor", "HeavyArmor", "BluntWeapon", "LongBlade", "Axe",
  "Spear", "Athletics", "Enchant", "Destruction", "Alteration", "Illusion", "Conjuration",
  "Mysticism", "Restoration", "Alchemy", "Unarmored", "Security", "Sneak", "Acrobatics",
  "LightArmor", "ShortBlade", "Marksman", "Mercantile", "Speechcraft", "HandToHand"
];
const ATTRIBUTE_IDS = [
  "Strength", "Intelligence", "Willpower", "Agility", "Speed", "Endurance", "Personality", "Luck"
];

/* ------------------------------------------------------------------ */
/* Binary reader                                                       */
/* ------------------------------------------------------------------ */

function toBytes(input) {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new TypeError("parseOmwSave expects an ArrayBuffer, a TypedArray or a Node Buffer");
}

class Reader {
  constructor(input) {
    this.u8 = toBytes(input);
    this.view = new DataView(this.u8.buffer, this.u8.byteOffset, this.u8.byteLength);
    this.formatVersion = 0;
    this.decoder = new TextDecoder("windows-1252");
  }
  get length() { return this.u8.length; }
  tag(p) {
    const u = this.u8;
    return String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]);
  }
  u32(p) { return this.view.getUint32(p, true); }
  i32(p) { return this.view.getInt32(p, true); }
  f32(p) { return this.view.getFloat32(p, true); }
  f64(p) { return this.view.getFloat64(p, true); }

  /* Raw bytes as text. Morrowind data is Windows-1252; trailing NULs are padding. */
  text(start, end) {
    const lo = Math.max(0, Math.min(start, this.u8.length));
    let hi = Math.max(lo, Math.min(end, this.u8.length));
    while (hi > lo && this.u8[hi - 1] === 0) hi--;
    return this.decoder.decode(this.u8.subarray(lo, hi));
  }

  /* A string subrecord. Old formats NUL-terminate inside the payload; new ones
   * use the whole payload (components/esm3/esmreader.cpp, getHStringView). */
  string(pos, size) {
    let end = pos + size;
    if (this.formatVersion <= MAX_STRING_REFID_VERSION) {
      for (let i = pos; i < end; i++) if (this.u8[i] === 0) { end = i; break; }
    }
    return this.text(pos, end);
  }

  /* A RefId subrecord (components/esm3/esmreader.cpp, getRefIdImpl).
   * The four non-string encodings are returned in a tagged "$kind:..." form so
   * callers can tell them apart instead of receiving decoded binary garbage. */
  refId(pos, size) {
    if (size <= 0) return "";
    if (this.formatVersion <= MAX_STRING_REFID_VERSION) return this.string(pos, size);
    switch (this.u8[pos]) {
      case 0: return ""; // Empty
      case 1: { // SizedString: u32 length, then that many characters
        if (size < 5) return "";
        const n = this.u32(pos + 1);
        return this.text(pos + 5, pos + 5 + Math.min(n, size - 5));
      }
      case 2: // UnsizedString: fills the rest of the subrecord
        return this.text(pos + 1, pos + size);
      case 3: // FormId: u32 index, i32 content file
        return size < 9 ? "" : "$formid:" + this.i32(pos + 5) + ":" + this.u32(pos + 1);
      case 4: // Generated: u64, for records created at runtime (e.g. a custom class)
        return size < 9 ? "" : "$generated:" + this.view.getBigUint64(pos + 1, true).toString();
      case 5: // Index: record type + u32
        return size < 9 ? "" : "$index:" + this.tag(pos + 1) + ":" + this.u32(pos + 5);
      case 6: // ESM3ExteriorCell: i32 x, i32 y
        return size < 9 ? "" : "$cell:" + this.i32(pos + 1) + "," + this.i32(pos + 5);
      default: return "";
    }
  }
}

/* Subrecords of one record, bounded by that record. */
function subrecords(r, body, size) {
  const out = [];
  const end = Math.min(r.length, body + size);
  let p = body;
  while (p + 8 <= end) {
    const tag = r.tag(p);
    const sz = r.u32(p + 4);
    if (p + 8 + sz > end) break; // truncated or corrupt: stop at the record boundary
    out.push({ tag, size: sz, data: p + 8 });
    p += 8 + sz;
  }
  return out;
}

/* Top-level records. Reads the TES3 header first to pick up the format version. */
function records(r) {
  const out = [];
  let i = 0;
  if (r.length >= 16 && r.tag(0) === "TES3") {
    const headerSize = r.u32(4);
    for (const sub of subrecords(r, 16, headerSize)) {
      if (sub.tag === "FORM" && sub.size >= 4) r.formatVersion = r.u32(sub.data);
    }
    i = 16 + headerSize;
  }
  while (i + 16 <= r.length) {
    const tag = r.tag(i);
    const size = r.u32(i + 4);
    const body = i + 16;
    if (body + size > r.length) break;
    out.push({ tag, size, body });
    i = body + size;
  }
  return out;
}

const round = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

/* ------------------------------------------------------------------ */
/* Inventory (components/esm3/inventorystate.cpp)                      */
/* ------------------------------------------------------------------ */

/* ICNT gives the exact item count. Each item is one ObjectState, framed by FRMR
 * (its RefNum) then NAME (its RefId). NAM9 carries mCount and is written only
 * when the count is not 1 (components/esm3/cellref.cpp:222). */
const INVENTORY_END_TAGS = new Set(["LEVM", "MAGI", "EQUI", "EQIP", "FACT", "DISP", "DISM", "SKIL", "STBA"]);

/* Equipment slot indices (apps/openmw/mwworld/inventorystore.hpp). */
const EQUIP_SLOTS = [
  "Helmet", "Cuirass", "Greaves", "LeftPauldron", "RightPauldron", "LeftGauntlet",
  "RightGauntlet", "Boots", "Shirt", "Pants", "Skirt", "Robe", "LeftRing",
  "RightRing", "Amulet", "Belt", "CarriedRight", "CarriedLeft", "Ammunition"
];

function readInventory(r, subs) {
  const icnt = subs.findIndex((s) => s.tag === "ICNT" && s.size >= 4);
  if (icnt < 0) return { items: [], endIndex: 0, expected: 0 };
  const expected = r.u32(subs[icnt].data);
  const items = [];
  let cur = null;
  let i = icnt + 1;
  for (; i < subs.length; i++) {
    const { tag, size, data } = subs[i];
    if (tag === "FRMR") {
      if (items.length >= expected) break;
      /* index is this item's position in InventoryState::mItems, which is what
       * the equipment table refers to. It is assigned before any filtering so
       * the two stay in step. */
      cur = { index: items.length, id: "", count: 1, soul: "" };
      items.push(cur);
      continue;
    }
    if (INVENTORY_END_TAGS.has(tag)) break;
    if (!cur) continue;
    if (tag === "NAME" && !cur.id) cur.id = r.refId(data, size);
    else if (tag === "NAM9" && size >= 4) cur.count = r.i32(data);
    else if (tag === "XSOL") cur.soul = r.refId(data, size);
  }
  return { items: items.filter((it) => it.id), endIndex: i, expected };
}

/* EQIP is a u32 count followed by that many (item index, slot) i32 pairs. EQUI
 * is the obsolete form carrying one pair per subrecord. Both sit between the
 * items and NpcStats (components/esm3/inventorystate.cpp:80). */
function readEquipment(r, subs, from) {
  const slots = new Map();
  for (let i = from; i < subs.length; i++) {
    const { tag, size, data } = subs[i];
    if (tag === "FACT" || tag === "DISP" || tag === "DISM" || tag === "SKIL" || tag === "STBA") break;
    if (tag === "EQUI" && size >= 8) {
      slots.set(r.i32(data), r.i32(data + 4));
    } else if (tag === "EQIP" && size >= 4) {
      const count = r.u32(data);
      for (let k = 0; k < count && 4 + k * 8 + 8 <= size; k++) {
        slots.set(r.i32(data + 4 + k * 8), r.i32(data + 8 + k * 8));
      }
    }
  }
  return slots;
}

/* ------------------------------------------------------------------ */
/* StatState (components/esm3/statstate.cpp)                           */
/* ------------------------------------------------------------------ */

/* STBA is written unconditionally; STMO/STCU/STDF/STPR only when non-zero.
 * An absent STCU therefore means a current value of 0 -- not "same as base",
 * which matters for a character at 0 fatigue or 0 magicka. */
function newStat(r, data, intFallback, id) {
  return {
    id: id || null,
    base: intFallback ? r.i32(data) : r.f32(data),
    mod: 0, current: 0, damage: 0, progress: 0
  };
}

function applyStatField(r, stat, tag, data, intFallback) {
  const num = () => (intFallback ? r.i32(data) : r.f32(data));
  if (tag === "STMO") stat.mod = num();
  else if (tag === "STCU") stat.current = num();
  else if (tag === "STDF") stat.damage = num();
  else if (tag === "STPR") stat.progress = r.f32(data);
  else return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Main parser                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parse a .omwsave into a plain JSON-serialisable object.
 * @param {ArrayBuffer|ArrayBufferView} input raw save bytes
 */
export function parseOmwSave(input) {
  const r = new Reader(input);
  const warnings = [];

  if (r.length < 16 || r.tag(0) !== "TES3") {
    throw new Error("Not an OpenMW save: missing TES3 header");
  }
  const recs = records(r);
  if (!recs.length) throw new Error("Not an OpenMW save: no records after the header");
  if (r.formatVersion === 0) warnings.push("No FORM subrecord in the header; assuming format version 0");
  if (r.formatVersion > CURRENT_SAVE_VERSION) {
    warnings.push(`Save format version ${r.formatVersion} is newer than this parser knows about (${CURRENT_SAVE_VERSION}); fields may be missing`);
  }
  const intFallback = r.formatVersion <= MAX_INT_FALLBACK_VERSION;
  const positionalStats = r.formatVersion <= MAX_FIXED_STATS_VERSION;

  const out = {
    formatVersion: r.formatVersion,
    contentFiles: [],
    identity: {
      name: "",
      race: null,
      class: { id: null, name: null, custom: false },
      birthsign: null,
      level: 1,
      cell: null
    },
    vitals: {
      health: null, magicka: null, fatigue: null,
      gold: 0, reputation: 0, bounty: 0, timePlayedSeconds: null
    },
    build: { skillKindSource: null, skills: [], attributes: [] },
    progress: { quests: [], otherJournalIds: [], factions: [] },
    stuff: { inventory: [], spells: [] },
    warnings
  };

  /* ---- SAVE: name, level, class, cell, time played, content files, health ---- */
  const saveRec = recs.find((x) => x.tag === "SAVE");
  if (!saveRec) {
    warnings.push("No SAVE record; name, level, class, cell and time played are unavailable");
  } else {
    let hpCur = null, hpMax = null;
    for (const { tag, size, data } of subrecords(r, saveRec.body, saveRec.size)) {
      switch (tag) {
        case "PLNA": out.identity.name = r.string(data, size); break;
        case "PLLE": if (size >= 4) out.identity.level = r.i32(data); break;
        case "PLCL": out.identity.class.id = r.refId(data, size) || null; break;
        case "PLCN":
          /* Written only when the class has no id, i.e. one created at chargen
           * (components/esm3/savedgame.cpp:53). */
          out.identity.class.name = r.string(data, size);
          out.identity.class.custom = true;
          break;
        case "PLCE":
          out.identity.cell = r.formatVersion <= MAX_CELL_NAME_AS_REFID_VERSION
            ? r.refId(data, size)
            : r.string(data, size);
          break;
        case "TIME": if (size >= 8) out.vitals.timePlayedSeconds = round(r.f64(data)); break;
        case "DESC": break; // the save's own description, not a character field
        case "DEPE": out.contentFiles.push(r.string(data, size)); break;
        case "CHLT": if (size >= 4) hpCur = r.f32(data); break;
        case "MHLT": if (size >= 4) hpMax = r.f32(data); break;
        default: break;
      }
    }
    if (hpCur !== null || hpMax !== null) {
      out.vitals.health = { current: round(hpCur ?? 0), max: round(hpMax ?? 0) };
    }
  }

  /* ---- NPC_: the player's race and class id sit on the player's own record ---- */
  let playerClassId = null;
  for (const rec of recs) {
    if (rec.tag !== "NPC_") continue;
    let isPlayer = false, race = null, cls = null;
    for (const { tag, size, data } of subrecords(r, rec.body, rec.size)) {
      if (tag === "NAME") isPlayer = r.refId(data, size).toLowerCase() === "player";
      else if (tag === "RNAM") race = r.refId(data, size);
      else if (tag === "CNAM") cls = r.refId(data, size);
    }
    if (!isPlayer) continue;
    if (race) out.identity.race = race;
    if (cls) playerClassId = cls;
  }
  if (playerClassId && !out.identity.class.id) out.identity.class.id = playerClassId;
  const classId = playerClassId || out.identity.class.id;

  /* ---- CLAS: a class created at chargen is saved as a dynamic record, so its
   * major/minor skills are recoverable. A predefined class (vanilla or from a
   * mod) lives in a content file and only its id is in the save. ---- */
  let classSkills = null;
  if (classId) {
    for (const rec of recs) {
      if (rec.tag !== "CLAS") continue;
      let id = null, name = null, cldt = null;
      for (const { tag, size, data } of subrecords(r, rec.body, rec.size)) {
        if (tag === "NAME") id = r.refId(data, size);
        else if (tag === "FNAM") name = r.string(data, size);
        else if (tag === "CLDT" && size >= 60) cldt = data;
      }
      if (!id || !cldt || id.toLowerCase() !== classId.toLowerCase()) continue;
      /* CLDT: i32 attribute[2], i32 specialization, i32 skills[5][2] as
       * (minor, major) pairs, ... (components/esm3/loadclas.cpp, EsmCLDTstruct). */
      const major = [], minor = [];
      for (let k = 0; k < 5; k++) {
        minor.push(SKILL_IDS[r.i32(cldt + 12 + k * 8)] ?? null);
        major.push(SKILL_IDS[r.i32(cldt + 16 + k * 8)] ?? null);
      }
      classSkills = { major, minor };
      if (name) out.identity.class.name = name;
      out.identity.class.custom = true;
      out.build.skillKindSource = "save-class-record";
      break;
    }
  }
  if (!classSkills) {
    warnings.push(
      classId
        ? `Class "${classId}" is defined in a content file, not in this save, so major/minor/misc cannot be recovered; skill.kind is null.`
        : "No class id found; skill.kind is null."
    );
  }

  /* ---- QUES and JOUR ---- */
  const seenQuest = new Set();
  const topics = new Set();
  for (const rec of recs) {
    if (rec.tag === "QUES") {
      let id = null, stage = 0, finished = false;
      for (const { tag, size, data } of subrecords(r, rec.body, rec.size)) {
        if (tag === "YETO") id = r.refId(data, size);
        else if (tag === "QSTA" && size >= 4) stage = r.i32(data);
        /* QuestState::mFinished is an unsigned char, so QFIN is one byte
         * (components/esm3/queststate.hpp). */
        else if (tag === "QFIN" && size >= 1) finished = r.u8[data] !== 0;
      }
      if (!id) continue;
      const key = id.toLowerCase();
      if (seenQuest.has(key)) continue;
      seenQuest.add(key);
      out.progress.quests.push({ id, stage, finished, status: finished ? "finished" : "active" });
    } else if (rec.tag === "JOUR") {
      let type = null, id = null;
      for (const { tag, size, data } of subrecords(r, rec.body, rec.size)) {
        if (tag === "JETY" && size >= 4) type = r.i32(data);
        else if (tag === "YETO") id = r.refId(data, size);
      }
      /* JournalEntry::Type -- 0 Journal, 1 Topic, 2 Quest
       * (components/esm3/journalentry.hpp). Only topics are not quests. */
      if (type === 1 && id) topics.add(id);
    }
  }
  out.progress.quests.sort((a, b) => a.id.localeCompare(b.id));
  out.progress.otherJournalIds = [...topics].sort((a, b) => a.localeCompare(b));

  /* ---- PLAY: the player actor, in one pass ---- */
  const playRec = recs.find((x) => x.tag === "PLAY");
  if (!playRec) {
    warnings.push("No PLAY record; vitals, build, factions, inventory and spells are unavailable");
    return out;
  }
  const subs = subrecords(r, playRec.body, playRec.size);

  /* Inventory first: it also tells us where the stat block begins. */
  const { items, endIndex, expected } = readInventory(r, subs);
  if (items.length !== expected) {
    warnings.push(`Inventory declared ${expected} items but ${items.length} were read`);
  }
  /* The same item can occupy several stacks when the copies differ in condition
   * or charge, so counts are summed rather than deduplicated. A captured soul
   * and an equipped slot are part of a stack's identity though -- a filled and
   * an empty soul gem do not stack, and neither does a worn ring with its spare
   * -- so stacks are merged per (id, soul, slot). Two identical rings worn in
   * both hands therefore stay as two entries. */
  const equipment = readEquipment(r, subs, endIndex);
  const byStack = new Map();
  for (const it of items) {
    if (/^gold_001$/i.test(it.id)) { out.vitals.gold += it.count; continue; }
    const soul = it.soul || null;
    const rawSlot = equipment.has(it.index) ? equipment.get(it.index) : null;
    const slot = rawSlot === null ? null : (EQUIP_SLOTS[rawSlot] ?? String(rawSlot));
    const key = it.id.toLowerCase() + " " + (soul ?? "").toLowerCase() + " " + (slot ?? "");
    const prev = byStack.get(key);
    if (prev) { prev.count += it.count; continue; }
    byStack.set(key, { id: it.id, count: it.count, soul, equipped: slot !== null, slot });
  }
  out.stuff.inventory = [...byStack.values()].sort(
    (a, b) => a.id.localeCompare(b.id)
      || (a.soul ?? "").localeCompare(b.soul ?? "")
      || (a.slot ?? "").localeCompare(b.slot ?? "")
  );

  /* Scalars, factions and spells, all of which follow the inventory. */
  const spells = new Set();
  const factions = [];
  let curFaction = null;
  let levelOverride = null;
  let seenBirthsign = false;
  for (let i = endIndex; i < subs.length; i++) {
    const { tag, size, data } = subs[i];
    switch (tag) {
      case "FACT":
        curFaction = { id: r.refId(data, size), rank: -1, reputation: 0, expelled: false };
        factions.push(curFaction);
        break;
      /* Rank and reputation are written only when set, so rank defaults to -1
       * (not a member rank) and reputation to 0 (components/esm3/npcstats.cpp). */
      case "FAEX": if (curFaction && size >= 4) curFaction.expelled = r.i32(data) !== 0; break;
      case "FARA": if (curFaction && size >= 4) curFaction.rank = r.i32(data); break;
      case "FARE": if (curFaction && size >= 4) curFaction.reputation = r.i32(data); break;
      case "REPU": if (size >= 4) out.vitals.reputation = r.i32(data); break;
      case "BOUN":
        /* NpcStats writes the bounty well before the birthsign; the BOUN/PREV
         * pairs after it are bound items (components/esm3/player.cpp:33). */
        if (!seenBirthsign && size >= 4) out.vitals.bounty = r.i32(data);
        break;
      case "LEVL": if (size >= 4) levelOverride = r.i32(data); break;
      case "SIGN":
        out.identity.birthsign = r.refId(data, size) || null;
        seenBirthsign = true;
        break;
      case "SPEL": { const id = r.refId(data, size); if (id) spells.add(id); break; }
      default: break;
    }
  }
  /* CreatureStats writes LEVL only when the level is not 1, and it agrees with
   * PLLE when present; prefer it as the actor's own value. */
  if (levelOverride !== null) out.identity.level = levelOverride;
  out.progress.factions = factions.filter((f) => f.id).sort((a, b) => a.id.localeCompare(b.id));
  out.stuff.spells = [...spells].sort((a, b) => a.localeCompare(b));

  /* Skills, attributes and the three dynamic stats. */
  const { skills, attributes, dynamics } = positionalStats
    ? readPositionalStats(r, subs, endIndex, intFallback, warnings)
    : readKeyedStats(r, subs, endIndex, intFallback, warnings);
  emitStats(out, skills, attributes, dynamics, classSkills);

  return out;
}

/* Format <= 39: NpcStats writes 27 skills, then CreatureStats writes 8
 * attributes and 3 dynamic stats, each as a bare StatState with no id. */
function readPositionalStats(r, subs, from, intFallback, warnings) {
  const groups = [];
  let cur = null;
  for (let i = from; i < subs.length; i++) {
    const { tag, size, data } = subs[i];
    if (tag === "STBA" && size >= 4) { cur = newStat(r, data, intFallback, null); groups.push(cur); continue; }
    if (cur && size >= 4) applyStatField(r, cur, tag, data, intFallback);
  }
  if (groups.length < 38) {
    warnings.push(`Expected at least 38 stat blocks in PLAY (27 skills, 8 attributes, 3 dynamic), found ${groups.length}`);
  }
  groups.slice(0, 27).forEach((g, i) => { g.id = SKILL_IDS[i]; });
  groups.slice(27, 35).forEach((g, i) => { g.id = ATTRIBUTE_IDS[i]; });
  return { skills: groups.slice(0, 27), attributes: groups.slice(27, 35), dynamics: groups.slice(35, 38) };
}

/* Format >= 40: each skill and attribute is preceded by a SKIL or ATTR
 * subrecord holding its id, so mod-added skills survive. The three dynamic
 * stats still follow the attributes unkeyed. */
function readKeyedStats(r, subs, from, intFallback, warnings) {
  const skills = [], attributes = [], dynamics = [];
  let pending = null, mode = null, cur = null, sawKey = false;
  for (let i = from; i < subs.length; i++) {
    const { tag, size, data } = subs[i];
    if (tag === "SKIL") { pending = r.refId(data, size); mode = "skill"; sawKey = true; continue; }
    if (tag === "ATTR") { pending = r.refId(data, size); mode = "attr"; sawKey = true; continue; }
    if (tag === "STBA" && size >= 4) {
      cur = newStat(r, data, intFallback, pending);
      if (mode === "skill") skills.push(cur);
      else if (mode === "attr") attributes.push(cur);
      else dynamics.push(cur);
      pending = null;
      if (mode === "attr" && attributes.length >= 8) mode = null; // dynamics come next
      continue;
    }
    if (cur && size >= 4) applyStatField(r, cur, tag, data, intFallback);
  }
  if (!sawKey) {
    warnings.push("Format version implies keyed stats but no SKIL/ATTR subrecords were found");
  }
  return { skills, attributes, dynamics: dynamics.slice(0, 3) };
}

function emitStats(out, skills, attributes, dynamics, classSkills) {
  const major = new Set((classSkills?.major ?? []).filter(Boolean).map((s) => s.toLowerCase()));
  const minor = new Set((classSkills?.minor ?? []).filter(Boolean).map((s) => s.toLowerCase()));

  out.build.skills = skills.map((g, i) => {
    const id = g.id ?? SKILL_IDS[i] ?? null;
    const key = (id ?? "").toLowerCase();
    return {
      id,
      index: SKILL_IDS.indexOf(id) >= 0 ? SKILL_IDS.indexOf(id) : i,
      base: round(g.base),
      modifier: round(g.mod),
      damage: round(g.damage),
      value: round(g.base + g.mod - g.damage),
      progress: round(g.progress),
      kind: classSkills ? (major.has(key) ? "Major" : minor.has(key) ? "Minor" : "Misc") : null
    };
  });

  out.build.attributes = attributes.map((g, i) => {
    const id = g.id ?? ATTRIBUTE_IDS[i] ?? null;
    return {
      id,
      index: ATTRIBUTE_IDS.indexOf(id) >= 0 ? ATTRIBUTE_IDS.indexOf(id) : i,
      base: round(g.base),
      modifier: round(g.mod),
      damage: round(g.damage),
      value: round(g.base + g.mod - g.damage)
    };
  });

  /* CreatureStats::mDynamic is health, magicka, fatigue in that order. The
   * effective maximum is base + mod. */
  ["health", "magicka", "fatigue"].forEach((name, i) => {
    const g = dynamics[i];
    if (!g) return;
    if (name === "health" && out.vitals.health) return; // SAVE's CHLT/MHLT already read
    out.vitals[name] = { current: round(g.current), max: round(g.base + g.mod) };
  });
}

export default parseOmwSave;

