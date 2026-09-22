const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MIGRATION_0001_PATH = path.join(__dirname, '../cloudflare/migrations/0001_saved_characters.sql');
const MIGRATION_0002_PATH = path.join(__dirname, '../cloudflare/migrations/0002_cloud_save_vault.sql');

/* ------------------------------------------------------------------ */
/* Test Setup & Cryptographic Fixtures                                */
/* ------------------------------------------------------------------ */

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const CLERK_JWT_KEY = publicKey.export({ type: 'spki', format: 'pem' });
const APP_ORIGIN = 'http://localhost:8765';
const CLERK_PUBLISHABLE_KEY = 'pk_test_' + Buffer.from('example.clerk.accounts.dev$').toString('base64');
const CLERK_SECRET_KEY = 'sk_test_mock_secret_key';

function createSessionToken(userId = 'user_adventurer_1', overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: userId,
    sid: 'sess_' + userId,
    iss: 'https://example.clerk.accounts.dev',
    azp: APP_ORIGIN,
    iat: now,
    nbf: now - 1,
    exp: now + 3600,
    ...overrides
  };

  const header = { alg: 'RS256', typ: 'JWT', kid: 'test_key' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url');
  return `${data}.${signature}`;
}

/**
 * Creates an in-memory D1 test database emulating Cloudflare D1
 * with multi-table storage, fast query views, revision tracking, and trigger quotas.
 */
