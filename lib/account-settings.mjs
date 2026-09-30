import { applyTravelOverrides, cleanTravelOverrides } from './travel-options.mjs';
import { DEFAULT_GEAR_TOGGLES } from './gear-rows.mjs';
import { DIFFICULTY_PRESETS } from './challenge-math.mjs';

// Shared account document contract for the API and browser consumers.
export const ACCOUNT_SETTINGS_VERSION = 1;
export const ACCOUNT_SETTINGS_MAX_BYTES = 16384;
const WORLDS = ['vanilla', 'tr', 'tr_arce'];
const SAVE_TOGGLES = ['mageGuild', 'conjurer', 'divine', 'almsivi', 'waterWalking'];
const TRAVEL_TOGGLES = [...SAVE_TOGGLES, 'walking', 'questTeleports'];
const ROUTE_CHOICES = ['walking', 'questTeleports', 'objective'];
const OBJECTIVES = ['hops', 'gold', 'time', 'real'];
const TOOL_IDS = ['travel', 'gear', 'challenge'];
const GEAR_TOGGLES = [...Object.keys(DEFAULT_GEAR_TOGGLES), 'questRewards', 'difficultEncounters'];
const BANDS = ['Easy', 'Medium', 'Hard', 'Grind'];
const COUNTS = ['random', '1', '2', '3', '4', '5'];
const MAX_DATASET_OVERRIDES = 24;

export function defaultAccountSettings() {
  return {
    version: ACCOUNT_SETTINGS_VERSION,
    world: 'vanilla',
    modpackId: null,
    modVersionId: null,
    overrideSaveToggles: false,
    theme: 'ashfall',
    versionUpdates: { policy: 'pinned', notify: true },
    defaultScope: 'global',
    toolDefaults: { travel: {}, gear: {}, challenge: {} },
    datasetOverrides: []
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
function booleanChoices(value, keys, label) {
  fields(value, keys, label);
  const result = {};
  for (const [key, enabled] of Object.entries(value)) {
    if (typeof enabled !== 'boolean') throw new Error(`${key} must be a boolean.`);
    result[key] = enabled;
  }
  return result;
}

function travelDefaults(value) {
  fields(value, [...TRAVEL_TOGGLES, 'objective'], 'Travel defaults');
  const { objective, ...toggles } = value;
  const result = booleanChoices(toggles, TRAVEL_TOGGLES, 'Travel defaults');
  if (Object.hasOwn(value, 'objective')) {
    if (!OBJECTIVES.includes(objective)) throw new Error('Choose an available Travel objective.');
    result.objective = objective;
  }
  return result;
}

function challengeDefaults(value) {
  fields(value, ['preset', 'restrictionCount', 'objectiveCount', 'allowedBands'], 'Challenge defaults');
  const result = {};
  if (Object.hasOwn(value, 'preset')) {
    if (typeof value.preset !== 'string' || !Object.hasOwn(DIFFICULTY_PRESETS, value.preset)) throw new Error('Choose an available Challenge preset.');
    result.preset = value.preset;
  }
  for (const key of ['restrictionCount', 'objectiveCount']) {
    if (Object.hasOwn(value, key)) {
      if (!COUNTS.includes(value[key])) throw new Error(`${key} must be random or a count from 1 to 5.`);
      result[key] = value[key];
    }
  }
  if (Object.hasOwn(value, 'allowedBands')) {
    result.allowedBands = booleanChoices(value.allowedBands, BANDS, 'Challenge bands');
  }
  return result;
}

function toolDefaults(value) {
  fields(value, TOOL_IDS, 'tool defaults');
  const result = { travel: {}, gear: {}, challenge: {} };
  if (Object.hasOwn(value, 'travel')) result.travel = travelDefaults(value.travel);
  if (Object.hasOwn(value, 'gear')) result.gear = booleanChoices(value.gear, GEAR_TOGGLES, 'Gear defaults');
  if (Object.hasOwn(value, 'challenge')) result.challenge = challengeDefaults(value.challenge);
  return result;
}

function dataSelection(value) {
  object(value, 'data selection');
  const selection = { world: value.world === undefined ? 'vanilla' : value.world,
    modpackId: value.modpackId === undefined ? null : identifier(value.modpackId, 'modpackId'),
    modVersionId: value.modVersionId === undefined ? null : identifier(value.modVersionId, 'modVersionId') };
  if (!WORLDS.includes(selection.world)) throw new Error('Choose an available world.');
  if (selection.modVersionId && /^(latest|current)$/i.test(selection.modVersionId)) {
    throw new Error('Mod Version must identify an immutable release.');
  }
  if (selection.modVersionId && !selection.modpackId && selection.world === 'vanilla') {
    throw new Error('A mod version requires Tamriel Rebuilt or a modpack.');
  }
  return selection;
}

function selectionKey(value) {
  return JSON.stringify([value.world, value.modpackId, value.modVersionId]);
}

/** Validate a complete supported document; missing optional fields use defaults.
 * Unknown fields/versions fail explicitly so an older client cannot erase them.
 * Registry availability is a separate check: IDs never authorize a fetch URL.
 */
export function validateAccountSettings(value) {
  fields(value, ['version', 'world', 'modpackId', 'modVersionId', 'overrideSaveToggles',
    'theme', 'versionUpdates', 'defaultScope', 'toolDefaults', 'datasetOverrides'], 'settings');
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
    result.toolDefaults = toolDefaults(value.toolDefaults);
  }
  if (Object.hasOwn(value, 'theme')) {
    if (!['ashfall', 'morrowind'].includes(value.theme)) throw new Error('Choose an available theme.');
    result.theme = value.theme;
  }
  if (Object.hasOwn(value, 'versionUpdates')) {
    fields(value.versionUpdates, ['policy', 'notify'], 'version updates');
    if (Object.hasOwn(value.versionUpdates, 'policy') && value.versionUpdates.policy !== 'pinned') {
      throw new Error('Mod versions remain pinned until an explicit upgrade.');
    }
    if (Object.hasOwn(value.versionUpdates, 'notify')) {
      if (typeof value.versionUpdates.notify !== 'boolean') throw new Error('Update notices must be a boolean.');
      result.versionUpdates.notify = value.versionUpdates.notify;
    }
  }
  if (Object.hasOwn(value, 'defaultScope')) {
    if (!['global', 'dataset'].includes(value.defaultScope)) throw new Error('Choose global or dataset defaults.');
    result.defaultScope = value.defaultScope;
  }
  if (Object.hasOwn(value, 'datasetOverrides')) {
    if (!Array.isArray(value.datasetOverrides) || value.datasetOverrides.length > MAX_DATASET_OVERRIDES) {
      throw new Error('Keep at most 24 dataset overrides.');
    }
    const seen = new Set();
    result.datasetOverrides = value.datasetOverrides.map(entry => {
      fields(entry, ['world', 'modpackId', 'modVersionId', 'toolDefaults'], 'dataset override');
      if (!Object.hasOwn(entry, 'world') || !WORLDS.includes(entry.world)) throw new Error('Dataset overrides require a world.');
      const selection = dataSelection(entry), key = selectionKey(selection);
      if (seen.has(key)) throw new Error('Duplicate dataset override.');
      seen.add(key);
      return { ...selection, toolDefaults: toolDefaults(entry.toolDefaults) };
    });
  }
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > ACCOUNT_SETTINGS_MAX_BYTES) {
    throw new Error('Account settings are too large.');
  }
  return result;
}

