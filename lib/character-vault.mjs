/**
 * Silt Strider Character Vault Hybrid Sync Engine
 *
 * Bridges browser localStorage and the Cloudflare D1 Cloud Save Vault API,
 * providing offline-first local persistence, 1-click cloud sync, duplicate builds,
 * shareable permalink generation, and conflict resolution.
 */

import { SAVE_TYPES } from './cloud-save-codec.mjs';
import { QuotaExceededError, RevisionConflictError } from './cloud-save-service.mjs';

export const LOCAL_SAVES_KEY = 'siltstrider-saved-characters';

/**
 * Generates a shareable permalink URL for a character build.
 * Compatible with Silt Strider's canonical hash router (#builder&build=...&world=...&arce=...).
 *
 * @param {Object} build
 * @param {string} [origin='']
 * @returns {string} Full URL or hash string
 */
export function generateBuildShareUrl(build, origin = '') {
  if (!build) return origin ? `${origin}#builder` : '#builder';
  const cleanBuild = {
    race: build.race,
    gender: build.gender || 'Male',
    className: build.className || 'Custom',
    sign: build.sign,
    spec: build.spec,
    fav1: build.fav1,
    fav2: build.fav2,
    maj: build.maj || [],
    min: build.min || [],
    bitterCup: Boolean(build.bitterCup),
  };

  const jsonStr = JSON.stringify(cleanBuild);
  let b64;
  if (typeof Buffer !== 'undefined') {
    b64 = Buffer.from(jsonStr).toString('base64url');
  } else if (typeof btoa !== 'undefined') {
    b64 = btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } else {
    b64 = encodeURIComponent(jsonStr);
  }

  const world = build.world || 'vanilla';
  const arce = build.arce ? '1' : '0';
  const prefix = origin ? origin.replace(/\/+$/, '') : '';
  return `${prefix}/#builder&build=${b64}&world=${world}&arce=${arce}`;
}

/**
 * Safely loads all local characters from browser storage.
 *
 * @param {Storage} [storage=globalThis.localStorage]
 * @returns {Array<Object>}
 */
export function loadLocalCharacters(storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_SAVES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (parsed && Array.isArray(parsed.records)) return parsed.records.filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a local character in browser storage.
 *
 * @param {Object} record
 * @param {Storage} [storage=globalThis.localStorage]
 * @returns {Object} Saved record
 */
export function saveLocalCharacter(record, storage = globalThis.localStorage) {
  if (!storage) throw new Error('Storage unavailable');
  const records = loadLocalCharacters(storage);
  const id = record.id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const entry = {
    id,
    version: 1,
    name: record.name || 'Custom Character',
    character: record.character || record.build || record,
    createdAt: record.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = records.findIndex((r) => r.id === id);
  if (existingIdx >= 0) {
    records[existingIdx] = entry;
  } else {
    records.push(entry);
  }

  storage.setItem(LOCAL_SAVES_KEY, JSON.stringify(records));
  return entry;
}

/**
 * Deletes a local character from browser storage.
 *
 * @param {string} id
 * @param {Storage} [storage=globalThis.localStorage]
 * @returns {boolean}
 */
export function deleteLocalCharacter(id, storage = globalThis.localStorage) {
  if (!storage) return false;
  const records = loadLocalCharacters(storage);
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length !== records.length) {
    storage.setItem(LOCAL_SAVES_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

/**
 * Duplicates a cloud save, appending " (Copy)" to the name.
 *
 * @param {Object} client Cloud save client instance
 * @param {string} saveId ID of save to duplicate
 * @returns {Promise<Object>} The new duplicate save record
 */
export async function duplicateCloudSave(client, saveId) {
  if (!client || typeof client.getSave !== 'function') {
    throw new Error('Valid cloud save client required');
  }

  const { save } = await client.getSave(saveId);
  if (!save) throw new Error('Original save not found');

  const copyName = `${save.name || 'Character'} (Copy)`;
  return client.createSave({
    saveType: save.save_type,
    data: save.data,
    name: copyName,
  });
}

/**
 * Syncs a single local character record to the cloud.
 *
 * @param {Object} client Cloud save client instance
 * @param {Object} localRecord
 * @returns {Promise<Object>}
 */
export async function syncLocalCharacterToCloud(client, localRecord) {
  if (!client) throw new Error('Cloud client required');
  const char = localRecord.character || localRecord.build || localRecord;
  const name = localRecord.name || char.name || 'Local Character';

  const data = {
    build: char,
    exportedAt: localRecord.updatedAt || new Date().toISOString(),
    version: 1,
  };

  return client.createSave({
    saveType: SAVE_TYPES.CHARACTER_BUILD,
    data,
    name,
  });
}

/**
 * Resolves a synchronization conflict between a local character and cloud save.
 *
 * @param {Object} client
 * @param {Object} params
 * @param {string} params.saveId
 * @param {number} params.revision Current cloud revision
 * @param {Object} params.localRecord
 * @param {Object} params.cloudRecord
 * @param {'keep_cloud'|'overwrite_cloud'} params.resolution
 * @param {Storage} [storage=globalThis.localStorage]
 */
export async function resolveConflict(client, {
  saveId,
  revision,
  localRecord,
  cloudRecord,
  resolution,
  storage = globalThis.localStorage,
} = {}) {
  if (resolution === 'keep_cloud') {
    // Overwrite local copy with cloud version
    if (cloudRecord && storage) {
      saveLocalCharacter({
        id: localRecord?.id,
        name: cloudRecord.name,
        character: cloudRecord.data?.build || cloudRecord.data,
        updatedAt: cloudRecord.updated_at,
      }, storage);
    }
    return { resolved: true, source: 'cloud' };
  }

  if (resolution === 'overwrite_cloud') {
    // Force overwrite cloud version using optimistic locking revision
    if (!client) throw new Error('Client required for cloud overwrite');
    const updated = await client.updateSave(saveId, {
      name: localRecord.name,
      data: {
        build: localRecord.character || localRecord,
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      revision,
    });
    return { resolved: true, source: 'local', save: updated.save };
  }

  throw new Error(`Unknown conflict resolution mode: ${resolution}`);
}