function createMockD1Database() {
  const cloudSaves = new Map(); // id -> row
  const userTiers = new Map();  // clerk_user_id -> row

  return {
    _cloudSaves: cloudSaves,
    _userTiers: userTiers,

    prepare(sql) {
      const normalizedSql = sql.replace(/\s+/g, ' ').trim();

      return {
        bind(...values) {
          return {
            async run() {
              // 1. INSERT INTO cloud_saves
              if (normalizedSql.includes('INSERT INTO cloud_saves')) {
                const [
                  id, clerk_user_id, save_type, name, format_version,
                  level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
                  quest_count, topic_count, item_count, spell_count, faction_count,
                  packed_payload, packed_size, unpacked_size, encoding, payload_hash,
                  created_at, updated_at
                ] = values;

                // Quota trigger enforcement (trg_limit_user_cloud_saves)
                const userTier = userTiers.get(clerk_user_id);
                const maxSaves = userTier ? userTier.max_saves : 5;
                const userSaveCount = Array.from(cloudSaves.values()).filter(r => r.clerk_user_id === clerk_user_id).length;

                if (userSaveCount >= maxSaves) {
                  throw new Error(`QUOTA_EXCEEDED: Maximum save slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing save to continue.`);
                }

                const row = {
                  id, clerk_user_id, version: 1, save_type, name, format_version,
                  level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
                  quest_count, topic_count, item_count, spell_count, faction_count,
                  packed_payload, packed_size, unpacked_size, encoding, payload_hash,
                  revision: 1, created_at, updated_at
                };
                cloudSaves.set(id, row);
                return { success: true, meta: { changes: 1 } };
              }

              // 2. Standalone rename UPDATE
              if (normalizedSql.includes('SET name = ?, updated_at = ?, revision = revision + 1')) {
                const [name, updated_at, clerk_user_id, id, revision] = values;
                const existing = cloudSaves.get(id);
                if (existing && existing.clerk_user_id === clerk_user_id && existing.revision === revision) {
                  existing.name = name;
                  existing.updated_at = updated_at;
                  existing.revision += 1;
                  return { success: true, meta: { changes: 1 } };
                }
                return { success: true, meta: { changes: 0 } };
              }

              // 3. UPDATE cloud_saves (optimistic locking: WHERE clerk_user_id = ? AND id = ? AND revision = ?)
              if (normalizedSql.includes('UPDATE cloud_saves')) {
                const [
                  save_type, name, format_version,
                  level, race, class_name, class_custom, birthsign, cell,
                  gold, time_played_seconds, quest_count, topic_count, item_count,
                  spell_count, faction_count,
                  packed_payload, packed_size, unpacked_size, encoding, payload_hash,
                  updated_at, clerk_user_id, id, revision
                ] = values;

                const existing = cloudSaves.get(id);
                if (existing && existing.clerk_user_id === clerk_user_id && existing.revision === revision) {
                  existing.save_type = save_type;
                  existing.name = name;
                  existing.format_version = format_version;
                  existing.level = level;
                  existing.race = race;
                  existing.class_name = class_name;
                  existing.class_custom = class_custom;
                  existing.birthsign = birthsign;
                  existing.cell = cell;
                  existing.gold = gold;
                  existing.time_played_seconds = time_played_seconds;
                  existing.quest_count = quest_count;
                  existing.topic_count = topic_count;
                  existing.item_count = item_count;
                  existing.spell_count = spell_count;
                  existing.faction_count = faction_count;
                  existing.packed_payload = packed_payload;
                  existing.packed_size = packed_size;
                  existing.unpacked_size = unpacked_size;
                  existing.encoding = encoding;
                  existing.payload_hash = payload_hash;
                  existing.updated_at = updated_at;
                  existing.revision += 1;
                  return { success: true, meta: { changes: 1 } };
                }
                return { success: true, meta: { changes: 0 } };
              }

              // 4. DELETE FROM cloud_saves
              if (normalizedSql.includes('DELETE FROM cloud_saves')) {
                if (normalizedSql.includes('revision = ?')) {
                  const [clerk_user_id, id, revision] = values;
                  const existing = cloudSaves.get(id);
                  if (existing && existing.clerk_user_id === clerk_user_id && existing.revision === revision) {
                    cloudSaves.delete(id);
                    return { success: true, meta: { changes: 1 } };
                  }
                  return { success: true, meta: { changes: 0 } };
                } else {
                  const [clerk_user_id, id] = values;
                  const existing = cloudSaves.get(id);
                  if (existing && existing.clerk_user_id === clerk_user_id) {
                    cloudSaves.delete(id);
                    return { success: true, meta: { changes: 1 } };
                  }
                  return { success: true, meta: { changes: 0 } };
                }
              }

              return { success: true, meta: { changes: 0 } };
            },

            async first() {
              // Point lookup by ID & clerk_user_id
              if (normalizedSql.includes('FROM cloud_saves WHERE clerk_user_id = ? AND id = ?')) {
                const [userId, id] = values;
                const row = cloudSaves.get(id);
                if (row && row.clerk_user_id === userId) {
                  return { ...row };
                }
                return null;
              }

              // SELECT id, save_type, revision FROM cloud_saves
              if (normalizedSql.includes('SELECT id, save_type, revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?')) {
                const [userId, id] = values;
                const row = cloudSaves.get(id);
                if (row && row.clerk_user_id === userId) {
                  return { id: row.id, save_type: row.save_type, revision: row.revision };
                }
                return null;
              }

              // SELECT revision FROM cloud_saves
              if (normalizedSql.includes('SELECT revision FROM cloud_saves WHERE clerk_user_id = ? AND id = ?')) {
                const [userId, id] = values;
                const row = cloudSaves.get(id);
                if (row && row.clerk_user_id === userId) {
                  return { revision: row.revision };
                }
                return null;
              }

              // Count total from v_cloud_save_headers
              if (normalizedSql.includes('SELECT count(*) AS total FROM v_cloud_save_headers')) {
                const [userId, filterType] = values;
                let rows = Array.from(cloudSaves.values()).filter(r => r.clerk_user_id === userId);
                if (filterType) rows = rows.filter(r => r.save_type === filterType);
                return { total: rows.length };
              }

              // Entitlements from v_user_entitlements
              if (normalizedSql.includes('FROM v_user_entitlements WHERE clerk_user_id = ?')) {
                const [userId] = values;
                const tier = userTiers.get(userId);
                if (!tier) return null;
                const savesCount = Array.from(cloudSaves.values()).filter(r => r.clerk_user_id === userId).length;
                return {
                  clerk_user_id: userId,
                  tier: tier.tier,
                  max_saves: tier.max_saves,
                  max_loadouts: tier.max_loadouts,
                  max_challenges: tier.max_challenges,
                  current_saves: savesCount,
                  current_loadouts: 0,
                  current_challenges: 0,
                };
              }

              // Fallback count query for free users without user_tiers row
              if (normalizedSql.includes('count(*) FROM cloud_saves WHERE clerk_user_id = ?')) {
                const [userId] = values;
                const savesCount = Array.from(cloudSaves.values()).filter(r => r.clerk_user_id === userId).length;
                return {
                  current_saves: savesCount,
                  current_loadouts: 0,
                  current_challenges: 0,
                };
              }

              return null;
            },

            async all() {
              // Listing from v_cloud_save_headers
              if (normalizedSql.includes('FROM v_cloud_save_headers WHERE clerk_user_id = ?')) {
                const userId = values[0];
                let filterType = null;
                let limit = 50;
                let offset = 0;

                if (normalizedSql.includes('save_type = ?')) {
                  filterType = values[1];
                  limit = values[2] ?? 50;
                  offset = values[3] ?? 0;
                } else {
                  limit = values[1] ?? 50;
                  offset = values[2] ?? 0;
                }

                let rows = Array.from(cloudSaves.values()).filter(r => r.clerk_user_id === userId);
                if (filterType) rows = rows.filter(r => r.save_type === filterType);

                // Sort ORDER BY updated_at DESC, id
                rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id));
                const paged = rows.slice(offset, offset + limit);
                return { results: paged.map(r => ({ ...r })) };
              }

              return { results: [] };
            }
          };
        }
      };
    }
  };
}

function createTestEnv(dbOverrides = {}) {
  const db = createMockD1Database();
  return {
    DB: db,
    APP_ORIGIN,
    CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY,
    CLERK_JWT_KEY,
    ...dbOverrides
  };
}

