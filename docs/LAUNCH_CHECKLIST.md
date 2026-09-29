# Launch checklist: 29 September to launch

The single ordered list from here to launch on **Tuesday 6 October 2026, 13:30 UTC**.
Details live in the linked documents; this file says what happens in which order and who
does it. **O** = owner, **C** = Claude (or the agent doing the work). Tick items as they
land and add the commit or version beside them.

- Usability findings (IDs such as TRV-1): [UX_USABILITY_AUDIT.md](UX_USABILITY_AUDIT.md)
- Posts, messages and claims: [LAUNCH_POSTS.md](LAUNCH_POSTS.md)
- Release, backup and rollback procedures: [DEPLOYMENT.md](DEPLOYMENT.md),
  [LAUNCH_OPERATIONS.md](LAUNCH_OPERATIONS.md)
- Production state and history: [LAUNCH_VERIFICATION.md](LAUNCH_VERIFICATION.md)

## Why this order

The audit's before-launch changes are the UX pass. Words and defaults go first because they
decide which controls and text exist; visual polish (contrast, target sizes) goes last, on the
final surfaces; a check with real people follows while there is still time to act on it; then
a freeze, and only then the screenshots and social card, so they show what visitors will see.

## Already done

- [x] Licences: site AGPL-3.0, pipeline GPL-3.0 (`6ada7bd`, `88d96bc`).
- [x] Social card rebuilt from the site's own maths (`dc5b777`).
- [x] Accessibility and crash fixes from both audits, security headers, 404 page (live as
      `65f849c7`, `b5a0813`).
- [x] Moderator messages: r/OpenMW and OpenMW Discord sent; Morrowind Discord confirmed
      **#modding**; Tamriel Rebuilt Discord skipped (LAUNCH_POSTS, Messages to send).
- [x] Old-format cloud saves deleted; D1 backup taken and verified (29 September).

## Tuesday 29 September (today)

- [ ] **C** Push the usability audit and this checklist.
- [ ] **O** Decide one name per tool (SITE-1). Suggested, matching the launch copy:
      Character Builder (with its Gear Advisor), Level Simulator, Travel Planner, Alchemy,
      Enchanting, Spellmaking, Faction Journal, Challenge Runs, Cloud Vault.
- [ ] **O** Decide the new-character defaults: Mages Guild off, theft off (or asked), no
      Intervention unless a save says so.

## Wednesday 30 September: defaults and trust (batch A)

- [ ] **C** TRV-1: Travel plans for a new character by default (no guild, no spells, no
      items), with a one-line summary and a Change link.
- [ ] **C** BLD-1: "Steal early gear" off by default.
- [ ] **C** LVL-1: fix `detectArchetype` so minors cannot make a warrior a Diplomat; test the
      default build; show why an archetype was chosen.
- [ ] **C** HOME-2 and SITE-4 (label only): "Example character — make it yours" until the
      player changes or loads one, on the home card and every "Active character" bar.
- [ ] **C** TRV-6 (label only): mark options set from a loaded save ("from your save").
- [ ] **C** TRV-3: Places buttons lose the browser grey; merge same-named exterior cells.
- [ ] **C** Tests for each (at least three edge cases per logic change), `npm test`, commit.

## Wednesday 30 September to Thursday 1 October: words (batch B)

- [ ] **C** SITE-1: apply the chosen names in nav, headings, buttons, cards and the footer;
      long SEO titles stay as page titles only.
