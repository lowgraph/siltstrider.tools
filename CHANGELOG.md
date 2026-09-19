# Changelog

All notable changes to the **Silt Strider** Morrowind character planner, calculators, and tools will be documented in this file.

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