const sampleOmwSave = {
  formatVersion: 40,
  contentFiles: ['Morrowind.esm', 'Tribunal.esm', 'Bloodmoon.esm'],
  identity: {
    name: 'Jiub the Victor',
    race: 'Dark Elf',
    gender: 'Male',
    class: { id: 'Custom', name: 'Cliff Racer Hunter', custom: true, specialization: 'Stealth', favoredAttributes: ['Agility', 'Speed'] },
    birthsign: 'The Steed',
    level: 25,
    cell: 'Balmora, Guild of Fighters'
  },
  vitals: {
    health: { current: 200, max: 200 },
    magicka: { current: 150, max: 150 },
    fatigue: { current: 300, max: 300 },
    gold: 45000,
    reputation: 30,
    bounty: 0,
    timePlayedSeconds: 72000.0
  },
  build: {
    skillKindSource: 'save-class-record',
    skills: [
      { id: 'LongBlade', index: 5, base: 75, modifier: 10, damage: 0, value: 85, progress: 0.5, kind: 'Major' },
      { id: 'HeavyArmor', index: 3, base: 60, modifier: 0, damage: 0, value: 60, progress: 0.2, kind: 'Major' }
    ],
    attributes: [
      { id: 'Strength', index: 0, base: 85, modifier: 10, damage: 0, value: 95 }
    ]
  },
  progress: {
    quests: [{ id: 'fgt_caius', stage: 10, finished: false, status: 'active' }],
    otherJournalIds: ['topic_cliff_racers', 'topic_balmora'],
    factions: [{ id: 'fighters_guild', rank: 4, reputation: 25, expelled: false }]
  },
  stuff: {
    inventory: [
      { id: 'silver_longsword', count: 1, soul: null, equipped: true, slot: 'CarriedRight' },
      { id: 'gold_001', count: 45000, soul: null, equipped: false, slot: null }
    ],
    spells: ['hearth_heal']
  },
  warnings: []
};

/* ==================================================================== */
/* 1. Worker Authentication & Routing Security Tests                    */
/* ==================================================================== */

