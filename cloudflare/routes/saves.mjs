/**
 * Silt Strider Cloudflare API: Cloud Save Vault Routes
 *
 * Implements:
 * - GET    /api/saves       (List user save headers via v_cloud_save_headers)
 * - GET    /api/saves/:id   (Fetch and unpack full SLT1 save payload)
 * - POST   /api/saves       (Pack and insert new save with zero-bypass quota enforcement)
 * - PUT    /api/saves/:id   (Optimistic concurrency update via revision counter)
 * - DELETE /api/saves/:id   (Concurrency-checked save deletion)
 */

import crypto from 'node:crypto';
import {
  packCloudSave,
  unpackCloudSave,
  extractCloudSaveMetadata,
  SAVE_TYPES,
  validateOmwSave,
  validateCharacterBuild,
  validateChallengeRun,
  validateCustomLoadout
} from '../cloud-save-codec.mjs';
import { json, getCorsHeaders } from '../cors.mjs';

/**
 * Normalizes input buffer or array into a strict Uint8Array.
 */
export function toUint8Array(payload) {
  if (!payload) return new Uint8Array(0);
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (ArrayBuffer.isView(payload)) return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
  if (Array.isArray(payload)) return new Uint8Array(payload);
  if (typeof payload === 'string') {
    // If base64-encoded string
    return Uint8Array.from(Buffer.from(payload, 'base64'));
  }
  return new Uint8Array(payload);
}

/**
 * Maps database header row to full dual-case representation.
 */
