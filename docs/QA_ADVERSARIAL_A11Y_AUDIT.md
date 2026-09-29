# Silt Strider — QA, Adversarial & Accessibility (A11y) Audit

**Date:** 29 September 2026  
**Target:** `lowgraph/siltstrider.tools` (`A:\Claude\morrowind-tools`)  
**Production:** `https://siltstrider.tools`  
**Status:** Findings verified across local checkout (`main` branch) and production deployment.

---

## 1. Executive Summary

A multi-pass verification, adversarial boundary audit, and accessibility evaluation of the Silt Strider web application was performed. The platform exhibits high mathematical reliability, strict binary parser boundary protection, and zero core engine crashes. 

However, the audit identified several **accessibility (WCAG 2.1 AA) violations**, **unlabeled interactive form controls**, **semantic heading gaps**, and **dead DOM references in header navigation** that require remediation prior to public launch.

---

## 2. Pass 1: General QA & Route Verification

All 15 application routes were retrieved and verified against the live production build (`plain-disk-78e6`):

| Route | HTTP | Title Tag Content | Meta Description | Canonical URL | H1 Status |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `/` (Home) | 200 | Silt Strider Tools — Morrowind Build Planner & Progression Toolbox | 180 chars | `https://siltstrider.tools` | **1** ("Plan the perfect Morrowind run.") |
| `/builder` | 200 | Morrowind Character Builder & Build Optimizer \| Silt Strider Tools | 150 chars | `https://siltstrider.tools/builder` | **1** ("Morrowind Character Builder & Build Optimizer") |
| `/leveler` | 200 | Morrowind Level Simulator & 5x Multiplier Progression Planner \| Silt Strider Tools | 155 chars | `https://siltstrider.tools/leveler` | **1** ("Morrowind Level Simulator & 5x Multiplier Progression Planner") |
| `/alchemy` | 200 | Morrowind Alchemy Calculator & Potion Brewing Recipe Tool \| Silt Strider Tools | 154 chars | `https://siltstrider.tools/alchemy` | **1** ("Morrowind Alchemy Calculator & Potion Brewing Recipe Tool") |
| `/enchanting` | 200 | Morrowind Enchanting & Soul Gem Calculator \| Silt Strider Tools | 148 chars | `https://siltstrider.tools/enchanting` | **1** ("Morrowind Enchanting & Soul Gem Calculator") |
| `/spellmaking` | 200 | Morrowind Spellmaking & Casting Chance Calculator \| Silt Strider Tools | 145 chars | `https://siltstrider.tools/spellmaking` | **1** ("Morrowind Spellmaking & Casting Chance Calculator") |
| `/travel` | 200 | Morrowind Travel Map & Transport Route Planner \| Silt Strider Tools | 189 chars | `https://siltstrider.tools/travel` | **1** ("Morrowind Travel Map & Transport Route Planner") |
| `/factions` | 200 | Morrowind Faction Journal & Guild Rank Tracker \| Silt Strider Tools | 150 chars | `https://siltstrider.tools/factions` | **1** ("Morrowind Faction Journal & Guild Rank Tracker") |
| `/challenge` | 200 | Morrowind Challenge Run Generator & Permalinks \| Silt Strider Tools | 154 chars | `https://siltstrider.tools/challenge` | **1** ("Morrowind Challenge Run Generator & Permalinks") |
| `/vault` | 200 | OpenMW Save File Inspector & Cloud Character Vault \| Silt Strider Tools | 155 chars | `https://siltstrider.tools/vault` | **1** ("OpenMW Save File Inspector & Cloud Character Vault") |
| `/about` | 200 | About Silt Strider & Game Engine Mechanics \| Silt Strider Tools | 156 chars | `https://siltstrider.tools/about` | **1** ("About Silt Strider & Game Engine Mechanics") |
| `/changelog` | 200 | Changelog & Version History \| Silt Strider Tools | 102 chars | `https://siltstrider.tools/changelog` | **1** ("Silt Strider Tools Changelog & Version History") |
| `/privacy` | 200 | Privacy Policy \| Silt Strider Tools | 81 chars | `https://siltstrider.tools/privacy` | **1** ("Privacy Policy") |
| `/terms` | 200 | Terms of Service \| Silt Strider Tools | 90 chars | `https://siltstrider.tools/terms` | **1** ("Terms of Service") |
| **`/account`** | 200 | **Your account \| Silt Strider Tools \| Silt Strider Tools** *(Duplicated)* | 180 chars | Fallback to `/` | **0** *(Lacks `<h1>`; renders `<h2>`)* |

