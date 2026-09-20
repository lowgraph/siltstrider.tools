-- Silt Strider Cloudflare D1 Database Schema
-- Database Name: siltstrider-db
-- Database ID: 141a1409-3956-4267-a078-02483bbb2bf6
--
-- Architecture:
-- 1. Clerk owns user identity (clerk_user_id). No user mirror tables or foreign keys.
-- 2. Optimistic concurrency control via `revision` column (revision = revision + 1).
-- 3. High-density binary packing (SLT1 + Deflate) storing complete OpenMW saves under 1-3 KB.
-- 4. Extracted query metadata columns enable instantaneous listing/filtering without fetching BLOBs.

-- ====================================================================
-- Table: saved_characters (Migration 0001)
-- Legacy / v1 custom character builder sheets
-- ====================================================================
CREATE TABLE IF NOT EXISTS saved_characters (
  id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL CHECK (length(clerk_user_id) > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version = 1),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  character_json TEXT NOT NULL CHECK (
    json_valid(character_json)
    AND coalesce(json_type(character_json), '') = 'object'
    AND coalesce(json_extract(character_json, '$.version'), 0) = 1
    AND length(CAST(character_json AS BLOB)) <= 16384
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS saved_characters_owner_updated
  ON saved_characters (clerk_user_id, updated_at DESC, id);

-- ====================================================================
-- Table: cloud_saves (Migration 0002)
-- Master high-density cloud save vault for OpenMW saves & rich builds
-- ====================================================================
CREATE TABLE IF NOT EXISTS cloud_saves (
  id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL CHECK (length(clerk_user_id) > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version = 1),
  save_type TEXT NOT NULL DEFAULT 'openmw_save' CHECK (save_type IN ('openmw_save', 'character_build', 'challenge_run', 'custom_loadout')),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  format_version INTEGER NOT NULL DEFAULT 0 CHECK (format_version >= 0),

  -- Fast-query metadata columns (extracted from payload for instant listing & filtering without reading blob)
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  race TEXT,
  class_name TEXT,
  class_custom INTEGER NOT NULL DEFAULT 0 CHECK (class_custom IN (0, 1)),
  birthsign TEXT,
  cell TEXT,
  gold INTEGER NOT NULL DEFAULT 0 CHECK (gold >= 0),
  time_played_seconds REAL DEFAULT NULL CHECK (time_played_seconds IS NULL OR time_played_seconds >= 0),
  quest_count INTEGER NOT NULL DEFAULT 0 CHECK (quest_count >= 0),
  topic_count INTEGER NOT NULL DEFAULT 0 CHECK (topic_count >= 0),
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  spell_count INTEGER NOT NULL DEFAULT 0 CHECK (spell_count >= 0),
  faction_count INTEGER NOT NULL DEFAULT 0 CHECK (faction_count >= 0),

  -- The optimized packed payload (BLOB): compressed, binary-packed, delta-encoded (up to 1 MB)
  packed_payload BLOB NOT NULL CHECK (length(packed_payload) > 0 AND length(packed_payload) <= 1048576),
  packed_size INTEGER NOT NULL CHECK (packed_size = length(packed_payload)),
  unpacked_size INTEGER NOT NULL CHECK (unpacked_size >= 0),
  encoding TEXT NOT NULL DEFAULT 'slt1_deflate' CHECK (encoding IN ('slt1_raw', 'slt1_deflate', 'json_compact')),
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),

  -- Concurrency and audit timestamps
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_saves_owner_updated
  ON cloud_saves (clerk_user_id, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_cloud_saves_owner_type
  ON cloud_saves (clerk_user_id, save_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_saves_owner_hash
  ON cloud_saves (clerk_user_id, payload_hash);

-- ====================================================================
-- Table: saved_challenges (Migration 0002)
-- Saved challenge run configurations, rolled constraints, and objectives
-- ====================================================================
CREATE TABLE IF NOT EXISTS saved_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL CHECK (length(clerk_user_id) > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version = 1),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  world TEXT NOT NULL DEFAULT 'vanilla' CHECK (world IN ('vanilla', 'tr')),
  arce INTEGER NOT NULL DEFAULT 0 CHECK (arce IN (0, 1)),
  major_objective TEXT NOT NULL DEFAULT '',
  challenge_json TEXT NOT NULL CHECK (
    json_valid(challenge_json)
    AND coalesce(json_type(challenge_json), '') = 'object'
    AND coalesce(json_extract(challenge_json, '$.version'), 0) = 1
    AND length(CAST(challenge_json AS BLOB)) <= 65536
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_challenges_owner_updated
  ON saved_challenges (clerk_user_id, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_saved_challenges_owner_world
  ON saved_challenges (clerk_user_id, world, updated_at DESC);

-- ====================================================================
-- Table: saved_loadouts (Migration 0002)
-- Saved equipment sets, gear advisor picks, and weapon loadouts
-- ====================================================================
CREATE TABLE IF NOT EXISTS saved_loadouts (
  id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL CHECK (length(clerk_user_id) > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version = 1),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  world TEXT NOT NULL DEFAULT 'vanilla' CHECK (world IN ('vanilla', 'tr')),
  loadout_json TEXT NOT NULL CHECK (
    json_valid(loadout_json)
    AND coalesce(json_type(loadout_json), '') = 'object'
    AND coalesce(json_extract(loadout_json, '$.version'), 0) = 1
    AND length(CAST(loadout_json AS BLOB)) <= 65536
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_loadouts_owner_updated
  ON saved_loadouts (clerk_user_id, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_saved_loadouts_owner_world
  ON saved_loadouts (clerk_user_id, world, updated_at DESC);

-- 4. High-Performance Header View
-- Facilitates fast dashboard listing without loading the BLOB payload.
CREATE VIEW IF NOT EXISTS v_cloud_save_headers AS
SELECT
  id,
  clerk_user_id,
  version,
  save_type,
  name,
  format_version,
  level,
  race,
  class_name,
  class_custom,
  birthsign,
  cell,
  gold,
  time_played_seconds,
  quest_count,
  topic_count,
  item_count,
  spell_count,
  faction_count,
  packed_size,
  unpacked_size,
  encoding,
  payload_hash,
  revision,
  created_at,
  updated_at
FROM cloud_saves;

-- ====================================================================
-- Table: user_tiers (Migration 0002)
-- User account tiers & entitlement limits
-- Default: Free users (5 saves, 5 loadouts, 5 challenges).
-- Paid / Supporter users: 25 saves, 25 loadouts, 25 challenges.
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_tiers (
  clerk_user_id TEXT PRIMARY KEY NOT NULL CHECK (length(clerk_user_id) > 0),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid', 'supporter')),
  max_saves INTEGER NOT NULL DEFAULT 5 CHECK (max_saves IN (5, 25, 50, 100)),
  max_loadouts INTEGER NOT NULL DEFAULT 5 CHECK (max_loadouts IN (5, 25, 50)),
  max_challenges INTEGER NOT NULL DEFAULT 5 CHECK (max_challenges IN (5, 25, 50)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ====================================================================
-- Quota Enforcement Triggers
-- Atomically blocks insertions if user exceeds their account tier quota.
-- ====================================================================
CREATE TRIGGER IF NOT EXISTS trg_limit_user_cloud_saves
BEFORE INSERT ON cloud_saves
FOR EACH ROW
WHEN (
  SELECT count(*) FROM cloud_saves WHERE clerk_user_id = NEW.clerk_user_id
) >= COALESCE((SELECT max_saves FROM user_tiers WHERE clerk_user_id = NEW.clerk_user_id), 5)
BEGIN
  SELECT RAISE(ABORT, 'QUOTA_EXCEEDED: Maximum save slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing save to continue.');
END;

CREATE TRIGGER IF NOT EXISTS trg_limit_user_saved_loadouts
BEFORE INSERT ON saved_loadouts
FOR EACH ROW
WHEN (
  SELECT count(*) FROM saved_loadouts WHERE clerk_user_id = NEW.clerk_user_id
) >= COALESCE((SELECT max_loadouts FROM user_tiers WHERE clerk_user_id = NEW.clerk_user_id), 5)
BEGIN
  SELECT RAISE(ABORT, 'QUOTA_EXCEEDED: Maximum loadout slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing loadout to continue.');
END;

CREATE TRIGGER IF NOT EXISTS trg_limit_user_saved_challenges
BEFORE INSERT ON saved_challenges
FOR EACH ROW
WHEN (
  SELECT count(*) FROM saved_challenges WHERE clerk_user_id = NEW.clerk_user_id
) >= COALESCE((SELECT max_challenges FROM user_tiers WHERE clerk_user_id = NEW.clerk_user_id), 5)
BEGIN
  SELECT RAISE(ABORT, 'QUOTA_EXCEEDED: Maximum challenge slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing challenge to continue.');
END;

-- ====================================================================
-- View: v_user_entitlements
-- User entitlements and current consumption overview
-- ====================================================================
CREATE VIEW IF NOT EXISTS v_user_entitlements AS
SELECT
  t.clerk_user_id,
  t.tier,
  t.max_saves,
  t.max_loadouts,
  t.max_challenges,
  (SELECT count(*) FROM cloud_saves WHERE clerk_user_id = t.clerk_user_id) AS current_saves,
  (SELECT count(*) FROM saved_loadouts WHERE clerk_user_id = t.clerk_user_id) AS current_loadouts,
  (SELECT count(*) FROM saved_challenges WHERE clerk_user_id = t.clerk_user_id) AS current_challenges
FROM user_tiers t;