export function mapSaveHeader(row) {
  return {
    id: row.id,
    saveType: row.save_type,
    save_type: row.save_type,
    name: row.name,
    formatVersion: row.format_version,
    format_version: row.format_version,
    level: row.level,
    race: row.race,
    className: row.class_name,
    class_name: row.class_name,
    classCustom: Boolean(row.class_custom),
    class_custom: row.class_custom,
    birthsign: row.birthsign,
    cell: row.cell,
    gold: row.gold,
    timePlayedSeconds: row.time_played_seconds,
    time_played_seconds: row.time_played_seconds,
    questCount: row.quest_count,
    quest_count: row.quest_count,
    topicCount: row.topic_count,
    topic_count: row.topic_count,
    itemCount: row.item_count,
    item_count: row.item_count,
    spellCount: row.spell_count,
    spell_count: row.spell_count,
    factionCount: row.faction_count,
    faction_count: row.faction_count,
    packedSize: row.packed_size,
    packed_size: row.packed_size,
    unpackedSize: row.unpacked_size,
    unpacked_size: row.unpacked_size,
    encoding: row.encoding,
    payloadHash: row.payload_hash,
    payload_hash: row.payload_hash,
    revision: row.revision,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

/**
 * Validates save payload according to its saveType.
 */
function validateSaveData(saveType, data) {
  switch (saveType) {
    case SAVE_TYPES.OPENMW_SAVE:
      return validateOmwSave(data);
    case SAVE_TYPES.CHARACTER_BUILD:
      return validateCharacterBuild(data);
    case SAVE_TYPES.CHALLENGE_RUN:
      return validateChallengeRun(data);
    case SAVE_TYPES.CUSTOM_LOADOUT:
      return validateCustomLoadout(data);
    default:
      throw new TypeError(`Unsupported save_type: ${saveType}`);
  }
}

/**
 * GET /api/saves: List save headers for the authenticated user.
 */
export async function handleListSaves(request, env, userId) {
  const cors = getCorsHeaders(request, env);
  const url = new URL(request.url);

  const filterType = url.searchParams.get('type') || url.searchParams.get('save_type');
  if (filterType && !Object.values(SAVE_TYPES).includes(filterType)) {
    return json({ error: 'BAD_REQUEST', message: `Invalid save_type filter: ${filterType}` }, 400, cors);
  }

  const rawLimit = Number(url.searchParams.get('limit') || 50);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

  const rawOffset = Number(url.searchParams.get('offset') || 0);
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  try {
    let sql = 'SELECT * FROM v_cloud_save_headers WHERE clerk_user_id = ?';
    const params = [userId];
    if (filterType) {
      sql += ' AND save_type = ?';
      params.push(filterType);
    }
    sql += ' ORDER BY updated_at DESC, id LIMIT ? OFFSET ?';
    params.push(limit, offset);

    let countSql = 'SELECT count(*) AS total FROM v_cloud_save_headers WHERE clerk_user_id = ?';
    const countParams = [userId];
    if (filterType) {
      countSql += ' AND save_type = ?';
      countParams.push(filterType);
    }

    const [listResult, countResult] = await Promise.all([
      env.DB.prepare(sql).bind(...params).all(),
      env.DB.prepare(countSql).bind(...countParams).first(),
    ]);

    const rows = Array.isArray(listResult?.results) ? listResult.results : (Array.isArray(listResult) ? listResult : []);
    const total = countResult?.total ?? (countResult && typeof countResult['count(*)'] === 'number' ? countResult['count(*)'] : rows.length);

    return json({
      saves: rows.map(mapSaveHeader),
      total,
      limit,
      offset,
    }, 200, cors);
  } catch (err) {
    return json({ error: 'DATABASE_ERROR', message: 'Failed to list saves: ' + (err?.message || 'unknown error') }, 500, cors);
  }
}

/**
 * GET /api/saves/:id: Fetch and unpack a single save payload.
 */
export async function handleGetSave(request, env, userId, saveId) {
  const cors = getCorsHeaders(request, env);

  if (!saveId || typeof saveId !== 'string' || saveId.trim().length === 0) {
    return json({ error: 'BAD_REQUEST', message: 'Invalid save ID' }, 400, cors);
  }

  try {
    const row = await env.DB.prepare(`
      SELECT
        id, version, save_type, name, format_version,
        level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
        quest_count, topic_count, item_count, spell_count, faction_count,
        packed_payload, packed_size, unpacked_size, encoding, payload_hash,
        revision, created_at, updated_at
      FROM cloud_saves
      WHERE clerk_user_id = ? AND id = ?
    `).bind(userId, saveId).first();

    if (!row) {
      return json({ error: 'NOT_FOUND', message: 'Save not found' }, 404, cors);
    }

    const payloadBytes = toUint8Array(row.packed_payload);
    let unpacked;
    try {
      unpacked = unpackCloudSave(payloadBytes);
    } catch (err) {
      return json({ error: 'DECODE_ERROR', message: 'Failed to decode save payload: ' + err.message }, 500, cors);
    }

    const header = mapSaveHeader(row);
    return json({
      ...header,
      data: unpacked.data,
    }, 200, cors);
  } catch (err) {
    return json({ error: 'DATABASE_ERROR', message: 'Failed to fetch save: ' + (err?.message || 'unknown error') }, 500, cors);
  }
}

/**
 * POST /api/saves: Pack and insert a new save, enforcing tier quotas.
 */
export async function handleCreateSave(request, env, userId) {
  const cors = getCorsHeaders(request, env);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400, cors);
  }

  if (!body || typeof body !== 'object') {
    return json({ error: 'BAD_REQUEST', message: 'Request body must be an object' }, 400, cors);
  }

  const saveType = body.saveType || body.save_type || SAVE_TYPES.OPENMW_SAVE;
  if (!Object.values(SAVE_TYPES).includes(saveType)) {
    return json({ error: 'BAD_REQUEST', message: `Invalid save_type: ${saveType}` }, 400, cors);
  }

  let packed;
  let encoding;
  let payloadHash;
  let packedSize;
  let uncompressedSize;
  let dataForMeta;

  let effectiveSaveType = saveType;

  if (body.data !== undefined && body.data !== null) {
    try {
      validateSaveData(saveType, body.data);
    } catch (err) {
      return json({ error: 'VALIDATION_FAILED', message: err.message }, 400, cors);
    }

    try {
      const packResult = packCloudSave(saveType, body.data);
      packed = packResult.packed;
      encoding = packResult.encoding;
      payloadHash = packResult.payloadHash;
      packedSize = packResult.packedSize;
      uncompressedSize = packResult.uncompressedSize;
      dataForMeta = body.data;
    } catch (err) {
      return json({ error: 'PACK_ERROR', message: 'Failed to pack save payload: ' + err.message }, 400, cors);
    }
  } else if (body.packedPayload) {
    try {
      packed = toUint8Array(body.packedPayload);
      packedSize = packed.length;
      const unpacked = unpackCloudSave(packed);
      dataForMeta = unpacked.data;
      effectiveSaveType = unpacked.saveType || saveType;
      uncompressedSize = body.unpackedSize ?? unpacked.uncompressedSize ?? packedSize;
      encoding = (packed[6] & 1) ? 'slt1_deflate' : 'slt1_raw';
      payloadHash = computeSha256Sync(packed);
    } catch (err) {
      return json({ error: 'INVALID_PAYLOAD', message: 'Invalid packed payload: ' + err.message }, 400, cors);
    }
  } else {
    return json({ error: 'BAD_REQUEST', message: 'Request body must contain either data or packedPayload' }, 400, cors);
  }

  if (packedSize > 1048576) {
    return json({ error: 'PAYLOAD_TOO_LARGE', message: 'Packed payload exceeds 1 MB limit' }, 413, cors);
  }

  const meta = extractCloudSaveMetadata(effectiveSaveType, dataForMeta, packed, uncompressedSize);

  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== 'string') {
      return json({ error: 'BAD_REQUEST', message: 'Save name must be a string' }, 400, cors);
    }
    const trimmedName = body.name.trim();
    if (trimmedName.length === 0) {
      return json({ error: 'BAD_REQUEST', message: 'Save name cannot be empty' }, 400, cors);
    }
    if (trimmedName.length > 120) {
      return json({ error: 'BAD_REQUEST', message: 'Save name exceeds maximum length of 120 characters' }, 400, cors);
    }
    meta.name = trimmedName;
  }

  if (!meta.name || meta.name.trim().length === 0) {
    return json({ error: 'BAD_REQUEST', message: 'Save name cannot be empty' }, 400, cors);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertSql = `
    INSERT INTO cloud_saves (
      id, clerk_user_id, version, save_type, name, format_version,
      level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
      quest_count, topic_count, item_count, spell_count, faction_count,
      packed_payload, packed_size, unpacked_size, encoding, payload_hash,
      revision, created_at, updated_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `;

  try {
    await env.DB.prepare(insertSql).bind(
      id, userId, meta.save_type, meta.name, meta.format_version,
      meta.level, meta.race, meta.class_name, meta.class_custom, meta.birthsign, meta.cell,
      meta.gold, meta.time_played_seconds, meta.quest_count, meta.topic_count, meta.item_count,
      meta.spell_count, meta.faction_count, packed, packedSize, meta.unpacked_size,
      encoding, payloadHash, now, now
    ).run();

    return json({
      id,
      revision: 1,
      saveType: meta.save_type,
      save_type: meta.save_type,
      name: meta.name,
      packedSize,
      packed_size: packedSize,
      unpackedSize: meta.unpacked_size,
      unpacked_size: meta.unpacked_size,
      encoding,
      payloadHash,
      payload_hash: payloadHash,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    }, 201, cors);
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('QUOTA_EXCEEDED')) {
      return json({
        error: 'QUOTA_EXCEEDED',
        message: 'Maximum save slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing save to continue.',
      }, 409, cors);
    }
    return json({ error: 'DATABASE_ERROR', message: 'Could not save character: ' + msg }, 500, cors);
  }
}