### QA Observations:
1. **Interactive Retained State:** `components/retained-tool.jsx` successfully caches DOM state across workstation switches (Builder, Leveler, Factions, Alchemy, Enchanting, Spellmaking, Travel). Inputs and scroll states persist without re-renders.
2. **Title Template Suffix on `/account`:** `app/account/page.jsx` sets `title: 'Your account | Silt Strider Tools'`, which gets combined with the template in `app/layout.jsx` (`%s | Silt Strider Tools`), producing duplicate brand suffixes in the document title.
3. **Missing Landmark:** `/account` has no `<h1>` tag; it renders `<h2>Your account</h2>` in `components/account-page.jsx:20`.

---

## 3. Pass 2: Adversarial Stress Testing & Boundary Defense

A dedicated test harness evaluated boundary conditions, corrupted encodings, and malformed save payloads:

### 1. Codec & Permalink Tampering
- **Base64URL Resiliency:** Null bytes (`\x00-\x02`), invalid padding, truncated bitstreams, and oversized payloads (100KB+) decode safely to empty strings without throwing unhandled exceptions (`lib/permalink-codec.mjs:49`).
- **Malformed Skill/Class Arrays:** Permalinks carrying fewer than 5 major/minor skills, invalid skill IDs, or duplicates are stripped by `sanitizeBuild` (`lib/character-vault.mjs:55`). Downstream, `character-context.jsx:230` safely falls back to standard class defaults without NaN or undefined errors.
- **World Profile Tampering:** Permalinks attempting to pair `arce: true` with `world: 'vanilla'` are safely normalized to `{ world: 'vanilla', arce: false }`.

### 2. Engine Math Boundaries
- **Zero Headroom Level Cap:** When a character starts with all Major/Minor skills at 100, the level cap evaluates safely to the current starting level (e.g. Level 1) without infinite loops or division by zero. Skills over 100 are clamped via `Math.max(0, 100 - skill)` (`lib/level-math.mjs:210`).
- **Multiplier Brackets:** Skill increases (-5 to 100) step strictly through canonical brackets (0 increases $\to$ 1×; 1–4 $\to$ 2×; 5–7 $\to$ 3×; 8–9 $\to$ 4×; $\ge 10 \to$ 5×).
- **Non-Finite Health Defense:** `NaN` endurance safely clamps to 0; however, `Infinity` evaluates as truthy and propagates `Infinity` in `calculateHealthGain` (`lib/level-math.mjs:222`). `Number.isFinite` should be enforced.

### 3. Save File & Cloud API Boundary Defense
- **Morrowind `.ess` Guard:** Binary header check immediately intercepts original engine `.ess` files with an explanatory modal (`lib/omwsave-import.mjs:50`).
- **Save Integrity Verifier:** `validateSave` (`lib/omwsave-import.mjs:22`) rejects corrupted structures and ensures all attributes and faction ranks are finite numbers.
- **Webhook Constant-Time Comparison:** Ko-fi webhook verification employs `timingSafeEqual` comparison against secret tokens and enforces a strict 32KB payload size cap (`cloudflare/routes/premium.mjs:15`).

---

## 4. Pass 3: Web Design Guidelines & Accessibility (A11y)

### 1. Color Contrast Ratios (WCAG 2.1 AA / AAA Compliance)
Calculations performed using standard sRGB relative luminance against primary surface backgrounds:

#### Ashfall Theme (Primary Surface `surface-3 = #131210`):
- `fg-1` (#fbf8f3): **17.67:1** (Passes AAA)
- `fg-5` (#cfc9bf): **11.38:1** (Passes AAA)
- `fg-10` (#948e86): **5.77:1** (Passes AA Normal text)
- `fg-11` / `fg-12` (#847e77): **4.66:1** (Passes AA Normal text)
- ❌ **`fg-13` (#716c65): 3.60:1 — FAILS WCAG AA Normal Text (< 4.5:1 required).** Used for 10px form labels in `spellmaking-workstation.jsx:399` and `enchanting-workstation.jsx:433`.
- ❌ **`fg-14` (#6b6660): 3.29:1 — FAILS WCAG AA Normal Text.**
- ❌ **`fg-15` (#58534e): 2.46:1 — FAILS WCAG AA Text and UI (< 3.0:1 required).**
- Vitals (`health` #f25c5c: 5.76:1, `magicka` #7b93ff: 6.65:1, `fatigue` #3fcb8b: 9.03:1): all PASS.

#### Morrowind Classic Theme (Primary Surface `surface-3 = #14100a`):
- Text ramps `fg-1` through `fg-13`: **4.80:1 to 18.95:1** (Passes AA).
- ❌ **`health` (`#a03017`) on `surface-3`: 2.64:1 — FAILS WCAG AA (4.5:1 text, 3:1 UI).**
- ❌ **`magicka` (`#2a387f`) on `surface-3`: 1.78:1 — SEVERELY FAILS WCAG AA.**

---

### 2. Unlabeled Interactive Form Controls (WCAG 4.1.2 & 1.3.1)
The following controls lack accessible names (`aria-label`, `<label htmlFor>`, or `aria-labelledby`):

1. **Alchemy Workstation** (`components/calculators/alchemy/alchemy-workstation.jsx:373-398`):
   - 4 Crucible slot `<select>` dropdowns (Crucibles 1–4).
   - 4 Crucible slot `<input placeholder="Search...">` fields.
2. **Character Builder Premade Browser** (`components/character-builder/premade-browser.jsx:100`):
   - Premade search filter `<input placeholder="Filter by name, race, sign, or skill...">`.
3. **Challenge Runs Pool Browser & Configurator** (`components/challenge-runs/pool-browser-modal.jsx:61`, `components/challenge-runs/run-configurator.jsx:192,218,245`):
   - Objective search input.
   - 3 pin `<select>` dropdowns (Race, Class, Birthsign).
4. **Equipment Studio Picker** (`components/equipment-studio/item-picker-drawer.jsx:162,271,286,300`):
   - Item search input.
   - Custom item inputs ("Item Name", "Base AR / Damage", "Weight") have sibling `<label>` tags without `htmlFor` and inputs without `id`.
5. **Enchanting & Spellmaking Workstations** (`components/calculators/enchanting/enchanting-workstation.jsx:423,574`, `components/calculators/spellmaking/spellmaking-workstation.jsx:388,523`):
   - Vendor search inputs.
   - Effect inputs (`Range`, `Min Mag`, `Max Mag`, `Duration`, `Area`) have sibling labels without `htmlFor`.
   - Enchantment Type button group lacks `role="radiogroup"` and `aria-checked` states.
6. **Travel Workstation** (`components/calculators/travel/travel-workstation.jsx:709,772`):
   - Origin and Destination search inputs.

---

### 3. Structural, Landmark & Focus Flaws
1. **Missing `<header>` Landmark:** In `components/site-header.jsx:266`, the top navigation container is `<div className="topbar">` instead of `<header className="topbar">` (breaking the WCAG banner landmark). Furthermore, lines 102, 107, and 129 contain dead DOM queries for `.account-bar`, an artifact removed from the React codebase.
2. **Missing Skip Navigation Link:** `.skip` and `.skip:focus` are defined in `app/globals.css:507`, but no `<a href="#main-content" className="skip">Skip to main content</a>` exists in `app/layout.jsx`, and `<main>` in `components/app-shell.jsx:79` lacks `id="main-content"` (WCAG 2.4.1 Level A failure).
3. **Focus Invisibility in Windows High Contrast Mode:** In `app/theme-ashfall.css:196`, `:focus-visible { outline: none; box-shadow: var(--af-ring); }` is completely stripped by the OS when `forced-colors: active` is enabled, rendering keyboard focus invisible.

---

## 5. Handoff Prompt for Codex (Site Agent)

Copy and run the following prompt in a Codex / DeepCoder session:

```markdown
**Task**: Implement accessibility, semantic HTML, and contrast fixes identified in the launch audit (`docs/QA_ADVERSARIAL_A11Y_AUDIT.md`).

**Scope & Requirements**:

1. **Semantic Landmarks & Dead Code Cleanup (`components/site-header.jsx`)**:
   - Change `<div className="topbar" ref={root}>` at line 266 to `<header className="topbar" ref={root}>`.
   - Purge dead DOM queries querying `.account-bar` at lines 102, 107, and 129 (leftover from legacy runtime).

2. **Skip Navigation Link (WCAG 2.4.1)**:
   - In `app/layout.jsx`: Add `<a href="#main-content" className="skip">Skip to main content</a>` immediately inside `<body>`.
   - In `components/app-shell.jsx:79`: Add `id="main-content"` to the `<main>` tag.

3. **Fix `/account` Page Metadata & Heading**:
   - In `app/account/page.jsx:5`: Change `title: 'Your account | Silt Strider Tools'` to `title: 'Your account'` to avoid duplicate suffixing from the layout template.
   - In `components/account-page.jsx:20`: Change `<h2>Your account</h2>` to `<h1>Your account</h1>`.

4. **Accessible Names for Form Controls (WCAG 4.1.2)**:
   - `components/calculators/alchemy/alchemy-workstation.jsx`:
     - Add `aria-label={`Crucible ${slotIndex + 1} ingredient`}` to the 4 crucible selects.
     - Add `aria-label={`Filter ingredients for crucible ${slotIndex + 1}`}` to the 4 crucible search inputs.
   - `components/calculators/travel/travel-workstation.jsx`:
     - Add `aria-label="Search departure location"` to origin input (line 709).
     - Add `aria-label="Search destination location"` to destination input (line 772).
   - `components/character-builder/premade-browser.jsx:100`:
     - Add `aria-label="Filter premade classes"` to the filter input.
   - `components/challenge-runs/pool-browser-modal.jsx:61`:
     - Add `aria-label="Search challenge pool objectives and rules"` to search input.
   - `components/challenge-runs/run-configurator.jsx`:
     - Add `aria-label="Pin race"`, `aria-label="Pin class"`, `aria-label="Pin birthsign"` to the 3 select elements (lines 192, 218, 245).
   - `components/calculators/enchanting/enchanting-workstation.jsx` & `components/calculators/spellmaking/spellmaking-workstation.jsx`:
     - Add `aria-label="Search spell vendor or teacher"` to vendor search inputs.
     - Ensure effect configuration inputs (`Min Mag`, `Max Mag`, `Duration`, `Area`) have matching `id` and `htmlFor` attributes on their respective labels.

5. **Color Contrast & High Contrast Focus**:
   - In `app/theme-ashfall.css`: Adjust `--color-fg-13` from `#716c65` to `#8a847c` ($\ge 4.6:1$ on `#131210`) so 10px labels pass WCAG AA.
   - In `app/theme-ashfall.css`: Add a high-contrast media block:
     ```css
     @media (forced-colors: active) {
       :root[data-theme="ashfall"] :focus-visible {
         outline: 2px solid Highlight !important;
       }
     }
     ```
   - In `lib/level-math.mjs:222`: Change `Number(newEndurance) || 0` to `Number.isFinite(Number(newEndurance)) ? Number(newEndurance) : 0` to prevent `Infinity` propagation.

**Verification**:
- Run `$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'; npm test` in `A:\Claude\morrowind-tools` (all tests must pass with 0 warnings).
- Run `npm run build:cloudflare` to ensure static prerendering succeeds across all 15 routes.
- Do not deploy or push to git without explicit user instruction.
```