- [ ] **C** SITE-2 and VLT-1: every "invariants" or "rules" box becomes a closed "How this is
      calculated" disclosure in plain words. This also lifts Travel's route a screen higher
      on phones (most of TRV-4's pain before the full restructure).
- [ ] **C** CALC-1: no results before input (dashes and a prompt).
- [ ] **C** CHL-1: one row of difficulty presets.
- [ ] **C** FAC-1 and FAC-2: rank names, skill labels, plain words for placements; drop
      "inter-faction standing".
- [ ] **C** Home card claims: Alchemy's "verified engine formulas" and "exact potion" go
      (LAUNCH_POSTS, Claims removed).
- [ ] **C** MOB-3: no "Ctrl K" hint on touch devices. SITE-5: explain "TR + ARCE".
- [ ] **C** `npm test`, commit.

## Thursday 1 October: visual polish and release (batch C)

- [ ] **C** Contrast: retune `fg-13`–`fg-15` against every panel they sit on (Faction
      Journal, Equipped Loadouts, premade catalog, Challenge, Travel labels), both themes.
- [ ] **C** Target size: the Level Simulator's attribute buttons to 24px.
- [ ] **C** Heading levels on the Level Simulator and Vault.
- [ ] **C** Re-run the axe, keyboard and high-contrast audit on a local build: no new
      violations; contrast and target size at zero.
- [ ] **O** Say "deploy". **C** release per DEPLOYMENT.md, post-deploy checks, re-run the
      audit on production, record the release in LAUNCH_VERIFICATION.

## Thursday 1 to Friday 2 October: check with people

- [ ] **O** Real sign-in test on production (LAUNCH_VERIFICATION §5 item 6): build a
      character, Sign in from the Vault with Google or Discord, save, reload; then delete
      the 10:54 save and save the Khajiit again, if not done already.
- [ ] **O** Usability test with three to five people, using the script at the end of the
      audit (seven tasks, twenty minutes each). Note failures by finding ID.
- [ ] **C** Browser regression across all tools in Vanilla, TR and TR + ARCE at desktop and
      phone widths (LAUNCH_OPERATIONS final acceptance, steps 2–3; LAUNCH_VERIFICATION §5
      item 4).

## Saturday 3 to Sunday 4 October: act on what people hit

- [ ] **C** Fix what three or more testers hit, and any High finding they confirm. Anything
      larger goes to the post-launch list.
- [ ] **O** Say "deploy"; **C** release and verify as above.

## Monday 5 October: freeze and prepare

- [ ] **C** Code freeze: after this, only fixes for breakage.
- [ ] **C** Regenerate the social card if tool names changed (`npm run social-card`), deploy
      it, and check the live `/og-image.png`.
- [ ] **C** Update LAUNCH_POSTS copy to the final tool names and features; re-check every
      claim in its table against the live site.
- [ ] **O** Screenshots for the posts (Builder with the Gear Advisor, Travel map, Level
      Simulator, a loaded save), taken on the frozen build.
- [ ] **C** Final acceptance pass, LAUNCH_OPERATIONS steps 1, 3 and 5; **O** step 4 (sign-in,
      cloud create/load/rename/delete, supporter badge) with disposable records.
- [ ] **O** Recovery record: fresh D1 Time Travel bookmark (and a full backup if saves have
      grown), per LAUNCH_OPERATIONS; note the rollback target version.
- [ ] **O** Launch prerequisites: r/OpenMW reply checked (no answer means post); House Role
      picked in Morrowserver `#house-roles`; Morrowind Modding Community channel found.

## Tuesday 6 October: launch (13:30 UTC)

- [ ] **O** Post r/Morrowind (flair Showcase), r/OpenMW (unless refused), r/TamrielRebuilt;
      Morrowserver `#modding`; Morrowind Modding Community; OpenMW Discord if approved.
- [ ] **O** Stay a few hours for comments (LAUNCH_POSTS, Replies; be ready for "was it made
      with AI?").
- [ ] **C** Watch errors and load: Worker logs and error references, API request count, D1,
      Clerk sign-ins; fix only breakage, and deploy only with the owner's go-ahead.

## Wednesday 7 to Thursday 8 October

- [ ] **O** Show HN and the X thread (Wednesday).
- [ ] **O** Creator outreach from Thursday, one at a time, through business contacts.
- [ ] **C** Collect feedback from the threads into the post-launch list.

## Cut line

If time runs short, keep batch A, SITE-1, SITE-2, CHL-1 and FAC-2, the sign-in test, and the
freeze tasks. The contrast retune, heading levels and the people check can move after launch
without breaking anything; say so in LAUNCH_VERIFICATION if they do.

## After launch (not before)

TRV-2 one place search; TRV-4 and TRV-5 task-first Travel with folded options; TRV-6
remembered choices and scrolls as one use; TRV-7 cheapest trade-off; BLD-2 automatic Gear
Advisor; BLD-3 premades first; BLD-4 a real Save button; CALC-2 editable skills; CALC-3 one
combobox per slot; HOME-1 two first steps; HOME-3 outcome numbers; SITE-3 nav order; SITE-4
character bar as a control; MOB-1 and MOB-4 lighter phone header and tabs; ENC-1 early-game
enchanting defaults; CHL-2 locks; LVL-2 and LVL-3; header menus focusing their first item;
the Cloud Vault checking a save's hash on load; CALC-4 reverse alchemy (a feature).
