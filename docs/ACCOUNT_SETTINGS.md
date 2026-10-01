# Account settings

ACC-1 creates the table in `cloudflare/migrations/0007_account_settings.sql`
before launch. It has been applied and checked on a fresh local D1 database;
production 0007 was applied separately with owner authorization on 30 September.
ACC-2 adds `/api/settings`, the account settings provider, and controls in Your
account.
ACC-1, ACC-2 and the tool polish are merged to main in `b45f686`.
Production migration verification is in LAUNCH_VERIFICATION §15. The settings API
and site changes are live from main `216cd90`, Worker `d523b9ba`; release checks
and recovery information are in §16.

## Requested settings

| Setting | Contract | Behavior |
| --- | --- | --- |
| World | `world`: `vanilla`, `tr`, `tr_arce` | Remembers the current three choices per account. Shared links with an explicit world retain priority. |
| Overwrite save-specific toggles with global toggles | `overrideSaveToggles`: boolean, initially false | When enabled, explicitly stored global booleans replace imported-save toggles and remembered per-save booleans. Unset globals inherit the save; false is a real choice. |
| Modpack | `modpackId`: stable ID or null | Future published modpack replaces the three-way world selector and resolves to its own data. `world` remains a legacy fallback field for the transition. |
| Mod Version | `modVersionId`: immutable release ID or null | Future published release selects an exact TR or modpack dataset. Never silently substitute a newer release. |
| Theme | `theme`: `ashfall` or `morrowind` | Existing Modern/Morrowind theme IDs; defaults to Modern. |
| Version update policy | `versionUpdates: { policy: "pinned", notify: true }` | Notify about supported new datasets; explicit upgrades only. Notifications can be disabled. |
| Default scope | `defaultScope`: `global` or `dataset` | Shared defaults alone, or shared defaults with matching dataset-specific overrides. |
| Travel objective | `toolDefaults.travel.objective`: `hops`, `time`, `gold`, `real` | Fewest legs, Fastest, Cheapest or Least real time. Explicit links and current edits win. |
| Gear preferences | `toolDefaults.gear`: sparse boolean map | Theft, endgame gear early, near-start gear, Dark Brotherhood armor, quest rewards and difficult encounters. |
| Challenge defaults | `toolDefaults.challenge`: sparse settings | Preset, difficulty bands, restriction count and objective count; shared seeds retain their choices. |

Example prepared document:

```json
{
  "version": 1,
  "world": "tr",
  "modpackId": null,
  "modVersionId": null,
  "overrideSaveToggles": true,
  "theme": "morrowind",
  "versionUpdates": { "policy": "pinned", "notify": true },
  "defaultScope": "dataset",
  "toolDefaults": {
    "travel": { "mageGuild": true, "walking": true, "objective": "gold" },
    "gear": { "theft": false, "questRewards": true },
    "challenge": { "preset": "standard", "restrictionCount": "3", "objectiveCount": "2" }
  },
  "datasetOverrides": [
    { "world": "tr", "modpackId": null, "modVersionId": null,
      "toolDefaults": { "travel": { "objective": "time" } } }
  ]
}
```

`version` versions the settings contract, not a mod, modpack or SLT1 save.
IDs are opaque registry keys, not arbitrary remote URLs or user-entered file paths.
The validator accepts future IDs for preparation; the eventual API/UI must only
activate IDs present in the published registry. Until then Modpack and Mod Version
are unavailable controls, not working selectors. For a built-in TR release,
`world: "tr"` or `"tr_arce"` can carry a `modVersionId` without a modpack ID.

## Approved additions — 30 September 2026

The owner accepted the additions below. Their contract, validation, resolution,
reset helpers and available tool integrations are implemented. Migration 0007
needs no additional columns.

1. **Theme**: Modern or Morrowind, remembered across devices. Keep motion/text-size
   preferences device/system-aware unless the user explicitly overrides them.
2. **Travel objective**: Fewest legs, Fastest, Cheapest or Least real time, with optional walking and
   quest-teleport defaults. Endpoints and follower counts usually belong to a
   particular journey, not an account default.
