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

## 2. Binary Codec (`lib/cloud-save-codec.mjs`) — `SLT1`

To store comprehensive character saves within Cloudflare D1's row size constraints and localStorage, Silt Strider implements a specialized binary format:

- **Magic Header**: `SLT1` (0x53, 0x4C, 0x54, 0x31)
- **Compression**: Combines variable-length integer encoding (varints), bitmasks, enumerated integer tables for attributes/skills/factions, and dictionary string pools for arbitrary cell names and IDs.
- **Efficiency**: Achieves approximately 96% compression compared to raw JSON (~4 KB binary vs ~100 KB JSON), enabling complete game state persistence within minimal storage footprints.
- **Zero-Bypass Validation**: Validated on unpack; corrupt payloads or unsupported schema versions produce explicit, safe error states.

---

## 3. Shell State & Permalinks (`components/shell-context.jsx`, `lib/permalink-codec.mjs`)

- **Routing**: Silt Strider is a client-side single-page application. Tool navigation is hash-based (`#builder`, `#level`, `#challenge`, `#factions`, `#gear`, `#vault`, `#alchemy`, `#enchanting`, `#spellmaking`, `#travel`).
- **Permalinks**: State is encoded into URL hashes using a pure ESM Base64URL codec (`lib/permalink-codec.mjs`). URLs preserve character build configurations and challenge seeds across browsers without requiring backend storage.

---

## 4. Cloud Character Vault & Account Architecture

### A. Cloudflare D1 Schema (`cloudflare/migrations/`)
1. `0001_saved_characters.sql`: Legacy character builder sheet table.
2. `0002_cloud_save_vault.sql`: Comprehensive `cloud_saves` table, user tier quotas, triggers, and views (`v_cloud_save_headers`, `v_user_entitlements`).
3. `0003_account_profiles.sql`: Account display settings, preferences, and default profile options.
4. `0004_premium_support.sql`: Supporter entitlements and verification mappings.

### B. Entitlements & Ko-fi Integration
- **Free Tier**: 5 cloud save slots.
- **Supporter Tier**: 25 cloud save slots.
- **Ko-fi Webhook**: Handled via `cloudflare/routes/premium.mjs`, validating incoming payment tokens and automatically upgrading user entitlements in D1.
- **Authentication**: Verified via Clerk (`@clerk/backend`) in `cloudflare/auth.mjs`.

---

## 5. Game Data Boundary

The web application does NOT extract or rebuild game data at runtime. It consumes content-addressed, immutable JSON bundles served from `public/game-data/<bundleId>/` and staged via `npm run data:stage`. See [docs/DATA_LOADER.md](DATA_LOADER.md) for bundle hashing and loader contracts.