test('Worker API Auth: Rejects unauthenticated, expired, or invalid tokens with 401', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();

  // 1. Missing Authorization header
  const req1 = new Request(`${APP_ORIGIN}/api/saves`, { method: 'GET' });
  const res1 = await worker.fetch(req1, env);
  assert.equal(res1.status, 401);
  const json1 = await res1.json();
  assert.equal(json1.error, 'UNAUTHORIZED');

  // 2. Malformed Authorization header (non-Bearer)
  const req2 = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: 'Basic dXNlcjpwYXNz' }
  });
  const res2 = await worker.fetch(req2, env);
  assert.equal(res2.status, 401);

  // 3. Expired token
  const expiredToken = createSessionToken('user_test', { exp: Math.floor(Date.now() / 1000) - 100 });
  const req3 = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  const res3 = await worker.fetch(req3, env);
  assert.equal(res3.status, 401);

  // 4. Token signed by untrusted party / wrong azp
  const attackerToken = createSessionToken('user_test', { azp: 'https://evil-attacker.example' });
  const req4 = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${attackerToken}` }
  });
  const res4 = await worker.fetch(req4, env);
  assert.equal(res4.status, 401);
});

test('Worker API Security: Enforces Origin check and CORS preflight', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const token = createSessionToken();

  // 1. OPTIONS preflight returns 204 with CORS headers
  const optReq = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'OPTIONS',
    headers: { Origin: APP_ORIGIN }
  });
  const optRes = await worker.fetch(optReq, env);
  assert.equal(optRes.status, 204);
  assert.equal(optRes.headers.get('Access-Control-Allow-Origin'), APP_ORIGIN);
  assert.match(optRes.headers.get('Access-Control-Allow-Methods'), /GET/);
  assert.match(optRes.headers.get('Access-Control-Allow-Methods'), /POST/);
  assert.match(optRes.headers.get('Access-Control-Allow-Methods'), /PUT/);
  assert.match(optRes.headers.get('Access-Control-Allow-Methods'), /DELETE/);

  // 2. Forbidden origin rejected with 403
  const badOriginReq = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: 'https://malicious-site.example'
    }
  });
  const badOriginRes = await worker.fetch(badOriginReq, env);
  assert.equal(badOriginRes.status, 403);
  const jsonBad = await badOriginRes.json();
  assert.equal(jsonBad.error, 'FORBIDDEN_ORIGIN');
});

test('Worker API: 503 when D1 or Clerk service is not configured', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const token = createSessionToken();

  // Missing DB binding
  const envNoDb = { ...createTestEnv(), DB: null };
  const req = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const resNoDb = await worker.fetch(req, envNoDb);
  assert.equal(resNoDb.status, 503);

  // Missing Clerk keys
  const envNoClerk = { ...createTestEnv(), CLERK_SECRET_KEY: null, CLERK_JWT_KEY: null };
  const resNoClerk = await worker.fetch(req, envNoClerk);
  assert.equal(resNoClerk.status, 503);
});

test('Worker API: 404 on unknown endpoint and 405 on unsupported method', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const token = createSessionToken();

  // Unknown route -> 404
  const req404 = new Request(`${APP_ORIGIN}/api/unknown-endpoint`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const res404 = await worker.fetch(req404, env);
  assert.equal(res404.status, 404);

  // Method not allowed -> 405 on /api/saves (PATCH)
  const req405 = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  const res405 = await worker.fetch(req405, env);
  assert.equal(res405.status, 405);
});

/* ==================================================================== */
/* 2. Full Save Lifecycle: POST, GET, PUT, DELETE, Entitlements         */
/* ==================================================================== */

test('Worker API: Complete Save Lifecycle with SLT1 packing, unpacking, optimistic locking, and deletion', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const userId = 'user_adventurer_lifecycle';
  const token = createSessionToken(userId);

  // 1. Initial GET /api/saves returns 0 saves
  const listReq1 = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const listRes1 = await worker.fetch(listReq1, env);
  assert.equal(listRes1.status, 200);
  const listData1 = await listRes1.json();
  assert.deepEqual(listData1.saves, []);
  assert.equal(listData1.total, 0);

  // 2. Initial GET /api/entitlements reports 5 free slots, 0 used, 5 remaining
  const entReq1 = new Request(`${APP_ORIGIN}/api/entitlements`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const entRes1 = await worker.fetch(entReq1, env);
  assert.equal(entRes1.status, 200);
  const entData1 = await entRes1.json();
  assert.equal(entData1.tier, 'free');
  assert.equal(entData1.maxSaves, 5);
  assert.equal(entData1.currentSaves, 0);
  assert.equal(entData1.remainingSaves, 5);

  // 3. POST /api/saves: Pack and save sample character
  const createReq = new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      saveType: 'openmw_save',
      data: sampleOmwSave,
      name: 'Jiub the Eradicator'
    })
  });
  const createRes = await worker.fetch(createReq, env);
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.ok(created.id);
  assert.equal(created.name, 'Jiub the Eradicator');
  assert.equal(created.saveType, 'openmw_save');
  assert.equal(created.revision, 1);
  assert.ok(created.packedSize > 0 && created.packedSize < 500);

  const saveId = created.id;

  // 4. GET /api/saves now returns 1 save header
  const listRes2 = await worker.fetch(listReq1, env);
  const listData2 = await listRes2.json();
  assert.equal(listData2.saves.length, 1);
  assert.equal(listData2.total, 1);
  assert.equal(listData2.saves[0].id, saveId);
  assert.equal(listData2.saves[0].name, 'Jiub the Eradicator');
  assert.equal(listData2.saves[0].level, 25);
  assert.equal(listData2.saves[0].gold, 45000);
  assert.equal(listData2.saves[0].questCount, 1);
  assert.equal(listData2.saves[0].itemCount, 2);

  // 5. GET /api/saves/:id returns full unpacked save data matching original
  const getReq = new Request(`${APP_ORIGIN}/api/saves/${saveId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const getRes = await worker.fetch(getReq, env);
  assert.equal(getRes.status, 200);
  const fetched = await getRes.json();
  assert.equal(fetched.id, saveId);
  assert.equal(fetched.name, 'Jiub the Eradicator');
  assert.equal(fetched.revision, 1);
  assert.deepEqual(fetched.data, sampleOmwSave);

  // 6. PUT /api/saves/:id: Optimistic concurrency conflict on stale revision
  const staleUpdateReq = new Request(`${APP_ORIGIN}/api/saves/${saveId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      saveType: 'openmw_save',
      data: { ...sampleOmwSave, identity: { ...sampleOmwSave.identity, name: 'Stale Jiub' } },
      name: 'Stale Jiub',
      revision: 99 // Wrong revision
    })
  });
  const staleRes = await worker.fetch(staleUpdateReq, env);
  assert.equal(staleRes.status, 409);
  const conflictData = await staleRes.json();
  assert.equal(conflictData.error, 'REVISION_CONFLICT');
  assert.equal(conflictData.currentRevision, 1);

  // 7. PUT /api/saves/:id: Successful update with matching revision (1 -> 2)
  const validUpdateReq = new Request(`${APP_ORIGIN}/api/saves/${saveId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      saveType: 'openmw_save',
      data: { ...sampleOmwSave, identity: { ...sampleOmwSave.identity, name: 'Saint Jiub', level: 30 } },
      name: 'Saint Jiub',
      revision: 1
    })
  });
  const updateRes = await worker.fetch(validUpdateReq, env);
  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.id, saveId);
  assert.equal(updated.revision, 2);
  assert.equal(updated.name, 'Saint Jiub');

  // Verify updated data on GET
  const getRes2 = await worker.fetch(getReq, env);
  const fetched2 = await getRes2.json();
  assert.equal(fetched2.name, 'Saint Jiub');
  assert.equal(fetched2.revision, 2);
  assert.equal(fetched2.data.identity.name, 'Saint Jiub');

  // 8. DELETE /api/saves/:id with stale revision fails with 409
  const badDelReq = new Request(`${APP_ORIGIN}/api/saves/${saveId}?revision=1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const badDelRes = await worker.fetch(badDelReq, env);
  assert.equal(badDelRes.status, 409);

  // 9. DELETE /api/saves/:id with correct revision (2) succeeds
  const goodDelReq = new Request(`${APP_ORIGIN}/api/saves/${saveId}?revision=2`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const goodDelRes = await worker.fetch(goodDelReq, env);
  assert.equal(goodDelRes.status, 200);
  const delData = await goodDelRes.json();
  assert.equal(delData.success, true);
  assert.equal(delData.id, saveId);

  // 10. GET /api/saves/:id now returns 404
  const getRes3 = await worker.fetch(getReq, env);
  assert.equal(getRes3.status, 404);

  // 11. Entitlements back to 5 free slots remaining
  const entRes2 = await worker.fetch(entReq1, env);
  const entData2 = await entRes2.json();
  assert.equal(entData2.currentSaves, 0);
  assert.equal(entData2.remainingSaves, 5);
});

/* ==================================================================== */
/* 3. Tier Quotas & Multi-Tenant Isolation Tests                        */
/* ==================================================================== */

test('Worker API Quotas: Free users capped at 5 saves; 6th returns 409 QUOTA_EXCEEDED; Paid users capped at 25', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();

  const freeUser = 'user_free_quota_test';
  const freeToken = createSessionToken(freeUser);

  const paidUser = 'user_paid_quota_test';
  const paidToken = createSessionToken(paidUser);

  // Configure paid user in user_tiers table
  env.DB._userTiers.set(paidUser, {
    clerk_user_id: paidUser,
    tier: 'paid',
    max_saves: 25,
    max_loadouts: 25,
    max_challenges: 25
  });

  // 1. Free user inserts 5 saves successfully
  for (let i = 1; i <= 5; i++) {
    const res = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freeToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: `Free Hero ${i}` })
    }), env);
    assert.equal(res.status, 201, `Save ${i} must succeed`);
  }

  // 2. Free user attempts 6th save -> returns clean 409 JSON
  const excessRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${freeToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: 'Excess Hero' })
  }), env);

  assert.equal(excessRes.status, 409);
  const excessJson = await excessRes.json();
  assert.equal(excessJson.error, 'QUOTA_EXCEEDED');
  assert.match(excessJson.message, /Maximum save slots reached/);

  // 3. Paid user inserts 25 saves successfully
  for (let i = 1; i <= 25; i++) {
    const res = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${paidToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: `Paid Hero ${i}` })
    }), env);
    assert.equal(res.status, 201, `Paid Save ${i} must succeed`);
  }

  // 4. Paid user attempts 26th save -> returns clean 409 JSON
  const excessPaidRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${paidToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: 'Excess Paid Hero' })
  }), env);

  assert.equal(excessPaidRes.status, 409);
  const excessPaidJson = await excessPaidRes.json();
  assert.equal(excessPaidJson.error, 'QUOTA_EXCEEDED');

  // 5. Multi-tenant isolation: Free user cannot access or modify Paid user saves
  const paidSavesList = await (await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${paidToken}` }
  }), env)).json();
  assert.equal(paidSavesList.saves.length, 25);

  const targetSaveId = paidSavesList.saves[0].id;

  // Free user attempts GET on Paid user save -> 404
  const leakGet = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/${targetSaveId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${freeToken}` }
  }), env);
  assert.equal(leakGet.status, 404);

  // Free user attempts PUT on Paid user save -> 404
  const leakPut = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/${targetSaveId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${freeToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: 'Hijacked', revision: 1 })
  }), env);
  assert.equal(leakPut.status, 404);

  // Free user attempts DELETE on Paid user save -> 404
  const leakDel = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/${targetSaveId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${freeToken}` }
  }), env);
  assert.equal(leakDel.status, 404);
});

