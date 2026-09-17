# Phase 1: serialization boundary

The DOM remains the live application state. This phase adds detached, JSON-safe
snapshots and validated restoration, not a new reactive store or calculation engine.

## Existing architecture and data flow

- Build Optimizer: `c-*`, `maj0..4`, and `min0..4` selects hold the active sheet.
  `readPanelBuild('c')` feeds `refreshCustom()` and `computeSheet()`. Gear helpers
  also read controls directly. The class picker calls `syncCustomClassLock()` /
  `applyClassToPanel()`; skill changes use `swapDuplicateSkill()` and its previous
  value bookkeeping. `applyPremadeToCustom()` translates recommendation records
  into a Custom sheet. Merely browsing recommendation cards does not change it.
- Challenge Runs: hidden `r-*`, `rmaj0..4`, and `rmin0..4` selects hold a complete
  sheet, including default values before anything is rolled. `challengeRun` holds
  rolled identity-card values plus the major objective, minor-objective records,
  restrictions, and a transient roll-status message. An empty identity-card value
  means "Not rolled", even though its hidden select has a usable default.
- `rollOne()`, `rollClass()`, `rollCustomClass()`, and `rollSkills()` write these
  controls and card values. `randomizeAll()` respects locks and compatibility rules;
  it is not a blanket state reset. Initial page setup supplies the default sheets.
  There is no separate new-character/reset handler. `sendChallengeToOptimizer()`
  copies the hidden sheet into the builder using its existing refresh path.
- `setWorld()` / `setArce()` rebuild availability lists through `applyArceLists()`.
  They preserve available selections, fall back when necessary, refresh sheets,
  and let `renderRun()` remove unavailable cards/objectives/restrictions.
- URL loading selects world/ARCE before loading payloads; page initialization waits
  until all data and controls exist. URL writing uses `history.replaceState`.

## Canonical objects

`getCurrentCharacter(panel = 'c')` returns:

```js
{
  version: 1, world: 'vanilla', arce: false,
  className: 'Custom', race: 'Dark Elf', gender: 'Male',
  sign: 'The Warrior', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: [/* five skill names */], min: [/* five different skill names */]
}
```

`panel` accepts `'c'` or `'r'`; the default explicitly means the builder, regardless
of which view is visible. The character stores the actual class details in the
controls, including named classes, so a snapshot captures the complete sheet.
Names reference game data; no race/class records or computed results are copied.

`getCurrentChallengeRun()` returns:

```js
{
  version: 1,
  character: { /* the complete r-panel Character above */ },
  rolled: { race: false, gender: false, className: false, sign: false },
  major: '', minors: [/* objective text references */],
  restrictions: [/* restriction text references */]
}
```

`rolled` is semantic partial-run state, not a randomizer lock. It distinguishes a
default hidden sheet from a rolled character. Omitting it would silently turn
"Not rolled" cards into completed cards on restoration. No duplicate character
names are stored in the canonical run. Minor-objective metadata is looked up when
loading rather than persisted. Returned arrays and objects do not alias live state.

## Loading and validation

- `normalizeCharacter()` validates version, world/ARCE, race, gender, class,
  birthsign, specialization, two distinct favored attributes, and ten distinct
  known skills against the existing definitions for the saved world. It returns
  an allowlisted copy. Unknown versions and unavailable choices throw.
- `loadCharacter(character, panel = 'c')` validates first, restores world/ARCE only
  when different, fills controls through `writeCharacterControls()`, synchronizes
  duplicate-swap bookkeeping and favored-attribute controls, and refreshes through
  the existing functions. Loading directly into `'r'` marks all identity cards
  rolled; use `loadChallengeRun()` to restore a partially rolled run instead.
- `normalizeChallengeRun()` validates the full character and run before mutation.
  It checks rolled flags, world-specific major/restriction availability, objective
  membership, uniqueness, five-item limits, and the existing minor-clash rule.
  It does not invent new cross-restriction rules that legacy loading never imposed.
- `loadChallengeRun()` restores the full hidden sheet, reconstructs rolled cards,
  resolves objective records, clears the transient status note as legacy loading
  did, then calls `renderRun()`. Existing aspect locks are left as they are.
- `restoreState()` suppresses intermediate URL writes during restoration and writes
  once afterward unless already inside URL restoration. Invalid objects do not
  change either sheet, preferences, or URL. These functions do not insert arbitrary
  serialized strings as HTML.

World and ARCE belong in each snapshot because they determine the interpretation
and availability of its references. They also remain global preferences in live
use. Loading a snapshot with different flags invokes the same existing world
switching behavior, including its effects on the other sheet and calculators.
This intentionally preserves the application's single-world model; isolated
per-character worlds would be a separate architectural change.