3. **Version update policy**: pinned by default, notify when a newer supported
   dataset appears, explicit upgrade only. Automatic follow-latest is not a
   supported policy in this contract.
4. **Default scope**: common tool defaults across all datasets, with optional
   modpack/release-specific override entries. A TR faction or modded item should
   not become a fabricated vanilla option.
5. **Gear acquisition preferences**: remember theft, quest rewards and difficult
   encounters; preserve today's opt-in defaults until the user changes them.
6. **Challenge generator defaults**: difficulty bands and objective/restriction
   counts. An explicitly shared seed/run keeps its own choices.

Reset all settings and reset one tool are essential account actions. Include
export/import of preferences later if portability becomes useful. These are
actions, not switches. A data/save mismatch warning should be default behavior,
not something users must discover and enable.

### Defaults, dataset scope and resets

`resolveAccountToolDefaults` resolves sparse stored preferences against today's
manual tool defaults. Travel starts with Fewest legs; existing gear policy
toggles remain false; Challenge starts with Standard, 3 restrictions, 2 objectives
and Easy/Medium bands enabled. Gear keys are `theft`, `endgame`, `nearStart`,
`darkBrotherhood`, `questRewards` and `difficultEncounters`. The last two prepare
the agreed future acquisition filters; current published gear rows do not have
separate quest-reward/encounter policy switches, so their consumer/filter support
must be added before exposing those controls. Do not equate them to endgame gear.

Challenge counts are the existing UI's strings `"random"`, `"1"` through `"5"`.
Bands are `Easy`, `Medium`, `Hard`, `Grind`; preset IDs are `standard`, `hardcore`,
`cursed`, `custom`. A named preset supplies its normal counts/bands; explicit
custom dials override them and the resolver marks the result Custom when it
differs from that preset. A shared seed or run wins over account defaults.

`datasetOverrides` holds at most 24 entries under the total 16 KiB document cap.
Each entry identifies a world, optional modpack and optional immutable release,
with sparse `toolDefaults`. Null release in an override entry means defaults
for that world/modpack across releases; an exact release overrides those broad
defaults regardless of array order. Worlds and modpack IDs must match exactly.
Duplicate selection entries are rejected. False remains an explicit preference.
When `defaultScope` is `global`, override entries are retained but ignored.
Theme and version-update policy remain global. Dataset resolution uses the actual
open world/pack/release, so a shared link can select a different scope from the
stored preferred world. A future published pack should have a canonical legacy
world mapping until the three-way selector is retired.

`resetAccountSettings` restores all default preferences and clears the selected
pack/version, global overrides and dataset overrides. `resetAccountToolSettings`
clears that tool's preferences in all scopes while preserving theme, world,
version policy and other tools; empty scope entries are removed. Neither mutates
the caller's document. Persist resets through the same revision-checked API as
ordinary edits, without deleting cloud saves or a generated Challenge run.

## Storage and API

Use a separate `account_settings` table, independent of the username-required
`account_profiles` table. Keep the settings as a bounded (16 KiB UTF-8) JSON
document, with a contract version in JSON, revision counter, and timestamps.
Clerk remains the identity authority. No settings row consumes a save-vault slot.

Migration: `cloudflare/migrations/0007_account_settings.sql` (ACC-1). It keeps the
reviewed table shape and is additive: existing saves, profiles, entitlements,
indexes, triggers and views stay unchanged. Never edit 0007 once applied; later
changes need a new migration. Remote apply belongs to the owner, with a fresh
D1 Time Travel bookmark, separately from any Worker deploy. Older Workers ignore
the new table and remain valid rollback targets.

`/api/settings` behavior (ACC-2):

- GET: authenticate, return `{ settings, revision }`; absent row returns defaults
  and revision 0. GET does not create rows or infer defaults from another account.
- PUT: full validated document plus expected revision; bind owner from Clerk,
  never request JSON. Use insert-only at revision 0 and compare-and-update later.
  Return 409 for a stale revision or simultaneous first creation.
