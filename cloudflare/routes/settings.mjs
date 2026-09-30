import { getCorsHeaders, json } from '../cors.mjs';
import { ACCOUNT_SETTINGS_MAX_BYTES, defaultAccountSettings, validateAccountSettings } from '../../lib/account-settings.mjs';

// The envelope adds a revision and property names to the bounded settings document.
const MAX_REQUEST_BYTES = ACCOUNT_SETTINGS_MAX_BYTES + 1024;

function assertAvailable(settings) {
  const selections = [settings, ...settings.datasetOverrides];
  if (selections.some(selection => selection.modpackId || selection.modVersionId)) throw new Error('Modpack and version selection will be available when their datasets are published.');
  if ([settings.toolDefaults, ...settings.datasetOverrides.map(entry => entry.toolDefaults)].some(tools => Object.keys(tools.gear).some(key => ['questRewards', 'difficultEncounters'].includes(key)))) throw new Error('These gear filters are not available yet.');
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES) throw new RangeError('Settings request is too large.');
  if (!request.body) throw new Error('A settings document and revision are required.');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RangeError('Settings request is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export async function handleSettings(request, env, userId) {
  const cors = getCorsHeaders(request, env);
  if (!['GET', 'PUT'].includes(request.method)) return json({ message: 'Use GET or PUT for settings.' }, 405, { ...cors, Allow: 'GET, PUT' });
  // Normally enforced by worker.mjs; also keep direct handler calls owner-bound.
  if (typeof userId !== 'string' || !userId.trim()) return json({ message: 'Please sign in.' }, 401, cors);
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT settings_json, revision FROM account_settings WHERE clerk_user_id = ?').bind(userId).first();
    if (!row) return json({ settings: defaultAccountSettings(), revision: 0 }, 200, cors);
    try {
      const settings = validateAccountSettings(JSON.parse(row.settings_json));
      assertAvailable(settings);
      return json({ settings, revision: row.revision }, 200, cors);
    } catch {
      return json({ error: 'UNSUPPORTED_SETTINGS', message: 'These settings need a newer app version. Your stored preferences have been kept.' }, 409, cors);
    }
  }
  let settings, revision;
  try {
    const body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['settings', 'revision'].includes(key))) throw new Error('Send only settings and revision.');
    revision = body.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('A non-negative integer revision is required.');
    if (new TextEncoder().encode(JSON.stringify(body.settings)).byteLength > ACCOUNT_SETTINGS_MAX_BYTES) throw new RangeError('Settings exceed 16 KiB.');
    settings = validateAccountSettings(body.settings);
    // Registry-backed data choices and gear filters cannot yet be activated.
    assertAvailable(settings);
  } catch (error) {
    return json({ error: 'BAD_REQUEST', message: error instanceof SyntaxError || error instanceof TypeError ? 'Send a valid settings document and revision.' : error.message }, error instanceof RangeError ? 413 : 400, cors);
  }
  const timestamp = new Date().toISOString();
  const document = JSON.stringify(settings);
  const result = revision === 0
    ? await env.DB.prepare('INSERT INTO account_settings (clerk_user_id, settings_json, revision, created_at, updated_at) VALUES (?, ?, 1, ?, ?) ON CONFLICT(clerk_user_id) DO NOTHING').bind(userId, document, timestamp, timestamp).run()
    : await env.DB.prepare('UPDATE account_settings SET settings_json = ?, revision = revision + 1, updated_at = ? WHERE clerk_user_id = ? AND revision = ?').bind(document, timestamp, userId, revision).run();
  if (result.meta.changes !== 1) return json({ error: 'REVISION_CONFLICT', message: 'Settings changed in another tab or device. Reload the saved settings before trying again.' }, 409, cors);
  return json({ settings, revision: revision + 1 }, 200, cors);
}
