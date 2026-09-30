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
| **Monday 5 October: freeze** | No changes except fixes for breakage. Then, on the frozen build: regenerate the social card if tool names on it changed (`npm run social-card`) and deploy it; update LAUNCH_POSTS copy to the final names and re-check its claims table against the live site (**C**); take the post screenshots: Builder with the Gear Advisor, Travel map, Level Simulator, a loaded save (**O**); final acceptance pass, LAUNCH_OPERATIONS steps 1, 3, 5 (**C**) and step 4 with disposable records (**O**); fresh D1 Time Travel bookmark, a full backup if saves have grown, and the rollback target noted (**O**); check the r/OpenMW reply (no answer means post), pick a House Role in Morrowserver `#house-roles`, find the Morrowind Modding Community's tools channel (**O**). |
| **Tuesday 6 October, 13:30 UTC: launch** | Post r/Morrowind (flair Showcase), r/OpenMW (unless refused), r/TamrielRebuilt, Morrowserver `#modding`, Morrowind Modding Community, OpenMW Discord if approved; stay a few hours for comments, ready for "was it made with AI?" (**O**). Watch Worker logs and error references, API requests, D1 and Clerk sign-ins; fix only breakage, deploy only on the owner's go-ahead (**C**). |
| **Wednesday 7 October** | Show HN and the X thread (**O**). |
| **From Thursday 8 October** | Creator outreach, one at a time, through business contacts (**O**). Feedback from the threads goes into the after-launch list (**C**). |

## Decisions (29 September, owner)

- **Tool names:** Character Builder (with its Gear Advisor), Level Simulator, Travel Planner,
  Alchemy, Enchanting, Spellmaking, Faction Journal, Challenge Runs, Cloud Vault.
- **Travel defaults:** without a loaded save, Mages Guild member **on** and Conjurer rank
  **off**, as now. With a loaded save, use what the character has (guild standing,
  Intervention, items), and when the character is not a Mages Guild member, warn that Guild
  Guides work from Mages Guild halls and need membership.
- **Usability audit:** its assessment is accepted, including theft off by default in the
  Gear Advisor (BLD-1).

## Priority list

**Current workflow (owner, 30 September):** write each requested fix, its tests and
handoff/changelog text, and run tests before every commit. This supersedes the earlier
instruction to leave tests unrun. Codex specializes in Travel; after each item, stop
and ask the owner before starting the next. Build/browser verification status must be
recorded separately from automated tests.
The owner subsequently authorized TRV-2's tests: `npm test` passed on 30 September
with 718 tests and 0 failures. Browser verification remains pending.
TRV-4 & TRV-5's tests were also authorized: `npm test` passed on 30 September
with 724 tests and 0 failures. Build and browser verification remain pending.

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

### 3. Before launch if time allows (can slip without breaking anything)

- [x] **C** Contrast (started 2026-09-29 20:51 UTC, C; done `241f58f`, merged `b0e5f39`; the Faction Journal's tinted cards fixed in `e34f135`; live as `4951b9b5`) retune `fg-13`–`fg-15` against every panel they sit on (Faction
      Journal, Equipped Loadouts, premade catalog, Challenge, Travel labels), both themes.
- [x] **C** Target size: the Level Simulator's attribute buttons to 24px (started 2026-09-29 21:08 UTC, C; done `da81aeb`, merged `ae152d0`, live as `4951b9b5`).
- [x] **C** Heading levels on the Level Simulator and Vault (started 2026-09-29 21:11 UTC, C; done `9758aa9`, merged `384118d`, live as `4951b9b5`).
- [ ] **C** Re-run the axe, keyboard and high-contrast audit (acceptance for the three above).
- [ ] **O** Usability test with three to five people, using the audit's script; **C** fix
      what three or more hit, and any High finding they confirm.
- [ ] **C** Browser regression across all tools in Vanilla, TR and TR + ARCE at desktop and
      phone widths (LAUNCH_OPERATIONS final acceptance, steps 2–3).

### 4. Priority 4: After launch (organized by priority)

