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

localStorage continues to contain only `mw-world` and `mw-arce`. No character
storage key, account, backend, or cloud persistence was added.

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
