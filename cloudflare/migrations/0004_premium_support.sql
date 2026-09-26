CREATE TABLE premium_support_codes (
  clerk_user_id TEXT PRIMARY KEY NOT NULL,
  code TEXT UNIQUE NOT NULL
);
CREATE TABLE premium_payments (
  transaction_id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  received_at TEXT NOT NULL
);
