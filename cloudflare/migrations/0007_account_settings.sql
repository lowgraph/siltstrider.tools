-- Migration 0007 (ACC-1): Account settings table before launch.
-- Additive table only; the authenticated API and settings page follow in ACC-2.
-- One row per verified Clerk account; no username prerequisite or identity mirror.
-- The reviewed JSON contract includes theme, version notices, scoped Travel/Gear/
-- Challenge defaults and reset actions. See docs/ACCOUNT_SETTINGS.md for fields.
CREATE TABLE account_settings (
  clerk_user_id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(clerk_user_id)) > 0),
  settings_json TEXT NOT NULL CHECK(
    length(CAST(settings_json AS BLOB)) BETWEEN 2 AND 16384
    AND CASE WHEN json_valid(settings_json) THEN
      json_type(settings_json) = 'object'
      AND COALESCE(json_type(settings_json, '$.version') = 'integer', 0)
      AND COALESCE(json_extract(settings_json, '$.version') >= 1, 0)
    ELSE 0 END
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(typeof(revision) = 'integer' AND revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- The API validates supported versions and fields. SQL allows future versions.
-- All reads/writes must bind the owner derived from the Clerk session.
-- GET with no row returns defaults and revision 0 without creating a row.
-- First write: INSERT ... ON CONFLICT(clerk_user_id) DO NOTHING; conflict = 409.
-- Existing write: UPDATE ... SET revision=revision+1 WHERE clerk_user_id=? AND revision=?;
-- Zero changed rows = 409; refetch and let the user retry rather than blind overwrite.