/* ==================================================================== */
/* 4. Client SDK Service Tests (lib/cloud-save-service.mjs)             */
/* ==================================================================== */

test('Client SDK Service: createCloudSaveClient methods, typed errors, and Worker interaction', async () => {
  const {
    createCloudSaveClient,
    QuotaExceededError,
    RevisionConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
  } = await import('../lib/cloud-save-service.mjs');

  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const userId = 'user_sdk_tester';
  const token = createSessionToken(userId);

  // Custom fetch function routing directly to the worker
  const clientFetch = async (url, options) => {
    return worker.fetch(new Request(url, options), env);
  };

  const client = createCloudSaveClient({
    baseUrl: 'https://siltstrider.tools',
    getToken: async () => token,
    fetchFn: clientFetch
  });

  // 1. Initial listSaves returns empty
  const initial = await client.listSaves();
  assert.deepEqual(initial.saves, []);
  assert.equal(initial.total, 0);

  // 2. createSave saves and returns metadata
  const created = await client.createSave({
    saveType: 'openmw_save',
    data: sampleOmwSave,
    name: 'SDK Adventurer'
  });
  assert.ok(created.id);
  assert.equal(created.name, 'SDK Adventurer');
  assert.equal(created.revision, 1);

  // 3. getSave retrieves full data
  const retrieved = await client.getSave(created.id);
  assert.equal(retrieved.name, 'SDK Adventurer');
  assert.deepEqual(retrieved.data, sampleOmwSave);

  // 4. updateSave increments revision
  const updated = await client.updateSave(created.id, {
    saveType: 'openmw_save',
    data: { ...sampleOmwSave, vitals: { ...sampleOmwSave.vitals, gold: 99999 } },
    name: 'Rich Adventurer',
    revision: 1
  });
  assert.equal(updated.revision, 2);
  assert.equal(updated.name, 'Rich Adventurer');

  // 5. updateSave with stale revision throws RevisionConflictError
  await assert.rejects(
    client.updateSave(created.id, {
      saveType: 'openmw_save',
      data: sampleOmwSave,
      name: 'Conflict Adventurer',
      revision: 1 // stale revision
    }),
    RevisionConflictError
  );

  // 6. getEntitlements reports 1 save used, 4 remaining
  const ent = await client.getEntitlements();
  assert.equal(ent.tier, 'free');
  assert.equal(ent.currentSaves, 1);
  assert.equal(ent.remainingSaves, 4);

  // 7. deleteSave deletes record
  const del = await client.deleteSave(created.id, { revision: 2 });
  assert.equal(del.success, true);

  // 8. getSave on deleted throws NotFoundError
  await assert.rejects(
    client.getSave(created.id),
    NotFoundError
  );

  // 9. Unauthorized client throws UnauthorizedError
  const unauthClient = createCloudSaveClient({
    baseUrl: 'https://siltstrider.tools',
    getToken: async () => 'invalid_jwt_token',
    fetchFn: clientFetch
  });
  await assert.rejects(
    unauthClient.listSaves(),
    UnauthorizedError
  );

  // 10. Client validation check (missing revision) throws ValidationError
  await assert.rejects(
    client.updateSave('some_id', { data: sampleOmwSave }),
    ValidationError
  );
});

