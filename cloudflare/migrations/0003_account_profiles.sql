CREATE TABLE account_profiles (
  clerk_user_id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(username) BETWEEN 3 AND 24),
  icon_id INTEGER NOT NULL DEFAULT 0 CHECK(icon_id BETWEEN 0 AND 5),
  updated_at TEXT NOT NULL
);
