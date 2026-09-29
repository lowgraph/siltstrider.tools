# Launch operations

Prepared 28 September 2026. These preparations do not replace the final browser
verification after the equipment optimizer changes and data staging are finished.
Use [DEPLOYMENT.md](DEPLOYMENT.md) for the release itself. The 29 September
verification, its findings and open issues are in [LAUNCH_VERIFICATION.md](LAUNCH_VERIFICATION.md).

## Production identity

| Resource | Identifier |
| --- | --- |
| Site | `https://siltstrider.tools` |
| Release branch | `main` |
| Worker | `plain-disk-78e6` |
| Cloudflare account | `4653c1ab885ae65ebea83b3804643010` |
| D1 binding / configured name | `DB` / `siltstrider-db` |
| Actual D1 dashboard name | `siltstrider-characters-dev` (despite the name, this is production) |
| D1 UUID | `141a1409-3956-4267-a078-02483bbb2bf6` |

The UUID, not a name containing “dev”, identifies the live database. Run commands
from `A:\Claude\morrowind-tools` so Wrangler resolves the configured name to that UUID.
Do not create a replacement database or rename a binding to reconcile the labels.

## What is prepared, and what remains

- Compatibility notice beside both save importers and on About: OpenMW only;
  vanilla, TR, and TR + ARCE tested; other mods untested; original `.ess` unsupported.
- Footer and About have **Report a bug** links using the existing support email.
  The email template asks for reproduction steps, profile, time, browser and error
  reference. It attaches no character data or browser state automatically.
- Worker error reporting and Cloudflare logging are configured in source. They
  become active when this revision is deployed; they are not a separate service.
- D1 Time Travel returned a valid bookmark in a read-only production check.
  A **schema-only** export was downloaded and tested locally. No production data
  restore or rollback was performed, and no full private-data backup was created.
- Claude's equipment optimizer work is finished and live: commit `7e72528` with
  bundle `3da0320236da77ec085d105d` (Worker version `329f6c2e-7ca2-4a0f-a3f5-b8ff7902a804`).
  Keep a code/bundle pair fixed while testing.
- Configure Discord in Clerk, then verify its live sign-in and sign-out. Other
  tools can be tested independently of Discord.
- After deployment, verify the new notice, report links and logging configuration.
  Automatic email alerts and off-device backup copies are not configured here.

## Error monitoring and bug reports

Open Cloudflare → Workers & Pages → **plain-disk-78e6** → **Observability**.
Search for `request_failed` or a user's `requestId`. Our structured event contains
the method, route category, HTTP status, duration, reference, and whether the
failure was a rejected handler or a returned 5xx response. Save IDs, query strings,
request bodies, headers, user IDs and exception text are excluded from our event.
The user sees the same reference in the error message. Expected 4xx errors are
not recorded as server failures.

Wrangler enables persisted logs, disables routine invocation logs, redacts query
strings, and samples platform traces at 1%. Platform metadata is still processed
by Cloudflare; these settings are not a guarantee of zero provider logging.
Do not add payloads, tokens, donor messages or SQL parameter values to logs.
Review Cloudflare's usage and retention for the account; sampling is not a spending cap.

For a live investigation, run this yourself and stop with Ctrl+C:

```powershell
node node_modules/wrangler/bin/wrangler.js tail plain-disk-78e6 --format pretty --search request_failed
```

Do not filter only by invocation status `error`: handled HTTP 500 responses can
have a successful invocation outcome. Review platform error metrics too, including
runtime limits that can terminate execution before the handler logs anything.

