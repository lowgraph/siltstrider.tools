-- Preserve legacy USD receipts and allow exact decimal amounts in any currency.
-- Keep nullable amount_cents so the previous Worker remains compatible during rollout.
CREATE TABLE premium_payments_next (
  transaction_id TEXT PRIMARY KEY NOT NULL,
  clerk_user_id TEXT NOT NULL,
  amount_cents INTEGER CHECK (amount_cents > 0),
  amount TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  received_at TEXT NOT NULL,
  CHECK (amount_cents IS NOT NULL OR (amount IS NOT NULL AND CAST(amount AS REAL) > 0))
);
INSERT INTO premium_payments_next (transaction_id, clerk_user_id, amount_cents, amount, currency, received_at)
SELECT transaction_id, clerk_user_id, amount_cents, printf('%.2f', amount_cents / 100.0), 'USD', received_at FROM premium_payments;
DROP TABLE premium_payments;
ALTER TABLE premium_payments_next RENAME TO premium_payments;
