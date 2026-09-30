import { applyTravelOverrides, cleanTravelOverrides } from './travel-options.mjs';

// Preparation only: no account API or workstation imports this module yet.
export const ACCOUNT_SETTINGS_VERSION = 1;
export const ACCOUNT_SETTINGS_MAX_BYTES = 16384;
const WORLDS = ['vanilla', 'tr', 'tr_arce'];
const SAVE_TOGGLES = ['mageGuild', 'conjurer', 'divine', 'almsivi', 'waterWalking'];
const TRAVEL_TOGGLES = [...SAVE_TOGGLES, 'walking', 'questTeleports'];

export function defaultAccountSettings() {
  return {
    version: ACCOUNT_SETTINGS_VERSION,
    world: 'vanilla',
    modpackId: null,
    modVersionId: null,
    overrideSaveToggles: false,
    toolDefaults: { travel: {} }
  };
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new Error(`${label} must be an object.`);
  }
}

function fields(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`Unsupported ${label} field: ${key}.`);
  }
}

function identifier(value, label) {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/.test(value)) {
    throw new Error(`${label} must be a stable release identifier or null.`);
  }
  return value;
}

/** Sparse toggle maps distinguish unset from an explicit false. */
function travelToggles(value) {
  fields(value, TRAVEL_TOGGLES, 'Travel defaults');
  const result = {};
  for (const [key, enabled] of Object.entries(value)) {
    if (typeof enabled !== 'boolean') throw new Error(`${key} must be a boolean.`);
    result[key] = enabled;
  }
  return result;
}

/** Validate a complete supported document; missing optional fields use defaults.
 * Unknown fields/versions fail explicitly so an older client cannot erase them.
 * Registry availability is a separate check: IDs never authorize a fetch URL.
 */
export function validateAccountSettings(value) {
  fields(value, ['version', 'world', 'modpackId', 'modVersionId', 'overrideSaveToggles', 'toolDefaults'], 'settings');
  if (value.version !== ACCOUNT_SETTINGS_VERSION) throw new Error('Unsupported account settings version.');
  const result = defaultAccountSettings();
  if (Object.hasOwn(value, 'world')) {
    if (!WORLDS.includes(value.world)) throw new Error('Choose an available world.');
    result.world = value.world;
  }
  for (const key of ['modpackId', 'modVersionId']) {
    if (Object.hasOwn(value, key)) result[key] = identifier(value[key], key);
  }
  if (result.modVersionId && /^(latest|current)$/i.test(result.modVersionId)) {
    throw new Error('Mod Version must identify an immutable release.');
  }
  if (result.modVersionId && !result.modpackId && result.world === 'vanilla') {
    throw new Error('A mod version requires Tamriel Rebuilt or a modpack.');
  }
  if (Object.hasOwn(value, 'overrideSaveToggles')) {
    if (typeof value.overrideSaveToggles !== 'boolean') throw new Error('Save toggle policy must be a boolean.');
    result.overrideSaveToggles = value.overrideSaveToggles;
  }
  if (Object.hasOwn(value, 'toolDefaults')) {
    fields(value.toolDefaults, ['travel'], 'tool defaults');
    if (Object.hasOwn(value.toolDefaults, 'travel')) result.toolDefaults.travel = travelToggles(value.toolDefaults.travel);
  }
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > ACCOUNT_SETTINGS_MAX_BYTES) {
    throw new Error('Account settings are too large.');
  }
  return result;
}

/** For future release/snapshot namespaces; not the settings schema version. */
export function accountDataSelectionKey(value) {
  const { world, modpackId, modVersionId } = validateAccountSettings(value);
  return JSON.stringify([world, modpackId, modVersionId]);
}

function localTravelChoices(value) {
  const result = cleanTravelOverrides(value);
  for (const key of ['walking', 'questTeleports']) {
    if (typeof value?.[key] === 'boolean') result[key] = value[key];
  }
  return result;
}

/** Pure precedence preparation. Current workstations still use their old flow.
 * Explicit link/session choices win. Global policy covers only stored booleans,
 * never saved inventory, current Magicka, carrying weight or movement magnitude.
 * The consumer must still enforce spell/resource availability and show notices.
 */
export function resolveAccountTravelOptions({ settings, defaults = {}, saveDefaults = null,
  saveOverrides = {}, linkOverrides = {}, sessionOverrides = {} }) {
  const account = validateAccountSettings(settings);
  const global = account.toolDefaults.travel;
  let result = applyTravelOverrides(defaults, {});
  if (saveDefaults !== null) {
    result = applyTravelOverrides({ ...result, ...saveDefaults }, saveOverrides);
    const applicable = Object.fromEntries(Object.entries(global).filter(([key]) =>
      !SAVE_TOGGLES.includes(key) || account.overrideSaveToggles));
    result = applyTravelOverrides(result, applicable);
    // applyTravelOverrides handles save-derived values; these two are route choices.
    for (const key of ['walking', 'questTeleports']) {
      if (Object.hasOwn(applicable, key)) result[key] = applicable[key];
    }
  } else {
    result = { ...applyTravelOverrides(result, global),
      ...Object.fromEntries(Object.entries(global).filter(([key]) => !SAVE_TOGGLES.includes(key))) };
  }
  for (const layer of [linkOverrides, sessionOverrides]) {
    const choices = localTravelChoices(layer);
    result = { ...applyTravelOverrides(result, choices),
      ...Object.fromEntries(Object.entries(choices).filter(([key]) => ['walking', 'questTeleports'].includes(key))) };
  }
  return result;
}