/** For future release/snapshot namespaces; not the settings schema version. */
export function accountDataSelectionKey(value) {
  const { world, modpackId, modVersionId } = validateAccountSettings(value);
  return selectionKey({ world, modpackId, modVersionId });
}

function mergeToolDefaults(base, patch) {
  return { travel: { ...base.travel, ...patch.travel }, gear: { ...base.gear, ...patch.gear },
    challenge: { ...base.challenge, ...patch.challenge,
      ...(base.challenge.allowedBands || patch.challenge.allowedBands ? {
        allowedBands: { ...base.challenge.allowedBands, ...patch.challenge.allowedBands }
      } : {}) } };
}

function scopedToolDefaults(account, selection) {
  let result = mergeToolDefaults({ travel: {}, gear: {}, challenge: {} }, account.toolDefaults);
  if (account.defaultScope !== 'dataset') return result;
  const matches = account.datasetOverrides.filter(entry => entry.world === selection.world &&
    entry.modpackId === selection.modpackId && (entry.modVersionId === null || entry.modVersionId === selection.modVersionId));
  // Pack/world-wide defaults first, exact pinned release last, regardless of array order.
  matches.sort((a, b) => Number(a.modVersionId !== null) - Number(b.modVersionId !== null));
  for (const entry of matches) result = mergeToolDefaults(result, entry.toolDefaults);
  return result;
}

/** Explicit stored choices only, for marking overrides without inventing values. */
export function accountToolChoices(settings, selection = settings) {
  return scopedToolDefaults(validateAccountSettings(settings), dataSelection(selection));
}

