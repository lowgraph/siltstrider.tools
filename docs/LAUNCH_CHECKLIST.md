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
| **Monday 5 October: freeze** | No changes except fixes for breakage. Then, on the frozen build: regenerate the social card if tool names on it changed (`npm run social-card`) and deploy it; update LAUNCH_POSTS copy to the final names and re-check its claims table against the live site (**C**); take the post screenshots: Builder with the Gear Advisor, Travel map, Level Simulator, a loaded save (**O**); final acceptance pass, LAUNCH_OPERATIONS steps 1–3 and 5 (**C**; step 2 again, since section 4 changes the tools after the 30 September regression) and step 4 with disposable records (**O**); fresh D1 Time Travel bookmark, a full backup if saves have grown, and the rollback target noted (**O**); check the r/OpenMW reply (no answer means post), pick a House Role in Morrowserver `#house-roles`, find the Morrowind Modding Community's tools channel (**O**); on a real phone (QA could only emulate one): no Ctrl K hint on touch, Travel options changed for a loaded save survive leaving Travel and coming back (the unexplained 30 September failure; 0 of 31 in the 1 October QA run), and a real `.omwsave` loads (**O**); Google and Discord sign-in with an unsaved TR + ARCE character, which must come back in TR + ARCE (the signed-in QA could test email only) (**O**). |
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
- [x] **C** **VAULT-TEST** (started 2026-09-30 22:12 UTC, C; done `a7bd0a4`, merged `c8e4aea` (the Premium heading scoped to its section, since ACC-2's settings heading shares `.account-page h2`), not deployed: `scripts/local-stack.cjs` and `scripts/test-vault.cjs`, 10 of 10 cases; the owner's real Clerk sign-in checked on the local site; its axe pass fixed the Vault card's grey Rename and Delete, an unnamed rename box and the account page's heading order) Signed-in Cloud Vault tests before the next deploy (owner, 30
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

### 5. QA findings (1 October): fix before the freeze

From the triage of the five QA reports (live site, signed out, 1 October). Source IDs in
brackets are the reports' own (F/U beginner audit, NUM/FLOW/UI veteran and numbers, SS
first impression and regression). Personas: R Reddit first visit, V veteran, N new player,
Q regression run. Each item: re-check the report's case first, fix, re-check after, plus the
usual tests (at least three edge cases for a logic change) and changelog.

- [ ] **C** **QA-01** (High, V; NUM-05; confirmed in code) Enchanting costs several effects
      wrong: each effect's points are its own plus the running total before it, and the
      item's total is the sum of those running costs (OpenMW 0.51 `enchanting.cpp`);
      `calcEnchantmentTotalPoints` (`lib/enchant-math.mjs`) returns only the last running
      cost. Two Constant Effects of 5/5 must read 75 points, not 50. Fix with QA-02.
- [ ] **C** **QA-02** (High, V; NUM-04; confirmed in code) Enchanting rounds points to
      nearest instead of flooring each effect: a 5/5, 5 s Target Fortify Attribute is 1.875
      points, shown as 2, so it "does not fit" a Common Ring and its base price doubles.
      Afterwards re-check the self-enchant chance (16% vs the engine's 15%) and the base
      price (2,000 vs 1,500 g) from SUS-01.
- [ ] **C** **QA-03** (High, V; NUM-02; confirmed in code) Level Simulator Health per level
      is floored (`floor(END / 10)`, `lib/level-math.mjs`); OpenMW keeps the fraction (10% of
      Endurance): END 35 to 55 gives 22.5 over five levels, the site 21. Confirm against
      OpenMW 0.51's `npcstats.cpp` first (the report cited 0.49); change the explanation too.
- [ ] **C** **QA-04** (High, V, N; NUM-01, F07, NUM-03) The Level Simulator's Health chart
      starts at 50 whatever the character's Health (35, 45), says "Endurance 100 at Lv 6"
      when ten +5 steps are needed, and its forecast moves when Bitter Cup changes only
      Personality and Willpower. Check each symptom on its own; the Bitter Cup one may be
      legitimate if the plan's later picks change.
- [ ] **C** **QA-05** (High, R, V, N; F02, F03, UI-01, SS-02, SS-04, SS-05) The character's
      title goes stale after an edit: the Builder sheet ("Imperial Agent" over a Female
      Breton), Home's character card ("Argonian Marsh Monk" over a Nord), and the Level
      Simulator naming two characters ("Argonian male — Spear scout" beside "Male Dark Elf").
      One fresh character through Builder, edit race, Home, Level Simulator: every heading
      must agree, or the premade's name must read as its source.
- [ ] **C** **QA-06** (High, Q; SS-01 regression; confirmed in code; retest 1 October: Vanilla and every Mortar list pass, TR and TR + ARCE Alembic, Calcinator and Retort still offer "Secret Master's (2x)") Secret Master's
      apparatus is still offered in TR and TR + ARCE Alchemy (Alembic, Calcinator, Retort),
      though the 30 September changelog says it is gone: the filter in
      `lib/alchemy-catalogs.mjs` matches only vanilla keys and names starting "Secretmaster".
- [ ] **C** **QA-07** (High, N; F01; retest 1 October: Vos, Sadrith Mora, Ebonheart and Mournhold found, "Ald'ruhn" still not, stale route still shown) Travel's place search finds nothing for "Ald'ruhn"; only
      "Ald-ruhn" works, and the previous route stays on screen. Ignore apostrophes and
      hyphens in matching; clear or mark a stale route when the search changes. Check Vos,
      Sadrith Mora, Ebonheart and Mournhold too.
- [ ] **C** **QA-08** (High, R, N; F06, SS-01) On a phone the Gear Advisor's Where column
      breaks into fragments ("Ald- / ruhn — / sold by / Dander / a"). Stack slot, item and
      source at phone width; Early and Late game, 375 and 390 px.
- [ ] **C** **QA-09** (High, N; F05; retest 1 October at 375 px: all five Configure popovers fail; Race runs below the screen behind the tab bar, Birthsign, Specialization and both Favored Attribute run off the right edge) On a phone the Builder's Specialization help opens mostly
      off-screen. Keep every info popover inside the viewport; check each info icon at 375 px.
- [ ] **C** **QA-10** (High, V; FLOW-02; retest 1 October: Early game now omits boots for Argonian and Khajiit, but the optimized endgame kit and runner-ups still offer Boots of Blinding Speed and, for an Argonian, the Masque of Clavicus Vile) Beast races are offered helmets and boots they cannot
      wear in the Gear Advisor's runner-up picks (Masque of Clavicus Vile, Boots of Blinding
      Speed) under the advisor's own note that they are excluded. Seen once; check Argonian,
      Khajiit and an ARCE Khajiit form, every runner-up list.
- [ ] **C** **QA-11** (Medium, V, Q; UI-02, SS-02, SS-03) The TR and TR + ARCE Faction Journal
      shows raw codes ("T_cyr_fightersguild", "T_mw_imperialnavy") in Inter-Faction Relations
      and literal "<Deprecated>" factions in the list. Readable names (ask the pipeline if the
      catalog lacks them); hide deprecated factions.
- [ ] **C** **QA-12** (High, N; U04, F08) Premade build cards say nothing about how a build
      plays, and "Maj:", "Min:" and "Magic Specialization" go unexplained. One "plays like"
      line and one trade-off per playstyle; spell out Major and Minor skills. Copy only.
- [x] **C** **QA-13** (done by CALC-4, merged `ef67b3e`, live as `3879ce7b`; retest 1 October: Restore Health found and its first pair carried into the calculator in all three worlds, desktop and 375 px) (High, N; U20) A first potion needs ingredient names: searching
      "Restore Health" in Alchemy finds nothing. CALC-4 answers it if it lands before the
      freeze; otherwise a starter-recipe line (Marshmerrow with Saltrice or Wickwheat).
- [x] **C** **QA-14** (no change made; the retest on `3879ce7b`, 1 October, found the Vault already tells the open save from Local Browser Saves, with "Save this character" rows marked Local storage) (Medium, R; SS-07; owner: change the wording) A loaded save says it is
      kept in this browser while the Vault's Local Browser Saves lists 0 and "No local
      characters found". Say what each is: the open save stays until cleared; Local Browser
      Saves are characters saved with "Save this character".
- [ ] **C** **QA-15** (Low, R; owner decision) About says the site is open source (code under
      AGPL-3.0; not the game or mod data), links https://github.com/lowgraph/siltstrider.tools
      and says it is made by LowGraph. Keep `test/site-claims.test.js` and the licence
      wording rules (COORDINATION, Licences).
- [ ] **C** **QA-16** (found in the 1 October retest; re-check first) Travel: Ebonheart to
      Mournhold showed No Route, though the Mournhold teleport from Ebonheart is everyday
      travel (Teleports policy). Check in Vanilla, TR and TR + ARCE with walking on and off;
      if it reproduces it is a wrong answer (High).

Checks the live QA could not run (sent to Codex with the QA-01 to QA-16 reproduction,
1 October); each becomes a finding if it fails:
- [ ] **C** **QA-17** Hydration and console errors on first load: every route, fresh, with a
      stored TR + ARCE world, a loaded save and each shared-link kind, 1366 and 375 px, both
      themes; Home and Builder ten times fresh. Kept as `--suite hydration` in the runner.
- [ ] **C** **QA-18** Real touch emulation (touch points, coarse pointer, no hover, tap
      events): no Ctrl K hint, tab bar, menus and popovers by tap, Travel save options 20
      times by tap, Alchemy pickers. Kept as `--touch` in the runner.
- [ ] **C** **QA-19** The signed-out API: GET `/api/account`, `/api/settings`, `/api/saves`,
      `/api/entitlements` and PUT `/api/settings` answer 401, with no data and no Set-Cookie.
- [ ] **C** **QA-20** Game data QA could not source: reverse alchemy's Restore Health pairs and
      the Vanilla Fighters and Mages Guild ranks, against the staged catalogs.

From the signed-in QA (live, 1 October, three email-only QA accounts, cleaned up; report
`siltstrider-account-qa-2026-10-01.md`, F-ids):
- [ ] **C** **QA-21** (High; F-1) "Load this build into Character Builder" in the Cloud Vault
      leaves a TR + ARCE build in the visitor's world: Vanilla, race shown as Argonian, the
      sheet stuck on "Calculating statistics…" (2 of 2). The Vault applies builds with the
      provider's plain `setBuild`, which ignores `build.world` and `build.arce`
      (`app-shell.jsx`, `character-context.jsx` `loadBuild`). Loading a build must set its
      world, as a shared link does (LINK-1).
- [ ] **C** **QA-22** (High; F-2, F-17) Share links carry the wrong character. An imported
      save's "Copy shareable permalink" writes raw ids (`className:"mage"`,
      `T_Els_Cathay-raht`), empty skill lists, the wrong gender and `world=vanilla` for a
      TR + ARCE save; it opens as a different or broken character (2 of 2 saves; Builder
      builds are fine). A challenge run's link took the visitor's current world (`world=tr`)
      for a run rolled in Vanilla. A link must describe its own character or run.
