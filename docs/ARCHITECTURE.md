# Silt Strider Tools — System Architecture & Data Discipline

`siltstrider.tools` is a web platform for character planning, progression analysis, and game-system simulation across **Morrowind**, **Tamriel Rebuilt**, and **ARCE**.

The project exemplifies **data architecture, release discipline, and producer–consumer contract validation**: turning complex 20-year-old binary game files into verified, content-addressed web artifacts consumed by a modern React 19 interface.

---

## 1. High-Level Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│     Data Pipeline (OpenMW Decompiler - Python/SQLite)  │
│  Binary ESM/ESP/omwaddon extraction → Normalized DBs   │
│  → Analytical Policies → Content-Addressed JSON Bundle │
└───────────────────────────┬────────────────────────────┘
                            │ Immutable Release Artifact
                            │ (SHA-256 Manifest + Catalogs)
                            ▼
┌────────────────────────────────────────────────────────┐
│        Staging Boundary (scripts/stage-game-data.mjs)  │
│  Integrity check → Stage to public/game-data/<hash>/   │
│  → Atomic pointer switch at current.json               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        Browser Runtime (Next.js 16 / React 19)         │
│  lib/bundle-loader.mjs verifies manifest hashes        │
│  Pure ESM zero-dependency math engines in lib/         │
│  Declarative CRPG Workstations in components/          │
│  Client-side hash routing via lib/permalink-codec.mjs  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│    Cloud Edge Layer (Cloudflare Workers & D1 SQL)      │
│  Clerk Auth verification                               │
│  SLT1 Binary Codec (~96% compression for character saves)│
│  Ko-fi Webhook integration for supporter tiers         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### A. Producer–Consumer Contract & Content Addressing
- Game data is extracted and published by an independent pipeline repository (`lowgraph/openmw-decompiler`).
- Releases are published as immutable, content-addressed bundles named by their SHA-256 hash (e.g. `public/game-data/6dbd919f45c24dbd2bcc8427/`).
- The web application consumes bundles through `lib/bundle-loader.mjs`, which enforces schema contracts and verifies catalog hashes against `manifest.json`.
- Delta inheritance is supported across game profiles (`vanilla` → `tr` → `tr_arce`), reducing redundant data transfer.
- Staging is guarded by `scripts/stage-game-data.mjs`, ensuring no corrupted or partial bundle can ever be pointed to by `current.json`.

### B. Pure ESM Math & Simulation Core
All game logic and formulas live in pure, zero-dependency ECMAScript modules in `lib/`:
- `character-math.mjs`: Core attributes, skills, racial abilities, and birthsign derivations.
- `level-math.mjs`: Level advancement, non-retroactive Endurance health scaling, training cost optimization, and archetype detection.
- `alchemy-math.mjs`: Exact OpenMW potion calculation engine accounting for apparatus tier, skill, and ingredient effects.
- `enchant-math.mjs`: Cast cost, charge capacity, and Constant Effect requirements.
- `spell-math.mjs`: Spellmaking cost and casting chance derivations.
- `travel-graph.mjs`: Directed graph pathfinding for shortest-hop transit across boat, silt strider, and guild guide networks.
- `faction-math.mjs`: FADT rank requirements, promotion deficit calculation, and mutual exclusion matrices.
- `best-in-slot.mjs`: Policy-driven gear ranking and equipment optimization.

### C. CRPG Authenticity with Modern React 19
- **App Shell**: Single-page architecture mounted by `components/app-shell.jsx`, rendering 13 specialized workstations.
- **Design Tokens**: Standardized Morrowind CRPG design tokens (`app/globals.css`, `app/theme-ashfall.css`) using native CSS custom properties, 9-slice borders, and the Pelagiad font.
- **Responsive Layout**: Adapts from full desktop workstations to mobile viewports with a dedicated mobile tab bar and responsive drawers.

### D. Save Import & Cloud Vault Architecture
- **Binary OpenMW Import**: `lib/omwsave-parser.mjs` directly parses binary `.omwsave` files in the browser, extracting live character vitals, inventory, skills, and factions.
- **Binary Codec (SLT1)**: `lib/cloud-save-codec.mjs` serializes complete save data into a compact binary format (~96% smaller than JSON) for storage in Cloudflare D1 and localStorage.
- **Cloudflare Edge**: Serverless API routes in `cloudflare/routes/` handle authenticated multi-save sync, account settings, and Ko-fi supporter entitlements.
