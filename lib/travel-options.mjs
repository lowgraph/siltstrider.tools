import { serializeOmwSave, sha256Sync } from './cloud-save-codec.mjs';

export const TRAVEL_OPTIONS_KEY = 'silt-travel-options-v1';
const validKey = key => typeof key === 'string' && /^(vanilla|tr|tr_arce):[a-f0-9]{64}$/.test(key);
const storageOf = () => { try { return globalThis.localStorage || globalThis.window?.localStorage || null; } catch { return null; } };

/** The same serialized snapshot survives local/cloud restore; load tokens do not. */
export function travelSaveKey(save, profile = 'vanilla') {
  if (!save || typeof save !== 'object' || Array.isArray(save) || !['vanilla', 'tr', 'tr_arce'].includes(profile)) return null;
  try { return `${profile}:${sha256Sync(serializeOmwSave(save))}`; } catch { return null; }
}

export function cleanTravelOverrides(value) {
  const out = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const key of ['mageGuild', 'conjurer', 'divine', 'almsivi', 'waterWalking']) {
    if (typeof value[key] === 'boolean') out[key] = value[key];
  }
  for (const [key, max] of [['carried', 1e6], ['levitate', 100]]) {
    if (Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= max) out[key] = value[key];
  }
  if (value.held && typeof value.held === 'object' && !Array.isArray(value.held)) {
    out.held = Object.fromEntries(Object.entries(value.held).slice(0, 500).filter(([id, enabled]) =>
      id.length > 0 && id.length <= 200 && !['__proto__', 'prototype', 'constructor'].includes(id) && typeof enabled === 'boolean'));
  }
  return out;
}

function readStore(storage) {
  try {
    const raw = storage?.getItem(TRAVEL_OPTIONS_KEY);
    if (!raw || raw.length > 250000) return {};
    const record = JSON.parse(raw);
    if (record?.version !== 1 || !record.saves || typeof record.saves !== 'object' || Array.isArray(record.saves)) return {};
    return Object.fromEntries(Object.entries(record.saves).filter(([key]) => validKey(key)).slice(-20));
  } catch { return {}; }
}

export function readTravelOverrides(key, storage = storageOf()) {
  return validKey(key) ? cleanTravelOverrides(readStore(storage)[key]?.values) : {};
}

/** Write player edits only, never a copy of defaults that would mask later data. */
export function writeTravelOverrides(key, values, storage = storageOf()) {
  if (!validKey(key) || !storage) return false;
  try {
    const saves = readStore(storage);
    delete saves[key];
    const clean = cleanTravelOverrides(values);
    if (Object.keys(clean).length) saves[key] = { values: clean };
    const entries = Object.entries(saves).slice(-20);
    let raw = JSON.stringify({ version: 1, saves: Object.fromEntries(entries) });
    while (raw.length > 250000 && entries.length > 1) {
      entries.shift();
      raw = JSON.stringify({ version: 1, saves: Object.fromEntries(entries) });
    }
    if (raw.length > 250000) return false;
    storage.setItem(TRAVEL_OPTIONS_KEY, raw);
    return true;
  } catch { return false; }
}

export function applyTravelOverrides(defaults, values) {
  const edits = cleanTravelOverrides(values);
  const held = new Set(defaults.held || []);
  for (const [id, enabled] of Object.entries(edits.held || {})) {
    if (enabled) held.add(id); else held.delete(id);
  }
  return { ...defaults, ...edits, held };
}
