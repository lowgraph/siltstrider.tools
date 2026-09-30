# Account settings migration preparation

Status: prepared on `feature/account-settings-preparation`; SQL is a proposal,
not an applied or numbered migration. No production settings API or UI is wired.

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
| Travel objective | `toolDefaults.travel.objective`: `hops`, `time`, `gold` | Fewest legs, Fastest or Cheapest. Explicit links and current edits win. |
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

The owner accepted the additions below. They are implemented in the prepared
settings contract, validation, resolution and reset helpers. API/UI integration
is still pending. The proposed JSON table needs no additional columns.

1. **Theme**: Modern or Morrowind, remembered across devices. Keep motion/text-size
   preferences device/system-aware unless the user explicitly overrides them.
2. **Travel objective**: Fewest legs, Fastest or Cheapest, with optional walking and
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

## Storage and API plan

Use a separate `account_settings` table, independent of the username-required
`account_profiles` table. Keep the settings as a bounded (16 KiB UTF-8) JSON
document, with a contract version in JSON, revision counter, and timestamps.
Clerk remains the identity authority. No settings row consumes a save-vault slot.

Draft SQL: `cloudflare/proposals/account_settings.sql`. Wrangler currently reads
only `cloudflare/migrations`, so routine migration commands cannot apply it.
After review, promote to the next unused migration number and update the schema
reference and account/state documentation. Never edit an already applied migration.

Planned `/api/settings` behavior (not implemented):

- GET: authenticate, return `{ settings, revision }`; absent row returns defaults
  and revision 0. GET does not create rows or infer defaults from another account.
- PUT: full validated document plus expected revision; bind owner from Clerk,
  never request JSON. Use insert-only at revision 0 and compare-and-update later.
  Return 409 for a stale revision or simultaneous first creation.
- Reject unknown contract versions/fields explicitly, instead of dropping them
  when an older browser saves. Bound the request body before decoding; JSON
  storage support does not replace application validation.
- Reset through the same revision-checked write path, preserving conflict safety.
- Account switches/sign-out invalidate cached settings and pending writes. Cache
  entries must be namespaced by Clerk user ID; guests use their own local settings.
- Existing guest preferences remain guest preferences. On first sign-in, offer
  an explicit adoption choice rather than uploading a shared device's settings.
- Debounce changes, report unsynced/error state, and do not repeatedly write on
  hydration. Late account responses must not overwrite a newer click or link.

The existing `AccountProvider` already guards against stale responses by owner
and generation; follow that pattern when wiring the settings provider.

## Toggle precedence and travel meaning

Prepared pure resolver: `lib/account-settings.mjs`. It is not yet connected to
the workstation. Lowest to highest priority:

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

Run `npm test` first in this checkout. The preparation adds contract/precedence
tests and in-memory SQLite tests applying existing migrations plus the proposal.
Tests check malformed JSON, missing/null versions, UTF-8 byte limits, account
isolation, concurrent writes, preserved saves and fresh accounts without usernames.

Next implementation: promote the reviewed SQL, wire the authenticated
API/provider/account UI, then connect World, theme and the tool defaults/reset
actions. Version notifications need a release registry. Keep future
dataset selectors unavailable until registry/loader support exists. Add UI,
authentication and persistence verification and both player changelogs when the
feature becomes visible. Apply/test locally before a separately authorized remote
migration and deployment; no remote migration or deployment was done here.

References: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
and [D1 JSON storage](https://developers.cloudflare.com/d1/sql-api/query-json/).