Only `/api/*` runs the Worker (see [DEPLOYMENT.md](DEPLOYMENT.md#routing-and-the-www-redirect)),
so `request_failed` events and user-visible references cover API failures. Pages and
game data are served by Cloudflare's asset store without the Worker; problems there show
in the zone's analytics and error metrics, not in these logs.

This is server monitoring. Browser-only problems arrive through bug reports and
the final browser tests; no automatic browser telemetry collector is installed.
For each report, record the affected release, profile, steps, and severity. Treat
data loss, login failures, payment failures and inaccessible tools as release blockers.

References: [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/),
[tracing attributes](https://developers.cloudflare.com/workers/observability/traces/spans-and-attributes/).

## Capture a recovery record before release

Use the installed Node/Wrangler versions. All commands below use the project-local
Wrangler. Store recovery files outside Git and public assets.

```powershell
git status -sb
git rev-parse HEAD
Get-Content public/game-data/current.json
node node_modules/wrangler/bin/wrangler.js deployments list --json
node node_modules/wrangler/bin/wrangler.js d1 info siltstrider-db --json
node node_modules/wrangler/bin/wrangler.js d1 migrations list siltstrider-db --remote
node node_modules/wrangler/bin/wrangler.js d1 time-travel info siltstrider-db --json
```

Record the UTC time, commit SHA, bundle ID and snapshot ID, active Worker version,
D1 UUID, applied migration list, and **fresh** recovery bookmark together. Keep a
copy of the selected bundle and manifest: Git intentionally excludes generated data.
Migration 0006 was applied on 28 September; the empty prototype table was removed.

For a full backup, the site owner can run the following at a quiet time. An export
can temporarily block database queries. This copies private records, so keep it in
protected storage and do not attach it to issues or commit it:

```powershell
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "A:\Cache\siltstrider-$backupStamp.sql"
node node_modules/wrangler/bin/wrangler.js d1 export siltstrider-db --remote --output $backupPath
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; stop the release.' }
Get-FileHash -LiteralPath $backupPath -Algorithm SHA256
```

Move a verified copy to private encrypted storage independent of this computer.
`A:\Cache` is a staging location, not a durable backup. A `--no-data` export proves
the schema can be reconstructed but **does not back up saves or entitlements**.
Before relying on a full export, restore it into an isolated local database and
verify integrity, row counts and representative payload decoding. Do not test it
by importing SQL into production.

## Recover the database only for a data incident

D1 Time Travel retains history for 7 days on Workers Free and 30 days on Workers
Paid. Bookmarks expire; record new ones before changes. See
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

First pause site writes and Ko-fi delivery, capture current recovery information,
and assess saves/payments created after the desired recovery point. A database
restore affects all its tables. Coordinate the restored schema with Worker code.
The following is a destructive incident command, **not a launch test**:

```powershell
$restoreBookmark = Read-Host 'Enter the reviewed recovery bookmark'
if ([string]::IsNullOrWhiteSpace($restoreBookmark)) { throw 'Bookmark required' }
node node_modules/wrangler/bin/wrangler.js d1 time-travel restore siltstrider-db --bookmark $restoreBookmark
```

Keep the undo bookmark returned by the restore. Verify migrations, login, owned
saves and supporter entitlements before reopening writes. Reconcile payments and
lost writes from the affected interval; coordinate webhook redelivery if needed.
Clerk settings and identities are outside this database and are not restored by D1.

## Roll back a faulty deployment

Prefer a code rollback for a code regression. Inspect deployment history and choose
an explicit compatible Worker version; don't blindly select “previous”. As a
reference, the release inspected during preparation was commit `a50cc38`, Worker
version `5da1eb70-e347-403e-b017-06194f28513f`; the equipment release after it was
commit `7e72528`, Worker version `329f6c2e-7ca2-4a0f-a3f5-b8ff7902a804`. Recheck
history during an incident.

```powershell
node node_modules/wrangler/bin/wrangler.js deployments list --json
$rollbackVersion = Read-Host 'Enter the reviewed compatible Worker version UUID'
if ([string]::IsNullOrWhiteSpace($rollbackVersion)) { throw 'Version required' }
node node_modules/wrangler/bin/wrangler.js rollback $rollbackVersion --message 'Rollback after release verification failure'
```

Rollback does not undo D1 writes or migrations. Avoid versions before `c8f84e4`:
the current schema removed the prototype table, and the cloud codec now requires
version 2. Check the target's bindings, secrets and bundled assets too. If the
desired version is unavailable or incompatible, fix/redeploy compatible code.
See [Cloudflare rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

After recovery, verify the homepage, static assets, bundle pointer, account access,
and one owned save round trip. Record the resulting version and root cause.

## Final acceptance pass (after the optimizer is finished)

1. Record one fixed commit and bundle. Run `npm test` and `npm run build:cloudflare`.
2. Check all tools in Vanilla, TR and TR + ARCE on desktop and mobile: builder,
   equipment, leveling, challenges, alchemy, enchanting, spellmaking, travel,
   factions/journal. Include empty inputs, profile changes and cross-tool navigation.
3. Check share links, repeatable seeds, save import, local persistence and exports.
4. On production, verify Google and Discord authentication, expiry/renewal, cloud
   create/load/rename/delete, account ownership and premium quota/badge behavior.
   Use clearly named disposable records; do not delete real saves.
5. Confirm support links, compatibility wording, privacy/terms, error log access,
   current backup/recovery record, and compatible rollback target before sharing.