/* ==================================================================== */
/* 5. Adversarial Edge Cases & Live SQLite Engine Verification          */
/* ==================================================================== */

test('Adversarial & Live SQLite: Real engine verification of SQL constraints, triggers, and views', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_1 = 'u_adv_1'
user_2 = 'u_adv_2'

# 1. Test CHECK constraint: Whitespace-only name rejected
try:
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_ws', ?, '   ', X'534C5431', 4, 10, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  """, (user_1,))
  assert False, "Should have rejected whitespace name"
except sqlite3.IntegrityError:
  pass

# 2. Test CHECK constraint: Name longer than 120 characters rejected
long_name = 'X' * 121
try:
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_long', ?, ?, X'534C5431', 4, 10, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  """, (user_1, long_name))
  assert False, "Should have rejected 121 character name"
except sqlite3.IntegrityError:
  pass

# 3. Test CHECK constraint: Negative level rejected
try:
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, level, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_neg_lvl', ?, 'Hero', 0, X'534C5431', 4, 10, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  """, (user_1,))
  assert False, "Should have rejected level < 1"
except sqlite3.IntegrityError:
  pass

# 4. Insert valid saves up to Free limit (5)
for i in range(5):
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, level, gold, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES (?, ?, ?, 10, 100, X'534C5431', 4, 10, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026-09-19', '2026-09-19')
  """, (f"cs_{user_1}_{i}", user_1, f"Save {i}"))

# 5. Verify trigger blocks 6th insert for Free user
try:
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_excess', ?, 'Excess', X'534C5431', 4, 10, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  """, (user_1,))
  assert False, "Should have aborted on 6th save"
except sqlite3.IntegrityError as e:
  assert "QUOTA_EXCEEDED" in str(e), f"Expected QUOTA_EXCEEDED in error, got: {e}"

# 6. Verify optimistic locking in SQLite: UPDATE with correct revision succeeds
cur = con.execute("""
  UPDATE cloud_saves
  SET name = 'Hero Rev 2', revision = revision + 1, updated_at = '2026-09-20'
  WHERE clerk_user_id = ? AND id = ? AND revision = 1
""", (user_1, f"cs_{user_1}_0"))
assert cur.rowcount == 1

# Verify revision updated to 2
row = con.execute("SELECT revision, name FROM cloud_saves WHERE id = ?", (f"cs_{user_1}_0",)).fetchone()
assert row == (2, 'Hero Rev 2')

# Attempt second UPDATE with stale revision 1 -> affects 0 rows
cur_stale = con.execute("""
  UPDATE cloud_saves
  SET name = 'Stale Edit', revision = revision + 1
  WHERE clerk_user_id = ? AND id = ? AND revision = 1
""", (user_1, f"cs_{user_1}_0"))
assert cur_stale.rowcount == 0

# 7. Fast-query header view integrity
header_rows = con.execute("SELECT name, level, gold, packed_size FROM v_cloud_save_headers WHERE clerk_user_id = ? ORDER BY id", (user_1,)).fetchall()
assert len(header_rows) == 5
assert header_rows[0] == ('Hero Rev 2', 10, 100, 4)

print("OK_ADVERSARIAL_D1")
`;

  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_ADVERSARIAL_D1/);
});

test('Adversarial API: Malformed record tags, invalid save types, and null/undefined properties', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const token = createSessionToken('user_adversarial_tester');

  // 1. Invalid save_type tag rejected with 400
  const badTypeRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'malformed_save_record_tag', data: sampleOmwSave })
  }), env);
  assert.equal(badTypeRes.status, 400);
  const badTypeJson = await badTypeRes.json();
  assert.equal(badTypeJson.error, 'BAD_REQUEST');

  // 2. Missing data property rejected with 400
  const noDataRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'openmw_save' })
  }), env);
  assert.equal(noDataRes.status, 400);

  // 3. Malformed data payload (non-object, string instead of object) rejected with 400
  const strDataRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveType: 'openmw_save', data: 'not_an_object' })
  }), env);
  assert.equal(strDataRes.status, 400);

  // 4. Corrupted skills collection (null skills in OpenMW save) rejected with 400
  const badSkillsRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      saveType: 'openmw_save',
      data: { ...sampleOmwSave, build: { ...sampleOmwSave.build, skills: null } }
    })
  }), env);
  assert.equal(badSkillsRes.status, 400);
  const badSkillsJson = await badSkillsRes.json();
  assert.equal(badSkillsJson.error, 'VALIDATION_FAILED');

  // 5. Malformed JSON syntax in body rejected with 400
  const malformedJsonRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{"unclosed_json: true'
  }), env);
  assert.equal(malformedJsonRes.status, 400);
  assert.equal((await malformedJsonRes.json()).error, 'BAD_REQUEST');
});

test('Adversarial API: Boundary values, pagination clamping, and optimistic revision validation', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const token = createSessionToken('user_boundary_tester');

  // 1. Pagination clamping: negative limit and offset cleanly clamped
  const negListRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves?limit=-10&offset=-5`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }), env);
  assert.equal(negListRes.status, 200);
  const negListData = await negListRes.json();
  assert.equal(negListData.limit, 50); // Clamped to default 50
  assert.equal(negListData.offset, 0);  // Clamped to 0

  // 2. Pagination clamping: excessive limit clamped to 100
  const hugeListRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves?limit=5000`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }), env);
  assert.equal(hugeListRes.status, 200);
  const hugeListData = await hugeListRes.json();
  assert.equal(hugeListData.limit, 100);

  // 3. PUT with missing or non-integer revision rejected with 400
  for (const badRev of [undefined, null, 'abc', -1, 0, 1.5]) {
    const putRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/cs_test`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, revision: badRev })
    }), env);
    assert.equal(putRes.status, 400, `Expected 400 for bad revision ${badRev}`);
    const putJson = await putRes.json();
    assert.equal(putJson.error, 'BAD_REQUEST');
  }
});

