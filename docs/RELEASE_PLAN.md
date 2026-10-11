# Release plan: three timelines

Source: *Silt Strider Tools: acceptance master plan* (11 October 2026). This file splits that
plan into what the owner does, what agents do, and what the two repositories must look like,
each by date. The plan's rule holds: **dates can move, gates do not.** A phase starts only when
the previous gate passes.

"Release" means the first public announcement. The site itself is already live
(`e4bc16c`, Worker `03e8ff80`, unchanged since 3 October).

## Gates and dates

| Gate | Date | Passes when |
| --- | --- | --- |
| 0 | Sat 17 Oct | Cut list and name question decided in writing. Feature freeze declared in the README. Existing supporters told. |
| 1 | Sun 1 Nov | No premium anywhere. Sign-in optional and off the first screen; no cookie before sign-in. New home, About, Support and README live. Pipeline renamed. Asset audit clean; every public claim true. |
| 2 | Sun 15 Nov | Ledger rows for all lead tools pass in CI. 30 routes walked. Known-issues page live. Old share links tested. |
| 3 | Sat 21 Nov | Five outside testers have used the site. Tamriel Rebuilt and Tales from Nirn told. Moderators asked. No correctness bug open on a lead tool. |
| 4a | Sun 29 Nov | Every correctness report from the OpenMW venue (posted Tue 24 Nov) closed. |
| 4b | Sun 6 Dec | Every report from Tamriel Rebuilt spaces (posted Tue 1 Dec) closed. |
| 4c | Sun 13 Dec | Every report from r/Morrowind (posted Tue 8 Dec) closed. Phase 5, maintenance, begins. |

Lead tools: the journey planner, the ingredient finder and the OpenMW save reader (beta).
Support tools: the Enchanting, Spellmaking and potion calculators, the Faction Journal and
character sheet maths.

---

## 1. Owner: what you must do, by when

Agents write none of the public words, file nothing upstream and contact no one. Everything
in this section is yours.

### Gate 0 — by Sat 17 Oct (decisions)

- [ ] **Premium:** remove it; keep cloud saves free with one slot limit for everyone (choose
      the number; today it is 5 free / 25 supporter).
- [ ] **Supporters:** tell existing supporters and offer refunds (the Terms promise notice
      when paid benefits change). Decide what happens to supporter rows in D1: keep until
      refunds settle, then delete by migration (needs your sign-off, as migration 0007 did).
- [ ] **Freeze:** declare a feature freeze until release, and one numbered release a week
      (pick the weekday; this plan assumes Sunday).
- [ ] **Name:** write to Tales from Nirn about "Silt Strider". If they object, rename now.
- [ ] **Cut list:** settle the premade builds and the Gear Advisor: keep only what you have
      played and can defend; the rest gets an "experimental" label or is cut.
- [ ] **Portfolio:** decide whether this is also a portfolio project. If yes, it is said once,
      plainly.