/**
 * PUT /api/saves/:id: Overwrite/update an existing save with optimistic concurrency.
 */
export async function handleUpdateSave(request, env, userId, saveId) {
  const cors = getCorsHeaders(request, env);

  if (!saveId || typeof saveId !== 'string' || saveId.trim().length === 0) {
    return json({ error: 'BAD_REQUEST', message: 'Invalid save ID' }, 400, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400, cors);
  }

  if (!body || typeof body !== 'object') {
    return json({ error: 'BAD_REQUEST', message: 'Request body must be an object' }, 400, cors);
  }

  // 1. Revision extraction: supports body.revision and standard If-Match header
  let revision = null;
  if (body.revision !== undefined && body.revision !== null) {
    const parsed = Number(body.revision);
    if (Number.isInteger(parsed) && parsed >= 1) {
      revision = parsed;
    } else {
      return json({ error: 'BAD_REQUEST', message: 'A valid positive integer revision is required for optimistic concurrency' }, 400, cors);
    }
  } else {
    const ifMatch = request.headers.get('If-Match');
    if (ifMatch) {
      const parsed = Number(ifMatch.replace(/["']/g, '').trim());
      if (Number.isInteger(parsed) && parsed >= 1) {
        revision = parsed;
      } else {
        return json({ error: 'BAD_REQUEST', message: 'If-Match header must contain a valid positive integer revision' }, 400, cors);
      }
    }
  }

  if (revision === null) {
    return json({ error: 'BAD_REQUEST', message: 'A valid positive integer revision is required for optimistic concurrency' }, 400, cors);
  }

  const now = new Date().toISOString();

  // 2. Case A: Standalone rename without transmitting payload
  const hasPayload = (body.data !== undefined && body.data !== null) || Boolean(body.packedPayload);
  if (!hasPayload) {
    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== 'string') {
        return json({ error: 'BAD_REQUEST', message: 'Save name must be a string' }, 400, cors);
      }
      const trimmedName = body.name.trim();
      if (trimmedName.length === 0) {
        return json({ error: 'BAD_REQUEST', message: 'Save name cannot be empty' }, 400, cors);
      }
      if (trimmedName.length > 120) {
        return json({ error: 'BAD_REQUEST', message: 'Save name exceeds maximum length of 120 characters' }, 400, cors);
      }

      const renameSql = `
        UPDATE cloud_saves
        SET name = ?, updated_at = ?, revision = revision + 1
        WHERE clerk_user_id = ? AND id = ? AND revision = ?
      `;

      try {
        const result = await env.DB.prepare(renameSql).bind(trimmedName, now, userId, saveId, revision).run();
        const changes = result?.meta?.changes ?? result?.meta?.rows_written ?? result?.changes ?? 0;

        if (changes === 0) {
          const existing = await env.DB.prepare('SELECT revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?').bind(userId, saveId).first();
          if (!existing) {
            return json({ error: 'NOT_FOUND', message: 'Save not found' }, 404, cors);
          }
          return json({
            error: 'REVISION_CONFLICT',
            message: 'Save has been modified by another session. Please reload and retry.',
            currentRevision: existing.revision,
            current_revision: existing.revision,
            expectedRevision: revision,
            expected_revision: revision,
          }, 409, cors);
        }

        const updatedRow = await env.DB.prepare(`
          SELECT
            id, version, save_type, name, format_version,
            level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
            quest_count, topic_count, item_count, spell_count, faction_count,
            packed_size, unpacked_size, encoding, payload_hash,
            revision, created_at, updated_at
          FROM cloud_saves
          WHERE clerk_user_id = ? AND id = ?
        `).bind(userId, saveId).first();

        return json(mapSaveHeader(updatedRow), 200, cors);
      } catch (err) {
        return json({ error: 'DATABASE_ERROR', message: 'Could not rename save: ' + (err?.message || 'unknown error') }, 500, cors);
      }
    }

    return json({ error: 'BAD_REQUEST', message: 'Request body must contain data, packedPayload, or name' }, 400, cors);
  }

  // 3. Case B: Full payload update (preserves existing save_type if omitted)
  let saveType = body.saveType || body.save_type;
  if (saveType && !Object.values(SAVE_TYPES).includes(saveType)) {
    return json({ error: 'BAD_REQUEST', message: `Invalid save_type: ${saveType}` }, 400, cors);
  }

  // If saveType was not specified in the update request, retrieve existing row to preserve its true type
  if (!saveType) {
    try {
      const existing = await env.DB.prepare('SELECT id, save_type, revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?').bind(userId, saveId).first();
      if (!existing) {
        return json({ error: 'NOT_FOUND', message: 'Save not found' }, 404, cors);
      }
      if (existing.revision !== revision) {
        return json({
          error: 'REVISION_CONFLICT',
          message: 'Save has been modified by another session. Please reload and retry.',
          currentRevision: existing.revision,
          current_revision: existing.revision,
          expectedRevision: revision,
          expected_revision: revision,
        }, 409, cors);
      }
      saveType = existing.save_type;
    } catch (err) {
      return json({ error: 'DATABASE_ERROR', message: 'Could not query existing save: ' + (err?.message || 'unknown error') }, 500, cors);
    }
  }

  let packed;
  let encoding;
  let payloadHash;
  let packedSize;
  let uncompressedSize;
  let dataForMeta;

  if (body.data !== undefined && body.data !== null) {
    try {
      validateSaveData(saveType, body.data);
    } catch (err) {
      return json({ error: 'VALIDATION_FAILED', message: err.message }, 400, cors);
    }

    try {
      const packResult = packCloudSave(saveType, body.data);
      packed = packResult.packed;
      encoding = packResult.encoding;
      payloadHash = packResult.payloadHash;
      packedSize = packResult.packedSize;
      uncompressedSize = packResult.uncompressedSize;
      dataForMeta = body.data;
    } catch (err) {
      return json({ error: 'PACK_ERROR', message: 'Failed to pack save payload: ' + err.message }, 400, cors);
    }
  } else if (body.packedPayload) {
    try {
      packed = toUint8Array(body.packedPayload);
      packedSize = packed.length;
      const unpacked = unpackCloudSave(packed);
      dataForMeta = unpacked.data;
      saveType = unpacked.saveType || saveType;
      uncompressedSize = body.unpackedSize ?? unpacked.uncompressedSize ?? packedSize;
      encoding = (packed[6] & 1) ? 'slt1_deflate' : 'slt1_raw';
      payloadHash = computeSha256Sync(packed);
    } catch (err) {
      return json({ error: 'INVALID_PAYLOAD', message: 'Invalid packed payload: ' + err.message }, 400, cors);
    }
  }

  if (packedSize > 1048576) {
    return json({ error: 'PAYLOAD_TOO_LARGE', message: 'Packed payload exceeds 1 MB limit' }, 413, cors);
  }

  const meta = extractCloudSaveMetadata(saveType, dataForMeta, packed, uncompressedSize);

  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== 'string') {
      return json({ error: 'BAD_REQUEST', message: 'Save name must be a string' }, 400, cors);
    }
    const trimmedName = body.name.trim();
    if (trimmedName.length === 0) {
      return json({ error: 'BAD_REQUEST', message: 'Save name cannot be empty' }, 400, cors);
    }
    if (trimmedName.length > 120) {
      return json({ error: 'BAD_REQUEST', message: 'Save name exceeds maximum length of 120 characters' }, 400, cors);
    }
    meta.name = trimmedName;
  }

  if (!meta.name || meta.name.trim().length === 0) {
    return json({ error: 'BAD_REQUEST', message: 'Save name cannot be empty' }, 400, cors);
  }

  const updateSql = `
    UPDATE cloud_saves
    SET save_type = ?, name = ?, format_version = ?,
        level = ?, race = ?, class_name = ?, class_custom = ?, birthsign = ?, cell = ?,
        gold = ?, time_played_seconds = ?, quest_count = ?, topic_count = ?, item_count = ?,
        spell_count = ?, faction_count = ?,
        packed_payload = ?, packed_size = ?, unpacked_size = ?, encoding = ?, payload_hash = ?,
        updated_at = ?, revision = revision + 1
    WHERE clerk_user_id = ? AND id = ? AND revision = ?
  `;

  try {
    const result = await env.DB.prepare(updateSql).bind(
      meta.save_type, meta.name, meta.format_version,
      meta.level, meta.race, meta.class_name, meta.class_custom, meta.birthsign, meta.cell,
      meta.gold, meta.time_played_seconds, meta.quest_count, meta.topic_count, meta.item_count,
      meta.spell_count, meta.faction_count,
      packed, packedSize, meta.unpacked_size, encoding, payloadHash,
      now, userId, saveId, revision
    ).run();

    const changes = result?.meta?.changes ?? result?.meta?.rows_written ?? result?.changes ?? 0;

    if (changes === 0) {
      const existing = await env.DB.prepare('SELECT revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?').bind(userId, saveId).first();
      if (!existing) {
        return json({ error: 'NOT_FOUND', message: 'Save not found' }, 404, cors);
      }
      return json({
        error: 'REVISION_CONFLICT',
        message: 'Save has been modified by another session. Please reload and retry.',
        currentRevision: existing.revision,
        current_revision: existing.revision,
        expectedRevision: revision,
        expected_revision: revision,
      }, 409, cors);
    }

    return json({
      id: saveId,
      revision: revision + 1,
      name: meta.name,
      saveType: meta.save_type,
      save_type: meta.save_type,
      updatedAt: now,
      updated_at: now,
      packedSize,
      packed_size: packedSize,
      uncompressedSize: meta.unpacked_size,
      unpacked_size: meta.unpacked_size,
      encoding,
      payloadHash,
      payload_hash: payloadHash,
    }, 200, cors);
  } catch (err) {
    return json({ error: 'DATABASE_ERROR', message: 'Could not update save: ' + (err?.message || 'unknown error') }, 500, cors);
  }
}