## Compatibility

- `collectBuild()` now projects `getCurrentCharacter()` to the existing `v: 1`
  build payload. World/ARCE still live in the surrounding hash flags.
- `applyBuild()` adapts old payloads, retains absent gender/class defaults and
  named-class reapplication, then calls `loadCharacter()`. Its existing behavior
  of opening the custom-builder subpanel remains; canonical loading alone does
  not change the selected view/subpanel.
- `encodeRunPayload()` projects the canonical run to the unchanged compact fields
  (`race`, `gender`, `cls`, `sign`, custom class details, `major`, `minors`, `rests`).
- `decodeRunPayload()` remains the untrusted JSON decoder. `applyRunPayload()`
  keeps the legacy tolerant filtering rules, builds a canonical run without
  touching controls, then calls `loadChallengeRun()`.
- `writeShareHash()` / `readShareHash()` retain their hash format, world precedence,
  initialization ordering, and legacy TR/ARCE flags. Old partial-run links still
  omit hidden defaults; canonical JSON captures those defaults in full.
- `activePool(mode = worldMode)` and `activeMajors(mode = worldMode)` now accept
  an optional world for validation before changing global preferences. Their
  existing no-argument behavior is unchanged.

## Outside persisted state

Temporary/UI-only state includes `aspectLocks`, `restNote`, randomizer difficulty
and count settings, search filters, expanded details, selected view/subpanel,
focus, copied-link messages, pending URL payloads/restoration guards, skill-swap
bookkeeping, gear filters/results, and the separate calculator input state.

At the end of Phase 1, localStorage contained only `mw-world` and `mw-arce`.
Phase 1 added no character storage key, account, backend, or cloud persistence.

Immutable reference data includes race/class tables (Vanilla/ARCE), birthsigns,
attributes, skills, specializations, objectives/restrictions and their metadata,
spells, gear recommendations, and TR data. Calculations are unchanged.

## Tests and remaining dependencies

`npm test` passes 55 tests: 46 existing regressions plus nine state tests covering
premade/Custom/TR/ARCE character JSON round trips, unchanged rendered sheets and
calculations, named/Custom Challenge Runs, locks, partial runs, direct permalink
reloads, detached snapshots, invalid input, and unchanged storage scope/view.

The existing direct writers (class selection, recommendation application,
randomization, world-list refresh, and sending a challenge to the optimizer)
remain DOM-based. Calculations and gear optimization still read DOM controls.
This is deliberate: snapshots observe their latest values without a second store
that could drift. Before a later persistence phase, keep saves/loads at this
boundary, ensure initialization is complete, and decide how global-world changes
should affect the other open sheet. Browser visual QA was not performed in this
phase; static markup/CSS and calculation implementations were not changed.

# Phase 2: browser-local characters

## Storage boundary

`siltstrider-saved-characters` contains one JSON array of records:

```js
{
  id: 'generated-uuid', version: 1, name: 'My character',
  createdAt: '2026-09-17T12:00:00.000Z', updatedAt: '2026-09-17T12:00:00.000Z',
  character: { /* canonical Character version 1, described above */ }
}
```

The outer version describes save metadata; `character.version` describes the
independent canonical schema. `normalizeSavedCharacter()` is the explicit future
migration point; currently it accepts only version 1. Names are trimmed metadata
(1–100 characters), never identities or calculation inputs. IDs use randomUUID,
with a cryptographic random-byte fallback, and are checked against stored IDs.
Updates and renames retain ID/createdAt and advance updatedAt. Only overwriting
replaces the character payload; renaming retains the saved payload.

`await saveCharacter(name, getCurrentCharacter())` captures the builder. Loading calls
`getSavedCharacter(id)` then the unchanged `loadCharacter(record.character)`.
There are no additional control setters, game-data copies, derived results, or
Challenge Run fields in a local save. Phase 1's getters/loaders and compact
permalink adapters are unchanged.

The persistence functions are `loadSavedCharacters`, `getSavedCharacter`,
`saveCharacter`, `updateSavedCharacter`, `renameSavedCharacter`, and
`deleteSavedCharacter`. Internal helpers are `savedCharacterName`,
`normalizeSavedCharacter`, `readSavedCharacterCollection`,
`writeSavedCharacterCollection`, `withSavedCharacterLock`, and `changeSavedCharacter`. Only this layer
reads/writes the new storage key; the UI receives validated detached records.
Mutation functions return promises; reads remain synchronous. The UI waits for
completion before reporting success and disables save actions while pending.