test('Adversarial D1: SQLite indices presence and query planner verification', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

# 1. Verify all required composite indexes exist
indices = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='index'").fetchall()]

required_indices = [
  'idx_cloud_saves_owner_updated',
  'idx_cloud_saves_owner_type',
  'idx_cloud_saves_owner_hash',
  'idx_saved_challenges_owner_updated',
  'idx_saved_challenges_owner_world',
  'idx_saved_loadouts_owner_updated',
  'idx_saved_loadouts_owner_world',
]

for idx in required_indices:
  assert idx in indices, f"Missing critical SQLite index: {idx}"

# 2. Verify query planner uses idx_cloud_saves_owner_updated for dashboard listing
plan = con.execute("EXPLAIN QUERY PLAN SELECT * FROM cloud_saves WHERE clerk_user_id = ? ORDER BY updated_at DESC, id LIMIT 20", ('u1',)).fetchall()
plan_str = " ".join([str(p) for p in plan])
assert 'idx_cloud_saves_owner_updated' in plan_str or 'USING INDEX' in plan_str, f"Query plan not using index: {plan_str}"

print("OK_INDICES")
`;

  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_INDICES/);
});

/* ==================================================================== */
/* 6. Extended Integration & Edge Case Verifications                   */
/* ==================================================================== */

test('API & SDK: Standalone Rename, Type Preservation, and If-Match Concurrency', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const { createCloudSaveClient } = await import('../lib/cloud-save-service.mjs');
  const env = createTestEnv();
  const userId = 'user_rename_preserve_test';
  const token = createSessionToken(userId);

  const client = createCloudSaveClient({
    baseUrl: APP_ORIGIN,
    getToken: async () => token,
    fetchFn: async (url, options) => worker.fetch(new Request(url, options), env)
  });

  const challengeData = {
    version: 1,
    character: { race: 'Nord', className: 'Barbarian', sign: 'The Lady' },
    restrictions: ['No Magic'],
    minors: ['Reach level 20']
  };

  // 1. Create a challenge run save
  const created = await client.createSave({
    saveType: 'challenge_run',
    data: challengeData,
    name: 'Nord Barbarian Ironman'
  });
  assert.ok(created.id);
  assert.equal(created.saveType, 'challenge_run');
  assert.equal(created.revision, 1);

  // 2. Update without passing saveType: must preserve challenge_run type and not fail OpenMW validation
  const updatedData = { ...challengeData, minors: ['Reach level 20', 'Clear Kogoruhn'] };
  const updated = await client.updateSave(created.id, {
    data: updatedData,
    name: 'Nord Barbarian Ironman v2',
    revision: 1
  });
  assert.equal(updated.revision, 2);
  assert.equal(updated.saveType, 'challenge_run');

  // Verify on getSave
  const fetched = await client.getSave(created.id);
  assert.equal(fetched.saveType, 'challenge_run');
  assert.equal(fetched.name, 'Nord Barbarian Ironman v2');
  assert.deepEqual(fetched.data.minors, ['Reach level 20', 'Clear Kogoruhn']);

  // 3. Standalone rename without data payload
  const renamed = await client.renameSave(created.id, 'Nord Barbarian Ascended', 2);
  assert.equal(renamed.revision, 3);
  assert.equal(renamed.name, 'Nord Barbarian Ascended');

  // 4. PUT with standard HTTP If-Match header (without body.revision)
  const ifMatchPutReq = new Request(`${APP_ORIGIN}/api/saves/${created.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'If-Match': '"3"'
    },
    body: JSON.stringify({ name: 'Nord Barbarian Legend' })
  });
  const ifMatchRes = await worker.fetch(ifMatchPutReq, env);
  assert.equal(ifMatchRes.status, 200);
  const ifMatchData = await ifMatchRes.json();
  assert.equal(ifMatchData.revision, 4);
  assert.equal(ifMatchData.name, 'Nord Barbarian Legend');

  // 5. DELETE with invalid revision returns 400 (does NOT silently delete)
  for (const badRev of ['-1', 'abc', '0']) {
    const badDelRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/${created.id}?revision=${badRev}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }), env);
    assert.equal(badDelRes.status, 400, `Expected 400 for bad revision ${badRev}`);
    const badDelJson = await badDelRes.json();
    assert.equal(badDelJson.error, 'BAD_REQUEST');
  }

  // 6. DELETE with valid If-Match header succeeds
  const ifMatchDelReq = new Request(`${APP_ORIGIN}/api/saves/${created.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'If-Match': '"4"'
    }
  });
  const ifMatchDelRes = await worker.fetch(ifMatchDelReq, env);
  assert.equal(ifMatchDelRes.status, 200);
  const delData = await ifMatchDelRes.json();
  assert.equal(delData.success, true);
});

test('API: Strict Name Validation and PackedPayload Upload with Raw/Deflate Encodings', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const { packCloudSave, unpackCloudSave } = await import('../lib/cloud-save-codec.mjs');
  const env = createTestEnv();
  const token = createSessionToken('user_strict_name_test');

  // 1. Empty, whitespace-only, and oversized names on POST fail with 400
  for (const badName of ['', '   ', 'X'.repeat(121)]) {
    const postRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveType: 'openmw_save', data: sampleOmwSave, name: badName })
    }), env);
    assert.equal(postRes.status, 400, `Expected 400 for bad name: ${JSON.stringify(badName)}`);
    const json = await postRes.json();
    assert.equal(json.error, 'BAD_REQUEST');
  }

  // 2. Upload raw uncompressed SLT1 payload directly
  const characterBuild = {
    version: 1,
    world: 'vanilla',
    className: 'Warlock',
    race: 'Breton',
    sign: 'The Mage',
    maj: ['Destruction', 'Mysticism'],
    min: ['Alteration', 'Alchemy']
  };
  const packResultRaw = packCloudSave('character_build', characterBuild, { compress: false });
  assert.equal(packResultRaw.encoding, 'slt1_raw');

  const rawPostRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packedPayload: Array.from(packResultRaw.packed),
      name: 'Breton Warlock Raw'
    })
  }), env);
  assert.equal(rawPostRes.status, 201);
  const rawPostJson = await rawPostRes.json();
  assert.equal(rawPostJson.encoding, 'slt1_raw');
  assert.equal(rawPostJson.saveType, 'character_build');

  // 3. Upload deflated SLT1 payload directly
  const packResultDeflate = packCloudSave('character_build', characterBuild, { compress: true });
  assert.equal(packResultDeflate.encoding, 'slt1_deflate');

  const defPostRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packedPayload: Array.from(packResultDeflate.packed),
      name: 'Breton Warlock Deflated'
    })
  }), env);
  assert.equal(defPostRes.status, 201);
  const defPostJson = await defPostRes.json();
  assert.equal(defPostJson.encoding, 'slt1_deflate');
  assert.equal(defPostJson.saveType, 'character_build');
});

test('API: Trailing Slash Normalization on API Endpoints', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const env = createTestEnv();
  const token = createSessionToken('user_trailing_slash_tester');

  // 1. GET /api/saves/ matches collection route
  const savesRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/saves/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }), env);
  assert.equal(savesRes.status, 200);

  // 2. GET /api/entitlements/ matches entitlements route
  const entRes = await worker.fetch(new Request(`${APP_ORIGIN}/api/entitlements/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }), env);
  assert.equal(entRes.status, 200);
});