/** Edit a tool in the selected scope while retaining other tools and worlds. */
export function updateAccountToolSettings(settings, tool, patch, selection = settings) {
  const account = validateAccountSettings(settings);
  if (!TOOL_IDS.includes(tool)) throw new Error('Choose an available tool.');
  let tools = account.toolDefaults;
  if (account.defaultScope === 'dataset') {
    const selected = dataSelection(selection);
    let entry = account.datasetOverrides.find(item => selectionKey(item) === selectionKey(selected));
    if (!entry) {
      entry = { ...selected, toolDefaults: { travel: {}, gear: {}, challenge: {} } };
      account.datasetOverrides.push(entry);
    }
    tools = entry.toolDefaults;
  }
  const next = { ...tools[tool], ...patch };
  for (const [key, value] of Object.entries(next)) if (value === undefined) delete next[key];
  tools[tool] = next;
  return validateAccountSettings(account);
}

/** Resolved manual defaults; challenge seed/current edits remain higher priority. */
export function resolveAccountToolDefaults(settings, selection = settings) {
  const account = validateAccountSettings(settings);
  const selected = dataSelection(selection);
  const saved = scopedToolDefaults(account, selected);
  const preset = DIFFICULTY_PRESETS[saved.challenge.preset || 'standard'];
  const resolved = mergeToolDefaults({
    travel: { mageGuild: true, conjurer: false, divine: false, almsivi: false,
      waterWalking: false, walking: true, questTeleports: false, objective: 'hops' },
    gear: { ...DEFAULT_GEAR_TOGGLES, questRewards: false, difficultEncounters: false },
    challenge: { preset: preset.id, restrictionCount: String(preset.restrictionsCount),
      objectiveCount: String(preset.objectivesCount), allowedBands: { ...preset.bands } }
  }, saved);
  // A customized named preset is reported honestly, rather than hiding changed dials.
  const challenge = resolved.challenge;
  if (challenge.preset !== 'custom' && (challenge.restrictionCount !== String(preset.restrictionsCount) ||
      challenge.objectiveCount !== String(preset.objectivesCount) ||
      BANDS.some(band => challenge.allowedBands[band] !== preset.bands[band]))) challenge.preset = 'custom';
  return resolved;
}

/** Pure reset actions, persisted through the revision-checked settings API. */
export function resetAccountSettings() {
  return defaultAccountSettings();
}

export function resetAccountToolSettings(settings, tool) {
  const account = validateAccountSettings(settings);
  if (!TOOL_IDS.includes(tool)) throw new Error('Choose an available tool to reset.');
  account.toolDefaults[tool] = {};
  account.datasetOverrides = account.datasetOverrides.map(entry => ({ ...entry,
    toolDefaults: { ...entry.toolDefaults, [tool]: {} } })).filter(entry =>
    TOOL_IDS.some(id => Object.keys(entry.toolDefaults[id]).length));
  return account;
}

function localTravelChoices(value) {
  const result = cleanTravelOverrides(value);
  for (const key of ['walking', 'questTeleports']) {
    if (typeof value?.[key] === 'boolean') result[key] = value[key];
  }
  if (OBJECTIVES.includes(value?.objective)) result.objective = value.objective;
  return result;
}

/** Resolve account defaults alongside save, link and current-session choices.
 * Explicit link/session choices win. Global policy covers only stored booleans,
 * never saved inventory, current Magicka, carrying weight or movement magnitude.
 * The consumer must still enforce spell/resource availability and show notices.
 */
export function resolveAccountTravelOptions({ settings, selection = settings, defaults = {}, saveDefaults = null,
  saveOverrides = {}, linkOverrides = {}, sessionOverrides = {} }) {
  const account = validateAccountSettings(settings);
  const global = scopedToolDefaults(account, dataSelection(selection)).travel;
  let result = applyTravelOverrides({ objective: 'hops', ...defaults }, {});
  if (saveDefaults !== null) {
    result = applyTravelOverrides({ ...result, ...saveDefaults }, saveOverrides);
    const applicable = Object.fromEntries(Object.entries(global).filter(([key]) =>
      !SAVE_TOGGLES.includes(key) || account.overrideSaveToggles));
    result = applyTravelOverrides(result, applicable);
    // applyTravelOverrides handles save-derived values; these two are route choices.
    for (const key of ROUTE_CHOICES) {
      if (Object.hasOwn(applicable, key)) result[key] = applicable[key];
    }
  } else {
    result = { ...applyTravelOverrides(result, global),
      ...Object.fromEntries(Object.entries(global).filter(([key]) => !SAVE_TOGGLES.includes(key))) };
  }
  for (const layer of [linkOverrides, sessionOverrides]) {
    const choices = localTravelChoices(layer);
    result = { ...applyTravelOverrides(result, choices),
      ...Object.fromEntries(Object.entries(choices).filter(([key]) => ROUTE_CHOICES.includes(key))) };
  }
  return result;
}