- Reject unknown contract versions/fields explicitly, instead of dropping them
  when an older browser saves. Bound the request body before decoding; JSON
  storage support does not replace application validation.
- Bound the request envelope to 17 KiB and the settings document to 16 KiB in
  UTF-8 bytes. Stream the body with a running limit even without Content-Length.
  Modpack/release selections and the two unsupported gear filters are rejected
  until their consumer/data support exists.
- Reset through the same revision-checked write path, preserving conflict safety.
- Account switches/sign-out invalidate cached settings and pending writes. Cache
  entries must be namespaced by Clerk user ID; guests use their own local settings.
- Existing guest preferences remain guest preferences. On first sign-in, offer
  an explicit adoption choice rather than uploading a shared device's settings.
- Debounce changes, report unsynced/error state, and do not repeatedly write on
  hydration. Late account responses must not overwrite a newer click or link.

`AccountSettingsProvider` follows `AccountProvider`'s owner/generation guards.
`AccountSettingsSession` serializes debounced writes, retains newer changes made
while a request is in flight, and aborts/invalidates requests on account changes.
No account document is cached in shared browser storage. Guests have a separate
`silt-guest-settings-v1` document, with the old world/theme/Challenge preferences
read as a fallback. An account with no settings offers explicit guest adoption.
Account World and theme changes do not overwrite the guest's stored choices.

The account page shows loading/saving/unsynced/error states. Network failures keep
edits for Retry; revision conflicts freeze edits until the player explicitly
discards unsaved preferences and reloads the server copy. Reset all and reset one
tool use the same revision-checked writes. World-specific defaults are editable
for all three current worlds; future dataset selectors are disabled.

## Toggle precedence and travel meaning

Shared resolver: `lib/account-settings.mjs`, used by Travel and the other tool
consumers. Lowest to highest priority:

1. Tool defaults.
2. Imported-save defaults and remembered per-save edits.
3. Explicit global/matching dataset defaults, for save-derived booleans only when the overwrite
   switch is enabled. Route choices such as walking and objective do not require
   that switch.
4. Explicit shared-route choices.
5. Current user edits in the open tool.

Without an imported save, account defaults apply normally. Unset booleans inherit;
stored false values actively disable a toggle. Switching overwrite off restores
the retained per-save choices. Do not rewrite the original `.omwsave` or SLT1
payload, or erase stored per-save choices when applying a global preference.

`mageGuild: true` currently means **assume Mages Guild membership**, not a separate
transport-preference filter. "Always use guild guides" therefore allows guides
as a planning assumption even if the imported character is not a member. Retain
the existing membership warning and label the overridden choice as a global
preference. It does not force every journey to use a guide. A distinct
allow/avoid-guides setting would need a separate route filter.

Global booleans cover `mageGuild`, `conjurer`, `divine`, `almsivi`, `waterWalking`,
`walking` and `questTeleports`. Inventory items, carried weight, Levitate magnitude,
Magicka, rank, position and spell ownership are not account-wide defaults.
Existing spell/resource availability checks must still run after resolution;
selecting Intervention does not manufacture a spell or an infinite scroll stack.
Conjurer remains inapplicable outside data that supplies its guides.

World/data precedence is separate: an explicit shared link or deliberate current
selection wins over a stored account default. Never automatically relabel an
imported character as belonging to a different modpack/release.

## Future modpack and version data work

The current bundle loader permits only `vanilla`, `tr`, `tr_arce` and follows
`current.json`. A preference field alone cannot load an older TR or a new modpack.
Before enabling these selectors, the pipeline/site contract needs a release registry:

- Stable modpack IDs and display names, with a source link to the relevant
  modding-openmw.com pack once datasets are provided.
- Immutable release IDs mapping to bundle ID, manifest path and data profile,
  plus constituent mod versions (including TR), pack revision and engine/math
  compatibility. A modpack may contain several independently versioned mods;
  Mod Version should select a tested dataset release, not guess from one label.
