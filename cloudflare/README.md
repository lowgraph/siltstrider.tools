> **Historical setup notes:** The development-only description below predates the current Cloud Save Vault. The repository now includes `worker.mjs`, `routes/saves.mjs`, `routes/entitlements.mjs`, and `migrations/0002_cloud_save_vault.sql`. Consult those files and `wrangler.jsonc` for the implemented routes and bindings. Their presence does not verify deployed configuration or live account flows.

# Development D1 and protected route

Created database: `siltstrider-characters-dev`.
Database ID: `141a1409-3956-4267-a078-02483bbb2bf6`.
Applied migration: `migrations/0001_saved_characters.sql`.

The production static Worker is unchanged. `test-route.mjs` is boilerplate,
not deployed or connected to the site's buttons. Bind the development D1 as
`DB` in a separate development Worker before executing it. Configure
`CLERK_PUBLISHABLE_KEY`, `APP_ORIGIN` (exact trusted frontend origin), and
`TEST_INSERT_ENABLED=true`. Store `CLERK_SECRET_KEY` as a Worker secret, never
in source or public assets. Optional `CLERK_JWT_KEY` is Clerk's PEM verification
key for networkless verification. Both keys must match the Clerk instance.

POST `/api/test-character` with `Authorization: Bearer <session token>`.
The development-only route inserts a fixed canonical v1 Custom character.
It ignores request body fields, including any claimed owner. No real user
token or fake-owner row was inserted into remote D1 during setup.
Remove the test route before production. A real create endpoint must reuse
canonical validation and enforce a bounded request body; this fixture route
does not implement arbitrary character saving or cross-origin CORS.

There is deliberately no users table, identity foreign key, or Clerk webhook.
`version` versions the save envelope, `character_json.version` versions canonical
inputs, and `revision` is an optimistic concurrency counter. Clerk account
deletion does not automatically remove D1 characters; an explicit deletion flow
must be designed later without identity mirroring.

All future record access must bind the verified Clerk user ID. Use these shapes:

```sql
SELECT * FROM saved_characters
WHERE clerk_user_id = ? ORDER BY updated_at DESC, id LIMIT ?;

SELECT * FROM saved_characters WHERE clerk_user_id = ? AND id = ?;

UPDATE saved_characters
SET name = ?, character_json = ?, updated_at = ?, revision = revision + 1
WHERE clerk_user_id = ? AND id = ? AND revision = ?;

DELETE FROM saved_characters
WHERE clerk_user_id = ? AND id = ? AND revision = ?;
```

Never allow updates to `clerk_user_id`, `id`, or `created_at`. Return a generic
not-found/conflict response without querying another owner's row. The schema
does not provide row-level security: isolation must be enforced in every API
query. Database-admin schema inspection is separate from application queries.