/**
 * DELETE /api/saves/:id: Delete a save with optional concurrency check.
 */
export async function handleDeleteSave(request, env, userId, saveId) {
  const cors = getCorsHeaders(request, env);

  if (!saveId || typeof saveId !== 'string' || saveId.trim().length === 0) {
    return json({ error: 'BAD_REQUEST', message: 'Invalid save ID' }, 400, cors);
  }

  const url = new URL(request.url);
  let revision = null;
  const qRev = url.searchParams.get('revision');
  if (qRev !== null && qRev !== '') {
    const parsed = Number(qRev);
    if (Number.isInteger(parsed) && parsed >= 1) {
      revision = parsed;
    } else {
      return json({ error: 'BAD_REQUEST', message: 'Invalid revision parameter' }, 400, cors);
    }
  }

  // Also check If-Match header if revision not in query
  if (revision === null) {
    const ifMatch = request.headers.get('If-Match');
    if (ifMatch) {
      const parsed = Number(ifMatch.replace(/["']/g, '').trim());
      if (Number.isInteger(parsed) && parsed >= 1) {
        revision = parsed;
      } else {
        return json({ error: 'BAD_REQUEST', message: 'Invalid If-Match header revision' }, 400, cors);
      }
    }
  }

  try {
    let deleteSql;
    let params;

    if (revision !== null) {
      deleteSql = 'DELETE FROM cloud_saves WHERE clerk_user_id = ? AND id = ? AND revision = ?';
      params = [userId, saveId, revision];
    } else {
      deleteSql = 'DELETE FROM cloud_saves WHERE clerk_user_id = ? AND id = ?';
      params = [userId, saveId];
    }

    const result = await env.DB.prepare(deleteSql).bind(...params).run();
    const changes = result?.meta?.changes ?? result?.meta?.rows_written ?? result?.changes ?? 0;

    if (changes === 0) {
      const existing = await env.DB.prepare('SELECT revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?').bind(userId, saveId).first();
      if (!existing) {
        return json({ error: 'NOT_FOUND', message: 'Save not found' }, 404, cors);
      }
      return json({
        error: 'REVISION_CONFLICT',
        message: 'Save has been modified by another session.',
        currentRevision: existing.revision,
        current_revision: existing.revision,
      }, 409, cors);
    }

    return json({ success: true, id: saveId }, 200, cors);
  } catch (err) {
    return json({ error: 'DATABASE_ERROR', message: 'Could not delete save: ' + (err?.message || 'unknown error') }, 500, cors);
  }
}

/**
 * Fast synchronous SHA-256 calculation for Uint8Array payloads.
 */
function computeSha256Sync(uint8Array) {
  try {
    return crypto.createHash('sha256').update(uint8Array).digest('hex');
  } catch {
    return '00'.repeat(32);
  }
}
