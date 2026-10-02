# Launch checklist

Everything between now and launch, **in priority order, not by date**: work from the top in
any burst of time and stop wherever it ends; each item stands alone. Only the items under
**Fixed dates** are tied to the calendar. **O** = owner, **C** = Claude (or the agent doing
the work).

**Marking progress.** When you start a task, add the date and time you started it, in UTC,
and who: `(started 2026-09-29 17:35 UTC, C)`. Commit that mark before the work, so another
session can see the task is taken and resume it if the burst ends mid-task. When it lands,
tick it and add the commit or Worker version: `[x] … (started …, C; done 93b7edf)`.

- Usability findings (IDs such as TRV-1): [UX_USABILITY_AUDIT.md](UX_USABILITY_AUDIT.md)
- Posts, messages and claims: [LAUNCH_POSTS.md](LAUNCH_POSTS.md)
- Release, backup and rollback: [DEPLOYMENT.md](DEPLOYMENT.md), [LAUNCH_OPERATIONS.md](LAUNCH_OPERATIONS.md)
- Production state and history: [LAUNCH_VERIFICATION.md](LAUNCH_VERIFICATION.md)

## Fixed dates

| Date | What |
| --- | --- |
| **By Monday 5 October** | Anything from the priority list not done by now moves after launch (see the cut line). |
| **Monday 5 October: freeze** | No changes except fixes for breakage. Then, on the frozen build: regenerate the social card if tool names on it changed (`npm run social-card`) and deploy it; update LAUNCH_POSTS copy to the final names and re-check its claims table against the live site (**C**); take the post screenshots: Builder with the Gear Advisor, Travel map, Level Simulator, a loaded save (**O**); final acceptance pass, LAUNCH_OPERATIONS steps 1–3 and 5 (**C**; step 2 again, since section 4 changes the tools after the 30 September regression; also `scripts/test-browser.cjs --suite hydration` and `--suite touch --touch`, BROWSER_TESTS.md, with the 404 page's expected error exempt) and step 4 with disposable records (**O**); fresh D1 Time Travel bookmark, a full backup if saves have grown, and the rollback target noted (**O**); check the r/OpenMW reply (no answer means post), pick a House Role in Morrowserver `#house-roles`, find the Morrowind Modding Community's tools channel (**O**); on a real phone (QA could only emulate one): no Ctrl K hint on touch, Travel options changed for a loaded save survive leaving Travel and coming back (the unexplained 30 September failure; 0 of 31 in the 1 October QA run), and a real `.omwsave` loads (**O**); Google and Discord sign-in with an unsaved TR + ARCE character, which must come back in TR + ARCE (the signed-in QA could test email only); on a touchscreen laptop the Ctrl K hint still shows (emulation could not combine touch with a fine pointer) (**O**). |
| **Tuesday 6 October, 13:30 UTC: launch** | Post r/Morrowind (flair Showcase), r/OpenMW (unless refused), r/TamrielRebuilt, Morrowserver `#modding`, Morrowind Modding Community, OpenMW Discord if approved; stay a few hours for comments, ready for "was it made with AI?" (**O**). Watch Worker logs and error references, API requests, D1 and Clerk sign-ins; fix only breakage, deploy only on the owner's go-ahead (**C**). |
| **Wednesday 7 October** | Show HN and the X thread (**O**). |
| **From Thursday 8 October** | Creator outreach, one at a time, through business contacts (**O**). Feedback from the threads, and whatever the freeze left of sections 3 and 4, goes into a new after-launch list (**C**). |

## Decisions (29 September, owner)

- **Tool names:** Character Builder (with its Gear Advisor), Level Simulator, Travel Planner,
  Alchemy, Enchanting, Spellmaking, Faction Journal, Challenge Runs, Cloud Vault.
- **Travel defaults:** without a loaded save, Mages Guild member **on** and Conjurer rank
  **off**, as now. With a loaded save, use what the character has (guild standing,
  Intervention, items), and when the character is not a Mages Guild member, warn that Guild
  Guides work from Mages Guild halls and need membership.
- **Usability audit:** its assessment is accepted, including theft off by default in the
  Gear Advisor (BLD-1).
- **Account settings (30 September):** migration 0007, the settings API and account
  controls are merged and live as `d523b9ba`. Design and current behavior:
  [ACCOUNT_SETTINGS.md](ACCOUNT_SETTINGS.md) on `main`.
- **QA triage (1 October):** five live-site QA reports (first impression, veteran, new
  player, numbers, regression) merged into section 5 (before the freeze) and section 6
  (after launch). Owner decisions on the open questions:
  - The Level Simulator keeps opening on a plan to level 50 (U23, U26): leave as is.
  - Loading a save replaces the signed-out Preferred world (SS-06): intended.
  - "Kept in this browser" for a loaded save while Local Browser Saves lists 0 (SS-07):
    change the wording (QA-14).
  - About says the site is open source, links the repository and says it is made by
    LowGraph (QA-15).
  - Real-phone checks join the freeze day.

## Priority list

Each item ends the same way: tests (at least three edge cases for a logic change),
`npm test`, a changelog entry if visitors will notice it (CHANGELOG.md and the public page,
before the commit; AGENTS.md "Changelog first"), a local commit. Deploy whenever the owner says, per DEPLOYMENT.md, then
post-deploy checks and a line in LAUNCH_VERIFICATION. Push and deploy are separate asks.

### 1. Before launch: wrong answers and trust

- [x] **C** Push the usability audit and this checklist. (started 2026-09-29 17:35 UTC, C; done with this commit)
- [x] **C** **LVL-1** (started 2026-09-29 17:35 UTC, C; done `ff3a894`, live as `6be6a2d4`) `detectArchetype`: Mercantile and Speechcraft as minors must not make a
      warrior a Diplomat; score minors below majors and compare instead of returning early;
      show why an archetype was chosen; test the default build (home page and simulator).
- [x] **C** **TRV-1 (as decided)** (started 2026-09-29 17:47 UTC, C; done `62b8219`, live as `6be6a2d4`) With a loaded save that is not a Mages Guild member, a
      warning by the route options: Guild Guides work from Mages Guild halls and need
      membership. Keep today's defaults without a save.
- [x] **C** **TRV-6 (label)** (started 2026-09-29 18:01 UTC, C; done `d1c0961`, live as `8da9cada`) Mark the options a loaded save set: "from your save".
- [x] **C** **BLD-1** (started 2026-09-29 18:07 UTC, C; done `dd01435`, live as `8da9cada`) "Steal early gear" off by default.
- [x] **C** **TRV-3** (started 2026-09-29 18:15 UTC, C; done `2af1e95`, live as `3daf4aa0`) The Places buttons lose the browser grey; merge or disambiguate
      same-named exterior cells ("Pelagiad" twice).
- [x] **C** **HOME-2 / SITE-4 (label)** (started 2026-09-29 18:30 UTC, C; skipped here and done another way in another session: a random premade start instead of an "example" label; audited, hydration and ARCE fixes, done `dccd680`, live as `3daf4aa0`; ARCE builds in the random start `d7a09fd`, live as `e5a3b044`) "Example character — make it yours" until the player
      changes or loads one, on the home card and every "Active character" bar.
- [x] **C** **Claims** (started 2026-09-29 18:31 UTC, C; done `80240d5`, live as `3daf4aa0`) Drop "inter-faction standing" (FAC-2), and "verified engine formulas"
      and "exact potion" on the home Alchemy card (LAUNCH_POSTS, Claims removed).
- [x] **C** **SITE-1** (started 2026-09-29 19:21 UTC, C; done `6e45e9a`, live as `719660ae`; page titles, the hidden h1 and structured data keep the long SEO names) Apply the decided names in nav, headings, buttons, cards and the
      footer; long SEO titles stay as page titles only. The social card's tiles say "Build
      Optimizer" and "Travel Optimizer", so it is regenerated at the freeze.
- [x] **C** **LINK-1** (found 29 September; started 2026-09-29 19:41 UTC, C; done `e93dbef`, live as `719660ae`; challenge run links fixed too: one without a world no longer resets yours to vanilla) A shared build link opens in the visitor's stored
      world, not the link's: a vanilla link opened by someone who chose TR or TR + ARCE shows
      the character in that world. The link's world must win. First-time visitors at launch
      have nothing stored, so it mostly reaches returning TR players sharing builds. Cause:
      the link effect compares against the shell while the page hydrates (still vanilla).
      Hydration tests: a vanilla link over a TR + ARCE store, a TR link over vanilla, an ARCE
      link, a link without a world.
- [x] **O** (done, owner, reported 2026-09-29 20:33 UTC: the old save deleted and the character saved again; works across browsers) Real sign-in test on production (LAUNCH_VERIFICATION §5 item 6), and delete the
      10:54 save and save the Khajiit again, if not done already.
- [x] **C** **VAULT-TEST** (started 2026-09-30 22:12 UTC, C; done `a7bd0a4`, merged `c8e4aea` (the Premium heading scoped to its section, since ACC-2's settings heading shares `.account-page h2`), live as `e29663d3`: `scripts/local-stack.cjs` and `scripts/test-vault.cjs`, 10 of 10 cases; the owner's real Clerk sign-in checked on the local site; its axe pass fixed the Vault card's grey Rename and Delete, an unnamed rename box and the account page's heading order) Signed-in Cloud Vault tests before the next deploy (owner, 30
      September): a local copy of the site with the Worker and a local database, signed in once by
      the owner with a Clerk development test account; and an automated signed-in suite that signs
      its own tokens (no Clerk), with axe on the signed-in pages.

### 2. Before launch: clarity

- [x] **C** **SITE-2 / VLT-1** (started 2026-09-29 19:08 UTC, Codex; done by Codex `8afcef1`, committed and merged to main by Claude `3bd72e2`, live as `719660ae`; Travel's route on a phone starts 2.7 screens down instead of 3.8) Every "invariants" or "rules" box becomes a closed "How this is
      calculated" disclosure in plain words. On phones this lifts Travel's route about a
      screen (most of TRV-4's pain until the full restructure).
- [x] **C** **CALC-1** (started 2026-09-29 19:55 UTC, C; done `d8b68f4`, live as `719660ae`; also effect base costs shown as the game does, `d3448b9`) No results before input: dashes and a prompt.
- [x] **C** **CHL-1** (started 2026-09-29 20:29 UTC, C; done `2fdcb3d`, live as `1fa07549`) One row of difficulty presets.
- [x] **C** **FAC-1** (started 2026-09-29 20:34 UTC, C; done `39ccad1`, live as `1fa07549`) Rank names, skill labels, plain words for placements and spots.
- [x] **C** **FAC-3** (found 29 September in FAC-1's live check; started 2026-09-29 23:08 UTC, C; done `ec456a9`, merged `769db3b`, live as `4951b9b5`) The Faction Journal's quest list
      shows each quest's internal key and journal stages under its name ("fg_alofsfarm ·
      Finishes: 100,110"). Show the name only, or say in words when the quest ends; test with
      a faction that has quests (FAC-1's page test used none).
- [x] **C** **MOB-3** (started 2026-09-29 23:08 UTC, C; done with SITE-5 `86a0ce1`, merged `769db3b`, live as `4951b9b5`) No "Ctrl K" hint on touch devices. **SITE-5** Explain "TR + ARCE".
- [x] **C** **ACC-1** (started 2026-09-30 19:29 UTC, Codex; done `09bd5fa`, merged `b45f686`, live as `d523b9ba`) The account settings table as migration `0007_account_settings.sql`
      (owner decision, 30 September). After Travel is merged: merge `main` into
      `feature/account-settings-preparation` so only its own commits remain; promote
      `cloudflare/proposals/account_settings.sql` to `cloudflare/migrations/0007_account_settings.sql`
      unchanged in shape (the table only; no API or UI in this item); run the schema test
      on `node:sqlite` instead of Python, and without `A:\Cache` hard-coded; update STATE and
      ACCOUNT_PROFILES; `npm test`; apply locally with `wrangler d1 migrations apply
      siltstrider-db --local` and check the saves tables are untouched; merge to `main`. No
      changelog entry: visitors see nothing.
- [x] **O** **ACC-1 (production)** (owner authorized; applied 2026-09-30 23:56 UTC, Codex; verified in LAUNCH_VERIFICATION §15) After ACC-1 is on `main` and before the freeze: record a
      fresh D1 Time Travel bookmark, then apply with `wrangler d1 migrations apply
      siltstrider-db --remote` as its own step, separate from any site release; check
      `migrations list --remote` reports none pending; record the bookmark and result in
      LAUNCH_VERIFICATION. Older Workers ignore the new table, so every rollback target
      stays valid.

### 3. Before launch if time allows (can slip without breaking anything)

- [x] **C** Contrast (started 2026-09-29 20:51 UTC, C; done `241f58f`, merged `b0e5f39`; the Faction Journal's tinted cards fixed in `e34f135`; live as `4951b9b5`) retune `fg-13`–`fg-15` against every panel they sit on (Faction
      Journal, Equipped Loadouts, premade catalog, Challenge, Travel labels), both themes.
- [x] **C** Target size: the Level Simulator's attribute buttons to 24px (started 2026-09-29 21:08 UTC, C; done `da81aeb`, merged `ae152d0`, live as `4951b9b5`).
- [x] **C** Heading levels on the Level Simulator and Vault (started 2026-09-29 21:11 UTC, C; done `9758aa9`, merged `384118d`, live as `4951b9b5`).
- [x] **C** Re-run the axe, keyboard and high-contrast audit (acceptance for the three above) (started 2026-09-30 00:49 UTC, C; done `03c3361`, live as `4c464aa3`; one more found live, a beast race's faded Boots slot, fixed with a faded ticked objective in `1e84b1a`, live as `24bd4ac1`, 0 violations on production: axe WCAG 2.2 AA + best practice on 19 pages and states, both themes, desktop and 375 px, found 5 issues (fg-16/17 text, faded ranks and stop labels, a Level Simulator preset, unnamed objective checkboxes), fixed, 0 on re-run; keyboard on 15 pages in both themes, the four dialogs and forced colors passed; LAUNCH_VERIFICATION §5 item 4).
- [x] **C** Browser regression (started 2026-09-30 00:49 UTC, C; done on the dev build of `03c3361`: 9 tools x 3 worlds x 2 widths and 13 flows passed; LAUNCH_VERIFICATION §5 item 4) across all tools in Vanilla, TR and TR + ARCE at desktop and
      phone widths (LAUNCH_OPERATIONS final acceptance, steps 2–3).

### 4. Before launch if time allows: larger improvements

Moved here from after launch by the owner on 30 September, since there is time before the
freeze. Like section 3, it can slip. Priority order within each group; IDs are the usability
audit's. BLD-2, CALC-2 and BLD-4 were built early and are live. The TRV items are Codex's
for now (owner, 30 September); other agents skip them.

**Travel and the Builder**
- [x] **C** **TRV-2** (started 2026-09-30 00:14 UTC, Codex; done `866bd3a`, merged `e3ab542`, live as `d523b9ba`) One place search per route end: towns and stops first, then named places.
- [x] **C** **TRV-4 / TRV-5** (started 2026-09-30 15:29 UTC, Codex; done `597214d`, merged `e3ab542`, live as `d523b9ba`) Task-first Travel: from, to and "plan for" at the top, the route
      under them, the other options folded.
- [x] **C** **BLD-2** The Gear Advisor ranks by itself, with "Early gear for this build ↓" to
      reach it (started 2026-09-29 21:30 UTC, C; done `5e36716`, merged `ef3cdea` with review
      fixes `5f11bea`: catalogs load near the screen, the name does not re-rank; live as `8f10cef2`).
- [x] **C** **TRV-6** (started 2026-09-30 15:56 UTC, Codex; done `7a85863`, merged `e3ab542`, live as `d523b9ba`) Keep the player's changes to a save's options across visits; Intervention
      scrolls have finite uses and known spells respect cast chance and current Magicka.
- [x] **C** **CALC-2** Your own skill, attribute and Luck numbers in Alchemy, Enchanting and
      Spellmaking (started 2026-09-29 21:36 UTC, C; done `822c4dc`, merged `6178e87` with
      review fixes `625c2b1`, `2b969fe`: 0 to 1000; live as `8f10cef2`. Typed numbers now stay across a world switch until Reset, owner 30 September, `cd01737`, live as `415d9c89`).
- [x] **C** **TRV-7** (started 2026-09-30 16:35 UTC, Codex; done `1604656`, merged `e3ab542`, live as `d523b9ba`) Say what Cheapest saves in gold and adds in movement compared with Fewest legs;
      show Real Time Approximation beside in-game time.

**First steps, phones and saving**
- [x] **C** **HOME-1 / MOB-2** (started 2026-09-30 16:17 UTC, C; done `ef59aae` merged `d4e96bd`, live as `d523b9ba`: "Start a character" and "Load your save" as equal cards, the character first when they stack; the start button on a phone at 758 px, the save's used to lead at 893) Two equal first steps on Home, a character or a save; the
      character first on phones.
- [x] **C** **BLD-3** (started 2026-09-30 15:31 UTC, C; done `c965c61`, merged `4d998be`, live as `4c464aa3`: a browser's first Builder opens on the catalog while the character is the random start, with "Build my own instead"; later visits, links, saves and saved characters open the Custom Class Builder) Premade builds first for newcomers.
- [x] **C** **BLD-4** "Save this character" without an account, with load and delete
      (started 2026-09-29 21:53 UTC, C; done `9d5b8ef`, merged `6a573c6` with review fixes
      `66ff77f`: blocked storage, foreign values, loading over a save; live as `8f10cef2`).
- [x] **C** **SITE-4** (started 2026-09-30 16:29 UTC, C; done `dbbee2d` merged `d4e96bd`, live as `d523b9ba`: wherever a tool names the character, the name links to the Builder, as Home names it; the Level Simulator names it too; the Faction Journal's line, hidden at every width by a legacy `.hidden` rule, shows from 640 px) The character bar as a control that opens the Builder.
  - [x] **C** (started 2026-09-30 21:40 UTC, C; done `ee3dfb0` merged `d4e96bd`, live as `d523b9ba`: `max-sm:hidden`; the last bare `hidden` with `sm:` in components) The Cloud Vault's signed-in header line (name, tier and saves) shows from 640 px; the legacy `.hidden` rule hid it at every width (found with SITE-4; owner 30 September).
- [x] **C** **MOB-1 / MOB-4** (started 2026-09-30 16:58 UTC, C; done `c91f585` merged `d4e96bd`, live as `d523b9ba`: a one-row 44 px phone header, pages start at 68 px instead of 257; one row of four Builder sections, the first field at 526-575 px instead of 915) A lighter phone header; one level of Builder tabs.
- [x] **C** **HOME-3** (started 2026-09-30 17:09 UTC, C; done `30862de` merged `d4e96bd`, live as `d523b9ba`: ×5 level-ups, any town, early gear, 3 worlds, instead of skill, restriction and stop counts) Outcomes on Home instead of counts ("27 skills modeled").

**Controls and polish**
- [x] **C** **CALC-3** (started 2026-09-30 17:21 UTC, C; done `2ab91fc` merged `d4e96bd`, live as `d523b9ba`: one ARIA combobox per slot, names starting with the typed text first, arrows, Enter, click, Escape; no separate search field) One searchable box per Alchemy slot.
- [x] **C** **CHL-2** (started 2026-09-30 17:28 UTC, C; done `710c95c` merged `d4e96bd`, live as `d523b9ba`: one lock per rolled item, on the sheet beside it; the settings choose instead of rolling, and a choice is locked) One lock per rolled item in Challenge Runs.
- [x] **C** **ENC-1** (started 2026-09-30 17:16 UTC, C; done `eaa1c83` merged `d4e96bd`, live as `d523b9ba`: an Expensive Ring and a Lesser Soul Gem, as a Common Ring holds a single point; a new effect starts at 5 for 5 s so it fits; the ring, amulet, shirt and robe grades added) Enchanting starts with early-game items and soul gems.
- [x] **C** **SITE-3** (started 2026-09-30 16:55 UTC, C; done `910abc5` merged `d4e96bd`, live as `d523b9ba`: the nav row and Home lead with Build, Level, Travel, Alchemy; the phone tab bar keeps Alchemy until Travel's phone layout is redone) Nav order by use: Character Builder, Level Simulator, Travel Planner,
      Alchemy, then the rest.
  - [x] **C** (started 2026-09-30 21:40 UTC, C; done `ee3dfb0` merged `d4e96bd`, live as `d523b9ba`: Home, Build, Level, Travel with a route icon; Alchemy in the menu) The phone tab bar has Travel instead of Alchemy, now that Travel's phone layout leads with the journey (TRV-4/5; owner 30 September).
- [x] **C** **LVL-2 / LVL-3** (started 2026-09-30 20:35 UTC, C; done `2a86cff` merged `d4e96bd`, live as `d523b9ba`: the Bitter Cup under a closed Advanced options that opens while it is on; END, PER, STR in the priority list, full names for screen readers) The Bitter Cup under advanced options; untruncated attribute
      labels in the priority list.
- [x] **C** **TRV-8** (started 2026-09-30 17:03 UTC, Codex; done `dce0622`, merged `e3ab542`, live as `d523b9ba`) One network/loading/error/Retry line in Travel, including TR + ARCE.
- [x] **C** (started 2026-09-30 20:39 UTC, C; done `b582e98` merged `d4e96bd`, live as `d523b9ba`: Enter, Space or a screen reader opens on the first item, the mouse leaves focus on the button; checked in Chrome) Header menus focus their first item when opened from the keyboard.
- [x] **C** (started 2026-09-30 20:34 UTC, C; done `f688888` merged `d4e96bd`, live as `d523b9ba`: the API compares the stored bytes with `payload_hash` before unpacking; a mismatch is a 422 with a plain message and a reference, and nothing of the save) The Cloud Vault checks a save's hash on load.
- [x] **C** **ACC-2** (started 2026-09-30 20:42 UTC, Codex; done `d4de9e7`, merged `b45f686`, live as `d523b9ba`; verification in LAUNCH_VERIFICATION §§12–16) Account settings for players, after ACC-1: the revision-checked
      `/api/settings` (GET and PUT, owner from the Clerk session, 409 on a stale revision), a
      settings provider, and a settings page for world, theme, Travel, Gear Advisor and
      Challenge defaults with reset all and reset one tool (ACCOUNT_SETTINGS.md). Modpack and
      mod version stay unavailable until the pipeline publishes a release registry; the Gear
      Advisor's quest-reward and difficult-encounter settings stay hidden until the gear rows
      carry them.

**Features**
- [x] **C** **CALC-4** (started 2026-10-01 00:43 UTC, Codex; done `c2bf5d8`, merged `ef67b3e`; live as `3879ce7b`) Reverse alchemy: pick the effects, get the ingredients.
  - [x] **C** **CALC-4 data** (started 2026-10-01 01:20 UTC, C; builder done `7be1365`, pushed through `602253a`; correction `41da92c` rebuilt and staged with owner authorization on 1 October as `a29adea046e6086c2c7ee654`; live as `3879ce7b`) Where each ingredient comes from, per world: shops that stock
        it (restocking or once), regrowing plants with the chance per harvest and counts by region
        and town, creatures that carry it and where they appear, and fixed finds such as ore
        deposits; sources that need theft left out (owner, 30 September). A pipeline catalog,
        `IngredientSources`, for the effect finder's results.
  - [x] **C** **CALC-4 where to get** (started 2026-10-01 02:28 UTC, C; resumed Codex, 1 October; done `5965af7`, corrected data `be29f68`, merged `ef67b3e` through `c2bf5d8`; live as `3879ce7b`) Each selected Alchemy ingredient has a "Where to get it" button, with the pair shortcut retained:
        shops, plants, creatures and finds from `IngredientSources`, loaded only when opened.

- [x] **C** **DESIGN — Morrowind game theme** (implemented `84d8d56`, QA `d85a931`;
      integration authorized 1 October, Codex; merged `6fab4c5`, live as `e29663d3`)
      Black windows, tan text, procedural frames and the Home stats window. Modern
      UI retains its layout, apart from the theme-toggle preview. Merged-checkout
      verification: LAUNCH_VERIFICATION §§47–49; spec: MORROWIND_GAME_THEME.md.

### 5. QA findings (1 October): fix before the freeze

From the triage of the five QA reports (live site, signed out, 1 October). Source IDs in
brackets are the reports' own (F/U beginner audit, NUM/FLOW/UI veteran and numbers, SS
first impression and regression). Personas: R Reddit first visit, V veteran, N new player,
Q regression run. Each item: re-check the report's case first, fix, re-check after, plus the
usual tests (at least three edge cases for a logic change) and changelog.

Signed-in findings also come from the live 1 October QA with three email-only QA
accounts, since cleaned up: `siltstrider-account-qa-2026-10-01.md` (F-ids).

Execution order confirmed by the owner. QA IDs identify findings; their numbers
do not set priority. The implementation items below are integrated into main by
`c3e740b`, retaining QA-24's earlier merge, and live with the theme in `6fab4c5` /
`e29663d3`. Branch, merged-checkout and release verification are in
LAUNCH_VERIFICATION §§30–49. The signed-in fixes (QA-21 to QA-24) passed a real
Clerk retest on the live release, each case twice (LAUNCH_VERIFICATION §50). Freeze
acceptance and release preparation remain separate checks against the final release build.

| Order | Target | Why |
| --- | --- | --- |
| 1 | **Test portability** | Small prerequisite: fresh clones and cloud sessions need a working test suite. |
| 2 | **QA-21 + QA-23 — world preservation** | Loading or signing in can turn an ARCE character into a different, broken character. Fix the shared world-precedence rules together. |
| 3 | **QA-24 — preserve unsaved characters on sign-out** | Players lose their work through an ordinary account action. |
| 4 | **QA-22 — correct share links** | Links must describe the saved character or rolled challenge. Sharing currently spreads incorrect data. |
| 5 | **QA-01 + QA-02 — Enchanting calculations** | Points, capacity, chance and price are wrong. These need one coherent fix following the OpenMW 0.51 source. |
| 6 | **QA-03 + QA-04 — Health progression and chart** | Wrong gains and forecasts undermine the Level Simulator's main purpose. Fix progression before validating the chart. |
| 7 | **QA-10 — beast-race equipment eligibility** | The recommended endgame kit includes equipment the character cannot wear. |
| 8 | **QA-16 — Ebonheart → Mournhold** | A routine journey incorrectly returns No Route in every world. |
| 9 | **QA-07 + QA-25 — Travel search and link precedence** | Fix failed searches leaving misleading routes, and explicit journey links losing their starting point. |
| 10 | **QA-06 — unobtainable Alchemy apparatus** | A contained correction that removes inflated results and fulfils an existing changelog claim. |
| 11 | **QA-05 — stale character titles** | Builder, Home and Simulator must consistently identify the character being calculated. |
| 12 | **QA-08 + QA-09 — phone tables and popovers** | Make gear sources readable and configuration help reachable at phone widths. |
| 13 | **QA-12 — premade explanations** | Important for newcomers choosing their first character; copy-only work. |
| 14 | **QA-11 — faction names and deprecated entries** | The catalog already has the names, so this is a contained presentation fix. |
| 15 | **QA-15 — About attribution and licence** | Low risk, straightforward, and explicitly requested. |
| 16 | **Freeze acceptance and release preparation** | Run against the final build after the fixes, then prepare the release and rollback records. |
| 17 | **Live retest (2 October): QA-26** | An edited premade's endgame kit is the premade's, not the player's (wrong answer). Cheap Lows QA-27–30 if time allows. |

Reproduction (Codex, 1 October, `qa/reproduce`, LAUNCH_VERIFICATION §27): the
original suite had 41 tests marked `{ todo: '<QA-id> not fixed yet' }` in `test/qa-*`.
Each fix removes its TODO mark, so the test proves it; `npm test` reports the
remaining count. `QA_UNMARK_TODOS=1` runs the remaining TODO cases as real tests.
Phone layout assertions: `test/qa-layout.browser.cjs` with `QA_BROWSER_REPORT`;
commands in BROWSER_TESTS.md.

#### 1. Test portability

- [x] **C** **Test portability** (started 2026-10-01 20:16 UTC, Codex, on launch/character-preservation; done `44ddd82`, `test/qa-staged-data.test.js`, verified in LAUNCH_VERIFICATION §35; merged `c3e740b`; live as `e29663d3`) Three of these tests read the staged bundle and fail where none is staged (a
      fresh clone, a cloud session): `QA-11 published faction names…` and both `QA-20`
      catalog tests. Skip them without a bundle, as the other bundle tests do.
      The same guard now covers later catalog-dependent regressions; pure and
      synthetic checks still run. An incomplete or corrupt staged bundle fails.

#### 2. QA-21 + QA-23 — world preservation

- [x] **C** **QA-21** (started 2026-10-01 17:23 UTC; taken over 2026-10-01 18:14 UTC, Codex, on launch/character-preservation; done `1029357`, verified in LAUNCH_VERIFICATION §30; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4 and in a real Clerk session; `AppShell` passes `setBuild` as `onApplyBuild`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High; F-1) "Load this build into Character Builder" in the Cloud Vault
      leaves a TR + ARCE build in the visitor's world: Vanilla, race shown as Argonian, the
      sheet stuck on "Calculating statistics…" (2 of 2). The Vault applies builds with the
      provider's plain `setBuild`, which ignores `build.world` and `build.arce`
      (`app-shell.jsx`, `character-context.jsx` `loadBuild`). Loading a build must set its
      world, as a shared link does (LINK-1).
- [x] **C** **QA-23** (started 2026-10-01 17:23 UTC; taken over 2026-10-01 18:14 UTC, Codex, on launch/character-preservation; done `1029357`, verified in LAUNCH_VERIFICATION §30; merged `c3e740b`; live as `e29663d3`) (reproduced, hydrated test and real session; `ShellProvider` takes `preferences.settings.world` whenever ready, and `setProfile` saves every header world change, so an explicit account choice cannot be told apart: record whether the Preferred world was chosen on the account; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High; F-3, F-9) Signing in switches to the account's Preferred world
      when the address has no `?world=` (3 of 3): an unsaved TR + ARCE character, or a loaded
      TR + ARCE save, comes back in Vanilla, the save re-read as plain Khajiit
      (`shell-context.jsx`). A new account has chosen nothing yet, but switching world or
      loading a save already auto-saves a Preferred world (F-9), which then wins. On sign-in
      the browser's world must win until the player chooses one on the account.

#### 3. QA-24 — preserve unsaved characters on sign-out

- [x] **C** **QA-24** (started 2026-10-01 17:30 UTC, Codex, on launch/character-signout-preservation; done `aebd6c0`, merged `339c198`, verified in LAUNCH_VERIFICATION §§28–29; live as `e29663d3`) (High; F-4) Signing out loses an unsaved Builder character: sign-out loads
      Home afresh and the Builder shows a random premade (2 of 2). A loaded save survives.
      Keep the character through sign-out as through sign-in (`SIGN_IN_EVENT` hand-off).

#### 4. QA-22 — correct share links

- [x] **C** **QA-22** (started 2026-10-01 18:50 UTC, Codex, on launch/character-preservation; done `c169031`, verified in LAUNCH_VERIFICATION §31; merged `c3e740b`; live as `e29663d3`) (reproduced, local, live and real session; `shareBuildLink` (`use-cloud-vault.js`) uses only the save summary; `handleCopyPermalink` (`challenge-runs-root.jsx`) uses the shell's world; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High; F-2, F-17) Share links carry the wrong character. An imported
      save's "Copy shareable permalink" writes raw ids (`className:"mage"`,
      `T_Els_Cathay-raht`), empty skill lists, the wrong gender and `world=vanilla` for a
      TR + ARCE save; it opens as a different or broken character (2 of 2 saves; Builder
      builds are fine). A challenge run's link took the visitor's current world (`world=tr`)
      for a run rolled in Vanilla. A link must describe its own character or run.

#### 5. QA-01 + QA-02 — Enchanting calculations

- [x] **C** **QA-01** (started 2026-10-01 19:11 UTC, Codex, on launch/character-preservation; done `df261d0`, verified in LAUNCH_VERIFICATION §32; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4 local and live; cause `calcEffectCost`/`calcEnchantmentTotalPoints`; OpenMW 0.51: running costs 25.025 and 50.05, capacity 75, base price 50,050 (site 50 and 250,000); test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, V; NUM-05; confirmed in code) Enchanting costs several effects
      wrong: each effect's points are its own plus the running total before it, and the
      item's total is the sum of those running costs (OpenMW 0.51 `enchanting.cpp`);
      `calcEnchantmentTotalPoints` (`lib/enchant-math.mjs`) returns only the last running
      cost. Two Constant Effects of 5/5 must read 75 points, not 50. Fix with QA-02.
- [x] **C** **QA-02** (started 2026-10-01 19:11 UTC, Codex, on launch/character-preservation; done `df261d0`, verified in LAUNCH_VERIFICATION §32; merged `c3e740b`; live as `e29663d3`) (partly reproduced: floor, chance and price tests fail; the Common Ring UI case not; OpenMW 0.51: 1.9125 points, capacity 1, base price 1,912 (price from the precise cost, so fix with QA-01); the engine's chance uses precise points, fatigue, item count and a Constant multiplier; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, V; NUM-04; confirmed in code) Enchanting rounds points to
      nearest instead of flooring each effect: a 5/5, 5 s Target Fortify Attribute is 1.875
      points, shown as 2, so it "does not fit" a Common Ring and its base price doubles.
      Afterwards re-check the self-enchant chance (16% vs the engine's 15%) and the base
      price (2,000 vs 1,500 g) from SUS-01.

#### 6. QA-03 + QA-04 — Health progression and chart

- [x] **C** **QA-03** (started 2026-10-01 19:34 UTC, Codex, on launch/character-preservation; done `4c89666`, verified in LAUNCH_VERIFICATION §33; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4 local and live; OpenMW 0.51 `levelUp` adds a float Endurance gain, and does not recompute the base half retroactively; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, V; NUM-02; confirmed in code) Level Simulator Health per level
      is floored (`floor(END / 10)`, `lib/level-math.mjs`); OpenMW keeps the fraction (10% of
      Endurance): END 35 to 55 gives 22.5 over five levels, the site 21. Confirm against
      OpenMW 0.51's `npcstats.cpp` first (the report cited 0.49); change the explanation too.
- [x] **C** **QA-04** (started 2026-10-01 19:34 UTC, Codex, on launch/character-preservation; done `4c89666`, verified in LAUNCH_VERIFICATION §33; merged `c3e740b`; live as `e29663d3`) (partly reproduced: all five chart expectations fail in unit tests, live chart starts at 50 for Health 35; cause `normalizeCharacterState`/`calculateHealthGrowthCurve` recompute the sheet; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, V, N; NUM-01, F07, NUM-03) The Level Simulator's Health chart
      starts at 50 whatever the character's Health (35, 45), says "Endurance 100 at Lv 6"
      when ten +5 steps are needed, and its forecast moves when Bitter Cup changes only
      Personality and Willpower. Check each symptom on its own; the Bitter Cup one may be
      legitimate if the plan's later picks change.

#### 7. QA-10 — beast-race equipment eligibility

- [x] **C** **QA-10** (started 2026-10-01 20:28 UTC, Codex, on launch/character-preservation; done `ebebd98`, original three tests enforced plus `test/beast-recommendations.test.js` and inspector tests; 28/28 Chrome, LAUNCH_VERIFICATION §36; merged `c3e740b`; live as `e29663d3`) (reproduced 12/12 (Argonian, Khajiit, ARCE Cathay-raht); `resolveBestInSlotPicks` named and fallback premade paths skip the beast check; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, V; FLOW-02; retest 1 October: Early game now omits boots for Argonian and Khajiit, but the optimized endgame kit and runner-ups still offer Boots of Blinding Speed and, for an Argonian, the Masque of Clavicus Vile) Beast races are offered helmets and boots they cannot
      wear in the Gear Advisor's runner-up picks (Masque of Clavicus Vile, Boots of Blinding
      Speed) under the advisor's own note that they are excluded. Seen once; check Argonian,
      Khajiit and an ARCE Khajiit form, every runner-up list.

#### 8. QA-16 — Ebonheart → Mournhold

- [x] **C** **QA-16** (started 2026-10-01 21:38 UTC, Codex, on launch/character-preservation; done `5fbbd59`, three catalog tests enforced and six stop-alias edge cases; 24/24 Chrome, LAUNCH_VERIFICATION §39; merged `c3e740b`; live as `e29663d3`) (reproduced 24/24, all worlds, walking on and off: High, a wrong answer; the Mournhold teleport is in every Teleports catalog, but `buildTransitStops`/`transitEndpointStops` (`lib/travel-stops.mjs`) do not expand the Mournhold city choice to its destination stop; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (found in the 1 October retest; re-check first) Travel: Ebonheart to
      Mournhold showed No Route, though the Mournhold teleport from Ebonheart is everyday
      travel (Teleports policy). Check in Vanilla, TR and TR + ARCE with walking on and off;
      if it reproduces it is a wrong answer (High).

#### 9. QA-07 + QA-25 — Travel search and link precedence

- [x] **C** **QA-07** (started 2026-10-01 21:54 UTC, Codex, on launch/character-preservation; done `e9e1389`, verified in LAUNCH_VERIFICATION §40; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4; cause `searchTravelOptions` normalization and `matchPlaces`; the rejected query leaves the committed route; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, N; F01; retest 1 October: Vos, Sadrith Mora, Ebonheart and Mournhold found, "Ald'ruhn" still not, stale route still shown) Travel's place search finds nothing for "Ald'ruhn"; only
      "Ald-ruhn" works, and the previous route stays on screen. Ignore apostrophes and
      hyphens in matching; clear or mark a stale route when the search changes. Check Vos,
      Sadrith Mora, Ebonheart and Mournhold too.
- [x] **C** **QA-25** (started 2026-10-01 21:54 UTC, Codex, on launch/character-preservation; done `e9e1389`, verified in LAUNCH_VERIFICATION §40; merged `c3e740b`; live as `e29663d3`) (partly reproduced: unit assertion only (two DOM attempts stalled); `travel-workstation.jsx` lets the restored save's token override a link origin; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (Medium, against a recorded invariant; F-5) With a save loaded, a Travel
      link's starting point is replaced by the save's position (`/travel?from=Balmora…` plans
      from Seyda Neen; the plan is kept). COORDINATION, Travel from the loaded save: a link
      wins over the save's starting point.

#### 10. QA-06 — unobtainable Alchemy apparatus

- [x] **C** **QA-06** (started 2026-10-01 22:04 UTC, Codex, on launch/character-preservation; done `ebaf9ae`, verified in LAUNCH_VERIFICATION §41; merged `c3e740b`; live as `e29663d3`) (reproduced 8/8; the missed keys are `tr_m7_apparatus_sm_alembic_02`, `_calcin_02`, `_retort_02`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, Q; SS-01 regression; confirmed in code; retest 1 October: Vanilla and every Mortar list pass, TR and TR + ARCE Alembic, Calcinator and Retort still offer "Secret Master's (2x)") Secret Master's
      apparatus is still offered in TR and TR + ARCE Alchemy (Alembic, Calcinator, Retort),
      though the 30 September changelog says it is gone: the filter in
      `lib/alchemy-catalogs.mjs` matches only vanilla keys and names starting "Secretmaster".

#### 11. QA-05 — stale character titles

- [x] **C** **QA-05** (regression recheck started 2026-10-01 22:08 UTC, Codex, on launch/character-preservation; passed, LAUNCH_VERIFICATION §42) (started 2026-10-01 19:50 UTC, Codex, on launch/character-preservation; done `fdb9c9c`, verified in LAUNCH_VERIFICATION §34; merged `c3e740b`; live as `e29663d3`) (partly reproduced: Builder title stale after hydration; Simulator identity stale on desktop, not on live phone; cause `updateField`, `character-sheet.jsx`, `normalizeCharacterState`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, R, V, N; F02, F03, UI-01, SS-02, SS-04, SS-05) The character's
      title goes stale after an edit: the Builder sheet ("Imperial Agent" over a Female
      Breton), Home's character card ("Argonian Marsh Monk" over a Nord), and the Level
      Simulator naming two characters ("Argonian male — Spear scout" beside "Male Dark Elf").
      One fresh character through Builder, edit race, Home, Level Simulator: every heading
      must agree, or the premade's name must read as its source.

#### 12. QA-08 + QA-09 — phone tables and popovers

- [x] **C** **QA-08** (started 2026-10-01 20:51 UTC, Codex, on launch/character-preservation; done `ae47496`, `test/qa-layout.browser.cjs` enforced, 36/36 Chrome, LAUNCH_VERIFICATION §37; merged `c3e740b`; live as `e29663d3`) (reproduced 8/8; `gear-sources.jsx` `SourceRow`, `best-in-slot-view.jsx`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, R, N; F06, SS-01) On a phone the Gear Advisor's Where column
      breaks into fragments ("Ald- / ruhn — / sold by / Dander / a"). Stack slot, item and
      source at phone width; Early and Late game, 375 and 390 px.
- [x] **C** **QA-09** (started 2026-10-01 21:10 UTC, Codex, on launch/character-preservation; done `915ce1f`, eight component edge cases and five enforced browser-report tests; 30/30 mouse and 30/30 touch, LAUNCH_VERIFICATION §38; merged `c3e740b`; live as `e29663d3`) (partly reproduced: Birthsign, Specialization and both Favored Attribute overflow 16/16; Race stays inside; `configurator.jsx` `InfoTip` has no clamping; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, N; F05; retest 1 October at 375 px: all five Configure popovers fail; Race runs below the screen behind the tab bar, Birthsign, Specialization and both Favored Attribute run off the right edge) On a phone the Builder's Specialization help opens mostly
      off-screen. Keep every info popover inside the viewport; check each info icon at 375 px.

#### 13. QA-12 — premade explanations

- [x] **C** **QA-12** (started 2026-10-01 22:38 UTC, Codex, on launch/character-preservation; done `730a13e`, verified in LAUNCH_VERIFICATION §43; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4; `premade-browser.jsx`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (High, N; U04, F08) Premade build cards say nothing about how a build
      plays, and "Maj:", "Min:" and "Magic Specialization" go unexplained. One "plays like"
      line and one trade-off per playstyle; spell out Major and Minor skills. Copy only.

#### 14. QA-11 — faction names and deprecated entries

- [x] **C** **QA-11** (started 2026-10-01 22:45 UTC, Codex, on launch/character-preservation; done `aa99c81`, verified in LAUNCH_VERIFICATION §44; merged `c3e740b`; live as `e29663d3`) (reproduced 8/8; the names are in the published catalog (no pipeline request needed): filter deprecated rows in `faction-roster.jsx`, look relation IDs up in `faction-detail-view.jsx`; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (Medium, V, Q; UI-02, SS-02, SS-03) The TR and TR + ARCE Faction Journal
      shows raw codes ("T_cyr_fightersguild", "T_mw_imperialnavy") in Inter-Faction Relations
      and literal "<Deprecated>" factions in the list. Readable names (ask the pipeline if the
      catalog lacks them); hide deprecated factions.

#### 15. QA-15 — About attribution and licence

- [x] **C** **QA-15** (started 2026-10-01 22:58 UTC, Codex, on launch/character-preservation; done `c065581`, verified in LAUNCH_VERIFICATION §45; merged `c3e740b`; live as `e29663d3`) (reproduced 4/4; `about-view.jsx`; `test/site-claims.test.js` already allows "open source" for the code; test in `test/qa-*`, LAUNCH_VERIFICATION §27) (Low, R; owner decision) About says the site is open source (code under
      AGPL-3.0; not the game or mod data), links https://github.com/lowgraph/siltstrider.tools
      and says it is made by LowGraph. Keep `test/site-claims.test.js` and the licence
      wording rules (COORDINATION, Licences).

#### 16. Freeze acceptance and release preparation

Completed reproduction baselines; rerun them on the final build:

- [x] **C** **QA-17** (done: no hydration warnings or uncaught exceptions in 1,168 first navigations; only the intended 404 page logs its expected 404 error, which `--suite hydration` should exempt at the freeze; LAUNCH_VERIFICATION §27) Hydration and console errors on first load: every route, fresh, with a
      stored TR + ARCE world, a loaded save and each shared-link kind, 1366 and 375 px, both
      themes; Home and Builder ten times fresh. Kept as `--suite hydration` in the runner.
- [x] **C** **QA-18** (done: no phone fault, 31/31 by tap and Travel save options 20/20; a touchscreen laptop (touch with a fine pointer) could not be emulated, so check one by hand; LAUNCH_VERIFICATION §27) Real touch emulation (touch points, coarse pointer, no hover, tap
      events): no Ctrl K hint, tab bar, menus and popovers by tap, Travel save options 20
      times by tap, Alchemy pickers. Kept as `--touch` in the runner.
- [x] **C** **QA-19** (done: all nine requests 401, no data, no Set-Cookie (production PUT not attempted); LAUNCH_VERIFICATION §27) The signed-out API: GET `/api/account`, `/api/settings`, `/api/saves`,
      `/api/entitlements` and PUT `/api/settings` answer 401, with no data and no Set-Cookie.
- [x] **C** **QA-20** (done: all 5,755 suggested pairs have Restore Health on both ingredients; all 20 Vanilla guild ranks match; LAUNCH_VERIFICATION §27) Game data QA could not source: reverse alchemy's Restore Health pairs and
      the Vanilla Fighters and Mages Guild ranks, against the staged catalogs.

- [ ] **C** **Freeze acceptance and release preparation** After the remaining fixes
      are integrated, run the final build through unit, browser, hydration, real-touch
      emulation and signed-in Vault acceptance (BROWSER_TESTS.md and LAUNCH_OPERATIONS).
      Repeat the completed QA-17–20 checks above against that build. Record results,
      backup/bookmark and the chosen rollback target in LAUNCH_VERIFICATION; keep the
      real-phone, social sign-in and owner checks in Fixed dates. Merge, push and
      deployment remain separate authorized steps.

#### 17. Live retest (2 October) — before the freeze

The signed-out retest of `6fab4c5` / `e29663d3` (LAUNCH_VERIFICATION §51) passed QA-01–03,
06–09, 11–16, 19 and 25. QA-04 and QA-05 passed with the leftovers below; QA-10 "failed"
on Helm of Oreyn Bearclaw, an open helmet beast races can wear (not a bug). Merge by
Sunday 4 October, then retest.

- [x] **C** **QA-26** (started 2026-10-02 02:05 UTC, Codex, on launch/qa-26-edited-endgame-kit; done `2b86443`, merged with this commit, verified in LAUNCH_VERIFICATION §§52–53; not deployed) (High, V, R, N; confirmed in code; QA-05 retest) An edited premade's
      Optimized endgame kit is still the premade's own kit. An edited premade keeps
      `build.name` (shown "Based on …"), so `resolveBestInSlotPicks` (`lib/best-in-slot.mjs`)
      finds the premade's BestInSlot record by name, and with a weapon setup (the default
      one-handed) restores that record's armor, clothing and jewelry; only weapon and shield
      are scored for the edited build. The view then says the kit is "ranked specifically for
      your build … (Argonian female — Marsh mage)" for a Female High Elf. Use the named record
      only while the build still equals its premade (`sameCharacter`, as `characterName`
      does); otherwise score dynamically. Name the build as `characterName` does. At least
      three edge cases: unedited premade keeps its record, edited race and edited skills
      re-rank, a custom build with a premade-like name.
- [x] **QA-10 re-check**: not a bug (owner, 2 October). The retest saw "Helm of Oreyn
      Bearclaw" in a Vanilla Argonian's endgame kit and read it as a closed helmet; it is an
      open helmet that beast races can wear (UESP; flagged open in the game files), and the
      final gate (`beastWearable`, no head body part, as OpenMW's `Armor::canBeEquipped`)
      kept it correctly. QA-10 stays done.

Cheap leftovers. Low, so after launch by the usual rule, but each is a few lines and
three are regressions of this week's release; take them before Sunday if there is time:
- [x] **C** QA-27 (Low; regression from QA-03) Health shows floating-point noise: "Delayed
      Endurance: 208.00000000003 HP" (target 55, Rush Endurance, Bitter Cup). Format Health
      totals (`health-growth-chart.jsx` legend and aria-label) to at most one decimal.
      (started 2026-10-02 03:20:20 UTC, Codex, on polish/qa-27)
      (completed on polish/qa-27; not merged into main or live)
- [x] **C** QA-28 (Low; QA-04 retest) The "Endurance 100 at Lv N" marker is hidden when N is
      the target level (`showMarker` uses `< endLevel`; target 16 shows "at Lv 15").
      (started 2026-10-02 03:51:01 UTC, Codex, on polish/qa-28)
      (completed on polish/qa-28; not merged into main or live)
- [x] **C** QA-29 (Low; regression from the Morrowind theme) In Morrowind UI at 375 px the
      Builder's premade categories break mid-word ("ALCHEMI / ST", "BATTLEMA / GE"); counts and
      Expand wrap too. Modern UI is fine. Same family as SS-09.
      (started 2026-10-02 03:53:47 UTC, Codex, on polish/qa-29)
      (completed on polish/qa-29; not merged into main or live)
- [ ] **C** QA-30 (Low, both themes) At 375 px Alchemy's selected apparatus is clipped
      ("Journeyman's (" for "Journeyman's (1x)"); the open list is fine.

No action: Modern UI "unchanged beyond the toggle" could not be judged live without a
baseline; the screenshot comparison against `main` (LAUNCH_VERIFICATION §47) covers it.
The raw ingredient IDs in TR pair names are F10 / CALC-4-01 (section 6).

#### Already resolved by other work

- [x] **C** **QA-13** (done by CALC-4, merged `ef67b3e`, live as `3879ce7b`; retest 1 October: Restore Health found and its first pair carried into the calculator in all three worlds, desktop and 375 px) (High, N; U20) A first potion needs ingredient names: searching
      "Restore Health" in Alchemy finds nothing. CALC-4 answers it if it lands before the
      freeze; otherwise a starter-recipe line (Marshmerrow with Saltrice or Wickwheat).
- [x] **C** **QA-14** (no change made; the retest on `3879ce7b`, 1 October, found the Vault already tells the open save from Local Browser Saves, with "Save this character" rows marked Local storage) (Medium, R; SS-07; owner: change the wording) A loaded save says it is
      kept in this browser while the Vault's Local Browser Saves lists 0 and "No local
      characters found". Say what each is: the open save stays until cleared; Local Browser
      Saves are characters saved with "Save this character".

### Cut line

At the freeze, whatever is left of sections 3 and 4 moves after launch; note it in
LAUNCH_VERIFICATION. An item is merged only when it is finished; a half-done one waits on its
branch. Sections 1, 2 and 5 are the launch bar: if one of them is not done, decide explicitly
whether to launch with it (and say so here).

### 6. After launch (from the QA triage, 1 October)

Medium, one persona:
- [ ] **C** FLOW-01: On Strike is accepted on a ring (weapon-only); cheap, can ride with QA-01/02.
- [ ] **C** FLOW-03: both rival Great Houses can be joined in the Faction Journal.
- [ ] **C** FLOW-04: a carried Propylon index is not used in TR (Rotheran to Andasreth went by
      Almsivi, boat, Guild Guide and walk). Re-check first: if the two are linked directly
      this is a wrong route; raise it to High and move it to section 5.
- [ ] **C** UI-05: TR stop counts differ (91 in the status line, 92 in the map legend); align
      or label the scopes.
- [ ] **C** F04 / F11: "By Race" shows 20 of 41 premades without saying why, and its hint
      still says "Pick a playstyle".
- [ ] **C** Beginner clarity (N): first tool to use (U01); which world to pick and what ARCE
      is (U02, F09); a manual route beside the unsupported `.ess` notice (U03); race and
      birthsign effects before lore (U05); a legend for the Builder's numbers (U06); an
      "enter this in the game" checklist (U08); Gear Advisor: findable from Home, one kit vs
      alternatives, buy / pick up / steal, empty or capped slots (U10–U13); what save
      differences mean (U14); "current position" vs "Silt Strider stop" (U16); a No Route
      message that says what to change (U17); one-line Travel definitions (U19); Alchemy
      jargon and recovery from a failed or zero brew (U21, U22); Level Simulator wording
      (U24, U25, U27).

Low:
- [ ] **C** UI-03: a stale "That is not a Silt Strider seed" stays under a valid run.
- [ ] **C** UI-04: Alchemy with zero stats shows a dash instead of 0%.
- [ ] **C** F10, CALC-4-01: raw ingredient IDs on screen ("Emerald [ingred_emerald_01]",
      "Braided Bread [t_ingfood_breadkeptu_02]") in Alchemy, its effect finder and the
      calculator slots; name the difference instead.
- [ ] **C** REG-01 (retest 1 October, 375 px, 10 of 10): Travel's Followers count and "Include
      quest teleports" reset on reload while the save's options stay. They are journey
      choices kept only in the route link, not save options; decide whether a signed-out
      visitor's choice should stick, as account settings do for signed-in players.
- [ ] **C** CALC-4: the effect finder suggests pairs only (3 and 4 ingredients only in the
      calculator), and a world switch clears the chosen effects and ingredients. Both
      deliberate for now; say so on the page.
- [ ] **C** SS-08: on a phone the selected faction is not visible beside its details.
- [ ] **C** SS-09, U28: "Pre/v", "Nex/t" and "Acrobati/cs" break mid-word on phones.
- [ ] **C** SS-10: "1 ranks" in search.
- [ ] **C** Copy: preset-to-custom wording (U07), a Clear search button (U09), content files and
      phone save location (U15), gold left after a route (U18), Home card jargon (U29).
- [ ] **C** SUS-02: a route total of 4 h 22 min against legs summing to 4 h 23 min (rounding).

From the signed-in QA (1 October):
- [x] F-6: no change (owner, 2 October: desired behaviour). Email sign-in reloads the page;
      the character and world survive it (QA-23 fixed).
- [ ] **C** F-7 (Medium): after Delete on a Vault card, keyboard focus drops to the page body
      and "Delete save?" is not announced; Confirm is 15 Tabs away. Focus the prompt.
- [ ] **C** F-8 (Low): "Keep account defaults" is not remembered; the new-account prompt
      returns on every load until something is saved.
- [ ] **C** F-10 (Low): "Reset all settings" has no confirmation or undo.
- [ ] **C** F-11 (Low): the icon cannot be saved without a username, and the help text does not
      say the username is required.
- [ ] **C** F-12 (Low): Vault cards say "Vvardenfell" for every location and show raw class ids
      ("Lvl 3 mage").
- [ ] **C** F-13 (Low): at 375 px the Vault's Close wraps letter by letter and "Duplicate"
      breaks mid-word.
- [ ] **C** F-15 (Low): after "Open Save File…" there is no upload to the Cloud Vault; the save
      must be chosen again in "Import save".
- [ ] **C** F-16 (Low): Challenge Runs has no cloud save, though the Vault window has a Challenge
      Runs tab and quota; /vault does not show that tab.
- [ ] **C** Gear note (Low; from the 2 October retest): the beast-race note says closed helmets
      are excluded but not that open ones (such as Helm of Oreyn Bearclaw) are kept, so a
      correct pick reads as a bug. Say so in the note.
- [ ] **C** F-17 (Low): Mod version says "Current published data" while disabled; the rename box
      allows 100 characters, the API 120.
- [x] F-18: not a bug. One sign-in in the 2 October retest ended on `/account`; the owner had
      switched windows by accident.
- [ ] **C** F-19 (Low; owner decision 2 October: offer to save it): a world switched in the
      header while signed in lasts only for that session; after signing in again the browser's
      world (or the account's Preferred world, once chosen) wins. When a signed-in player
      switches world, offer to save it as their Preferred world (one dismissible prompt, no
      automatic save: an automatic save caused F-9/QA-23). Keep QA-23's rule that the
      browser's world wins until the player chooses one on the account.
- [x] F-14: no change. The Guild Guide warning is for a save whose character is not a member;
      when an account default turns membership off, Travel labels it "account default" and
      says "no Mages Guild", which is enough.
- [ ] **O** After launch, if wanted: delete the QA accounts in Clerk (the three from 1 October
      plus qa4 from the 2 October retest, which wrote no settings or saves), their
      `account_settings` rows (revisions 26, 4, 2; values are the defaults) and account A's
      Ko-fi support code (`SS-80dec…`).

## Done

- [x] Licences: site AGPL-3.0, pipeline GPL-3.0 (`6ada7bd`, `88d96bc`).
- [x] Social card rebuilt from the site's own maths (`dc5b777`).
- [x] Accessibility and crash fixes from both audits, security headers, 404 page (live as
      `65f849c7`, `b5a0813`).
- [x] Moderator messages: r/OpenMW and OpenMW Discord sent; Morrowind Discord confirmed
      **#modding**; Tamriel Rebuilt Discord skipped (LAUNCH_POSTS, Messages to send).
- [x] Old-format cloud saves deleted; D1 backup taken and verified (29 September).
- [x] Usability audit ([UX_USABILITY_AUDIT.md](UX_USABILITY_AUDIT.md)); tool names and Travel
      defaults decided.