- Release retention and availability checks. Missing pinned data reports an error
  with explicit recovery choices; it must not fall through to today's data.
- Loader, feature caches and remembered per-save choices keyed by data identity,
  rather than only the legacy world. `accountDataSelectionKey` prepares that key;
  the eventual runtime key must also include the resolved immutable bundle ID.
- Link and saved-record data provenance. Account settings need no SLT1 change,
  but links/saves that must independently identify a modpack/release will need
  separately versioned metadata or a future codec change. Decide that contract
  before releasing multiple datasets.

No game-data schema changes or extraction are part of this preparation.

## Validation and rollout

Run `npm test` first in this checkout. `test/account-settings-schema.test.js` uses
`node:sqlite`'s `DatabaseSync`, without Python, subprocesses or Windows cache paths.
It applies migrations 0001–0006 in order, then 0007, and checks `json_valid` and
`json_type`, malformed JSON, missing/null/non-integer versions, UTF-8 byte limits,
owner isolation, revision conflicts, unchanged saves/profiles/entitlements and
fresh accounts without usernames.

The branch previously had no `engines` declaration, although its documented
minimum was Node 22.11.0. `package.json` now declares `>=22.11.0`; `npm test` uses
`node --experimental-sqlite --test test/*.test.js` so SQLite loads on Node 22.11
and 22.12, where it still needs the flag. This preserves the current runtime
minimum rather than raising it. Node 22.11 emits `ExperimentalWarning: SQLite is
an experimental feature and might change at any time`; it is not suppressed.

ACC-1 local verification uses a fresh persistence directory (do not reuse an
existing developer database):

```powershell
npx wrangler d1 migrations apply siltstrider-db --local --persist-to <fresh-local-directory>
npx wrangler d1 migrations list siltstrider-db --local --persist-to <fresh-local-directory>
```

All seven migrations applied successfully; list reported `No migrations to
apply!`. Local `account_settings` exists; the 28 historical schema objects match
the 0001–0006 baseline (ignoring Wrangler's removal of SQL comments/whitespace).
The seven existing application tables remain empty in the fresh database.
Separate seeded in-memory tests verify that existing records survive 0007.

ACC-2 verification on the branch incorporating origin/main `2c113b8`: `npm test`
passed 836 tests with no failures or skips and the reported SQLite experimental
warning. `npm run build:cloudflare` passed, generating 24 static pages; the
Worker also compiled with `wrangler deploy --dry-run`. Fresh local migrations
and the 28-object historical schema comparison passed. Chrome ran 33 settings,
tool and Travel cases at desktop/mobile widths in both themes, with 28 axe
reports and no critical/serious findings, runtime errors or server errors.
Evidence and limits: [LAUNCH_VERIFICATION.md](LAUNCH_VERIFICATION.md) §12.

ACC-2 implements the authenticated API/provider/account UI and connects World,
theme and tool defaults/reset actions. Version notifications need a release
registry; future dataset selectors remain unavailable until registry/loader
support exists. Schema, API, client state and React/browser integration are
verified locally; production sign-in remains an owner acceptance check.
The latest origin/main `11c1c96` has also been incorporated into the settings
branch without rebasing. Only settings work differs from that main; local
migration, tests and build passed after integration. The verification record
above describes the original implementation; §12 also records the new-main checks.
The owner authorized merging the completed settings and tool-polish branch to main
in `b45f686`; current merge verification is in LAUNCH_VERIFICATION §14.
Production 0007 was applied separately with owner authorization on 30 September;
the recovery record and preservation checks are in LAUNCH_VERIFICATION §15.
The subsequent owner-authorized release deployed main `216cd90` as Worker
`d523b9ba` on 1 October at 00:11 UTC (30 September locally), recorded in §16.
Live authenticated settings reads passed; settings writes and cross-device
acceptance remain separate owner checks.

References: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
and [D1 JSON storage](https://developers.cloudflare.com/d1/sql-api/query-json/).