#### 4.1 Core routing and builder workflow
- [x] **C** **TRV-2** (started 2026-09-30 00:14 UTC, Codex; implemented `866bd3a` on `launch/trv-2-unified-place-search`; 18 new tests; owner authorized `npm test` on 30 September: 718 passed, 0 failures; browser verification pending; not merged or deployed) One place search: replace the dual stop list and "Places" cell list with a single unified combobox per route end; rank towns and transit stops first, then named exteriors, then interiors grouped under their town ("Balmora › Council Club").
- [x] **C** **TRV-4 & TRV-5** (started 2026-09-30 15:29 UTC, Codex; implemented `597214d` on `launch/trv-2-unified-place-search`; six new integration tests; owner authorized `npm test` on 30 September: 724 passed, 0 failures; build/browser verification pending; not merged or deployed) Task-first Travel with folded options: place Origin, Destination, and "Plan for" at the top with route results immediately below; fold character and transit options into a one-line summary disclosure; move transit rules to a closed footer disclosure.
- [x] **C** **BLD-2** Automatic Gear Advisor (started 2026-09-29 21:30 UTC, C; done `5e36716`): compute gear recommendations automatically when character build attributes/skills change, and add a quick-jump link from the top of the builder ("Early gear for this build ↓").
- [x] **C** **TRV-6** (started 2026-09-30 15:56 UTC, Codex; implemented `7a85863`, branch `launch/trv-2-unified-place-search`; owner authorized tests: `npm test` passed on 30 September, 740 tests, 0 failures) Remembered choices & single-use scrolls: persist player modifications to save-derived options across visits for that save; treat Intervention scrolls as single-use consumables rather than permanent routing access; consider cast chance before assuming known spells are usable. Save/profile-scoped browser overrides, reset to save defaults, finite scroll counts, estimated cast chance and shared current Magicka budget implemented. All 16 new tests passed. Build and browser verification pending. Not merged or deployed.
- [x] **C** **CALC-2** Editable calculator skill inputs (started 2026-09-29 21:36 UTC, C; done `822c4dc`): allow typing custom skill, attribute, and Luck numbers directly in Alchemy, Enchanting, and Spellmaking ("Using Dark Elf Custom: Alchemy 5 — change") without requiring a built character first.

#### 4.2 Onboarding, mobile, and character continuity
- [ ] **C** **HOME-1 / MOB-2** Equal first steps on Home & mobile: provide two equal primary actions ("Start a character / Browse 41 premades" and "Load my save"); lead with character creation on touch devices.
- [ ] **C** **BLD-3** Premade builds first for newcomers: open the Character Builder on the Premade Builds Catalog on a first visit, or surface three recommended starter archetypes above the custom form.
- [ ] **C** **BLD-4** Local character save button: add an explicit "Save this character" action for browser storage in the builder without requiring an account, keeping Cloud Vault sync as an optional upgrade.
- [ ] **C** **SITE-4** Interactive active character bar: make the global character bar across tools clickable to link back to the Character Builder with a clear edit prompt.
- [ ] **C** **MOB-1 & MOB-4** Mobile header & builder layout compaction: streamline the phone header (single tagline, search behind an icon) and compact builder tab controls so inputs appear above the fold on mobile.

#### 4.3 Controls cleanup and interaction polish
- [ ] **C** **CALC-3** Single combobox per Alchemy slot: merge the separate dropdown and text filter into a single searchable combobox per ingredient slot.
- [ ] **C** **CHL-2** Consolidated Challenge locks: replace redundant locking mechanisms across the sheet, pinned slots, and restrictions with a single contextual lock per rolled item.
- [ ] **C** **ENC-1** Early-game Enchanting defaults: default to early-game accessible items (Common Ring, Petty/Lesser Soul Gem) instead of end-game Exquisite jewelry and Grand Soul Gems.
- [ ] **C** **SITE-3** Centrality-based navigation order: reorder top navigation to reflect usage frequency (Character Builder, Level Simulator, Travel Planner, Alchemy, then secondary tools).
- [ ] **C** **LVL-2 & LVL-3** Level Simulator polish: move niche "Drink Bitter Cup" toggle into an Advanced collapsible group; adopt standard 3-letter attribute abbreviations (END, PER, STR) to prevent label clipping.
- [ ] **C** **TRV-7** (started 2026-09-30 16:35 UTC, Codex; branch `launch/trv-2-unified-place-search`) Transparent Cheapest routing trade-offs: display the trade-off on "Cheapest" route results (e.g. "saves 5 gold, 1h 13m slower than Fewest legs").
- [ ] **C** **HOME-3** Player-centric outcome metrics: replace developer-centric metrics ("27 skills modeled") with tangible player outcomes ("Routes to any named place", "×5 level-ups planned").
- [ ] **C** Keyboard menu navigation: ensure dropdown menus in the header automatically focus their first item when opened via keyboard.
- [ ] **C** Cloud Vault save hash verification: verify OpenMW save file hash on load to confirm save integrity and detect external file modifications.

#### 4.4 Post-launch features
- [ ] **C** **CALC-4** Reverse Alchemy Recipe Calculator: reverse effect search allowing players to select desired magical effects (e.g., Restore Health, Levitate) to discover ingredient pairings and vendor availability.

### Cut line

At the freeze, whatever is left of section 3 moves into section 4; note it in
LAUNCH_VERIFICATION. Sections 1 and 2 are the launch bar: if one of them is not done, decide
explicitly whether to launch with it (and say so here).

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
