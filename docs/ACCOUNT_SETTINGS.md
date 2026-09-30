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

Example prepared document:

```json
{
  "version": 1,
  "world": "tr",
  "modpackId": null,
  "modVersionId": null,
  "overrideSaveToggles": true,
  "toolDefaults": {
    "travel": { "mageGuild": true, "walking": true }
  }
}
```

`version` versions the settings contract, not a mod, modpack or SLT1 save.
IDs are opaque registry keys, not arbitrary remote URLs or user-entered file paths.
The validator accepts future IDs for preparation; the eventual API/UI must only
activate IDs present in the published registry. Until then Modpack and Mod Version
are unavailable controls, not working selectors. For a built-in TR release,
`world: "tr"` or `"tr_arce"` can carry a `modVersionId` without a modpack ID.

## Other settings recommended before migration

These are proposals, not additional fields implemented without the owner's choice.
The JSON table can accommodate them later without a new D1 column.

1. **Theme**: Modern or Morrowind, remembered across devices. Keep motion/text-size
   preferences device/system-aware unless the user explicitly overrides them.
2. **Travel objective**: Fewest legs, Fastest or Cheapest, with optional walking and
   quest-teleport defaults. Endpoints and follower counts usually belong to a
   particular journey, not an account default.
3. **Version update policy**: pinned by default, notify when a newer supported
   dataset appears, explicit upgrade only. Optional follow-latest could be added
   later, but must resolve to one immutable release for the whole page session.
4. **Default scope**: common tool defaults across all datasets, with optional
   modpack/release-specific overrides later. A TR faction or modded item should
   not become a fabricated vanilla option.
5. **Gear acquisition preferences**: remember theft, quest rewards and difficult
   encounters; preserve today's opt-in defaults until the user changes them.
6. **Challenge generator defaults**: difficulty bands and objective/restriction
   counts. An explicitly shared seed/run keeps its own choices.

Reset all settings and reset one tool are essential account actions. Include
export/import of preferences later if portability becomes useful. These are
actions, not switches. A data/save mismatch warning should be default behavior,
not something users must discover and enable.

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
3. Explicit global defaults, for save-derived booleans only when the overwrite
   switch is enabled. Route choices such as walking do not require that switch.
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

Next implementation: settle the proposed settings, promote the SQL, wire the
authenticated API/provider/account UI, then connect World and Travel. Keep future
dataset selectors unavailable until registry/loader support exists. Add UI,
authentication and persistence verification and both player changelogs when the
feature becomes visible. Apply/test locally before a separately authorized remote
migration and deployment; no remote migration or deployment was done here.

References: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
and [D1 JSON storage](https://developers.cloudflare.com/d1/sql-api/query-json/).