- [ ] **C** **QA-23** (High; F-3, F-9) Signing in switches to the account's Preferred world
      when the address has no `?world=` (3 of 3): an unsaved TR + ARCE character, or a loaded
      TR + ARCE save, comes back in Vanilla, the save re-read as plain Khajiit
      (`shell-context.jsx`). A new account has chosen nothing yet, but switching world or
      loading a save already auto-saves a Preferred world (F-9), which then wins. On sign-in
      the browser's world must win until the player chooses one on the account.
- [ ] **C** **QA-24** (High; F-4) Signing out loses an unsaved Builder character: sign-out loads
      Home afresh and the Builder shows a random premade (2 of 2). A loaded save survives.
      Keep the character through sign-out as through sign-in (`SIGN_IN_EVENT` hand-off).
- [ ] **C** **QA-25** (Medium, against a recorded invariant; F-5) With a save loaded, a Travel
      link's starting point is replaced by the save's position (`/travel?from=Balmora…` plans
      from Seyda Neen; the plan is kept). COORDINATION, Travel from the loaded save: a link
      wins over the save's starting point.

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
- [ ] **C** F-6 (Medium): email sign-in reloads the page (4 of 4). The character comes back
      through the hand-off; the world was QA-23.
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
- [ ] **C** F-17 (Low): Mod version says "Current published data" while disabled; the rename box
      allows 100 characters, the API 120.
- [x] F-14: no change. The Guild Guide warning is for a save whose character is not a member;
      when an account default turns membership off, Travel labels it "account default" and
      says "no Mages Guild", which is enough.
- [ ] **O** After launch, if wanted: delete the three QA accounts in Clerk, their
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