test('Adversarial D1: SQLite Engine Execution of Standalone Rename and Type Updating', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_id = 'u_sql_live'
save_id = 'cs_sql_live_1'
payload = bytes([0x53, 0x4c, 0x54, 0x31, 1, 2, 0, 0, 0, 0, 0])

# 1. Insert character_build save
con.execute("""
  INSERT INTO cloud_saves (
    id, clerk_user_id, version, save_type, name, format_version,
    level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
    quest_count, topic_count, item_count, spell_count, faction_count,
    packed_payload, packed_size, unpacked_size, encoding, payload_hash,
    revision, created_at, updated_at
  ) VALUES (?, ?, 1, ?, ?, 1, 1, 'Breton', 'Mage', 0, 'The Mage', 'Vivec', 50, 100.0, 0, 0, 0, 0, 0, ?, ?, ?, 'slt1_raw', ?, 1, '2026-09-19', '2026-09-19')
""", (save_id, user_id, 'character_build', 'Initial Mage', payload, len(payload), len(payload), 'a'*64))
con.commit()

# 2. Standalone rename UPDATE
rename_cur = con.execute("""
  UPDATE cloud_saves
  SET name = ?, updated_at = '2026-09-20', revision = revision + 1
  WHERE clerk_user_id = ? AND id = ? AND revision = 1
""", ('Renamed Mage', user_id, save_id))
assert rename_cur.rowcount == 1

row = con.execute("SELECT name, revision, save_type FROM cloud_saves WHERE id = ?", (save_id,)).fetchone()
assert row == ('Renamed Mage', 2, 'character_build'), f"Unexpected row state: {row}"

# 3. Full update with SET save_type = ?
update_cur = con.execute("""
  UPDATE cloud_saves
  SET save_type = ?, name = ?, format_version = 1,
      level = 2, race = 'Breton', class_name = 'Sorcerer', class_custom = 0, birthsign = 'The Mage', cell = 'Balmora',
      gold = 500, time_played_seconds = 200.0, quest_count = 1, topic_count = 0, item_count = 2,
      spell_count = 3, faction_count = 1,
      packed_payload = ?, packed_size = ?, unpacked_size = ?, encoding = 'slt1_raw', payload_hash = ?,
      updated_at = '2026-09-21', revision = revision + 1
  WHERE clerk_user_id = ? AND id = ? AND revision = 2
""", ('custom_loadout', 'Renamed Sorcerer', payload, len(payload), len(payload), 'b'*64, user_id, save_id))
assert update_cur.rowcount == 1

row2 = con.execute("SELECT name, revision, save_type, class_name FROM cloud_saves WHERE id = ?", (save_id,)).fetchone()
assert row2 == ('Renamed Sorcerer', 3, 'custom_loadout', 'Sorcerer'), f"Unexpected row2: {row2}"

print("OK_LIVE_RENAME_TYPE")
`;

  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_LIVE_RENAME_TYPE/);
});

