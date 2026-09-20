# Changelog

All notable changes to the **Silt Strider** Morrowind character planner, calculators, and tools will be documented in this file.

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
