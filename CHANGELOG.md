# Changelog

All notable changes to the **Silt Strider** Morrowind character planner, calculators, and tools will be documented in this file.

## Open a Save — 2026-09-22

### Highlights
- **Open an OpenMW save without signing in:** the vault's new "Open a Save in Silt Strider" input reads a `.omwsave` in the browser; nothing is uploaded.
- **The builder takes the character over:** name, race, gender, birthsign, class (custom classes included, with specialization and favoured attributes) and the matching game profile (Vanilla, TR or TR + ARCE, chosen from the save's content files).
- **Everything the save could not carry is listed, not guessed:** a notice names mod classes, races, signs and items the catalogs do not know, and, for level-1 saves, every value where the save's mods differ from Morrowind's rules.
- **Equipment Studio:** a "Worn by <name>" loadout with the gear the character is wearing, rated with their real skills and attributes.
- **Level Simulator:** plan from the save's level and stats, or from the build at level 1.
- **Journal:** factions, ranks and quest progress come from the save.
- **Cloud saves** keep gender, specialization and favoured attributes; older saved payloads still load.
- 356 site tests pass.

### Front page and navigation
- **Drop a save to start:** the home page leads with a drop zone for OpenMW saves (drop anywhere on the page, or choose a file). "Start a new build" is the second option, right under the world choice.
- **World choice up top:** Vanilla, Tamriel Rebuilt or TR + ARCE is picked in the hero instead of at the bottom of the page; the header switch stays on every page.
- **Tools weighted by use:** Alchemy and Travel get large cards (Alchemy shows your brew chance); Challenge Runs and Cloud Vault move to a slim row.
- **Header:** Alchemy and Travel join the nav row; Challenge Runs moves under More; the Cloud Vault is an account button beside search. The phone tab bar swaps Challenge for Alchemy.
- 367 site tests pass.

### Fixes from testing
- **Challenge runs stay put:** leaving the page (to open the character in the Build Optimizer, say) no longer clears the run, and a reload keeps it.
- **Difficulty ticks are respected:** Generate no longer rolls Hard or Grind restrictions with those bands unticked; "Reach level 50" now counts as Grind.
- **Seeds reproduce runs:** a seed carries the world, difficulty bands and counts, and rolls the same run wherever it is loaded.
- **Permalinks work:** Share copies a link that opens the exact run, in its world. Copy Build Link, and the vault's share, now copy a link that opens the character too.
- **Send the build back:** a character sent to the Build Optimizer can go back to its challenge run, with any changes.
- **Your settings are remembered:** your preferred bands and counts are kept on this device; a loaded seed's settings are only for its run.
- **Enchant capacity on the game's scale:** the Gear Advisor showed record points (Exquisite Shirt 600); it now shows what the game shows (60). Silver Staff on the Enchanting page is 5.6, not 30.
- **Dead buttons fixed:** Level Optimizer, Back to Character Builder and the vault's shortcuts navigate again.
- **TR + ARCE in the top bar:** the world switch offers Vanilla, Tamriel Rebuilt and TR + ARCE side by side.
- 383 site tests pass.

## [Phase 13] Legacy Cleanup & Architecture Archival — 2026-09-21

### Highlights
- **Legacy Harness Archival (`archive/legacy/`):**
  - Moved obsolete DOM workbench `components/legacy-workbench.jsx` to `archive/legacy/components/`.
  - Moved legacy extraction scripts (`scripts/extract-legacy.cjs`, `scripts/connect-character-runtime.cjs`, `scripts/connect-alchemy-runtime.cjs`) and preview dev server (`scripts/dev-server.cjs`) to `archive/legacy/scripts/`.
  - Moved legacy migration event bridges (`migration/shell-bridge.js`, `migration/character-bridge.js`) to `archive/legacy/migration/`.
  - Created `archive/legacy/README.md` documenting the historical context of the DOM-slicing migration harness.
- **Native Style Bundling & Entry Point Decoupling (`app/legacy-compat.css`, `app/layout.jsx`):**
  - Ingested baseline legacy styles into `app/legacy-compat.css` with local fonts (`/fonts/Pelagiad.ttf`) and textures (`/textures/mw-*.png`).
  - Imported `legacy-compat.css` directly into `app/layout.jsx`, eliminating external runtime stylesheet links (`<link rel="stylesheet" href="/legacy/legacy.css" />`) from `app/page.jsx`.
  - Completely cleaned and removed `public/legacy/` from disk while maintaining `.gitignore` protection.
- **Build & Cloudflare Pipeline Decoupling:**
  - Decoupled `scripts/build-cloudflare.cjs` to remove `extract-legacy.cjs` execution.
  - Removed `"extract:legacy"` script from `package.json` and repointed `"dev:legacy"` to the archived dev server.
- **Regression Test Re-anchoring:**
  - Re-anchored `test/migration.test.js`, `test/character-catalogs.test.js`, `test/alchemy-catalogs.test.js`, and `test/auth.test.js` to archived script locations.
  - 100% test pass rate across 297 site tests (`npm test`) and 482 pipeline tests (`unittest discover`).

## [Phase 12] Modern App Shell & Architecture Decoupling — 2026-09-21

### Highlights
- **Native React App Shell (`components/app-shell.jsx`):**
  - Completely replaced the legacy HTML extraction harness (`LegacyWorkbench.jsx`, `dangerouslySetInnerHTML`, and 11 `createPortal` mounts) with a declarative, native React 19 / Next.js 16 application layout.
  - Renders all 12 tools (`home`, `builder`, `challenge`, `leveler`, `factions`, `enchanting`, `spellmaking`, `alchemy`, `travel`, `vault`, `about`, `changelog`) cleanly inside `<main className="site-main">`.
  - Automatic `view-${view}` body class synchronization and persistent `<SiteHeader />`, `<SiteFooter />`, and `<CloudVaultModal />`.
- **Pure ESM Permalink Codec & Hash Sync Engine (`lib/permalink-codec.mjs`):**
  - Universal safe UTF-8 Base64URL encoder and decoder for character build states, challenge runs, and game profile flags (`vanilla`, `tr`, `tr_arce`).
  - Strict input sanitation with prototype pollution defense and safe fallbacks for corrupted hashes or legacy aliases (`#optimizer`, `#TR`, `#ARCE`).
  - Bidirectional hash event synchronization via modernized `components/shell-context.jsx` preserving seamless browser back/forward history navigation.
- **Challenge Engine Decoupling (`lib/challenge-engine.mjs`):**
  - Extracted card aspect rolling, seed reproducibility, lock preservation, and mutual restriction conflict resolution into a pure ESM engine.
- **Native React Static Views (`components/views/` & `components/site-footer.jsx`):**
  - Replaced legacy static markup for `#panel-about` and `#panel-changelog` with responsive, accessible React components (`AboutView` and `ChangelogView`).
  - Implemented authentic CRPG footer with legal disclaimers, open-source attribution, and keyboard-accessible modal navigation hooks.
- **Asset Ingestion & CRPG Design Tokens (`app/globals.css`):**
  - Ingested local Pelagiad font (`public/fonts/Pelagiad.ttf`) and Morrowind 9-slice border textures (`public/textures/mw-border.png`, `mw-bevel.png`, `mw-groove.png`).
  - Established formal `:root` tokens for `--ink`, `--paper`, `--gold`, and procedural 9-slice border styles without external or inline asset dependencies.
- **Legacy Extraction Hook Deprecation (`package.json`, `app/page.jsx`):**
  - Retired `scripts/extract-legacy.cjs` from `predev` and `prebuild` npm hooks.
  - Decoupled `app/page.jsx` from `manifest.json` and query parameters, rendering `<AppShell />` directly.
  - Next.js production build compile time reduced to **592ms** (down from >6s).
- **Test Integrity & Adversarial QA:**
  - Authored unit and adversarial test suites for permalinks (`test/permalink-codec.test.js`), challenge engine (`test/challenge-engine.test.js`), and app shell routing (`test/app-shell.test.js`).
  - 100% test pass rate across 297 site tests (`npm test`) and 482 pipeline tests (`unittest discover`).

## [Best-In-Slot Gear Advisor & Bundle Integration] — 2026-09-20

### Highlights
- **Best-In-Slot Bundle Feature Integration (`lib/bundle-loader.mjs`):**
  - Added `bestInSlot: Object.freeze(['BestInSlot', 'Armor', 'Clothing', 'Weapons'])` to `FEATURE_CATALOGS`.
  - Added contract verification in `test/bundle-contract.test.js` ensuring all 4 catalogs load cleanly across `vanilla`, `tr`, and `tr_arce` profiles.
- **Client-Side Best-In-Slot Scoring & Resolution Engine (`lib/best-in-slot.mjs`):**
  - Implemented `picksForBuild`, `deriveBuildTraits`, `scoreItem`, `findClosestBuildRecord`, and `resolveBestInSlotPicks` adhering strictly to `best-in-slot-types.ts` and `build_best_in_slot_catalog.py` specifications.
  - Matches 122 pre-computed `BuildPicks` records for canonical premade builds and dynamically scores custom characters using the catalog's embedded scoring model.
  - Evaluates drawback rules and severities (disqualifying vs significant with mitigations), fortify skills and attributes, armor rating scaling, weapon damage contributions, and beast race equipment filters (beast races excluded from closed helmets and footwear).
  - Categorizes resolved recommendations into 3 clean groups: Optimized Armor & Shield, Optimized Weapons, and Constant-Effect Clothing & Jewelry (featuring distinct Ring 1 and Ring 2 picks).
- **CRPG Best-In-Slot UI View (`components/character-builder/best-in-slot-view.jsx`):**
  - Designed authentic Morrowind-themed late-game equipment dossier under `<details open className="best-in-slot-recommendations"><summary>Optimized endgame kit</summary>`.
  - Renders slot labels, item names with gold highlights, key combat stats (AR, damage, effect summary), score badges, scoring rationale chips, and drawback warnings with mitigations.
  - Displays rich acquisition details (placed in world with easiest level, quest reward tags, and formidable level warnings).
  - Supports expandable runner-up / alternative picks per slot.
- **Gear Advisor Wiring (`components/character-builder/gear-advisor.jsx`):**
  - Wired `useGameData('bestInSlot')` into `GearAdvisor` and `GearAdvisorView`.
  - Renders live `BestInSlotView` recommendations when bundle is ready upon clicking "Optimize Gear", with clean backward-compatible fallback to legacy `gearHtml`.
  - Fully responds to character changes, beast race restrictions, and the "Endgame gear early" toggle (`allowFormidableSources`).
- **Comprehensive Automated QA & Adversarial Edge Cases:**
  - Added `test/best-in-slot.test.js` with 12 unit, integration, and adversarial tests covering:
    - Pre-computed picks and formidable toggle behavior (e.g. King Helseth's Royal Signet Ring inclusion/exclusion).
    - Drain Magicka disqualification on casters vs non-casters.
    - Beast race footwear/helmet exclusion.
    - React UI rendering of `BestInSlotView` and `GearAdvisorView` with runner-up toggling.
    - 3 adversarial edge-case suites (Rule 3): null/undefined/malformed inputs, exact boundary level 30 vs 31 with quest overrides, and empty custom characters.
  - 100% test pass rate: 275/275 tests in `A:\Claude\morrowind-tools`, 445/445 tests in `OpenMW Decompiler`.

## [Phase 11] Faction Journal & Promotion Deficit Engine — 2026-09-20

### Highlights
- **Faction Journal Workstation (`components/journal-factions/`):** Introduced a full-featured CRPG Faction Journal workstation for tracking faction affiliations, rank promotions, attribute/skill deficits, inter-faction diplomacy, and linked guild quests. Designed strictly with authentic Morrowind UI aesthetics: Pelagiad font, `--mw-bevel` button styling, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold headings `#d4b06a`, and deep inset frames.
  - **Master Split-Pane Workspace (`journal-factions-root.jsx`):** Features responsive split-pane layout, profile-aware live game bundle status (`• Live: 27 Factions (VANILLA)`), active character build summary from `CharacterContext`, and interactive join/leave faction membership toggle with vault save synchronization.
  - **Searchable Faction Roster (`faction-roster.jsx`):** Provides real-time text search across faction names, favoured attributes, and skills, with 8 category filter tabs (`All Factions`, `Guilds`, `Great Houses`, `Imperial`, `Religion & Cults`, `Native & Ashlanders`, `Vampire Clans`, `My Memberships`), active faction selection, owned world placement counts, and status badges (`Eligible to Join`, `Unqualified`, `Non-joinable`, `Member · Rank Name`, `⚠ Expelled`).
  - **Interactive Faction Dossier View (`faction-detail-view.jsx`):**
    - **10-Rank Stepper Track:** Displays ranks 0 through 9 with current rank badge, reputation thresholds, and click-to-inspect requirements for any rank.
    - **Promotion Requirements & Deficit Solver:** Evaluates character attributes and skills against canonical FADT thresholds. Displays individual progress meters with color-coded qualification indicators (`✓` or `(Need +X)`), and aggregates promotion gaps into actionable instructions.
    - **Simulated Reputation Control:** Interactive input allowing players to simulate different faction reputation values to test future promotion eligibility.
    - **Mutual Exclusivity Warning:** Automatically detects and alerts on rival faction conflicts (e.g. Great House Hlaalu vs Redoran/Telvanni, rival vampire clans).
    - **Diplomatic Standing & Inter-Faction Relations:** Maps allied reactions (+1 to +3) and hostile/rival reactions (-1 to -3) with disposition adjustments.
    - **Associated Faction Quests Ledger:** Displays all quests associated with the faction prefix with quest key, finish index, and progress status.
- **Canonical Morrowind Faction Promotion Engine (`lib/faction-math.mjs`):**
  - Implemented pure calculation functions: `normalizeStatKey`, `getStatValue`, `joinableFactions`, `meetsRank`, `getHighestEligibleRank`, `solvePromotionGaps`, `MUTUAL_EXCLUSIONS`, `getMutualExclusionConflict`, `getFactionReactions`, and `getFactionQuests`.
  - Strictly models canonical Morrowind FADT promotion rules: requires both favoured attributes $\ge$ rank thresholds; requires 1 skill $\ge$ primary skill threshold, and 2 other favoured skills $\ge$ favoured skill threshold; faction reputation $\ge$ rank reputation.
- **Bundle Loader & Game Data Integration:**
  - Added `factions: Object.freeze(['Factions', 'Quests', 'Skills', 'Attributes'])` to `FEATURE_CATALOGS` in `lib/bundle-loader.mjs`.
  - Wired into `useGameData('factions')` for seamless content-addressed loading with graceful fallback.
- **Navigation & Legacy Shell Integration:**
  - Registered `factions: 'factions'` in `migration/shell-bridge.js`.
  - Added `#panel-factions` panel to `index.html` and wired through `showView('factions')`, `calcViews`, and `deskNavIds`.
  - Added Faction Journal to site header desktop dropdown (`#react-desk-factions`) and mobile drawer, preserving single-row desktop header invariant.
  - Added Faction Journal launcher card to Home Hub directory (`tool-directory-grid.jsx`), expanding canonical tools to 9.
  - Mounted `JournalFactionsRoot` via React portal in `components/legacy-workbench.jsx`.
- **Legacy HTML Byte Budget Compliance:**
  - Extracted legacy body: 48,906 bytes (strict budget < 50,000 bytes with 1,094 bytes headroom).
- **Automated QA & Adversarial Test Coverage:**
  - Added `test/faction-math.test.js` (7 test suites) and `test/journal-factions-ui.test.js` (7 UI integration & adversarial test suites).
  - Updated `test/home-hub-ui.test.js` and `test/bundle-contract.test.js`.
  - 100% test pass rate: 262/262 tests in `A:\Claude\morrowind-tools`, 445/445 tests in `OpenMW Decompiler`.
  - Headless Chrome CDP visual layout verification at 1440x950 and 390x844 viewports.

---



### Highlights
- **Specialized Workstations Live Data Rewiring:** Completely wired all 4 specialized workstations (`Enchanting`, `Spellmaking`, `Alchemy`, `Travel`) to the content-addressed game data bundle loader (`lib/bundle-loader.mjs` and `useGameData`), moving off static legacy extracts to dynamic, profile-aware bundle data with clean fallbacks.
- **Bundle Loader Feature Catalog Expansion (`lib/bundle-loader.mjs`):**
  - Expanded `FEATURE_CATALOGS` to include:
    - `travel: Object.freeze(['Travel', 'Places'])`
    - `enchanting: Object.freeze(['MagicEffects', 'GameSettings', 'Enchantments', 'EffectRules', 'Merchants'])`
    - `spellmaking: Object.freeze(['MagicEffects', 'GameSettings', 'EffectRules', 'Merchants'])`
  - Validated immutable profile inheritance and delta resolution across `vanilla`, `tr`, and `tr_arce`.
- **Dynamic Travel Graph Adapter (`lib/travel-graph.mjs`):**
  - Implemented `adaptTravelGraph(records, nodes)` to dynamically compile live transit networks from bundle `Travel` records and node metadata.
  - Normalizes settlement names (strips Guild of Mages, Wolverine Hall, and Vivec canton suffixes) and maps transit modes (`silt_strider`, `guild_guide`, `gondola`, `riverstrider`).
  - Extended `buildNetworkGraph`, `getAvailableTransitStops`, and `findFewestHopsRoute` to accept dynamic custom graphs with seamless fallback to static network tables.
- **Three-Toggle Gear Acquisition Policy & Gear Advisor Integration:**
  - Added `#gear-near-start` ("Near starting areas") toggle to `index.html` `.gear-toggles` group and wired through `earlyGearOptions()`.
  - Updated `components/character-builder/gear-advisor.jsx` with bi-directional DOM synchronization (`handleToggleNearStart`), `resolveRanking()`, and direct connection to `useGameData('gear')`.
- **Live Workstations Features:**
  - **Alchemy Workstation (`alchemy-workstation.jsx`):** Consumes `useGameData('alchemy')`, dynamically loads live ingredients and apparatus tiers from bundle catalogs via `adaptAlchemy`, and displays live status badge `• Live: 126 Ing. (PROFILE)`.
  - **Enchanting Workstation (`enchanting-workstation.jsx`):** Consumes `useGameData('enchanting')`, filters effects using `allowEnchanting === true` from live `EffectRules`, extracts enchanters using `servicesRaw & 65536` (`0x10000` service bit) from live `Merchants`, and displays live status badge `• Live: 129 Effects · 24 Vendors (PROFILE)`.
  - **Spellmaking Workstation (`spellmaking-workstation.jsx`):** Consumes `useGameData('spellmaking')`, filters spells using `allowSpellmaking === true` from live `EffectRules`, extracts spellmakers using `servicesRaw & 32768` (`0x8000` service bit) from live `Merchants`, and displays live status badge `• Live: 129 Spells · 43 Vendors (PROFILE)`.
  - **Travel Workstation (`travel-workstation.jsx`):** Consumes `useGameData('travel')`, dynamically builds network graphs via `adaptTravelGraph`, and displays live status badge `• Live: 21 Stops (PROFILE)`.
- **Automated QA & Adversarial Test Coverage:**
  - Added contract tests in `test/bundle-contract.test.js` verifying `loadFeature` decoding for `travel`, `enchanting`, and `spellmaking`.
  - Created `test/live-workstations.test.js` targeting edge conditions: malformed records, missing nodes, self-loops, disconnected transit networks, all 8 boolean toggle permutations for gear policy, and merchant bitmask service isolation.
  - 100% test pass rate across all 247 site test suites and 396 pipeline test suites.
  - Turbopack production build compiled and statically optimized in 1.2s with zero errors.

---

## [Phase 9] Equipped Loadouts & Equipment Inspector — 2026-09-20

### Highlights
- **Categorized CRPG Equipment Ledger (`components/equipment-studio/equipment-ledger.jsx`):** Introduced a clean, structured CRPG equipment ledger organizing all 19 canonical equipment slots into distinct Defense and Attire rosters with a compact tactical character identity banner. Purges any paper doll or mannequin concepts in favor of authentic CRPG table ergonomics. Designed strictly with Morrowind UI invariants: procedural CRPG SVG glyphs, 4px `--mw-bevel` buttons, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold headings `#d4b06a`, deep inset frames, zero emojis, and zero modern neon hues.
- **Tactile Equipment Slot Cards (`equipment-slot-card.jsx`):** Renders all 19 canonical equipment slots (Helmet, Pauldrons, Cuirass, Gauntlets, Greaves, Boots, Shield, Weapons, Ammunition, Robe, Shirt, Pants, Skirt, Rings, Amulet, Belt) with procedural SVG silhouette glyphs, item names, armor rating & weight chips, unequip `✕` actions, and responsive layout.
- **Mathematical Calculations Engine (`lib/equipment-math.mjs`):**
  - **Weighted Total Armor Rating (AR):** Implements Morrowind's canonical slot weighting ratios (Cuirass 30%, Shield 10%, Helmet 10%, Greaves 10%, Boots 10%, Pauldrons 10% each, Gauntlets 5% each) and Unarmored skill formula ($\lfloor \text{UnarmoredSkill}^2 \times 0.0065 \rfloor$) with dynamic skill-scaling armor formulas.
  - **Encumbrance & Carry Capacity:** Accurately models $\text{Strength} \times 5$ carrying capacity with active weight tallying, percentage cap indicator, and tactile visual progress meter.
  - **Main-Hand Weapon Combat Profile:** Computes weapon damage ranges across all three attack types (Chop, Slash, Thrust min-max), weapon speed, reach, and automatic fallback to Hand-to-Hand when unarmed.
  - **Two-Handed vs. Shield Mutual Exclusion:** Equipping a two-handed weapon (claymore, battle axe, warhammer, halberd, staff, bow, crossbow) automatically un-equips the off-hand shield or light source with clear feedback.
  - **Beast Race Equipment Restrictions:** Authentic lore fidelity barring Argonian and Khajiit characters from equipping footwear and closed helmets, with explanatory badge overlays and item picker warnings.
  - **Constant Effect Enchantment Aggregation:** Automatically scans equipped items and aggregates passive constant effect enchantments (attributes, skill fortifications, resistances) into a structured combat ledger.
- **Multi-Loadout Presets System (`loadout-tabs-bar.jsx`):** Up to 4 named equipment loadouts per character (`Primary Combat`, `Secondary / Alternate`, `Stealth & Infiltration`, `Arcane & Utility`) with 1-click tab switching, duplication, renaming, clearing, and curated starter/endgame kit templates (`Seyda Neen Scout`, `Ghostgate Glass Champion`, `Daedric Warlord`).
- **Interactive Item Picker & Custom Forging Drawer (`item-picker-drawer.jsx`):** Slide-in modal drawer with embedded game item catalog across all slots, category filter chips (`ALL`, `LIGHT`, `MEDIUM`, `HEAVY`), instant search, beast restriction indicators, and a custom item forge form for homebrew/artifact gear.
- **Cross-Tool Architecture & Integrations:**
  - **3-Way Studio Mode Bar (`character-builder-root.jsx`):** Expanded Character Builder top navigation to seamlessly toggle between `Custom Class Builder`, `Equipped Loadouts`, and `Premade Builds Catalog`.
  - **Character Sheet Quick Launch (`character-sheet.jsx`):** Added `[ Equipped Loadout → ]` direct navigation button in the Character Sheet quick launch grid.
  - **Gear Advisor Direct Equip Bridge (`gear-advisor.jsx`):** Added `[ Equip Kit to Loadout → ]` action button to equip the algorithmic gear recommendation directly into the active loadout via decoupled event dispatching.
- **Automated QA & Adversarial Test Coverage:** Added 17 unit and adversarial UI tests across `test/equipment-math.test.js` and `test/equipment-studio-ui.test.js`. 100% test pass rate across all 242 site test suites and 335 pipeline test suites.

---

## [Phase 8] Home Hub & Tool Directory Overhaul — 2026-09-20

### Highlights
- **Home Hub CRPG Transformation (`components/home-hub/`):** Transformed the legacy `#panel-home` landing page into an authentic Morrowind CRPG directory hub enclosed in canonical 6-pixel ornate parchment borders (`--mw-border`), Pelagiad typography, warm parchment `#f3e6c8`, gold `#d4b06a`, and deep inset shading.
- **Active Character Session Plaque (`active-session-banner.jsx`):** Integrated a real-time session banner connected to `useActiveCharacter()` from `CharacterContext`. Displays active character identity (Name, Race, Class, Birthsign, Specialization) along with authentic color-coded vitals chips (Health `#b83b3b`, Magicka `#3b6bb8`, Fatigue `#3bb852`) and 1-click continuation controls (`[ Resume Build Optimizer → ]`, `[ Level Simulator → ]`, `[ Cloud Vault ]`). Includes graceful empty-state fallback when no character is active.
- **8-Tool Directory Grid (`tool-directory-grid.jsx` & `tool-launcher-card.jsx`):** Unified all 8 site planning and calculation modules (`builder`, `leveler`, `vault`, `challenge`, `enchanting`, `spellmaking`, `alchemy`, `travel`) into a responsive CRPG grid. Each card features canonical subtitles, feature tags, status badges (`POPULAR`, `NEW`), and tactile `--mw-bevel` action buttons.
- **Game World Profiles Guide (`world-profiles-guide.jsx`):** Added an interactive parchment guide explaining Vanilla Vvardenfell, Tamriel Rebuilt Mainland, and TR + ARCE Rebalance profiles with 1-click profile switching via `window.siltShell.setProfile`.
- **Project Colophon Bulletin (`colophon-bulletin.jsx`):** Established official project metadata, Bethesda/Tamriel Rebuilt data provenance, Pelagiad typeface licensing attribution, and direct links to About, Changelog, and community support.
- **Master Window Isolation & Seamless Hydration:** Enforced `#panel-home:has(.home-hub-root) > *:not(.home-hub-root) { display: none !important; }` in `app/globals.css` to eliminate legacy markup flash during hydration while maintaining preflight fallback compatibility.
- **Adversarial QA & Test Suite:** Added 9 new unit and adversarial test suites (`test/home-hub-ui.test.js`) verifying all 8 launcher cards, rapid profile switching, empty session states, and cross-platform CustomEvent dispatching. All 225 site test suites and 233 pipeline test suites pass with 100% success.
- **Aesthetic Invariants:** 100% adherence to authentic CRPG aesthetic standards: zero emojis, zero modern neon hues, Pelagiad font, `--mw-groove` dividers, and `--mw-bevel` buttons.

---

## [Phase 7] Cloud Character Vault & OpenMW Binary Save Ingestion — 2026-09-20

### Highlights
- **Cloud Character Vault Workstation (`#panel-vault` & Modal Portal):** Introduced an authentic CRPG dossier management portal enclosed in canonical 6-pixel ornate parchment borders (`--mw-border`), accessible from the persistent site header, mobile navigation drawer, and Build Optimizer.
- **Workstation Frame & Panel Isolation:** Configured `#panel-vault` with master window framing (`--mw-border` 6px), deep inset shading, and strict CSS panel hiding (`body.view-vault #panel-home { display: none !important; }`), ensuring an isolated, distraction-free dossier management view matching Character Builder and Level Simulator.
- **Home Launcher Grid Harmonization:** Expanded the Home page launcher grid to 8 cards with the addition of the Cloud Character Vault card (`#btn-go-vault`), balancing the 2x4 layout and wiring seamless `#vault` hash navigation.
- **Client-Side OpenMW Binary Save Parser (`lib/omwsave-parser.mjs`):** Direct in-browser parsing of `.omwsave` binary files (format v37+ and legacy formats). Automatically extracts character name, race, class, birthsign, level, attributes, skills, dynamic vitals, gold, cell/location, inventory, and completed journal quest milestones with zero Node.js/native dependencies.
- **SLT1 Binary Codec & Ultra-Compact Serialization (`lib/cloud-save-codec.mjs`):** Proprietary byte-packed binary codec compressing large ~35 KB character dossiers down to ~1.4 KB BLOBs (~96% compression ratio) for efficient Cloudflare D1 edge database storage.
- **Tiered Cloud Quota Model:**
  - **Free Tier:** 5 cloud character slots with full inventory, quests, and challenge data persistence.
  - **Paid / Supporter Tier:** 25 cloud character slots with automatic tier enforcement via SQLite triggers (`COALESCE(max_saves, 5)`).
- **Offline-First Hybrid Sync Engine (`lib/character-vault.mjs`):** Zero-latency local browser caching in `localStorage` paired with seamless cloud synchronization to Cloudflare D1 via Clerk JWT authentication.
- **1-Click Local Migration & Backup:** Dedicated button allowing players to migrate offline character builds to the cloud in a single click, with bi-directional JSON export/import for complete data portability.
- **Cross-Tool Navigation & Shell Integration:** Quick launch buttons embedded in the Character Sheet header, Local Characters panel, and desktop navigation bar (`[ Cloud Vault ]`).
- **CRPG Aesthetic Standards:** 100% adherence to authentic Morrowind styling: Pelagiad typography, `--mw-bevel` 4px buttons, `--mw-groove` dividers, warm parchment `#f3e6c8`, gold `#d4b06a` accents, zero modern emojis, and zero neon hues.

---

## [Phase 6] Character Level Simulator & Build Progression Optimizer — 2026-09-19

### Highlights
- **Character Level Simulator Workstation (`#panel-leveler`):** Introduced a dedicated progression planning workstation enclosed in the canonical 6-pixel ornate parchment window frame (`--mw-border`) with deep inset shading, fully responsive across desktop and mobile.
- **Dual Progression Modes:**
  - **Stats Only Mode:** High-level attribute goal planning for players who want to set target attributes and see their level cap and health trajectory instantly.
  - **Stats & Skills Mode:** Detailed, level-by-level progression matrix across all 27 skills with filter tabs for Combat, Magic, and Stealth.
- **1-Click Optimization Presets:**
  - **Auto-Calculate Optimal Build:** Detects character archetype (Warrior, Assassin, Mage, Battlemage, Nightblade, Diplomat) and solves the most efficient attribute allocation path to cap attributes with maximum speed.
  - **Rush Endurance (+5):** Prioritizes reaching 100 Endurance as early as possible to maximize non-retroactive level-up health gains.
  - **Triple +5:** Aggressive powerleveling path aiming for three +5 attribute multipliers on every level up.
  - **Efficient (+5/+5/+1 Luck):** Ensures consistent +1 Luck investment on every level up while securing two +5 attribute multipliers.
- **Automated Miscellaneous Skill Trainer Solver:**
  - Dynamically calculates the exact skill training deficit required to earn 5x attribute multipliers.
  - Recommends which specific off-class (Miscellaneous) skills to train each level, picking the lowest and cheapest skills first to avoid burning valuable Major or Minor skill headroom.
  - Computes exact in-game Septims trainer costs for every prescribed training session.
- **Interactive SVG Health Growth Projection Curve:**
  - Dynamic visual chart contrasting optimal Endurance rushing vs. delayed Endurance growth up to the character's exact theoretical level cap.
  - Displays maximum health potential, total stat efficiency percentage, and level cap.
- **Daedric Bitter Cup Toggle:**
  - Seamlessly integrated across character formulas (`lib/character-math.mjs`, `lib/level-math.mjs`), the Character Builder UI, and the Level Simulator.
  - Accurately models the artifact's permanent +20 to highest attribute and -20 to lowest attribute with live stat and health recalculations.
- **Cross-Tool Quick Launch Bridge:**
  - Added a 1-click launch button directly inside the Character Sheet header in Build Optimizer, passing the active build state directly into the simulator without manual configuration.
- **Pure CRPG Authentic Aesthetic Refinement:**
  - Complete elimination of all emojis (`📥`, `⚡`, `🛡️`, `⚔️`, `🍀`, `🔄`, `🎯`, `🪙`, `✓`, `⚠️`, `📈`, `🔗`) across the Level Simulator and Character Builder.
  - Eradicated all bright modern neon text colors (`#4ade80`, `#ef4444`, `#f87171`, `#fde047`, `#fdba74`, etc.).
  - Unified typography under authentic Morrowind gold (`#d4b06a`), warm parchment (`#f3e6c8`), and muted brass (`#9e8b6b` / `#8c7853`).
  - Styled SVG chart curves with solid gold (`#d4b06a`) for optimal path and muted brass (`#8c7853`) for delayed path.

---

## [Phase 5] Specialized Calculator Workstations — 2026-09-19

- **Enchanting Workstation:** Live visual capacity gauge bar (0 / 120 pts) with base item presets, soul gem selector from Petty to Grand with 400-soul Constant Effect indicator, When Used / On Strike / Constant Effect toggles, multi-effect stack builder, self-enchant success chance %, and ranked barter pricing for 21 Vanilla and 15 Tamriel Rebuilt enchanters with live search.
- **Spellmaking Workstation:** Custom spell naming, magic school filter tabs (Alteration, Conjuration, Destruction, Illusion, Mysticism, Restoration), multi-effect stack editor with min/max magnitude, duration, area, and range inputs, exact OpenMW magicka cost formula, cast reliability rating badge, governing school indicator, and ranked barter pricing for 38 named spellmakers.
- **Alchemy Workstation:** Apparatus rack with Mortar & Pestle, Alembic, Calcinator, and Retort across five quality tiers, four crucible slots with live ingredient search, effect pills, and a filter to show only ingredients sharing effects with Slot 1. Live potion preview calculates brew success chance %, gold value, magnitude, and duration.
- **Alchemy Crucible Clear Controls:** Crucible slots initialize clean and empty, with a new Clear All Ingredients button in the crucible subheader to reset all slots, search queries, and custom names in one click, plus individual per-slot Clear buttons.
- **Travel Optimizer Workstation:** Shortest-hop BFS transit network router across Silt Striders, Boats, Guild Guides, and River Striders. Features searchable origin and destination listboxes, fast-select travel hubs, quick origin/destination swap, turn-by-turn navigation cards, and complete waypoint breadcrumb chain.
- **Authentic Dark CRPG Scrollbars:** Added global dark color-scheme on root and all form elements, standard scrollbar-color (`#4e3c23` thumb on `#14100a` track), and custom WebKit scrollbars across all scrollable containers and listbox elements (`select[size]`), permanently eliminating white browser scrollbars.

---

## [Phase 4] Challenge Runs Workstation Overhaul — 2026-09-19

- **Two-Pane CRPG Workstation:** Transformed Challenge Runs into an authentic two-pane workstation with interactive card controls, live character summary sheet, and full mobile drawer integration.
- **Individual Card Locking and Pinning:** Every parameter card (Race, Gender, Class, Sign, Major Objective, Restrictions, Skills) features individual lock and reroll buttons, allowing players to pin favorite choices while "Randomize All" rerolls only the unlocked cards.
- **Deterministic Seed Engine:** Compact, shareable seed strings encoding world profile, locked slots, difficulty filters, and rolled attributes, enabling 1-click URL sharing and identical run recreation.
- **Difficulty Band Selector:** Quick preset filters (Easy, Normal, Hard, Grind) that dynamically tailor objective and restriction pools according to desired run intensity.
- **Searchable Pool Browser Modal:** Accessible in-app reference catalog detailing all hand-curated objectives and restrictions with category tags and difficulty ratings.
- **Send to Build Optimizer Bridge:** 1-click bridge action serializing the rolled character state directly into the Character Builder.
- **Automated Conflict Resolution Engine:** Built-in rules validator that detects mutually conflicting objectives, incompatible restrictions, and redundant level caps to guarantee 100% playable, lore-friendly runs.

---

## [Phase 1-3] Modern Architecture & Character Builder Foundation — 2026-09-18

- **Next.js 16 & React 19 Architecture:** Silt Strider migrated to Next.js 16 App Router with React 19, static export, and on-demand game data loading for Vanilla, Tamriel Rebuilt, and ARCE profiles.
- **Two-Pane Character Builder:** Interactive Configurator, live Character Sheet, Premade Builds catalogue browser, and decoupled Gear Advisor, preserving URL permalinks and local saves.
- **Art Direction Overhaul & 3-Tier Frame Hierarchy:** Eliminated line tangencies across the site. The 6-pixel ornate scrollwork frame is reserved for primary panels, 2-pixel etched grooves for plaques and banners, and 4-pixel bevels exclusively for buttons and dropdowns.
- **Accessible Focus States & Contrast:** High-contrast gold focus outlines on keyboard navigation across all interactive elements, with muted text contrast meeting WCAG AA standards.
- **Cross-Tool Calculator State Integration:** Calculators dynamically ingest character stats, skills, and fatigue from the active character sheet via `useActiveCharacter`, with bidirectional DOM synchronization.
