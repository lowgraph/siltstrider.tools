# Silt Strider Tools — Character State & Persistence Architecture

This document specifies the current React 19 state architecture, active save synchronization, binary serialization (`SLT1`), and cloud persistence models across `siltstrider.tools`.

---

## 1. Character State Model (`components/character-context.jsx`)

The application state is managed by `CharacterProvider` via `useActiveCharacter()`. It unifies two distinct character modes:

### A. Planner Builds (`build`)
- **Structure**: `{ version: 1, world: 'vanilla' | 'tr' | 'tr_arce', arce: boolean, name: string, race: string, gender: 'Male' | 'Female', className: string, sign: string, spec: string, fav1: string, fav2: string, maj: string[5], min: string[5], bitterCup: boolean }`.
- **Derivation**: Attributes and skill levels are derived deterministically using `computeSheet(build, catalogs)` in `lib/character-math.mjs`.
- **Mutations**: Controlled via `updateField`, `swapSkill`, `selectClassPreset`, and `selectPremade`.

### B. Imported Game Saves (`activeSave`)
- **Structure**: Parsed binary OpenMW save states (`.omwsave`) containing exact runtime attributes, current/max vitals (Health, Magicka, Fatigue), skill progress, inventory items with soul/equipped flags, factions with ranks/reputation, and completed quests.
- **Distinction**:
  - A **Build** represents a planned archetype with base derived stats at level 1.
  - An **Active Save** represents a living in-game character state with historical level progression, equipment, and quest progress.
- **Save Synchronization**: When an active save is loaded (`loadSave(saveData)`), dependent workstations (Level Simulator, Faction Journal, Equipment Studio, Calculators) consume the actual live save data. Calling `clearSave()` returns tools to planner build mode.

---

### C. Travel choices for imported saves

Travel stores edits to save-derived guild, Intervention, held-item, carrying and
constant-movement options under `silt-travel-options-v1` in this browser. Entries
are keyed by world profile and the SHA-256 of the uncompressed SLT1 save body, so
reloads and cloud/local restores reuse the snapshot's choices despite new load
tokens. A different snapshot or profile has its own edits. The store retains at
most 20 snapshots and saves only validated player overrides, not copied defaults.
Catalog arrivals apply fresh save defaults first, then overrides; denied storage
retains edits for the current session and reports that they will not survive reload.
“Use save defaults” removes only the current entry. Clearing the active save returns
Travel's manual planner defaults. Route style/objective/followers are separate from
save-derived overrides and remain governed by the route controls and shared link.

Intervention availability reads saved Mysticism, Willpower, Luck, Fatigue and current
Magicka with published Spells cost/alwaysSucceeds fields from the existing carrying
feature. Known spells default on at an estimated chance of at least 75% with enough
current Magicka; this threshold is a planner policy. Lower/unknown chances require
explicit selection, while zero chance and insufficient Magicka are excluded.
Scrolls default off and count positive integer inventory stacks. The route search
tracks remaining scrolls by Intervention kind and a shared Magicka budget across
all legs, including named places and teleport-connected places. Replanning starts
from the snapshot's quantities without modifying the imported save. Routes assume
successful casts and no Magicka recovery. Explicitly selected spells without cost
or current Magicka data cannot have their Magicka budget checked. Temporary Silence and other unmodeled
cast modifiers are excluded from the estimate.

### D. Travel time and Cheapest comparisons

Outdoor movement edges carry `movementSeconds` alongside in-game `hours`, including
separate run/swim timing, Water Walking and flight. Seconds are computed before
timescale; paid transport and teleport clock jumps are counted as transitions,
not converted into real-time minutes. Indoor movement remains uncounted. Invalid
or unknown movement records cannot produce a claimed complete movement duration.

Route results show “Real Time Approximation” and explicitly label game-clock time.
The estimate excludes combat, menus, loading screens, detours and indoor movement.
Cheapest computes a Fewest legs baseline from the same graph, player prices and
resource budgets, then compares known fares, outdoor movement, transitions and legs.
The comparison is derived state; changing options or endpoints recomputes it and
never spends inventory. Fastest continues minimizing in-game hours.

## 2. Binary Codec (`lib/cloud-save-codec.mjs`) — `SLT1`

To store comprehensive character saves within Cloudflare D1's row size constraints and localStorage, Silt Strider implements a specialized binary format:

- **Format version**: 2 only. Version 1 site saves are rejected; import the original OpenMW save again. Identity, positions, created items and full build snapshot fields are required in the binary layout.
- **Magic Header**: `SLT1` (0x53, 0x4C, 0x54, 0x31)
- **Compression**: Combines variable-length integer encoding (varints), bitmasks, enumerated integer tables for attributes/skills/factions, and dictionary string pools for arbitrary cell names and IDs.
- **Efficiency**: Achieves approximately 96% compression compared to raw JSON (~4 KB binary vs ~100 KB JSON), enabling complete game state persistence within minimal storage footprints.
- **Zero-Bypass Validation**: Validated on unpack; corrupt payloads or unsupported schema versions produce explicit, safe error states.

---

## 3. Shell State & Permalinks (`components/shell-context.jsx`, `lib/permalink-codec.mjs`)

- **Routing**: Canonical paths (`/builder`, `/challenge`, `/account`, etc.) with explicit `world` and `arce` query parameters.
- **Permalinks**: Build and run payloads use Base64URL query parameters. Retired hash routes and view aliases are not decoded.

---

## 4. Cloud Character Vault & Account Architecture

### A. Cloudflare D1 Schema (`cloudflare/migrations/`)
1. `0001_saved_characters.sql`: Historical prototype schema; retained as applied migration history.
2. `0002_cloud_save_vault.sql`: Comprehensive `cloud_saves` table, user tier quotas, triggers, and views (`v_cloud_save_headers`, `v_user_entitlements`).
3. `0003_account_profiles.sql`: Username, icon and update timestamp only; no world/tool preferences.
4. `0004_premium_support.sql`: Supporter entitlements and verification mappings.
5. `0005_premium_currencies.sql`: One-time tips in any currency.
6. `0006_remove_empty_prototype.sql`: Retires the prototype table only if empty; refuses to discard rows.

Account world/tool preferences are currently browser-local. Preparation for a
separate versioned `account_settings` table is documented in
[ACCOUNT_SETTINGS.md](ACCOUNT_SETTINGS.md). Its SQL remains outside the applied
migrations directory; the account API and workstations do not use it yet.
The approved contract also covers theme, pinned-version update notices,
Travel/Gear/Challenge defaults, dataset-specific overrides and preference resets.

### B. Entitlements & Ko-fi Integration
- **Free Tier**: 5 cloud save slots.
- **Supporter Tier**: 25 cloud save slots.
- **Ko-fi Webhook**: Handled via `cloudflare/routes/premium.mjs`, validating incoming payment tokens and automatically upgrading user entitlements in D1.
- **Authentication**: Verified via Clerk (`@clerk/backend`) in `cloudflare/auth.mjs`.

---

## 5. Game Data Boundary

The web application does NOT extract or rebuild game data at runtime. It consumes content-addressed, immutable JSON bundles served from `public/game-data/<bundleId>/` and staged via `npm run data:stage`. See [docs/DATA_LOADER.md](DATA_LOADER.md) for bundle hashing and loader contracts.