- [ ] **Textures:** say where `public/textures/mw-border.png`, `mw-bevel.png` and
      `mw-groove.png` came from (added 29 September as "Morrowind 9-slice border textures";
      unused by the site's CSS, but deployed and baked into `og-image.png`). If from game
      files, they go.
- [ ] **Agent rules:** approve the six agent rules (section 2) for AGENTS.md.

### Gate 1 — by Sun 1 Nov (words and claims)

By **Sun 25 Oct**, so agents can wire them in before the Gate 1 release:
- [ ] **Words:** write the AI statement, the About page, the home page line, the README
      introduction and the Support page (real yearly cost, separated from AI subscriptions;
      "covered until [month]"; upstream projects to support; one Ko-fi link; one line on the
      removed paid tier).
- [ ] **Data and AI tools:** find out what game and mod data your coding tools were shown, and
      your providers' data settings. The AI statement and the "uncomfortable questions"
      depend on it.
- [ ] **Claims:** confirm every public claim: no game assets, no AI images, who wrote the
      interface text, and how much of the code you can read and explain.
- [ ] **Pipeline repo:** rename `openmw-decompiler` on GitHub (Settings → rename; GitHub
      redirects the old address), once agents have its references ready (from Thu 22 Oct).
- [ ] **Security review:** arrange a web-security review of sign-in and the save backend
      (done by Fri 13 Nov).

By **Sun 1 Nov**:
- [ ] **Gate 1 release:** review it and authorise the deploy.

### Gate 2 — by Sun 15 Nov (proof)

- [ ] **Routes:** walk 30 routes in game, 10 on Vvardenfell and 20 on the mainland, and record
      each result. Start now on the live site; about 2 a day. Done by Sun 15 Nov.
- [ ] **Calculator cases:** record 20 in-game cases per calculator where the engine cannot
      be queried (console-set stats). Due Thu 12 Nov, so agents can encode them by Gate 2.
- [ ] **TR note:** send Tamriel Rebuilt a short courtesy note once the cleaned site is live
      (Mon 2 – Fri 6 Nov).
- [ ] **Moderators:** ask each venue's moderators whether and where to post: OpenMW forum,
      Discord or r/openmw; TR spaces; r/Morrowind. Ask by Sun 8 Nov so answers arrive in time.
- [ ] **Testers:** recruit five outside testers for the quiet round (by Fri 13 Nov).

### Gate 3 — by Sat 21 Nov (quiet round)

- [ ] **Tales from Nirn:** confirmed (from Gate 0).
- [ ] **Quiet round:** run it with the five testers (Mon 16 – Fri 20 Nov) and triage their
      findings.
- [ ] **Answers:** write your true answers to the twelve uncomfortable questions (by Fri 20 Nov).
- [ ] **Upstream reports:** file those your pipeline found, each confirmed by you in game.
      This is "give before asking"; do it before the first post.
- [ ] **Calendar:** block each post day and the two days after (24–26 Nov, 1–3 Dec, 8–10 Dec).
- [ ] **Sign off Gate 3:** no correctness bug open on a lead tool.

### Gate 4 — posts, one week apart

Each post: written by you, its own text and angle per venue, disclosure in the first lines,
one picture, one ask, limits stated, others credited, no donation link. Online 6–8 hours on
the day, then daily for a week; answer each comment once; every bug becomes an issue, a fix,
a test and a credit. Never ask for money, upvotes, pins or links. If a post is removed, ask
the moderators privately; do not repost.

| Date | Venue | Lead with | Ask | Gate |
| --- | --- | --- | --- | --- |
| Tue 24 Nov | OpenMW forum, Discord or r/openmw | Save reader, formula ledger, in-engine checks | "Where does my port differ from the engine?" | 4a, Sun 29 Nov |
| Tue 1 Dec | Tamriel Rebuilt spaces (if willing) | Mainland routes and ingredient sources for 26.08 | "What is wrong or missing? Tell me if you want anything changed or removed." | 4b, Sun 6 Dec |
| Tue 8 Dec | r/Morrowind | One route picture, the new-player angle | "Break my route planner." | 4c, Sun 13 Dec |

### Phase 5 — from Mon 14 Dec

- [ ] **Releases and corrections:** keep the weekly release and the corrections log going.
- [ ] **Update window:** commit to updating data within [N] days of a Tamriel Rebuilt or
      OpenMW release (choose N), and say so publicly.

---

## 2. Agents: what they must deliver, by when

Agents deliver the sixteen outcomes below, each with its done-when test. Each change is
verified as usual (`npm test`, plus the groups `npm run test:browser:plan` prints;
BROWSER_TESTS.md). The full browser set runs before each gate's release.

**Six rules for every agent task** (to add to AGENTS.md once the owner approves):
1. No posts, replies, About text or messages to anyone.
2. No upstream reports. Prepare the evidence; the owner confirms it in game and files it.
3. No generated images.
4. No features until release beyond A1–A16.
5. Any change to a number ships with a ledger row and a test.
6. No history rewrites and no removed attribution.

### Week of 12 Oct (Gate 0): read-only preparation, no product changes

- [ ] **Premium inventory:** list every premium code path, route, table, page and test
      (`cloudflare/routes/premium.mjs`, `entitlements.mjs`, Ko-fi webhook, supporter tier,
      Terms and Privacy text), with a removal order, for A1.
- [ ] **Asset inventory:** list every image, icon and font with its git origin, for A7.
- [ ] **Claim inventory:** list every public claim and where it appears (site, README,
      metadata, social card), for A7.

### Phase 1, Mon 19 Oct – Sun 1 Nov (Gate 1)

| # | Outcome | Done when | Window |
| --- | --- | --- | --- |
| A7 | Asset and claims audit | ASSETS.md lists every image, icon and font with origin and licence. Anything from game archives or an image generator is replaced; the social card is regenerated. The claims test fails on "definitive", "perfect", "exact" and unbacked "verified" (today "definitive" is in `app/layout.jsx` four times and "Plan the perfect … run" is on Home). | 19–21 Oct |
| A1 | Premium removed; cloud saves free and hardened | No premium code path, payment webhook or supporter tier remains. Everyone has the same slot limit. Export and account deletion are self-serve. Tests prove one account cannot read or change another's saves (the Vault suite already covers ownership; extend it). No cookie is set before sign-in. Privacy and Terms match. Supporter rows are kept until the owner approves the delete migration. | 19–25 Oct |
| A2 | Local saves with export and import | A character survives export, a browser reset and import, in an automated test. | 19–24 Oct |
| A6 | Repositories restructured | See section 3, Gate 1. History untouched. Pipeline references ready for the owner's rename by Thu 22 Oct. | 19–28 Oct |
| A5 | Advice features parked | Premade builds, Gear Advisor and rankings carry an "experimental" label, or are cut to the owner's list. | 22–24 Oct |
| A3 | Travel-first home and navigation | Home opens on a working route box (From, To, Vanilla/TR switch), one trust line and a beta label. Navigation: Travel, Alchemy, Calculators, Your save, Character, More. Sign-in, "Popular"/"New" badges, the premade count and ×5 headlines are off the first screen. | 24–30 Oct |
| A4 | Two doors and spoiler-safe mode | The new-player path hides unique item locations and quest lists until clicked. Spoiler-safe mode only if done by Fri 30 Oct; otherwise after release (it is the largest new piece). | 26–30 Oct |
| — | Gate 1 release | Owner's words wired in; full browser set and Vault suite pass; owner authorises deploy. | 30 Oct – 1 Nov |

TR + ARCE carries a "less tested" note until it passes the same checks as Vanilla and TR.

### Phase 2, Mon 2 Nov – Sun 15 Nov (Gate 2)

| # | Outcome | Done when | Window |
| --- | --- | --- | --- |
| A12 | CI, status table, known issues | CI runs on every push. The status table is generated from results and **shows skipped tests as skipped**: CI has no game data, and 84 tests skip without it. A known-issues page is live. | 2–5 Nov |
| A15 | Release process | Weekly numbered releases, the first being the Gate 1 deploy. Interface and data changelogs are separate. | 2–8 Nov |
| A14 | Stable share links | A corpus of links from every past release format opens correctly in tests, run on every release. | 2–6 Nov |
| A11 | Data provenance in the interface | Each tool shows plugin versions and the data release ID. | 3–6 Nov |
| A10 | Route audit export | A public table of every leg with NPC, cell and plugin. Automated checks flag one-way and orphan legs. Published early, so the owner's route walks can use it. | 2–8 Nov |
| A8 | Formula ledger | A generated page, one row per formula: tool, OpenMW 0.51.0 file and function, the Research page, GMSTs used, check status. Every lead-tool formula has a row. | 4–11 Nov |
| A13 | Report a wrong number | Each lead-tool result opens a pre-filled GitHub issue with the inputs and the data release ID. | 9–12 Nov |
| A9 | In-engine checks | The owner's recorded cases (due 12 Nov), plus those the pipeline's OpenMW Lua dumper can capture, are committed as small fixtures. CI checks the site's maths against them: 20 cases per calculator pass. CI never runs OpenMW or holds game files. | 6–14 Nov |
| — | Gate 2 release | Ledger rows for lead tools pass; full browser set passes. | 15 Nov |

### Phase 3, Mon 16 – Sat 21 Nov (Gate 3)

- [ ] **Quiet-round reports only:** fix correctness reports from the five testers; no
      features. Each fix is a public issue, a fix, a test and a ledger row where a number
      changed.

### Phase 4, Tue 24 Nov – Sun 13 Dec (Gates 4a–4c)

- [ ] **Venue reports:** fix the correctness reports from each venue before the next post.
      Weekly numbered release; credit reporters in the corrections log.

### Phase 5, from Mon 14 Dec

| # | Outcome | Done when |
| --- | --- | --- |
| A16 | Update runbooks | A tested procedure for a new Tamriel Rebuilt release, and one for OpenMW 0.52 including a formula diff against the 0.51.0 tag. |

---

## 3. Repositories: what they must look like, by when

`lowgraph/siltstrider.tools` (site) and `lowgraph/openmw-decompiler` (pipeline, to be renamed).
Agent attribution and history stay as they are in both.

### Gate 0 — Sat 17 Oct

- [ ] **Freeze line:** the README states the feature freeze and the weekly release (the
      owner's words).
- [ ] **This plan replaces the 6 October launch schedule:** LAUNCH_CHECKLIST.md's dates and
      LAUNCH_POSTS.md are marked superseded, and AGENTS.md points to this file in place of the
      launch checklist.
- [ ] **Agent rules:** AGENTS.md carries the six agent rules.

### Gate 1 — Sun 1 Nov

Site:
- [ ] **No premium code:** no `premium.mjs`, no premium entitlements, no Ko-fi webhook, no
      supporter tier in UI, Terms or Privacy. Supporter rows await their delete migration.
- [ ] **Assets:** no unaccounted image; the three PNG textures are gone or documented;
      `og-image.png` is regenerated.
- [ ] **New root files:** `ASSETS.md`, `CONTRIBUTING.md`, `SECURITY.md`, a notices file
      crediting OpenMW for the ported formulas, and `.github/ISSUE_TEMPLATE/` including
      "wrong number".
- [ ] **README order:** what it is, the live site, how it was built, how numbers are checked,
      how to report an error, how to run it, licence and credits. The case study and demo move
      lower or out; if it is a portfolio piece, it says so once. The Licence section keeps
      the text `test/license.test.js` checks.
- [ ] **Description and topics:** "Journey planner and calculators for Morrowind and Tamriel
      Rebuilt on OpenMW", topics `morrowind`, `openmw`, `tamriel-rebuilt`.
- [ ] **Agent files:** COORDINATION.md, UI_TRANSFORMATION.md and handoffs move to
      `docs/agents/` with a short note on what they are. Keep a short `AGENTS.md` at the root
      pointing there: Codex and Claude Code read it from the root.
- [ ] **Claims test:** extended (A7) and passing.

Pipeline:
- [ ] **Rename:** to a plain name such as `siltstrider-data` (the owner renames; GitHub
      redirects the old address).
- [ ] **Docs:** new description, topics and README; a notices file; agent files in
      `docs/agents/`.
- [ ] **Shared files:** COORDINATION.md and UI_TRANSFORMATION.md stay identical in both repos
      after the move.

### Gate 2 — Sun 15 Nov

- [ ] **CI:** `.github/workflows/` runs the tests on every push; a README badge shows the
      result, and the generated status table shows skipped tests as skipped.
- [ ] **Ledger:** the formula ledger is generated from the repo (A8).
- [ ] **Fixtures:** in-engine case fixtures are committed and checked (A9).
- [ ] **Route audit:** the export is committed or published (A10).
- [ ] **Share-link corpus:** committed and run in tests (A14).
- [ ] **Known issues:** `KNOWN_ISSUES.md` or a GitHub label, linked from About and every tool.
- [ ] **Changelogs:** split into interface and data. Releases are numbered and tagged weekly.

### Gate 3 — Sat 21 Nov

- [ ] **Open issues:** no open issue labelled as a correctness bug on a lead tool.
- [ ] **Tester findings:** each one is an issue, closed or explained.

### Gates 4a–4c — Sun 29 Nov, Sun 6 Dec, Sun 13 Dec

- [ ] **Venue reports:** every report from the venue is an issue, closed before the next post,
      with a test and the reporter credited in the corrections log.
- [ ] **Tags:** one tagged release per week.

### Phase 5 — from Mon 14 Dec

- [ ] **Runbooks:** `docs/runbooks/` holds the tested Tamriel Rebuilt and OpenMW 0.52 update
      procedures (A16).
- [ ] **Weekly cadence:** the release tags and the corrections log continue weekly.
