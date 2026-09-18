-- Save-record version is separate from character_json.version and revision.
-- Clerk owns identity: no users table, foreign key, or identity sync.
CREATE TABLE saved_characters (
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
CREATE INDEX saved_characters_owner_updated
  ON saved_characters (clerk_user_id, updated_at DESC, id);
