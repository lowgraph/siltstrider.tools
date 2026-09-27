# Agent Path Migration Guide — Silt Strider Tools

Date: 2026-09-26  
Migration branch: `portfolio/restructure` — merged on 2026-09-26  
Canonical branch: `main`

> [!NOTE]
> The historical migration branch (`portfolio/restructure`) has been merged into `main` and retired. Agents must work directly on the canonical default branch (`main`) using the canonical paths defined below. Do not search for, checkout, or recreate the retired migration branch.

This guide defines canonical repository locations, path migrations, and operational guidelines for AI agents working in `siltstrider.tools`.

---

## 1. Repository Map

| Area | Canonical Path | Description |
|---|---|---|
| **App Routing & Styles** | `app/` | Next.js App Router root (`layout.jsx`, `page.jsx`, `globals.css`, `theme-ashfall.css`, `legacy-compat.css`) |
| **UI Workstations** | `components/` | React 19 UI workstation components organized by domain (`character-builder/`, `level-simulator/`, `calculators/`, `equipment-studio/`, `journal-factions/`, `character-vault/`, etc.) |
| **Pure ESM Domain Logic**| `lib/` | Math calculation engines, binary codecs, parsers, and bundle loader (`*-math.mjs`, `cloud-save-codec.mjs`, `omwsave-parser.mjs`, `bundle-loader.mjs`) |
| **Backend & Database** | `cloudflare/` | Cloudflare Worker (`worker.mjs`), API routes (`routes/`), and D1 SQL migrations (`migrations/`) |
| **Documentation** | `docs/` | System architecture (`ARCHITECTURE.md`), state design (`STATE.md`), loader contracts (`DATA_LOADER.md`), and account specs (`ACCOUNT_PROFILES.md`, `PREMIUM.md`) |
| **Historical Archive** | `docs/archive/` | Historical migration records (`docs/archive/STATE.md`, `docs/archive/MIGRATION.md`) |
| **Legacy Code Archive** | `archive/legacy/` | Phase 13 archival of retired DOM workbench and prebuild extraction scripts |
| **Static Assets & Data** | `public/` | Fonts, textures, and immutable staged game bundles (`public/game-data/<bundleId>/`) |
| **Tooling & Build Scripts**| `scripts/` | Data staging (`stage-game-data.mjs`), Cloudflare static export build (`build-cloudflare.cjs`), asset deployer (`cloudflare-assets.cjs`) |
| **Automated Tests** | `test/` | Node test runner test suites (`test/*.test.js`) |

---

## 2. Path Migration Table

| Deprecated / Old Path | Canonical New Path | Purpose |
|---|---|---|
| `DATA_LOADER.md` | `docs/DATA_LOADER.md` | Content-addressed bundle contract and loader specification |
| `ACCOUNT_PROFILES.md` | `docs/ACCOUNT_PROFILES.md` | Cloudflare D1 account profile specification |
| `PREMIUM.md` | `docs/PREMIUM.md` | Ko-fi supporter entitlement specification |
| `STATE.md` | `docs/archive/STATE.md` | Historical Phase 1 DOM-as-state specification |
| *(new)* | `docs/STATE.md` | Current React 19 state, active save, and SLT1 codec specification |
| *(new)* | `docs/ARCHITECTURE.md` | System architecture, contracts, and data discipline guide |
| `MIGRATION.md` | `docs/archive/MIGRATION.md` | Historical Next.js migration notes |

---

## 3. Invariants Kept at Root

The following files deliberately remain at the repository root:
- `index.html`: Monolithic reference implementation used as an active regression fixture by `test/site.test.js` and `archive/legacy/scripts/dev-server.cjs`.
- `README.md`: Primary public project documentation.
- `CHANGELOG.md`: Detailed chronological release log.
- `COORDINATION.md`: Multi-agent contract sync document, shared with the data pipeline repository.
- `UI_TRANSFORMATION.md`: Detailed 13-phase UI transformation roadmap.

---

## 4. Supported Commands & Verification

- **Install dependencies**: `npm ci` (Node.js >=22.11.0)
- **Run automated test suite**: `npm test` (executes the complete test suite via `node --test test/*.test.js`)
- **Local dev server**: `npm run dev` (starts Next.js at `http://127.0.0.1:8765`)
- **Production Next.js build**: `npm run build`
- **Cloudflare static export build**: `npm run build:cloudflare` (runs `node scripts/build-cloudflare.cjs`)
- **Stage game data**: `npm run data:stage` (validates and stages bundle from the configured local data workspace)

---

## 5. Agent Invariants

1. **Cross-Repo Boundary**: Never modify data extraction logic inside this web application repository. Game data is authored and extracted exclusively by the sibling data pipeline repository (`lowgraph/openmw-decompiler`) and ingested via versioned bundles.
2. **Deterministic Domain Core**: `lib/` must remain pure ESM without JSX, DOM, or framework dependencies.
3. **No Stale Extraction Hooks**: The legacy prebuild extraction hook (`npm run extract:legacy`) was retired in Phase 13. Never attempt to run it.
4. **No Secrets**: Never commit `.env.local`, `.env.production.local`, or live Clerk keys.
