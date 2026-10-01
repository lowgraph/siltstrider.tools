# Morrowind UI, closer to the game

Implementation spec for restyling the site's **Morrowind UI** theme so it looks like the
game's own menus.

- **Design approved** by the owner on 1 October 2026, from the reference mockup below, including
  Phase 4.
- **Implemented** in `84d8d56`, with theme QA adjustments in `d85a931`. The owner
  requested integration into main on 1 October; merged-checkout verification is
  in [LAUNCH_VERIFICATION §47](LAUNCH_VERIFICATION.md#47-morrowind-game-theme-merge--1-october-2026).
- **Timing:** this ships before the 6 October launch only if every launch feature is done by
  **3 October**; otherwise it waits until after launch. Check `docs/LAUNCH_CHECKLIST.md` before merging,
  and push or deploy only when the owner asks. This integration is authorized;
  deployment remains a separate request.

## Reference files

All in `docs/design/morrowind-game-theme/` unless noted.

| File | What it is |
|---|---|
| `mockup-game.html` | **The target.** The front page in the new look, static HTML. Open it from that folder. |
| `mockup-today.html` | The front page in today's Morrowind UI, for comparison. |
| `game.jpg`, `today.jpg` | Full-page renders of both mockups at 1366 px. |
| `frames-2x.png` | 2× close-up of the frames, bars and text hierarchy. |
| `make_textures.py` | Generates the three frame textures below. |
| `public/textures/mw-window.svg` | Window frame (6 px slice). |
| `public/textures/mw-panel-grain.svg` | Panel and groove line (2 px slice), speckled. |
| `public/textures/mw-button-grain.svg` | Button and field bevel (4 px slice), speckled. |

The mockup was also built as a private claude.ai design canvas. The HTML here is the same design,
and it is the version to follow.

## Scope

**In scope:**
- Colors, fonts and frames.
- Selected, hover, pressed and focus states; links; vitals bars; scrollbars.
- Every page in Morrowind UI, not only the front page.

- Phase 4's structural changes: card title bars, the stats-window character card, 44 px buttons.

**Out of scope:**
- Any other layout, spacing, copy or component-structure change.
- Theme ids and account settings: the `theme` setting stays `ashfall` | `morrowind`.
- New dependencies.

**Rules:**
- **Modern UI must not change by a single pixel, with one exception:** the theme toggle in the header,
  which previews the new Morrowind look in both themes (Phase 2).
- **Never ship Bethesda files:** no game textures, no Magic Cards or Daedric font.
  - Pelagiad (SIL OFL, already in `public/fonts/`) is fine.
  - The three SVG textures are original: procedural noise tuned to colors sampled from a screenshot.

## How the themes are built (read before editing)

- **Morrowind UI is the base CSS:**
  - the tokens in `app/globals.css` (`@theme static { … }`, lines ~893–1030);
  - the theme variables in its `:root` (~1056);
  - every rule in `globals.css`.
- **Modern UI is `app/theme-ashfall.css`:**
  - scoped to `:root[data-theme="ashfall"]`;
  - imported after `globals.css` in `app/layout.jsx`.
- **`<html data-theme>`** is set before first paint by `THEME_INIT_SCRIPT` (`lib/theme.mjs`), so
  `:root[data-theme="morrowind"]` always matches in Morrowind UI.
- **Token values are safe to edit.** A test in `test/theme.test.js` ("Ashfall re-values every color
  token") guarantees that every `--color-*` and `--gradient-*` defined in `globals.css` is also defined
  in the Ashfall block. Consequences:
  - **Changing a token's value in `globals.css` changes Morrowind UI only.**
  - **Adding a token** means adding it to the Ashfall block too, or the test fails.
- **Theme variables are safe too.** Ashfall also overrides `--mw-border`, `--mw-bevel` and
  `--mw-groove` (to `none`), plus `--offblack`, the `--font-*` variables and the `--mw-scroll-*`
  variables. Changing these in `globals.css`'s `:root` is Morrowind-only as well.
- **Everything else in `globals.css` is shared:**
  - 205 hard-coded colors sit outside the token block.
  - 48 rules hard-code warm browns or golds.
  - About 30 of those 48 are **not** restyled by Ashfall, so Modern UI shows them too.
  - **Do not edit those literals in place.** Override them for Morrowind in a new file (Architecture,
    step 3).

## Architecture of the change

1. **Tokens:** edit the values in place in `globals.css` `@theme static` (Phase 1).
2. **Frames, scrollbars, page ground:** edit in place in `globals.css` `:root`: `--mw-border`,
   `--mw-bevel`, `--mw-groove`, `--mw-scroll-*`, `--offblack` (Phase 2).
3. **Everything else:** a new file, `app/theme-morrowind.css`.
   - **Every selector is prefixed `:root[data-theme="morrowind"]`.**
   - Import it in `app/layout.jsx` right after `globals.css`, and keep `theme-ashfall.css` after
     `globals.css` (a test checks that order).
   - Base rules that use `!important` need `!important` in the override too.
   - No component changes are needed for Phases 1–3.

## The game palette (source of truth)

**Text and state colors.** These come from the game's own UI color settings: `Morrowind.ini`
`[Fonts]`, as OpenMW reads them, `fallback=FontColor_color_*`. Contrast is measured on black.

| Role | Game key | Value | Use | On `#000` |
|---|---|---|---|---|
| Normal | `normal` | `#CAA560` | Body text, labels, list items, button text | 9.06 |
| Header / hover | `normal_over`, `header` | `#DFC99F` | Headings, values, hover state | 12.99 |
| Pressed | `normal_pressed` | `#F3EDDD` | Strongest emphasis, pressed state, numbers on bars | 17.97 |
| Disabled | `disabled` | `#B3A887` | Secondary text | 8.87 |
| Selected | `active_over` | `#9FA9DF` | Selected item text, focus ring | 9.21 |
| Selection mark | `active` | `#6070CA` | Underline or border of a selected item. **Never text** (3.8–4.7). | 4.67 |
| Link | `link` | `#707ECF` | Links | 5.57 |
| Link hover | `link_over` | `#8F9BDA` | | 7.87 |
| Link pressed | `link_pressed` | `#AFB8E4` | | 10.80 |
| Health, magic, answer | `health`, `magic`, `answer` | `#C83C1E`, `#35459F`, `#96321E` | Fills only. **Never text** (2.0–4.1). | |
| Background | `background` | `#000000` | Windows and panels | |

**Vitals bars**, sampled from a game screenshot. These are already the `--gradient-*` tokens; keep them:

| Bar | Gradient (top → bottom) |
|---|---|
| Health | `#9B2D16` → `#2F0E07` |
| Magicka | `#28347B` → `#0C1025` |
| Fatigue | `#00722E` → `#00240E` |

## Visual rules

1. **Black windows.** Windows and panels are `#000000`; the page ground is `#0E0D0B`. No brown or
   gold fills anywhere: not for selected, hover, active, zebra rows, menus or tooltips.
2. **Tan text hierarchy:**
   - Normal `#CAA560` for body text.
   - Header `#DFC99F` for headings and values.
   - Pressed `#F3EDDD` for emphasis.
   - Disabled `#B3A887` for secondary text.
3. **Frames.** On every edge the lighter pixels sit on the top-left side: light outside on the top
   and left edges, light inside on the bottom and right edges. There are three kinds:
   - **Window:** a flat four-line bevel (`--mw-border`, 6 px slice).
   - **Panel / groove:** an engraved speckled line, light over dark (`--mw-groove`, 2 px).
   - **Button / field:** a raised speckled bevel (`--mw-bevel`, 4 px).
4. **States:**
   - **Selected:** text `#9FA9DF`, plus a 2 px `#6070CA` underline drawn as `box-shadow: inset 0 -2px 0`,
     on a black background. The underline means selection is never shown by color alone.
   - **Hover:** text turns `#DFC99F`.
   - **Pressed:** text turns `#F3EDDD`.
5. **Links** are `#707ECF`, hover `#8F9BDA`, pressed `#AFB8E4`. Links inside prose stay underlined.
   Standalone calls to action ("Open Travel Planner →") may drop the underline and show it on hover.
6. **Focus:** a 2 px solid `#9FA9DF` outline, offset 2 px, on every control.
7. **Type:**
   - **Pelagiad:** display text, headings, buttons, tabs, labels, badges, stat names and values.
   - **Segoe UI** (`var(--font-sans)`): body text, descriptions, tables and inputs. The owner chose
     this for readability.
   - **Monospace:** only for code and keyboard hints.
8. **Bars:**
   - The gradient fill sits in a 2 px panel frame.
   - The value ("50/50") is centered on the bar in Pelagiad `#F3EDDD`.
   - The game draws that number in tan `#CAA560`, which falls to 2.6:1 on the bright top of the Health
     and Fatigue bars. The owner approved `#F3EDDD` (5.2:1 or better).
9. **Scrollbars:** thumb `#9F7F45`, hover `#BEA47B`, track `#000000`.

## Phase 1: tokens (`app/globals.css`, `@theme static`)

**Text** (`fg-1` brightest; higher numbers quieter):

| Token | New value | Role |
|---|---|---|
| `fg-1` | `#F3EDDD` | Pressed / emphasis |
| `fg-2` | `#CAA560` | Normal: the default text (`--paper`) |
| `fg-3` | `#DFC99F` | Header |
| `fg-4` | `#CAA560` | Normal |
| `fg-5` … `fg-8` | `#B3A887` | Disabled: secondary text |
| `fg-9`, `fg-10` | `#A49A7C` | Quiet |
| `fg-11`, `fg-12` | `#9C9174` | Quieter |
| `fg-13`, `fg-14` | `#948A6E` | Muted (`fg-14` is the most used muted color) |
| `fg-15` | `#8A8066` | Faint, still ≥ 4.5:1 on any text surface below |
| `fg-16`, `fg-17`, `fg-18` | `#6E6450`, `#5A5242`, `#4A4336` | **Decoration only**: never text (components use none today) |

**Surfaces:**

| Token | New value | Notes |
|---|---|---|
| `surface-1` … `surface-7` | `#000000` | Windows, panels, cards, fields |
| `surface-8` … `surface-12` | `#0A0908` | Hover |
| `surface-13` … `surface-17` | `#100E0B` | Raised / hover on raised |
| `surface-18` … `surface-22` | `#16130F` | Highest surface that may carry text |
| `surface-23` | `#1D1914` | Non-text fills only (`fg-15` drops to 4.46 here) |
| `surface-24` | `#9F7F45` | Bronze fill |

**Borders** (`line-1` most prominent; the ramp is ordered by luminance):

| Token | New value | On `#000` |
|---|---|---|
| `line-1` | `#BEA47B` | 8.79 |
| `line-2` | `#A98F62` | 6.79 |
| `line-3` | `#9F7F45` | 5.60 |
| `line-4` | `#8B7B5A` | 5.08 |
| `line-5` | `#857048` | 4.41 |
| `line-6` | `#7D6C4C` | 4.12 |
| `line-7` | `#76663F` | 3.74 |
| `line-8` | `#706044` | 3.45 |
| `line-9` | `#6B5C40` | 3.23: the main card and input border, must stay ≥ 3:1 |
| `line-10` | `#5A4C33` | 2.52: dividers only |
| `line-11` | `#4F442F` | 2.20: dividers only |
| `line-12` | `#2B251A` | 1.38: dividers only |

**Accent** (the heading gold today, `text-accent` used 319 times):

| Token | New value | Notes |
|---|---|---|
| `accent` | `#DFC99F` | Header |
| `accent-1` | `#F3EDDD` | Today it colors the "Open …" calls to action; Phase 3 switches those to the link color |
| `accent-2` | `#CAA560` | |
| `accent-3` | `#B3A887` | |
| `accent-4` | `#9F7F45` | 5.60 on black; fine as text |
| `accent-5` | `#6E562B` | Borders only |

**Unchanged:**
- the `danger-*`, `success-*`, `warning-*`, `info-*` and `teal-*` ramps (readable already; the game has
  no equivalents);
- `--color-health`, `--color-magicka`, `--color-fatigue` and the three `--gradient-*` tokens (already
  the sampled game values).

**New tokens.** Add these to the base block **and** to Ashfall's `:root[data-theme="ashfall"]` block:

| Token | Morrowind (base) | Ashfall |
|---|---|---|
| `--color-link` | `#707ECF` | `var(--color-accent)` |
| `--color-link-hover` | `#8F9BDA` | `var(--color-accent)` |
| `--color-link-active` | `#AFB8E4` | `var(--color-accent)` |
| `--color-select` | `#9FA9DF` | `var(--color-accent)` |
| `--color-select-mark` | `#6070CA` | `var(--color-accent)` |

Only `theme-morrowind.css` uses them, so the Ashfall values never show; they exist to satisfy the token
test.

## Phase 2: frames, scrollbars, page ground (`app/globals.css`, `:root`)

```css
--offblack: #0e0d0b;
--mw-border: url("/textures/mw-window.svg");       /* was mw-border.png, same 6 px slice */
--mw-bevel: url("/textures/mw-button-grain.svg");  /* was mw-bevel.png, same 4 px slice */
--mw-groove: url("/textures/mw-panel-grain.svg");  /* was mw-groove.png, same 2 px slice */
--mw-scroll-thumb: #9f7f45;
--mw-scroll-thumb-hover: #bea47b;
--mw-scroll-track: #000000;
```

- **The slice widths match the old PNGs,** so the 40-odd `border-image: var(--mw-…) N repeat` rules
  need no change.
- **Keep the PNG files.** `scripts/generate-social-card.mjs` still embeds them.
- **The theme toggle previews the new look in both themes (owner decision).** `.theme-toggle` (~line
  2460) is the one piece of Morrowind styling that also shows inside Modern UI, as the way back. It is
  styled by shared base CSS, so change it in place in `globals.css`. This is the only sanctioned change
  to Modern UI.

  ```css
  :root {
    --classic-gold: #caa560;         /* was #d4b06a: game normal text */
    --classic-gold-bright: #dfc99f;  /* was #f0d48a: game hover/header */
    --classic-brown: #000000;        /* was #1a140d: black, no gradient */
    --classic-brown-hi: #000000;     /* was #3a2a18 */
  }
  .theme-toggle { border-image: url("/textures/mw-button-grain.svg") 4 repeat; }  /* was mw-bevel.png */
  .theme-toggle:hover { filter: none; }                                           /* hover is the color change */
  .theme-toggle:focus-visible { outline-color: #9fa9df; }                         /* game selection blue */
  ```

  - Keep the `url(...)` literal rather than `var(--mw-bevel)`: Ashfall sets `--mw-bevel` to `none`, and
    the toggle must keep its frame there.
  - The ember sun glyph shown when switching to Modern UI (`.theme-toggle-face--to-ashfall`) stays as it
    is.
  - Check the toggle at 1366 px (label) and below 900 px (icon only, 44 × 44).
- **Some panels use the button bevel.** `--mw-bevel` is used by 23 rules: buttons, selects and fields,
  but also some panels (for example the front page's current-character card). In the game, panels use
  the 2 px groove, not the button bevel. For each `var(--mw-bevel) 4` rule:
  - if the element is clickable or a field, keep it;
  - if it is a container, override it in `theme-morrowind.css` to
    `border-width: 2px; border-image: var(--mw-groove) 2 repeat`.

## Phase 3: Morrowind overrides (`app/theme-morrowind.css`)

Start from this, then sweep. Every rule must stay scoped.

```css
/* Body text in Segoe UI; headings, buttons and labels keep Pelagiad from the base rules. */
:root[data-theme="morrowind"] body { font-family: var(--font-sans); }

:root[data-theme="morrowind"] a { color: var(--color-link); }
:root[data-theme="morrowind"] a:hover { color: var(--color-link-hover); }
:root[data-theme="morrowind"] a:active { color: var(--color-link-active); }
:root[data-theme="morrowind"] :focus-visible { outline: 2px solid var(--color-select) !important; outline-offset: 2px !important; }

/* Buttons: black, tan text; selection is blue text plus an underline, never a gold fill. */
:root[data-theme="morrowind"] .mw-btn,
:root[data-theme="morrowind"] .mw-btn:hover:not(:disabled) { background: #000000 !important; color: var(--color-fg-2) !important; }
:root[data-theme="morrowind"] .mw-btn:hover:not(:disabled) { color: var(--color-fg-3) !important; }
:root[data-theme="morrowind"] .mw-btn:active:not(:disabled) { color: var(--color-fg-1) !important; }
:root[data-theme="morrowind"] .mw-btn.active,
:root[data-theme="morrowind"] .mw-btn[aria-pressed="true"],
:root[data-theme="morrowind"] .mode-bar .mw-btn.active,
:root[data-theme="morrowind"] .mode-bar .mw-btn[aria-pressed="true"],
:root[data-theme="morrowind"] .mode-bar-grid .mw-btn.active,
:root[data-theme="morrowind"] .mode-bar-grid .mw-btn[aria-pressed="true"] {
  background: #000000 !important;
  color: var(--color-select) !important;
  box-shadow: inset 0 -2px 0 var(--color-select-mark) !important;
}

/* The front page's "Open …" calls to action are links, in the game's topic blue. */
:root[data-theme="morrowind"] .home-hub-root .home-tool-open { color: var(--color-link); }
```

**Then sweep the remaining hard-coded colors.** Find every rule in `globals.css` (outside the token
block) with a warm color literal. That means a hex or `rgb[a]()` where red exceeds blue by more than 12
and the brightest channel is above 24, in `background`, `color`, `border`, `box-shadow` or `outline`.
For each one, add a scoped override that maps it to the palette:

| Today | Becomes |
|---|---|
| `#3a2a18`, `#4d361c`, `#26190c`, brown gradients such as `rgba(62, 42, 22, …)` or `rgba(90, 58, 28, …)` (selected or hover fills: `.seg .seg-btn.on`, `.dropdown-item.on`, `[aria-current="page"]`, `.btn[aria-pressed]`, `.btn.on`, the world switch) | `#000000` plus the selected-state rule above |
| Gold zebra and hover rows, e.g. `rgba(201, 162, 39, 0.08 … 0.16)` (`#gear-box`, `.gear-results-container`) | Zebra `var(--color-surface-8)`; hover `var(--color-surface-13)` |
| `#f4ead4`, `#cfc3aa`, `#c4a056` (old paper and muted text: `.sub`, `.pool li`, `.tip`, `.muted`, `.vital-label`, `.kicker`, `.account-bar::before`) | `var(--color-fg-2)`, `var(--color-fg-5)`, `var(--color-accent)` |
| `#f0d48a` (old focus and hover gold: `a:hover`, `.btn:focus-visible`, `select:focus-visible`) | `var(--color-link-hover)`, or the focus rule above |
| `#3a3224`, `#8a7344`, `#332717` (borders) | `var(--color-line-9)`, `var(--color-line-3)`, `var(--color-line-11)` |
| `#4e3c23`, `#785d37` (WebKit scrollbar literals) | `var(--mw-scroll-thumb)`, `var(--mw-scroll-thumb-hover)` |
| Gold glows (`box-shadow: 0 0 8px rgba(212, 176, 106, …)`, gold `text-shadow`) | Remove |
| `.mw-btn` and `.btn` brown gradient backgrounds | `#000000` |
| Vitals bars | Keep the gradients. Frame: `border: 2px solid transparent; border-image: var(--mw-groove) 2 repeat`. Number centered in Pelagiad `var(--color-fg-1)`, where the component already shows the number on the bar. |

Pages to cover:
- Home, Character Builder (and its sheet and gear advisor), Level Simulator, Travel Planner, Alchemy,
  Enchanting, Spellmaking, Faction Journal, Challenge Runs;
- Cloud Vault (window and page), Your account, About, Changelog, Privacy, Terms;
- search (Ctrl K), menus, dropdowns, tooltips.

## Phase 4 (approved): game window structure

The mockup also gives the main cards **title bars**: the title centered between two speckled groove
bars. This needs markup changes; class names and wrappers only, no behavior changes.

- **Title bar, CSS only:**

  ```css
  :root[data-theme="morrowind"] .mw-caption { display: flex; align-items: center; gap: 12px; }
  :root[data-theme="morrowind"] .mw-caption::before,
  :root[data-theme="morrowind"] .mw-caption::after {
    content: ""; flex: 1 1 24px; height: 2px; background: #000000;
    border: 2px solid transparent; border-image: var(--mw-groove) 2 repeat;
  }
  ```

  Wrap each card's heading in `.mw-caption`. Starting points:
  - `components/home-hub/home-tools.jsx` (tool cards);
  - `components/home-hub/home-hero.jsx` (start, save and current-character cards);
  - the calculator panel headings.

  In Modern UI the class must do nothing (it is scoped).
- **Current-character card as the game's stats window:**
  - full attribute names, as label / value rows;
  - "Level / Race / Class / Sign" rows;
  - no avatar letter;
  - bars with the value centered.

  See the mockup.

  **Switch it with CSS, not JavaScript.** The server renders `data-theme="ashfall"`, and the stored theme
  is applied before first paint (`THEME_INIT_SCRIPT`), so React doesn't know the theme while rendering.
  Branching on the theme in JSX would cause a hydration mismatch or a flash. Instead:
  - render both forms in the DOM (short labels "STR", "INT" … and full names "Strength", "Intelligence" …;
    the avatar letter; the bar value inside and beside the bar);
  - show one or the other with scoped CSS, e.g.
    `:root[data-theme="morrowind"] .attr-short { display: none }` and
    `:root:not([data-theme="morrowind"]) .attr-full { display: none }`;
  - give screen readers one label, not both: hide the visual duplicate with `aria-hidden="true"`, or use
    the full name as the accessible name in both themes.

  Modern UI must render exactly as before.
- **Buttons at least 44 px tall** in Morrowind UI (`min-height` in `theme-morrowind.css`).

## Accessibility acceptance

- **Text contrast:**
  - all text tokens (`fg-1` … `fg-15`, `accent` … `accent-4`, the link and select tokens) reach at least
    4.5:1 on `#000000` and on `surface-22` (`#16130F`);
  - `fg-16` … `fg-18` are never used as text.
- **Banned as text:** `#6070CA`, `#35459F`, `#C83C1E`, `#96321E`.
- **Selection** is never color-only (the underline mark), and focus is visible on every control.
- **Input and card borders** (`line-9` and stronger) reach at least 3:1 on black.
- **axe** (wcag2a, wcag2aa, wcag21aa, wcag22aa) finds zero violations in Morrowind UI at 1366 px and
  375 px on every page in the list above.

## Verification

1. **`npm test` passes**, plus at least three new tests (AGENTS.md asks for edge cases):
   - every selector in `app/theme-morrowind.css` starts with `:root[data-theme="morrowind"]`, so Modern
     UI cannot be affected;
   - `theme-morrowind.css` uses no color literal outside the palette above, an allowlist that stops gold
     creeping back;
   - the Morrowind text tokens and the link and select tokens meet 4.5:1 on `#000000` and `#16130F`
     (compute the WCAG ratio in the test);
   - the three `--mw-*` variables point at files that exist in `public/textures/`.
2. **Modern UI unchanged:**
   - take full-page screenshots of every page above in Modern UI, before and after, at 1366 and 375 px
     (headless Chrome through CDP, as AGENTS.md describes);
   - the pixel difference must be zero outside the theme toggle's box (and its hover tip); explain any
     other pixel that moved;
   - Phase 4's new class names and wrappers must not move anything in Modern UI either.
3. **Morrowind UI:**
   - screenshots of every page at 1366 and 375 px;
   - compare the front page against `mockup-game.html`;
   - check keyboard focus on the account page and the Vault.
4. **Leftover-brown check.** Run this in the browser on each page in Morrowind UI. It should report
   nothing except the frame textures and the vitals bars:

   ```js
   [...document.querySelectorAll('body *')].filter(el => {
     const m = getComputedStyle(el).backgroundColor.match(/\d+/g);
     if (!m || +m[3] === 0) return false;
     const [r, g, b] = m.map(Number);
     return r > b + 12 && Math.max(r, g, b) > 24;
   }).map(el => `${el.tagName}.${el.className}`.slice(0, 80));
   ```
5. **Changelog first:** add a plain-words entry to `CHANGELOG.md` and
   `components/views/changelog-view.jsx` under the day's date, for example: "The Morrowind UI now looks
   like the game's menus: black windows, tan text and the game's frames. Modern UI is unchanged."
6. **Follow `docs/LAUNCH_CHECKLIST.md`:** claim the task with a timestamp, tick it when done, and respect
   the freeze and cut line. Push and deploy only when the owner asks.

## Textures: how they were made

- **Sampled** from a 1:1 screenshot of the game's character review screen (544 × 432):
  - **Window frame:** a flat four-line bevel. Top and left edges, outside → in: `#BEA47B`, `#9F7F45`,
    `#6E562B`, `#120B07`. Bottom and right edges, outside → in: `#2C2013`, `#7B5F33`, `#967D49`,
    `#C2A470`.
  - **Panel line:** a speckled light line (about `#8B8465`–`#D9CBA6`) above-left of a speckled
    dark-brown line (about `#322316`–`#5A4226`).
  - **Button:** top and left edges, outside → in: `#CBBF99`, `#85724A`, `#6D6246`, `#1E1710`. Bottom and
    right edges, outside → in: three dark lines (`#121009`, `#28200F`, `#33220F`), then `#A59874`.
- **Grain** is SVG `feTurbulence` fractal noise (`baseFrequency 0.9`, 2 octaves), tinted per line with
  `feColorMatrix` and clipped to the line. On high-density screens the speckle renders finer.
- **To tune:** edit the ring tables in `make_textures.py`, then run
  `python docs/design/morrowind-game-theme/make_textures.py public/textures`.

## Decisions already made (owner, 1 October 2026)

- Segoe UI for body text: readability over authenticity.
- Bar numbers in `#F3EDDD`, not the game's tan, for contrast.
- Black windows; no brown or gold fills.
- No game assets.
- **Phase 4 is in scope:** title bars, the stats-window character card, 44 px buttons.
- **The theme toggle previews the new look in both themes.** It is the only change visible in Modern UI;
  everything else there stays untouched.
- **Ship before the 6 October launch only if every launch feature is done by 3 October;** otherwise after
  launch.
