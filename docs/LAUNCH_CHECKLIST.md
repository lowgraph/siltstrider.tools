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
- [x] **C** **CHL-1** (started 2026-09-29 20:29 UTC, C; done `2fdcb3d` on branch `launch/chl-1-presets`, not merged or deployed) One row of difficulty presets.
- [x] **C** **FAC-1** (started 2026-09-29 20:34 UTC, C; done `39ccad1` on branch `launch/chl-1-presets`, not merged or deployed) Rank names, skill labels, plain words for placements and spots.
- [ ] **C** **MOB-3** No "Ctrl K" hint on touch devices. **SITE-5** Explain "TR + ARCE".

### 3. Before launch if time allows (can slip without breaking anything)

- [x] **C** Contrast (started 2026-09-29 20:51 UTC, C; done `241f58f` on branch `launch/contrast-fg13-fg15`) retune `fg-13`–`fg-15` against every panel they sit on (Faction
      Journal, Equipped Loadouts, premade catalog, Challenge, Travel labels), both themes.
- [x] **C** Target size: the Level Simulator's attribute buttons to 24px (started 2026-09-29 21:08 UTC, C; done `da81aeb` on branch `launch/level-buttons-24px`).
- [ ] **C** Heading levels on the Level Simulator and Vault.
- [ ] **C** Re-run the axe, keyboard and high-contrast audit (acceptance for the three above).
- [ ] **O** Usability test with three to five people, using the audit's script; **C** fix
      what three or more hit, and any High finding they confirm.
- [ ] **C** Browser regression across all tools in Vanilla, TR and TR + ARCE at desktop and
      phone widths (LAUNCH_OPERATIONS final acceptance, steps 2–3).

### Cut line

At the freeze, whatever is left of section 3 moves after launch; note it in
LAUNCH_VERIFICATION. Sections 1 and 2 are the launch bar: if one of them is not done, decide
explicitly whether to launch with it (and say so here).

### 4. After launch

TRV-2 one place search; TRV-4 and TRV-5 task-first Travel with folded options; TRV-6
remembered choices and scrolls as one use; TRV-7 cheapest trade-off; BLD-2 automatic Gear
Advisor; BLD-3 premades first; BLD-4 a real Save button; CALC-2 editable skills; CALC-3 one
combobox per slot; HOME-1 two first steps; HOME-3 outcome numbers; SITE-3 nav order; SITE-4
character bar as a control; MOB-1 and MOB-4 lighter phone header and tabs; ENC-1 early-game
enchanting defaults; CHL-2 locks; LVL-2 and LVL-3; header menus focusing their first item; the
Cloud Vault checking a save's hash on load; CALC-4 reverse alchemy (a feature).

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