## UI and world behavior

Build Optimizer's custom builder has a collapsed **Local characters** section.
Enter a name and choose **Save as new**, or select a stored character to **Load**,
**Rename**, **Overwrite with current sheet**, or **Delete**. Overwrite and delete
ask for confirmation. Merely selecting a save does not load it. Startup populates
the list without changing the character. **Refresh list** or reopening the section
refreshes the list; the selected save and messages are temporary UI state. Storage
events refresh an unselected list, but preserve an active draft/selected revision
and display a notice to review the latest saves instead of silently replacing it.
Names are inserted with `Option`/`textContent`, never interpolated into HTML.

The UI states that loading restores the saved world and ARCE site-wide. This
preserves Phase 1's global-world model: `loadCharacter()` switches via the existing
setters when necessary, including `mw-world`/`mw-arce` preferences and effects on
the other sheet/calculators. Validation checks availability in the saved world
before mutation. A save is not interpreted using the recipient's current mode.

Permalinks remain portable and independent of local storage. The loaded sheet
updates the usual URL through the canonical loader, with no record ID or name.
Challenge Run sharing, randomizer locks, and calculations are unchanged.

## Failure handling and limitations

Missing storage means an empty collection. Individual invalid, future-version,
or duplicate-ID records are hidden with a warning; all records sharing a duplicate
ID are hidden. Their raw entries remain in the stored array through valid edits,
so one bad record cannot destroy other saves. Validation requires record metadata,
ISO dates, and the existing strict `normalizeCharacter()` checks; missing game
values are never invented. Unknown fields are not part of validated snapshots.

Malformed JSON or an unsupported root format blocks mutations while preserving
the original data. Unavailable storage and quota/write failures produce visible
errors, without reporting success. There is no automatic destructive recovery UI;
repairing malformed whole-collection data currently requires browser developer
tools. Clearing site data removes saves. Storage is browser/origin-specific.

Mutations acquire an exclusive Web Lock named after the storage key before
reading and writing. Concurrent writes from tabs running this version are
serialized, preserving additions and edits to unrelated records. Updates,
renames, and deletes compare the selected `updatedAt` against the latest stored
record inside the lock; stale edits fail with a review/refresh message. Timestamps
advance monotonically. Save inputs are validated and detached before waiting.
The browser releases the lock even when a mutation throws or its tab closes.

When Web Locks is unavailable, writes fail visibly rather than attempting an
unsafe localStorage lock. Reading/loading existing saves still works. Use HTTPS
(or localhost for development) and a browser supporting Web Locks. All open tabs
must run this version; older code or external tools that bypass the lock cannot
be coordinated by it. There is no autosave, export/import, cloud sync,
or Challenge Run save collection. DOM controls remain the live source of character
state and calculation input, as in Phase 1; global world isolation remains a
future architectural decision.

## Compatibility with future accounts and a backend

The DOM is the live editor, not the persisted format. A future backend can store
the existing versioned record and canonical character JSON, then return it to
the same validator/loader. Removing DOM-based calculation inputs is not a
prerequisite. Promise-based mutation calls also allow asynchronous storage later.
Account ownership, authorization, server validation, server-controlled revisions,
and any local-to-account migration must be designed in that future phase. Local
timestamps/IDs are not authorization credentials or a cloud concurrency scheme.
No accounts, backend, or second character representation were implemented here.

## Verification

Run `npm test` from this repository. All 69 tests pass: 55 existing regressions
and 14 local-save tests in `test/local-saves.test.js`. New coverage includes
premade/Custom/TR/ARCE save → fresh page → explicit load, complete canonical
state and rendered calculation/gear equality, no startup autoload, sharing to a
recipient with no saves, duplicate names with distinct IDs, multiple saves,
stable metadata on overwrite/rename, deletion/cancellation, unsafe names as text,
malformed JSON/root formats, invalid/future/duplicate records, blocked storage,
quota failures, stale selections, and storage events. Existing Challenge Run,
permalink, randomization, calculator, and canonical-state tests also pass.
Additional cases cover two windows sharing storage and a lock queue, concurrent
additions/independent edits, stale edits/deletes, missing locking support, queued
input snapshots, double-click suppression, and preserving drafts on notifications.

Browser QA was performed against a localhost preview in the Codex Chromium
browser: save/reload/change/load, renaming, a stale rename across two real tabs,
and recovery through Refresh list. Desktop and 390px-wide screenshots were
inspected. The save-name field now reuses the site's themed input rule, and the
new action buttons stack at narrow widths. No existing calculator styling changed.
