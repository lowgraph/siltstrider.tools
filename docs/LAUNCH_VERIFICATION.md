# Launch verification — assessment and handoff

Written 29 September 2026 by Claude (Data Agent) for the next agent. It assesses the
launch verification report produced by Antigravity (Gemini) on 29 September at
07:35 UTC, records what was checked independently, what was fixed, and what remains.
Nothing here contains user data: no account IDs, usernames, save names or payment
details. Use [LAUNCH_OPERATIONS.md](LAUNCH_OPERATIONS.md) for procedures and
[DEPLOYMENT.md](DEPLOYMENT.md) for releases.

## 1. Production state at hand-off

| Item | Value |
| --- | --- |
| Live commit | `672c0d3` (QA-31/32, QA-33–39, beginner clarity and contained follow-ups; release verification in §68) |
| Live Worker version | `56a07cb7-4daf-4e8c-8348-9da01b18cbdc`, tagged `672c0d3`; deployed at 100% on 2026-10-02 23:46:37 UTC (20:46:37 in São Paulo) |
| Security headers | `public/_headers` retained; nosniff, `X-Frame-Options: DENY`, `frame-ancestors 'none'` and HSTS verified live after this release; existing CSP, referrer policy and permissions policy unchanged |
| Licences | site `AGPL-3.0-or-later`, pipeline `GPL-3.0-or-later`; GitHub detects both |
| Worker routing | only `/api/*` runs the Worker; `www` pages redirect through the zone rule "www to root" |
| Game bundle | `a29adea046e6086c2c7ee654`, snapshot `1613a1123ed9…`; corrected IngredientSources, existing extraction snapshot |
| D1 database | binding `DB` / configured `siltstrider-db`, UUID `141a1409-3956-4267-a078-02483bbb2bf6` (dashboard name contains "dev"; it is production) |
| D1 migrations | 0001–0007 applied; none pending before the 23:46 release; no migration ran |
| D1 Time Travel bookmark | `00000074-00000000-000050f8-6b7a252ad77140777ca900210cc70b77`, captured 2026-10-02 23:42:41 UTC before this release; recovery record in §67, historical private migration backup and preservation checks in §15 |
| Code rollback for the next release | Owner-selected `73df6e58-912e-48db-9786-5866ce793efd` / `250b1b5` (§67); Worker version switch only, database writes and migrations retained |
| Pipeline repo | `master` / `origin/master` at `631aa2e`; correction `41da92c` included and shared release records synchronized |

Deployment history since the last tagged release before this batch:

| Worker version | Created (UTC) | Commit | Note |
| --- | --- | --- | --- |
| `329f6c2e-7ca2-4a0f-a3f5-b8ff7902a804` | 09-28 18:25 | `7e72528` | tagged; build-aware gear ranking; predates launch preparation and the Ko-fi fix |
| `972dee9c-60f5-4d72-8861-5d5b32ffe794` | 09-29 09:15 | unknown | **no tag or message**; do not use as a rollback target without identifying it |
| `eb9adb1c-55cc-44c5-9da8-485ed5220bb6` | 09-29 09:31 | `85801eb` (inferred) | no tag; the favicons from `ad1fc0b` were live under it, consistent with `85801eb` |
| `9efa1a55-b2d7-49da-8077-910c08840991` | 09-29 11:08 | `5bd4e04` | tagged; privacy text in structured data |
| `8c8fe551-ccb0-4888-91ad-f0ecf6943e71` | 09-29 12:04 | `74a9c9f` | tagged; API-only Worker, Clerk on demand, Privacy Policy cookies section |
| `64cf5d59-4efa-4406-8828-c844e55c13cd` | 09-29 12:45 | `6a744c0` | tagged; sign-in keeps the character, changelog, no "open-source" claim |
| `343fa189-95ee-47fc-9ea6-0128ea2cbc1d` | 09-29 13:01 | `6ada7bd` | tagged; AGPL-3.0 licence, About says open source again |
| `e0103bde-7264-4574-9a4c-2873a77b08bf` | 09-29 14:03 | `dc5b777` | tagged; bundle-derived social card, launch post checklist and subreddit rules |
| `af7c20e4-b16a-49e3-9d34-4c76b2b52631` | 09-29 15:31 | `bec9295` | tagged; accessibility fixes (landmarks, skip link, control labels, contrast), audit doc, confirmed #modding channel |
| `65f849c7-5889-47c0-92ad-0b6e1c2767f7` | 09-29 16:49 | `b5a0813` | tagged; second audit's fixes: crafted share links no longer crash the builder, visible focus in the modern theme and high contrast, modal dialogs, tool headings inside `<main>`, 404 page, security headers |
| `6be6a2d4-552d-4314-a071-3ba7c8b7204f` | 09-29 17:55 | `94c08da` | tagged; UX pass LVL-1 (fighters read as Warriors, with the reason shown) and TRV-1 (Guild Guides for members only, a note for non-member saves) |
| `8da9cada-fb37-4875-bbc1-ef36477fe9e1` | 09-29 18:13 | `4c5e143` | tagged; UX pass TRV-6 ("from your save" on options a save set, "a scroll, one use") and BLD-1 (Gear Advisor theft off by default) |
| `3daf4aa0-c962-4455-8f00-a69f6e1b6083` | 09-29 18:43 | `825510a` | tagged; UX pass TRV-3 (each town once in the place search), Claims (no "verified"/"exact"/"inter-faction standing"), HOME-2 (random premade start, hydration fixed) |
| `e5a3b044-b4fb-43e3-bea4-55678886edc9` | 09-29 19:13 | `d7a09fd` | tagged; HOME-2 follow-up: with TR + ARCE the random start draws ARCE builds too (it was drawn before the page read the visitor's world) |
| `719660ae-09bd-48c5-8ad5-b2326494337e` | 09-29 20:22 | `b1457cb` | tagged; SITE-1 (one name per tool on screen), LINK-1 (shared links keep their world), CALC-1 (no results before input; effect base costs as the game shows them), SITE-2 / VLT-1 ("How this is calculated" disclosures, Codex's work) |
| `1fa07549-0a45-45d0-8d2c-10bb4af88a71` | 09-29 20:42 | `997886b` | tagged; CHL-1 (one row of difficulty presets), FAC-1 (rank names, skill names and plain words in the Faction Journal) |
| `4951b9b5-3efc-4524-ad87-35d20c404de2` | 09-29 23:45 | `2e6d2be` | tagged; Gemini's contrast retune (with the Faction Journal follow-up), 24px Level Simulator buttons and heading levels; FAC-3 (faction quests by name), MOB-3 (no Ctrl K hint on touch), SITE-5 (TR + ARCE explained); deployed from the `mt-site-1` worktree on a clean `main` |
| `8f10cef2-f828-4ac4-b634-6664ddbf6604` | 09-30 00:31 | `8410c63` | tagged; Gemini's BLD-2 (Gear Advisor ranks by itself; catalogs load near the screen), CALC-2 (your own numbers in the calculators) and BLD-4 (save a character without an account), each with review fixes; deployed from the `mt-site-1` worktree on a clean `main` |
| `415d9c89-3242-4777-9f5f-d955d4e6b79c` | 09-30 00:47 | `cd01737` | tagged; typed calculator numbers stay across a world switch until Reset (owner, 30 September) |
| `4c464aa3-db84-44be-a1a7-d8572e75d27c` | 09-30 15:46 | `4d998be` | tagged; the acceptance re-run's fixes (`03c3361`: fg-14 for text on the equipment panels, no fading on faction ranks or Travel stop labels, Level Simulator preset descriptions, named objective checkboxes) and BLD-3 (premade builds first for newcomers); deployed from the `mt-site-1` worktree on a clean `main` |
| `24bd4ac1-e287-4c14-88d8-80bee20b42f9` | 09-30 16:04 | `1e84b1a` | tagged; no fading on a beast race's Boots slot (axe found it live on `4c464aa3` when the random start drew a Khajiit) or on a ticked Challenge objective; Travel rollback target |
| `3ef09493-cb5a-42e2-96fd-ca54c168d3e2` | 09-30 20:32 | `2c113b8` | tagged; standalone Travel release: TRV-2, TRV-4/5, TRV-6, TRV-7 and TRV-8; unchanged bundle and D1 schema; rolled back after repeated mobile acceptance failure |
| `24bd4ac1-e287-4c14-88d8-80bee20b42f9` (rollback) | 09-30 20:47 | `1e84b1a` | previous production version restored at 100%; superseded by the later releases below; no data or schema rollback |
| `3ef09493-cb5a-42e2-96fd-ca54c168d3e2` (restored) | 09-30 21:30 | `2c113b8` | owner-authorized return to the Travel release for live reproduction; active version captured before the next release |
| `d523b9ba-92b1-4fed-9056-89ee19916a49` | 10-01 00:11 | `216cd90` | tagged; current main, account settings and tool polish; 100% traffic; migration 0007 had already been applied separately |
| `3879ce7b-c397-4698-83c4-e9d185d9ed5c` | 10-01 05:22 | `ef67b3e` | tagged; CALC-4 finder and selected-ingredient sources, corrected bundle, Travel city transfers and swimming fallback, retaining main's Vault fixes; 100% traffic; no migration |
| `e29663d3-68eb-45ff-bbef-13447c3b0cbf` | 10-02 00:13 | `6fab4c5` | tagged; all implemented QA fixes and Morrowind game theme, 100% traffic; same bundle and database schema; recovery recorded before deployment (§48), live verification in §49 |
| `73df6e58-912e-48db-9786-5866ce793efd` | 10-02 04:47 | `250b1b5` | tagged; QA-26, twelve checklist polish fixes, QA-27 through QA-30 (Health display formatting, END 100 milestone target, phone premade category wrapping, Alchemy apparatus label width); 100% traffic; same bundle and D1 schema; live verification in §58 |
| `56a07cb7-4daf-4e8c-8348-9da01b18cbdc` | 10-02 23:46 | `672c0d3` | tagged; QA-31/32, QA-33–39, beginner clarity and contained follow-ups; §68 |

For the current release, §67 records code rollback target `73df6e58` /
`250b1b5`: switch the Worker version only. No database restore or migration is
part of this rollback.

For the earlier CALC-4 release, §26 records code rollback target `d523b9ba` / `216cd90`:
the account-settings/tool-polish release immediately before CALC-4 and the new
Travel behavior. Its assets restore the earlier bundle too. Rollback preserves
the additive migration 0007 and all database writes.

For the earlier account-settings release, §16 recorded target `3ef09493`: this is
the Travel version that failed the 375 px saved-Travel check (§9). Later reruns
passed (§10), but the cause of the original failure remains unconfirmed.
`24bd4ac1` (`1e84b1a`, before Travel) is the last version that passed full
acceptance. Both versions are compatible with migration 0007 because its table
is additive. Leave the rollback choice for the freeze; this handoff selects
neither version for a rollback.

Rollback from the Travel release `3ef09493` to `24bd4ac1` removes the Travel batch
and retains the earlier launch improvements. No schema or bundle change is involved.

Rollback from `24bd4ac1`: `4c464aa3` drops only the Boots-slot and ticked-objective contrast fixes. From `4c464aa3`: `415d9c89` drops only the acceptance re-run's fixes and BLD-3. From `415d9c89`: `8f10cef2` drops only the kept calculator numbers. From `8f10cef2`: `4951b9b5` drops only BLD-2, CALC-2 and BLD-4. From `4951b9b5`: `1fa07549` drops only the contrast, 24px buttons, heading levels, FAC-3, MOB-3 and SITE-5. From `1fa07549`: `719660ae` drops only CHL-1 and FAC-1. From `719660ae`: `e5a3b044` drops only SITE-1, LINK-1, CALC-1 and SITE-2 / VLT-1. From `e5a3b044`: `3daf4aa0` drops only the ARCE random-start fix. From `3daf4aa0`: `8da9cada` drops only TRV-3, Claims and HOME-2. From `8da9cada`: `6be6a2d4` drops only TRV-6 and BLD-1. From `6be6a2d4`: `65f849c7` drops only LVL-1 and TRV-1 (COORDINATION, "UX pass for launch"). From `65f849c7`: `af7c20e4` drops only its batch (see COORDINATION, "Accessibility and crash fixes from the second audit"). From `af7c20e4`: `e0103bde` retains the bundle-derived social card and valid schema. From `e0103bde`: `343fa189` differs only in the social card graphic and launch docs. From `343fa189`: `64cf5d59` differs only in the About wording (it drops the
"open-source" claim, which stays true either way). From `64cf5d59`: `8c8fe551` drops only the sign-in fix and wording; `9efa1a55`
also restores Worker-for-every-request routing and Clerk on every page (it still works,
since the redirect rule only duplicates the Worker's own `www` redirect). `eb9adb1c`
keeps the launch notice, error references and the Ko-fi fix but is untagged, so confirm
its commit first; `329f6c2e` is the last tagged version before this batch and drops all three. Both commits `7e72528` and `85801eb` come
after `c8f84e4` (`git merge-base --is-ancestor c8f84e4 7e72528` → yes), so they match the
current schema and codec. `972dee9c` is an unknown commit: do not roll back to it.

## 2. Test suites and how to run them

| Suite | Where | Command | Result at hand-off |
| --- | --- | --- | --- |
| Site | `A:\Claude\mt-travel-merge` (clean main worktree) | `$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'; npm test` | **787 pass, 0 fail, 0 todo, 0 skipped** at the `2c113b8` Travel release |
| Pipeline | `C:\Users\tiago\OneDrive\Documents\ChatGPT\OpenMW Decompiler` | `$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'; python -B -m unittest discover -s . -p "test_*.py"` | **670 pass** (pre-existing ResourceWarnings from unclosed sqlite in older tests) |
| Release build | site | `npm run build:cloudflare` | passes; 22 static routes |
| Worker dry run | site | `node node_modules/wrangler/bin/wrangler.js deploy --dry-run --keep-vars` | passes |

Tests that depend on local state:

- `test/gear-benchmark.test.js` reads the **staged bundle** in `public/game-data/`
  (not in Git). It is skipped when no bundle is staged, and TR is marked TODO only if
  the staged gear rows predate candidate shortlists. With bundle `3da03202` both
  vanilla and TR pass: every caster class (Mage, Sorcerer, Healer, Battlemage,
  Nightblade, Spellsword) and a custom caster favouring neither Intelligence nor
  Willpower are shown Mentor's Ring, with steal off and on; it also asserts the
  caster classes are exactly those six.
- `test/best-in-slot.test.js` also reads the staged bundle, with a synthetic fallback.
- Everything else uses synthetic fixtures.

## 3. Assessment of the Antigravity report

Its facts are mostly right; its conclusion ("READY FOR RELEASE") was overstated when
written, and it missed a privacy defect. Each claim was re-checked with read-only
commands; the commands are in section 6.

### Confirmed

- HEAD `85801eb`, clean and synced with `origin/main`; live bundle `3da03202`.
- `eb9adb1c` is the active version at the time and includes the latest commits
  (favicons from `ad1fc0b` were served).
- All routes 200; `www` → apex 301; `/api/saves`, `/api/saves/:id`, `/api/account`,
  `/api/entitlements` return 401 without a session.
- No unapplied migrations.
- Save quota: trigger `trg_limit_user_cloud_saves` (5 Free, 25 Supporter) exists in
  `cloudflare/migrations/0002_cloud_save_vault.sql` and `cloudflare/schema.sql`, and
  the API maps it to 409 `QUOTA_EXCEEDED` (`cloudflare/routes/saves.mjs`).
- `.ess` rejection message exists verbatim in `lib/omwsave-import.mjs:51`.
- Compatibility notice, Report a bug links and the corrected Cloud Vault wording are live.

### Overstated or unsupported

- **"Retrieved payload from Cloudflare API"** (cloud-save lifecycle) contradicts its own
  "0 production records created". Its log shows the lifecycle and two-account isolation
  checks ran in a local harness with in-memory databases. Only the unauthenticated
  401 checks touched production. The repo's own tests
  (`cloud-save-api`, `cloud-save-schema`, `cloud-save-zero-n`) cover isolation locally.
- **"Tool regression PASS, 191 tests across 22 suites"**: a subset. The full site suite
  is 562 tests in 84 files; it does pass.
- **Responsive layout and themes "verified"**: no browser or screenshot run appears in
  its log, only unit tests (`header-layout`, `theme`, `stylesheets`, …).
- **"Payment webhooks … passed verification"**: no Ko-fi webhook was exercised, and the
  Ko-fi fix in `85801eb` (Donation event type, case-insensitive codes) was not covered.
  The owner has since tested the Ko-fi path on production (section 5).
- **Rollback targets**: `329f6c2e` is compatible but predates the launch preparation and
  the Ko-fi fix; `972dee9c` is an untagged deploy of unknown commit.
- **It queried private production tables** (account profiles, all cloud saves, the
  payments table) with `wrangler d1 execute --remote`. Read-only, but not needed for
  verification. Don't repeat this; use counts or synthetic data.
- Ko-fi currency and Brazilian payment advice is opinion, not verification.

### Missed

- **Stale privacy promise in search results.** `ABOUT_FAQ_JSON_LD` in
  `lib/seo-breadcrumbs.mjs` (FAQ structured data on `/about`) still said save parsing
  was "zero-tracking" and that "no save data or personal information is ever
  transmitted to an external server"; the Vault page's structured data said "zero
  server transmission" and "Zero-tracking privacy". This contradicted the corrected
  About text: Cloud Vault stores parsed character data and sign-in goes through Clerk.
  **Fixed** in `5bd4e04` and deployed (section 4).
- **Discord sign-in** was not mentioned; it was an open launch item (owner has since
  set it up and tested it, section 5).
- **Three of four production cloud saves are unreadable by the live site** (section 5;
  the owner has decided to delete them).

## 4. Actions taken on 29 September

1. **Privacy text** (`5bd4e04`, live as `9efa1a55`). The About FAQ answer now says a save
   is parsed in the browser and not uploaded, and that saving to Cloud Vault is optional,
   needs an account, and sends the parsed character data to the service. The Vault
   page's description and feature list lost "zero server transmission" and
   "zero-tracking". New test in `test/seo-workstations-h1-metadata.test.js`
   ("structured data never promises that nothing leaves the browser") scans
   `ABOUT_FAQ_JSON_LD`, every `getToolJsonLd` and every `getToolFaqJsonLd` for such
   promises; it fails on the old text. Verified in the exported `about.html` and
   `vault.html` and on the live pages. Google may show the old text until it re-crawls.
2. **Full D1 backup**, with the owner's explicit approval, per LAUNCH_OPERATIONS.
   Export at 10:55 UTC, 37,297 bytes, SHA-256
   `5D269B79D7AE3A9C6766FF499E807203576A002037E49FE361BCC1CCF8CA4C1A`.
   Restore check in an isolated in-memory SQLite database: `PRAGMA integrity_check` ok;
   row counts equal production in all 8 tables (compared with a single `SELECT (SELECT
   count(*) …), …` query; D1 rejects long `UNION ALL` chains with "too many terms in
   compound SELECT"); every cloud save's `packed_payload` hashes to its stored
   `payload_hash`. A recovery record (commit, bundle, Worker version, D1 UUID,
   migrations, bookmark) was written beside it. The owner packed both into an
   AES-256 7z with encrypted headers, stored it in Google Drive with the password in
   a password manager, and the local copies were moved to the Recycle Bin.
   Wrangler's export prints a pre-signed download URL valid for one hour; treat it as
   secret and do not repeat it.
3. **No cookies unless you sign in** (`3fcd1f6`). Clerk used to load on every page and
   set `__client_uat` for every visitor. It now loads on page load only when
   `hasClerkSession()` finds Clerk's `__client_uat` above 0, otherwise from Sign in;
   `AccountProvider` and the Vault attach through `silt-auth-ready`. Verified on the
   live site: a fresh visit sets no cookies and never contacts Clerk. The Privacy Policy
   gained "Cookies, local files and browser storage" (Clerk's cookies only once you sign
   in, browser storage, Cloudflare Web Analytics without cookies or storage) and its own
   date. Earlier visitors keep Clerk's old `__client_uat=0` cookies until they expire.
4. **Only the API runs the Worker** (`74a9c9f`, live as `8c8fe551`). `run_worker_first`
   was `true`, so every request invoked the Worker (about 18 for a first visit to
   `/builder`), which could exhaust the Workers allowance on a busy launch day. It is
   now `["/api/*"]`. The owner created the zone Redirect Rule "www to root" (wildcard
   `https://www.siltstrider.tools/*` → `https://siltstrider.tools/${1}`, 301, query
   preserved) before the release; verified live for pages, queries and `/api/*`. The
   analytics beacon still loads. Error references now cover API failures only.
5. **Sign-in keeps the builder's character** (`4fc21f3`, `29cadd8`). The owner's 10:54
   cloud save (an ARCE Khajiit when saved) decoded as the builder's default Dark Elf:
   Google and Discord sign-in reloads the page, and an unsaved character reset while
   the world survived in the address. Reproduced on the live site. Sign-in buttons now
   dispatch `silt-before-sign-in`; `CharacterProvider` keeps the character in session
   storage and restores it once on a signed-in return within 15 minutes;
   `AccountProvider` drops it when an email sign-in completes on the page. Verified on
   the local server with a simulated signed-in return.
6. **Docs and wording** (`cc36f9d` and this commit). Public changelog for 28–29
   September; `COORDINATION.md` entry in both repositories; launch post copy with every
   claim checked in [LAUNCH_POSTS.md](LAUNCH_POSTS.md) (TR 26.08.23 is the "Poison
   Song" release, per the owner); About's search description and feature list no
   said "open-source" while neither repository had a licence; with the licences below
   they say so again, naming AGPL-3.0.

## 5. Open issues and risks

1. **Old-format cloud saves, to be deleted.** 3 of the 4 production cloud saves (OpenMW
   imports from 25–27 September) carry SLT1 envelope **version 1**;
   `lib/cloud-save-codec.mjs` now requires version 2 (`Unsupported SLT1 format version:
   1`), so the live site cannot open them. The owner decided on 29 September that they
   are to be deleted, and runs the delete (agents do not hard-delete stored data). The
   table's `format_version` column is the OpenMW save format (37 for these), **not** the
   envelope version; match the envelope byte instead:
   `DELETE FROM cloud_saves WHERE hex(substr(packed_payload, 5, 1)) = '01'` (3 rows at
   the time of writing; check first with the same `WHERE` in a `SELECT count(*)`).
   The 29 September backup and D1 Time Travel both hold them. The fourth save, a
   character build with envelope version 2, decodes and stays.
   **Done:** the owner ran the delete on 29 September; a count afterwards shows one
   cloud save left, the version 2 character build, and none with envelope version 1.
2. **Ko-fi**: owner reports the production path fully tested after `85801eb`
   (29 September). Not independently verified by an agent.
3. **Untagged deploys.** `972dee9c` (09:15 UTC) and `eb9adb1c` (09:31 UTC) on
   29 September were published without `--tag` and `--message`, so deployment history
   does not name their commits (most likely `ad1fc0b` and `85801eb`). They are not
   faults in the site, only gaps in the record; `9efa1a55` has since been deployed on
   top, tagged. Always use the DEPLOYMENT.md command so history names the commit.
4. **No browser-level regression run** by an agent across all tools, three profiles and
   both widths since the launch changes (LAUNCH_OPERATIONS "Final acceptance pass",
   step 2–3). Spot checks done: Gear Advisor (vanilla and TR Mage, Assassin), home,
   About and Vault notices, Report a bug links.
   **Done (30 September, agent, headless Chrome):**
   - Regression, step 2, on the dev build of `03c3361`: builder (races, sheet, premade
     catalog, loading a premade), equipment (slots and picker), Level Simulator,
     Challenge Runs (a roll and its seed), Alchemy, Enchanting and Spellmaking (a dash
     before input, a result after), Travel (a route) and the Faction Journal, each in
     Vanilla, TR and TR + ARCE at 1366 and 375 px: all passed, with the right world shown,
     no sideways scrolling, no console or hydration errors.
   - Regression, step 3: cross-tool navigation keeps the character; a world switch
     mid-tool (Alchemy 126 to 921 ingredients, Travel 22 to 91 stops; TR + ARCE brings the
     ARCE races); build and challenge share links open the same character and run in a
     fresh browser; a seed repeats its run; the challenge summary and the Level Simulator
     JSON export; the challenge run, a saved character and the world survive a reload; one
     real .omwsave imports and is restored after a reload (nothing from it recorded).
   - Audit re-run (acceptance for contrast, 24 px targets, heading levels): axe WCAG 2.2
     AA + best practice on 19 pages and states, both themes, 1366 and 375 px, against
     production `415d9c89`, found 5 issues, fixed in `03c3361` (fg-16/17 text now fg-14;
     no fading on unmet faction ranks or Travel stop labels; fg-9 for Level Simulator preset
     descriptions; objective checkboxes named); 0 violations on re-run (76 runs). Keyboard:
     15 pages in both themes (skip link first, visible focus, no trap), the search palette,
     Cloud Vault, challenge pool and equipment picker dialogs (focus inside, Tab wraps,
     Escape closes, focus returns), and forced colors: passed before the fixes.
   - On production after the fixes went live (`4c464aa3`, 15:46 UTC): axe on the same 19
     pages and states found one more, on Equipped Loadouts, only because this time the
     random start drew a beast race: the Boots slot was faded to half (2.2:1) and its
     reason in danger-8 (1.9:1). A ticked Challenge objective, a state the audit never
     reached, was faded too (4.05 to 4.37:1). Both fixed in `1e84b1a`, live as `24bd4ac1`
     (16:04 UTC): 0 violations in 76 runs, and 0 on a Khajiit's Equipped Loadouts and a
     ticked objective in both themes. Keyboard: 15 pages in both themes, the four dialogs
     and forced colors pass (the audit's Enter key now carries its text; without it the
     Cloud Vault and challenge pool dialogs only looked broken). BLD-3 live: a fresh
     browser's first Builder opens on the catalog with its welcome, the next on the
     Custom Class Builder; no console errors on Home, the Builder, Changelog or Challenge
     Runs; `www` answers 301 and `/api/account` 401.
   Not covered here: step 4 (real accounts) is the owner's, and step 5 is for the freeze.
5. **Owner-reported, not agent-verified:** Discord in Clerk is set up and tested;
   production sign-in, a cloud-save round trip and Ko-fi were tested (owner,
   29 September).
6. **Real sign-in test, owner.** Build a character, click Sign in in the Vault, sign in
   with Google or Discord, save, reload. It proves two things only a real account can:
   that Clerk's return sets `__client_uat` above 0 before the page loads (on-demand
   loading relies on it to show a signed-in visitor as signed in without clicking Sign
   in again), and that the character comes back. Then delete the 10:54 save, which
   holds the default Dark Elf, and save the Khajiit again.
   **Done (owner, 29 September):** the owner deleted the old save, saved the character
   again, and reports it works across browsers. Owner-reported, not agent-verified.
7. **Licence: done.** The site is `AGPL-3.0-or-later` and the pipeline
   `GPL-3.0-or-later` (29 September): `LICENSE` in each repository, a Licence section in
   each README excluding the Pelagiad font (SIL OFL 1.1), game and mod data (including
   the pipeline's `items/examples/` excerpts) and the name and logo, and
   `"license"` in the site's `package.json`. Runtime dependencies are MIT (site: Next.js,
   React, Clerk; pipeline: jsonschema), all compatible.
   ([LAUNCH_POSTS.md](LAUNCH_POSTS.md) lists the other claims not to make.)

## 6. Read-only verification commands

Run from `A:\Claude\morrowind-tools` in PowerShell.

```powershell
git fetch origin; git status -sb; git log --oneline -5
Get-Content public/game-data/current.json
Invoke-RestMethod https://siltstrider.tools/game-data/current.json
node node_modules/wrangler/bin/wrangler.js deployments list
node node_modules/wrangler/bin/wrangler.js d1 migrations list siltstrider-db --remote
node node_modules/wrangler/bin/wrangler.js d1 time-travel info siltstrider-db --json
```

```bash
# Routes, redirect, auth (Git Bash)
for u in / /builder /about /vault /account; do curl -s -o /dev/null -w "%{http_code} $u\n" https://siltstrider.tools$u; done
curl -s -o /dev/null -D - https://www.siltstrider.tools/builder | grep -iE "^HTTP|^location"
for u in /api/saves /api/account /api/entitlements; do curl -s -o /dev/null -w "%{http_code} $u\n" https://siltstrider.tools$u; done
# Privacy promises must be absent from the live pages
for u in /about /vault; do curl -s https://siltstrider.tools$u | grep -cE "zero-tracking|ever transmitted|zero server transmission"; done
```

Row counts without reading rows:

```powershell
$t = 'account_profiles','cloud_saves','d1_migrations','premium_payments','premium_support_codes','saved_challenges','saved_loadouts','user_tiers'
$q = 'SELECT ' + (($t | ForEach-Object { "(SELECT count(*) FROM $_) AS $_" }) -join ', ')
node node_modules/wrangler/bin/wrangler.js d1 execute siltstrider-db --remote --json --command $q
```

## 7. Rules for the next agent

- Do not read private production rows (profiles, saves, payments, codes). Counts and
  schema are enough; use synthetic data for behaviour.
- A full D1 export copies private data; run it only with the owner's explicit approval.
  Never paste the pre-signed export URL anywhere.
- Deploy only from a clean `main` synchronised with `origin/main`. Other agents leave
  uncommitted work in the site checkout; if the tree is dirty, build and deploy from a
  clean `git worktree` of `main` (copy `.env.production.local` and `.env.local`, link
  `public/game-data`, run `npm ci`), and unlink the game-data junction with
  `cmd /c rmdir` **before** removing the worktree so the real data is not deleted.
- Always deploy with `--tag <short sha> --message "main <sha>: …"`.
- The user runs multi-minute jobs (gear rows, rebuilds) themselves; hand them the
  command.
- Keep `COORDINATION.md` identical in both repositories.

## 8. Travel integration verification — 30 September 2026

Merge commit: `e3ab542ceba3a1e573dd98ef25df8c34cb225690`.
Merge inputs: main `0bc1a7f`, Travel `5170293`. Verified in the actual main
worktree `A:/Claude/mt-travel-merge`, with repository build config unchanged.
No extraction, schema change, deployment or production write.

- `npm test`: **787 passed, 0 failures** on the actual merged checkout.
- `npm run build:cloudflare`: **passed**, with the repository's
  `next.config.mjs` unchanged and physical local dependencies. No preview root
  adjustment or alternate compiler.
- Full local Chrome/CDP suite: **125 cases passed, 0 failures**. Sixteen pages/tool
  views × Vanilla, TR and TR + ARCE × 1366/375 px × Modern/Morrowind UI, plus
  interaction cases: **216 WCAG 2/2.1 AA theme audits, 0 reported violations**,
  no horizontal overflow, uncaught exceptions or unexpected server errors.
- Flows: Travel keyboard search, cancellation, swaps, objectives, sharing,
  real-time comparison, forced colors and network failure/retry; imported
  synthetic saves, local choices, profile isolation and reset; all calculators'
  custom/empty states and inputs; challenge seeds/exports/sharing; Builder
  sharing and equipment dialog focus/Escape; Faction Journal search/rank/empty
  states; Level Simulator modes, target level and priority ordering. Builder,
  calculators, Faction Journal and Level Simulator interactions ran in both
  themes, at both widths, in all three profiles.
- Browser-runner investigation: changing the departing document's theme just
  before navigation left Pelagiad loading. Interaction cases now store the theme
  for the arriving document's existing initialization. Navigation waits for that
  document's load event; bounded font-state checks retain font-error/loading
  failures and identify unfinished faces. All **411 font checks** completed,
  including loaded Pelagiad. Failure stacks, pending requests and optional
  lifecycle traces are retained. This changes local test setup only.
- Main's unfaded restriction/rank cards, danger-7/fg-14 equipment text and fg-9
  Level Simulator descriptions are retained, including the automatically merged
  contrast-sensitive files. Both sets of 30 September player changelogs share
  one day's list. The checklist retains the owner's section 4 and priorities.
- Evidence: `A:/Cache/trv-final-npm-test.log`, `A:/Cache/trv-final-build.log`,
  `A:/Cache/trv-merged-final-browser/report.json`; screenshots, axe JSON and
  request trace beside the browser report. Earlier failed runs remain in the
  cache for diagnosis. Reproduce with [BROWSER_TESTS.md](BROWSER_TESTS.md).

These are local signed-out checks. Production sign-in, Cloud Vault, payments,
real-save corpus, other browser engines and manual screen-reader review were
not repeated during integration. Deployment was a separate owner ask: ship Travel as its own
release, retaining the previous production version so rollback removes Travel
without rolling back the earlier launch improvements. The authorized release is
recorded below.

## 9. Travel production release and rollback — 30 September 2026

Owner request: "Deploy main". Released from the clean, synchronized main worktree
`A:/Claude/mt-travel-merge`, commit `2c113b85ea98c42db66e3e667abe2440bd67237e`.
The later account-settings merge contains documentation only; no settings API or
migration is in this release.

- Deployed at **20:32 UTC**, tagged `2c113b8`, Worker version
  **`3ef09493-cb5a-42e2-96fd-ca54c168d3e2`**, initially 100% of traffic. The message identifies
  TRV-2, TRV-4/5, TRV-6, TRV-7 and TRV-8 as their own Travel release.
- **Rollback target:** `24bd4ac1-e287-4c14-88d8-80bee20b42f9` (live commit
  `1e84b1a` before this release). It retains the previous launch fixes. The bundle
  stays `3da0320236da77ec085d105d`; no schema, binding, configuration or data change
  was made. `--keep-vars` retained dashboard variables.
- Pre-release `npm test`: **787 passed, zero failures/skips/todos**;
  `npm run build:cloudflare` and `wrangler deploy --dry-run --keep-vars`: **passed**.
  Main and production were rechecked immediately before deploying.
- Recovery: D1 UUID confirmed; no pending migrations; fresh Time Travel bookmark
  recorded in section 1. No migration, private-row read or full data export ran.
  Bundle pointer, manifest and before/after deployment history are saved in
  `A:/Cache/trv-release-20260930`.
- Live HTTP checks: homepage **200**; homepage and a static JavaScript asset match
  the release output by SHA-256; `www` Builder **301** to the apex with its query
  preserved; signed-out `/api/account`, `/api/saves` and `/api/entitlements` **401**.
  Security headers and live bundle/snapshot match the verified build.
- Production Chrome sweep: **124 of 125 passed**; **216 WCAG 2/2.1 AA audits,
  zero violations**, no horizontal overflow, runtime exceptions or server errors.
  Sixteen views in all three profiles, both themes and 1366/375 px; Travel
  keyboard/search/swap/sharing, real-time comparison and loading/failure/retry;
  Builder, calculator, challenge, Faction Journal and Level Simulator interactions.
  A temporary copy of the local runner allowed only the production origin and used
  the same checked-in assertions in a disposable signed-out browser.
- The last mobile synthetic-save persistence case initially reported
  `Save/profile override isolation: true !== false` for the guild choice after
  navigation. Desktop passed. A focused repeat of both widths with click/storage
  diagnostics passed **2/2**: clicks hit the inputs, edited values were stored,
  and save/profile isolation and reset worked. Repeating the original test logic
  without added diagnostics then failed again at **375 px**, while desktop passed.
  Both failures are `AssertionError [ERR_ASSERTION]` at the guild assertion in
  `scripts/test-browser.cjs:310`: the vanilla save's unchecked guild edit should
  survive navigation, but the control was checked. The cause remains unconfirmed;
  diagnostic timing may change the outcome. No application fix was attempted.
- **Rolled back at 20:47 UTC** to `24bd4ac1-e287-4c14-88d8-80bee20b42f9`,
  confirmed active at 100%. Home, Travel, Builder and the bundle pointer return
  **200**, signed-out account **401**, and the bundle is unchanged. Travel remains
  on main for investigation; further fixes stopped under the two-failure rule.
  Do not re-release this batch until the original mobile check passes reliably.
- Pipeline coordination verification: **670 tests passed**; the identical release
  initial handoff was pushed as `a7b71fe`, then corrected to record the rollback.

Evidence: `A:/Cache/trv-release-tests.log`, `trv-release-build.log`,
`trv-release-dry-run.log`, `trv-release-deploy.log`; browser reports under
`A:/Cache/trv-release-20260930/production-browser` and
`production-save-diagnostic` and `production-save-repeat`, including screenshots, axe results, font states,
request traces and failure HTML. These production checks stayed signed out and
used synthetic saves locally; real sign-in, Cloud Vault ownership/writes, payments,
other browser engines and manual screen-reader acceptance were not repeated.

## 10. Travel mobile failure investigation — 30 September 2026

The owner authorized investigation, then explicitly authorized putting the same
Travel version back on live because the site has no users yet. At **21:30 UTC**,
`3ef09493-cb5a-42e2-96fd-ca54c168d3e2` (`2c113b8`) returned to 100% of traffic.
Rollback version `24bd4ac1-e287-4c14-88d8-80bee20b42f9` remains available.
No new application code, bundle, migration, binding or configuration was deployed.
Before that, explicit diagnostic version overrides selected Travel at 0% while
ordinary traffic remained on the restored release; that split is now removed.

- The original failing assertion checks restoration after navigation, without
  first verifying that the checkbox edits took effect. Failure HTML shows save
  defaults; the failed disposable browser's stored options contain no overrides.
  This does not establish whether clicks missed, edits were cleared, or an
  application race occurred. The root cause remains **unconfirmed**.
- Focused 1366/375 px reproductions passed **2/2 each** on the local static export,
  local Worker and a local mirror of the HTTPS origin. Passive input tracing on
  the export, a throttled export and the remote diagnostic version also passed
  **2/2 each**. The original uninstrumented remote diagnostic flow passed **2/2**.
  Three further original-timing mobile repetitions on live passed **3/3**.
- The full original browser suite on live passed **125/125**, including the final
  mobile save case: **216 accessibility audits with zero violations**, no runtime
  exceptions or unexpected server errors, and **411 settled font checks**. It
  covered both themes, 1366/375 px and all three profiles, including Builder,
  calculator, Faction Journal, Level Simulator and Travel interactions. Only
  failure-state capture was added, after a failed assertion; click timing and
  the assertions in this run were the original ones.
- Traced successful runs hit the intended controls and write the expected
  `false/true/false/12.5` choices under the vanilla save key. Adding diagnostics
  can change timing; successful traces do not explain the earlier failures.
- The checked-in browser test now verifies every edited control and the stored
  choices **before** navigation, so a future failure identifies whether editing,
  storage or restoration failed. The added checks passed **2/2 locally** and
  **2/2 on live**. Click behavior and application persistence code are unchanged.
- `npm test`: **787 passed**, zero failures/skips/todos. Pipeline handoff
  verification: **670 passed**. The existing production build is reused; no
  rebuild was necessary for test-runner and documentation changes.

Evidence: `A:/Cache/trv-mobile-investigation`, including `original-live-full`, `original-live-repeat`,
`verified-edits-local`, `verified-edits-live`, the earlier focused reports and
the routing records. These checks stayed signed out and used synthetic saves.

## 11. Launch package integration verification — 30 September 2026

Merge commit: `d4e96bdaec9112fe9739da76452a0565b3440bb6`.
Merge inputs: main `054fef5`, `launch/home-1-mob-2-first-steps` `6d6c2e6`
(HOME-1/MOB-2, SITE-4, SITE-3, MOB-1/MOB-4, HOME-3, ENC-1, CALC-3, CHL-2,
LVL-2/LVL-3, header menus, Cloud Vault hash check, the phone tab bar's Travel tab, the Vault header's account line). Prepared and verified in
`A:/Claude/mt-site-1` with physical dependencies and repository build config
unchanged. No extraction, schema change, migration, deployment or production write.

- Conflicts: `travel-workstation.jsx` (main's TRV-8 layout kept whole; SITE-4's
  character link moves to the Travel header as "Planning for <name> · change",
  outside the live network status and the folded options' `<summary>`) and this
  checklist (both sides' records kept).
- Main's `test/travel-task-layout.test.js` registers the character-link helper
  (16 of its tests failed without it) and gains a SITE-4 Travel test. Main's
  browser runner chooses Alchemy ingredients through CALC-3's combobox (`choose`)
  and uses MOB-4's section buttons below 1024 px (`builderTab`).
- `npm test`: **827 passed, 0 failures**. `npm run build` and
  `npm run build:cloudflare`: **passed**.
- Local Chrome/CDP runner (`scripts/test-browser.cjs`) on the dev server:
  **125 cases passed, 0 failures**: sixteen views × three profiles × 1366/375 px ×
  both themes with axe (WCAG 2/2.1 AA, 0 critical/serious), no overflow, runtime
  exceptions or server errors; tool, challenge, Builder, Faction/Level and Travel
  interactions. The 375 px saved-Travel case (section 9) passed **7 of 7** runs
  locally; the cause of its production failure is still unconfirmed (section 10).
- Axe with best-practice rules on every page, both themes, desktop and phone:
  **0 violations in 76 runs** on the first trial merge, and 0 in the 38 phone runs again after the phone tab bar change. Keyboard audit (first trial): 40 page checks pass (30 keyboard, 10 forced colours) and 4 dialogs (focus inside, trapped, Escape closes, focus returns).
- Evidence: `A:/Cache/launch-package-browser/` (reports, screenshots, axe JSON).

Local signed-out checks only. The Cloud Vault hash check is covered by
`test/cloud-save-api.test.js` against the Worker route with a simulated D1; a
signed-in production load was not run.

Main was fast-forwarded to this merge on the owner's word ("merge to main, but don't
deploy"); it is not deployed. Production runs the Travel release (main `2c113b8`,
Worker `3ef09493`), restored at 21:30 UTC with the owner's authorization; Codex's
section 10 on `launch/trv-mobile-verification` records it. This section is numbered 11
so that section keeps its number when that branch merges.

## 12. Account settings verification — 30 September 2026

ACC-1 and ACC-2 are prepared on `feature/account-settings-preparation`. The
initial implementation `d4de9e7` incorporated origin/main `2c113b8` at `7a9f0bd`;
its verification is recorded below. Integration with the newer main `11c1c96`
is recorded after it. The owner has not approved merging the settings branch
into main or deploying it.

- `npm test`: **836 passed, 0 failures, 0 skips**. Cases cover the schema, owner
  isolation, UTF-8 limits, bad JSON/versions/revisions, concurrent creation,
  stale writes, unknown/future data selections, network retry, delayed loads,
  edits during writes, sign-out/account switches, guest adoption, coherent
  world-specific presets, shared-route/seed precedence and resets.
- The actual Worker verifies locally generated RSA session tokens through
  Clerk's offline verifier against the in-memory migrated SQLite database.
  Accounts with no username can persist preferences; another owner cannot read
  them. Cross-origin writes are refused, and server failures retain reference
  IDs without exposing SQL, settings or tokens. No real credentials are used.
- Node 22.11.0 uses `--experimental-sqlite` and prints its **ExperimentalWarning**
  in both SQLite test files. It is not suppressed. Existing Clerk development
  telemetry notices in older test files remain; the new auth fixture adds none.
- `npm run build:cloudflare`: **passed**, **24 static pages**. Wrangler Worker
  compilation with `deploy --dry-run` also passed (no upload/deployment).
- A fresh isolated local D1 directory received migrations **0001–0007**.
  `migrations list --local` reported **No migrations to apply!**. The new table
  exists, all **28 historical schema objects** match the 0001–0006 baseline,
  and all seven existing application tables remain empty/unchanged. Seeded
  schema tests separately verify that old save/profile/entitlement records survive.
- Local Chrome/CDP: **33 cases passed, 0 failures**: four settings cases,
  26 tool interactions and three Travel cases. Settings use synthetic identities
  and local API fixtures; remaining cases are signed out. Both themes and
  desktop/mobile widths are covered; tool inputs/sharing and saved Travel checks
  also cover Vanilla, TR and TR + ARCE. **28 axe reports** had no critical/serious
  WCAG 2/2.1 AA findings. No reported overflow, uncaught exceptions or unexpected
  server errors. Settings screenshots were inspected in both themes and widths.
- Evidence under `A:/Cache`: `acc2-final-test.log`, `acc2-final-build.log`,
  `acc2-worker-dry-run.log`, `acc2-local-apply.log`; browser `report.json`, axe JSON
  and screenshots in `acc2-settings-final-browser`, `acc2-tools-browser` and
  `acc2-travel-browser`. Fresh D1 persistence: `acc2-final-local-20260930`.
  Reproduce browser checks with [BROWSER_TESTS.md](BROWSER_TESTS.md), using the
  dedicated local server at port 8790; occupied 8765/8766 servers were untouched.

Real production sign-in, cross-device accounts and owner acceptance are still
deployment checks. Modpack/version/update-notice controls stay unavailable
until published release support exists; the two future gear filters stay hidden.
Migration 0007 is unchanged from its reviewed ACC-1 shape. No extraction, remote
database apply, main change or deployment occurred. The owner applies production
0007 separately before deploying the settings API.

### Integration with new main `11c1c96`

The owner requested preparation against the new main. A normal merge combines
the settings implementation `d4de9e7` with origin/main `11c1c960de344c8d550433ffb10776636bd479f8`;
no rebase or main update. The two conflicts were confined to this verification
record and the launch checklist. Main's launch completions and production history
are preserved; the settings record is section 12, leaving section 10 reserved
for the Travel acceptance branch. The original settings changelog entry is now
under its correct 30 September heading in both changelogs.

- `npm test`: **876 passed, 0 failures, 0 skips**. The SQLite experimental
  warnings remain visible. `npm run build:cloudflare`: **24 static pages**;
  Wrangler `deploy --dry-run` passed without uploading or deploying.
- Fresh local D1: migrations **0001–0007 applied**, **none pending**;
  `account_settings` exists. All **28 historical schema objects** match the
  0001–0006 baseline and all seven historical application tables are unchanged.
  Origin/main still ends at migration 0006; 0007 keeps its reviewed shape.
- Local Chrome/CDP: **33 cases passed** (four settings, 26 tools, three Travel),
  **28 axe reports**, no critical/serious findings, runtime errors or unexpected
  server errors. Settings screenshots were inspected at desktop/mobile widths
  in both themes. These retain the synthetic-account and local-only limits above.
- The diff against this main contains exactly the original **38 settings paths**.
  Main's first steps, phone navigation, tool controls, keyboard menus and Vault
  hash checks are retained. GitHub main was checked again before committing.

Evidence under `A:/Cache`: `acc-main-11c1c96-test.log`,
`acc-main-11c1c96-build.log`, `acc-main-11c1c96-worker-dry-run.log`,
`acc-main-11c1c96-local.log`; fresh D1 persistence `acc-main-11c1c96-local`;
browser reports, axe JSON and screenshots in `acc-main-11c1c96-settings-browser`,
`acc-main-11c1c96-tools-browser` and `acc-main-11c1c96-travel-browser`.
Only the feature branch is prepared for owner review; no feature merge into main,
remote D1 apply or deployment is authorized by this preparation.

## 13. Small tool polish — 30 September 2026

Owner request: branch from `mt-account-settings` and polish Travel, Alchemy,
Enchanting and calculator navigation. Branch `launch/small-polish` starts at
`db9def9` (`feature/account-settings-preparation`), retaining account settings,
save choices and shared-link precedence.

- Unsaved unlinked Travel starts Seyda Neen → Balmora. Least real time (`real`)
  minimizes estimated outdoor movement, then transport/spell transitions, with
  existing scroll/Magicka budgets. Unknown movement is not treated as zero.
  Menus, loading screens and indoor movement remain uncounted. The objective
  round-trips through links and account defaults. Pending routes show Loading;
  real network errors keep Retry.
- Alchemy's site adapter hides Secretmaster tools and sorts obtainable apparatus
  by quality descending, with stable name/ID ties. Published catalog records are
  unchanged; the Journeyman mortar and optional None defaults are retained.
- Enchanting accepts typed soul sizes, including 300. Empty/negative values are
  nonnegative, fractions become integer sizes, and Constant Effect remains gated
  at 400; lowering the soul switches an active Constant choice to When Used.
- Navigation exposes all three calculators directly at 1440/1920 px. At
  375/900/1024/1366 px, all three live in Calculators. Both themes keep the wide
  links and world switch on the same row, with no horizontal overflow. Rules use
  `.topbar`; the old `#react-header-slot` wrapper is absent from this layout.
- `npm test`: **887 passed**, zero failures/skips/todos. Added tests cover unknown
  and invalid movement, equal-time ties, scroll exhaustion, apparatus identity
  and quality ties, custom soul sizes and the 399/400 Constant boundary.
- Full local Chrome suite: **153/153 passed**, **232 accessibility audits with
  zero violations**, no runtime exceptions or unexpected server errors, and
  **439 settled font checks**. Includes all profiles, both themes, 1366/375 px,
  Builder/calculator/Faction Journal/Level Simulator/Travel interactions, saved
  Travel options, synthetic account settings and the 24 new polish cases.
  Final navigation alignment was also checked at all six widths in both themes.
- `npm run build:cloudflare`: **passed**, 24 static pages with repository config
  unchanged. This checkout has no production Clerk key; the build establishes
  compilation/export, not real production sign-in or release packaging.
- Pipeline synthetic suite: **670 passed**. Shared COORDINATION and roadmap files
  match byte for byte; synchronization preserves every existing pipeline note.
- Both player changelogs and the shared coordination/roadmap record are updated.
  No exported bundle, data extraction or D1 operation is part of this polish.

The first mobile navigation attempt failed twice because its selectors targeted
the removed header wrapper. Only that attempt was reverted, and work stopped;
the owner explicitly authorized continuing with the current model. The final
selectors and responsive behavior passed. Old tests expecting a two-item
calculator menu were updated for the requested three-item menu.

Evidence under `A:/Cache`: `small-polish-tests-verified.log`,
`small-polish-build-final.log`, `small-polish-full-browser` and
`small-polish-nav-aligned`, with reports, screenshots, axe results and network
traces. Tests remain local, signed out and synthetic; real account sign-in,
Cloud Vault writes, payments and other browser engines are outside this pass.

Parent integration — 30 September: the owner authorized merging `launch/small-polish`
into `feature/account-settings-preparation` and pushing the parent. The clean parent
and its remote both started at `db9def9`; the polish tip was `1ac7788`. The merge had
no conflicts, and its application tree matches the polish branch. Re-ran `npm test`
on the merged checkout: **887 passed**, zero failures/skips/todos. The unchanged
Cloudflare build passed with 24 static pages. The decompiler synthetic suite passed
**670 tests** again; shared coordination and roadmap contents are identical.
Full merged-checkout Chrome suite: **153/153 passed**, **232 accessibility audits
with zero violations**, no runtime/server errors and **439 settled font checks**.
Merged-checkout evidence: `A:/Cache/small-polish-parent-unit.log`,
`small-polish-parent-build.log`, `small-polish-parent-pipeline.log` and
`small-polish-parent-browser`. The browser run uses this parent checkout's server at
`http://127.0.0.1:8791`, separate from the original polish server.

## 14. Account settings and tool polish merged to main — 30 September 2026

The owner authorized the merge of PR #1. `origin/main` `11c1c96` and feature tip
`6dc207e` still matched the preparation. In a new clean main worktree,
`A:/Claude/mt-account-main-merge`, the no-fast-forward merge had no conflicts.
Its tree `145767c07a98ea8d6f4e9c94c9539d7a6477cae7` matched the prepared feature
tree exactly. Merge commit: `b45f686` (ACC-1, ACC-2 and the tool polish).

- Actual merged checkout: **887 unit tests passed**, no failures/skips/todos.
- Cloudflare build: **passed, 24 static pages**, repository config unchanged.
  Worker `deploy --dry-run` passed without uploading or deploying.
- Full local Chrome suite at port 8792: **153/153 passed**, across Vanilla, TR,
  TR + ARCE, both themes and desktop/phone widths. Includes all tools, saved
  Travel choices, synthetic settings identity/conflict cases and the 24 polish
  cases. **232 axe audits, zero violations**; no runtime/server errors and
  **439 settled font checks**. Phone Travel screenshots were inspected.
- The preparation's fresh isolated local D1 check applied **0001–0007**, none
  pending, with the historical application tables empty and the settings table
  present. The reviewed migration, prior migrations and configuration remain
  unchanged. Unit schema tests separately verify existing seeded records survive.
- Final documentation handoff: **887 unit tests** and **670 pipeline tests**
  passed before their commits. Shared COORDINATION and roadmap files are identical;
  all earlier pipeline notes are preserved.
- ACC-1 and ACC-2 are marked complete with their implementation and merge commits.
  The production ACC-1 checkbox remains open. Existing production state and
  release history are unchanged; this is a code merge, with no remote D1 apply,
  deployment, extraction or published bundle change.

Evidence under `A:/Cache`: `acc-main-merge-unit.log`, `acc-main-merge-build.log`,
`acc-main-merge-worker.log`, `acc-main-handoff-unit.log`, `acc-main-handoff-pipeline.log`,
and `acc-main-merge-browser` (report, screenshots,
audit JSON and network traces). Local database preparation:
`acc-polish-merge-local.log`, persistence `acc-polish-merge-local-6dc207e`.
Browser report HEAD is the pre-commit main `11c1c96`; it tested the merged tree
before committing. A following documentation commit records this result; it
changes no application code. Real sign-in and cross-device account acceptance
remain release checks. Capture a fresh D1 recovery bookmark and apply migration
0007 separately before deploying the settings API.

## 15. Production account settings migration — 30 September 2026

The owner explicitly authorized production migration 0007. From clean main
`254c76f` in `A:/Claude/mt-account-main-merge`, the configured account and returned
D1 UUID matched `141a1409-3956-4267-a078-02483bbb2bf6` (dashboard name
`siltstrider-characters-dev`; configured name `siltstrider-db`). Only
`0007_account_settings.sql` was pending, with 0001–0006 already recorded.
Application started **2026-09-30 23:56:48 UTC**; Wrangler 4.134.0 applied 0007
successfully, and the post-check reported **No migrations to apply!**.

- Immediate pre-apply Time Travel bookmark:
  `00000058-00000000-000050f6-bb9b1481c9d6b08340cdb425cedbc8c1`.
- Full pre-migration backup SHA-256:
  `01b9a10b10e404567c641eda62648db8a1e252af7e43c1b5d3694f65ebf30110`.
  The 40,424-byte export is private, outside Git/public assets, in a folder with
  access restricted to the current Windows user, SYSTEM and administrators.
- Restored the backup into an isolated local SQLite file. Integrity passed;
  counts matched the remote preflight. Rehearsed 0007 on the restored data:
  every historical record remained unchanged.
- Production verification: `account_settings` exists with **zero rows**; all
  **20 historical schema objects** (excluding SQLite/Cloudflare internals) are
  identical and all **seven application table counts** match the preflight.
- Exported a private post-migration snapshot, restored it locally, and compared
  every historical application row: **all records exactly preserved**. The
  original six migration records are unchanged; 0007 is the only added record.
  Post-snapshot integrity passed. No original data was lost or modified.
- Worker deployment history before/after is identical. No site deployment,
  Worker upload, database restore, extraction or bundle change occurred.
  The current Worker ignores the new table; the settings API awaits deployment.
- Documentation verification before committing: **887 site tests** and
  **670 pipeline tests** passed. Shared coordination/roadmap files are identical.
- ACC-1 production is complete. Code rollback does not remove this additive
  table; existing Workers remain compatible. Deployment remains a separate ask.

Private recovery/evidence directory:
`A:/Cache/account-settings-production-20260930` (exports, restored local checks,
bookmark/action metadata, schema/count snapshots, pending/apply logs, verification
JSON and before/after Worker deployment metadata). Never commit those private
exports or restored files. The first read-only UNION count query exceeded D1's
compound SELECT limit; separate SELECT statements succeeded before applying.

## 16. Account settings and tool polish production release — 30 September locally

The owner authorized deployment of clean main `216cd909dbf3768de4b4d6c1e4566d81f209c177`.
Worker `d523b9ba-92b1-4fed-9056-89ee19916a49`, tagged `216cd90`, was created
**2026-10-01 00:11:19 UTC**, and deployed at **00:11:21 UTC**, with **100% traffic**.
This is 30 September in the owner's timezone. It releases the complete current
main, including account settings and the Travel/Alchemy/Enchanting/navigation
polish; it is not a separate Travel-only code release.

- Pre-release `npm test`: **887 passed**, no failures/skips/todos.
- Production `npm run build:cloudflare`: **passed, 24 static pages**, using the
  configured live Clerk publishable key. Repository configuration and dependency
  lockfile are unchanged. Flat `account.html` contains the live key; the first
  pre-upload guard used the wrong nested filename and stopped before uploading.
  Corrected the guard's path after checking the export, then deployed successfully.
- Used project-local Wrangler 4.134.0 with `--keep-vars`, the commit tag and release
  message. D1 and Clerk bindings match the captured previous version; dashboard
  variables and secrets remain managed separately.
- Live HTTP: all **11 public pages** returned 200, as did the sampled script,
  bundle pointer and manifest. The `www` Builder response is 301 to the root
  domain. Signed-out `/api/account` and `/api/settings` return 401. Public pages
  retain `DENY` and `nosniff` security headers.
- Live in-app browser, Modern UI, desktop and 375 px: Travel initially displays
  neutral Loading messages, then the Seyda Neen → Balmora route and its Real Time
  Approximation. Least real time selects successfully and produces a route;
  its previous objective was restored. No horizontal phone overflow.
- Alchemy's four apparatus lists exclude Secretmaster and descend by quality,
  keeping the optional None choice. Enchanting accepts typed soul size **300**,
  with Constant disabled below 400; restored the original input afterward.
  All three calculators appear directly at 1440 px and in the phone menu.
- An existing authenticated browser session loaded the profile and account
  settings controls, including the empty-settings adoption prompt, without an
  error. No settings/profile/cloud-save/payment write or sign-out was performed;
  theme/world preferences were left unchanged. Cross-device settings writes and
  real sign-in/out remain owner acceptance checks. Captured browser console
  errors/warnings: **none**. These live smoke checks do not replace the full local
  Chrome run in §14 (**153 cases, 232 axe audits, 439 settled font checks**).
- Bundle remains `3da0320236da77ec085d105d`, snapshot
  `1613a1123ed9f5102fa3b266df33a4820d0128e9a9bdf680b8b7a1b40296fd1f`.
  No extraction, additional migration or database restore ran during deployment.
  Migrations 0001–0007 were already applied, with none pending. D1 UUID remains
  `141a1409-3956-4267-a078-02483bbb2bf6`; §15 records preservation of every old row.
- Immediate pre-release recovery bookmark:
  `00000059-00000000-000050f7-69367513ae9acb9d9add96e963178727`.
  Previous active Worker and code rollback target:
  `3ef09493-cb5a-42e2-96fd-ca54c168d3e2`. Code rollback leaves the additive settings
  table intact; it reverts this complete main release, not just the tool polish.
  This target is the Travel version that failed the 375 px check (§9). The last
  version that passed full acceptance is `24bd4ac1` (`1e84b1a`, before Travel).
  Both are compatible with additive migration 0007; choose at the freeze.

Private release evidence: `A:/Cache/account-settings-release-20260930` contains
unit/build/deployment logs, recovery metadata, before/after deployment history,
version metadata and the read-only HTTP report. The phone screenshot contains
only the public tool UI. No private account snapshot or SQL export is published.
Release documentation is synchronized between the site and pipeline repositories;
**887 site tests and 670 pipeline tests passed** before the documentation commits.
Shared coordination and roadmap files match byte for byte, preserving all prior
pipeline notes. Evidence: `documentation-unit.log`, `documentation-pipeline.log`
and `browser.json` in the private release directory.

## 17. Travel diagnostic merge and release-record housekeeping — 30 September locally

Merged `launch/trv-mobile-verification` at `19bdd92` into clean main `c64679f`
with `--no-ff`. Only LAUNCH_VERIFICATION conflicted: preserved main's content,
inserted the branch's exact §10 between §§9 and 11, and retained the runner's
checks of each edited control and all four stored choices before navigation.
The coordination investigation is folded into its existing Travel entry.

- `npm test`: **887 passed**, zero failures/skips/todos.
- Local Chrome saved-Travel case on this checkout's dev server at
  `http://127.0.0.1:8792`: **1366 px 2/2; 375 px 2/2**. Two independent runner
  invocations used fresh disposable profiles. All four cases passed applied
  edits, stored choices, restoration, world isolation and reset; no runtime or
  unexpected server errors. **46 settled font checks** across both runs.
- Pipeline synthetic tests: **670 passed** before its coordination commit.
  COORDINATION and the unchanged roadmap match byte for byte in both repositories.
- Verified all **17 distinct implementation commits** against release `216cd90`
  using `git merge-base --is-ancestor`, then added its Worker to the **18 requested
  checklist entries**. CALC-4 remains open. The production table reflects §16,
  and rollback guidance distinguishes the failed Travel version from the last
  fully accepted pre-Travel version; the freeze will choose the target.
- Documentation and the test runner only. No application code, bundle,
  configuration, migration or deployment changed. These local repetitions do
  not establish the cause of the historical production failure in §§9–10.

Evidence under `A:/Cache`: `trv-housekeeping-unit.log`,
`trv-housekeeping-pipeline.log`, `trv-housekeeping-ancestry.json`,
`trv-housekeeping-browser-summary.json` and `trv-housekeeping-browser-1`/`-2`
(reports, synthetic fixture, screenshots and request traces).

## 18. CALC-4 ingredient-pair finder on its branch — 30 September locally

`launch/calc-4-reverse-alchemy` starts at main `f5b1f56`; claim `73b75be` was
committed after 887 passing tests. The implemented finder searches the current
profile's potion effects, accepts up to four targets and lists distinct ingredient
pairs that share every selected effect. Attribute/skill targets remain distinct;
additional shared effects, including harmful ones, are shown. Pairs rank by fewer
extras, then ingredient base value; this is not a vendor quote. Using a pair clears
the other slots and moves focus to the existing potion output. Typed stats,
apparatus choices and the forward calculator remain intact; world changes reset
the finder through the existing workstation lifecycle.

- Full unit suite: **895 passed**, zero failures/skips/todos. Eight new tests
  cover target identity, multi-effect intersections, duplicate records/slots,
  malformed/null input, harmful extras, missing prices, deterministic pagination,
  frozen records, sparse effects and React search/use/remove behavior.
- Focused Chrome cases: **12/12 passed**, all three profiles, both themes,
  1366/375 px. Checks search, multiple targets, use/clear, focus, unmatched text,
  world isolation and horizontal overflow. **12 axe audits, zero violations**;
  no runtime/server errors; **25 settled font checks**. Desktop and phone
  screenshots were inspected.
- `npm run build:cloudflare`: **passed, 24 static pages**, existing repository
  configuration and live Clerk publishable key; no deployment.
- Pipeline tests: **670 passed** before local shared-note commit `83b0159`.
- The first browser attempt queried the remove button by visible text using its
  accessible label. Correcting only the runner selector produced the passing
  twelve-case run; no application persistence or calculator patch was needed.
- Published Merchants contains services/locations but no ingredient inventories.
  The finder says shop availability is not listed. CALC-4 remains in progress for
  buying locations from its usability recommendation; do not invent stock from
  merchant service flags. No extraction, published-bundle/schema change, API,
  migration, main merge or deployment is part of this branch work.

Evidence under `A:/Cache`: `calc-4-claim-unit.log`, `calc-4-unit.log`,
`calc-4-precommit-unit.log`, `calc-4-build.log`, `calc-4-pipeline.log` and
`calc-4-browser-verified` (report, screenshots and audits).
Shared coordination and roadmap notes describe the branch and the missing stock
coverage; both repositories keep identical copies.

## 19. Precise city transfers with merged city choices — 30 September locally

`launch/travel-city-stop-walks` starts at CALC-4 `f3461cd`. Cities remain one
search choice and keep their general names at unspecified journey boundaries.
Searching a specific hall, district, service or provider reveals its precise
location. Intermediate cities show the arrival/departure stops and the timed
outdoor walk between them, including doors into and out of guild halls.

The router retains published cell/position identities, including distinct
arrivals, Intervention markers and usable scripted teleports. A merged city is
only a choice of route boundary platforms, never a free intermediate node.
Unknown exterior positions have separate placeholders; they cannot manufacture
a transfer. Local indoor coordinates are not used as world coordinates, and
indoor movement remains uncounted. Existing membership, quest, inventory,
terrain, movement and spell/scroll resource constraints remain in effect.

- `npm test`: **911 passed**, zero failures/skips/todos. Synthetic cases cover
  exact transfers, distinct arrivals/providers, malformed/missing coordinates,
  frozen data, city boundaries, resource budgets, old/specific links, grouped
  city/canton search, and picker drafts during equivalent list recalculations.
- Local Chrome Travel cases: **21/21 passed**, including the twelve city-transfer
  cases across Vanilla/TR/TR+ARCE, both themes and 1366/375 px, plus keyboard,
  loading/failure/retry, imported-save persistence/profile isolation and defaults.
  **16 axe audits, zero violations; 91 settled font checks**; no runtime or
  unexpected server errors. Desktop and phone screenshots were inspected.
- `npm run build:cloudflare`: **passed, 24 static pages**, with the repository
  configuration unchanged and its configured live Clerk publishable key.
- Pipeline synthetic suite: **680 passed**, with no uncaught warnings. Shared
  COORDINATION and UI_TRANSFORMATION copies remain byte-identical; concurrent
  IngredientSources implementation work is preserved.
- The owner removed the retired two-failure/boost rule from both AGENTS.md files.
  The resumed browser expectations allow the published guide's provider name
  and the optimizer's actual transfer city: Fewest legs can prefer Vivec over
  Balmora. No application patch forces either city into a route.
- No extraction, immutable bundle/schema change, API, D1 migration, merge,
  push or deployment ran. The owner-requested dev server remains available at
  `http://127.0.0.1:8792`; CALC-4 remains intact on the parent branch.

Evidence under `A:/Cache`: `city-stop-final-unit.log`,
`city-stop-final-pipeline.log`, `city-stop-final-build.log`, and
`city-stop-final-browser-verified` (report, screenshots, audits and input traces).

## 20. Automatic long-walk and swimming fallback — 1 October locally

On `launch/travel-city-stop-walks`, plan against the restricted walking network
first. Only if no route exists, add long endpoint/place walks and open-water
swims and optimize again with the same objective and character/resource limits.
Normal journeys retain their transport: Fewest legs must keep Seyda Neen →
Balmora by Silt Strider. Remote Ald Redaynia gains a route after the restricted
attempt fails. There is no extra toggle, warning or account setting. The existing
walking-off choice disables both attempts; old experimental `long` parameters
are ignored and removed from generated links.

Mixed legs show walking and swimming time separately. Water Walking counts water
at run speed. Overload, blocked terrain, missing exits, membership, quest and
spell/scroll budgets remain enforced. Long searches are lazy and bounded, and
city platforms never become free intermediate joins. The phone route summary
uses a shorter leg label so the endpoint names retain readable widths.

- `npm test`: **920 passed**, zero failures/skips/todos. Cases cover every normal
  route objective, automatic island fallback, walking-off, overload, Water
  Walking, long/short memo isolation, enclosed terrain, missing swim speed and
  beyond-limit place reach, along with the existing city-transfer regressions.
- Chrome Travel: **33/33 passed**, including twelve city-transfer and twelve
  fallback cases across all profiles, both themes and 1366/375 px, keyboard,
  loading/failure/retry, imported-save persistence and default journeys.
  **28 axe audits, zero violations; 127 settled font checks**; no unexpected
  runtime/server errors. Desktop and phone screenshots were inspected.
- `npm run build:cloudflare`: **passed, 24 static pages**; repository config
  unchanged, configured live Clerk publishable key, no deployment.
- Pipeline synthetic suite: **685 passed**. Shared COORDINATION and
  UI_TRANSFORMATION copies are byte-identical; no pipeline code changed here.
- No extraction, immutable catalog modification, migration, commit, push, merge
  or deployment. The restored dev server remains on `http://127.0.0.1:8792`.

Evidence under `A:/Cache`: `travel-fallback-final-unit.log`,
`travel-fallback-final-build.log`, `long-journeys-pipeline.log`, and
`travel-fallback-browser-verified` (report, screenshots and axe audits).

## 21. Travel integrated into its original CALC-4 parent — 1 October locally

With owner approval, merge `launch/travel-city-stop-walks` at `f07425c` into
`launch/calc-4-reverse-alchemy` at `f3461cd` with `--no-ff`. The merge has no
conflicts. Application code matches the tested Travel source; shared handoff
notes now describe the integration. The parent's effect finder remains intact.
Buying-location wiring stays on the separate `launch/calc-4-where-to-get`
branch at `85e6a5e`; none of its uncommitted implementation is included.

- On the actual merged parent checkout, `npm test`: **920 passed**, zero
  failures/skips/todos. Before the Travel source commit, the same suite also
  passed all 920 tests.
- Chrome Travel: **33/33 passed**, covering city transfers, restricted-first
  long-walk/swimming fallback, keyboard/search, loading/failure/retry, saved
  choices/profile isolation and defaults. All three profiles, both themes and
  1366/375 px are covered. **28 axe audits, zero violations; 127 settled font
  checks**; no unexpected runtime/server errors. Screenshots inspected.
- Chrome Alchemy effect finder: **12/12 passed**, all three profiles, both
  themes and 1366/375 px. **12 axe audits, zero violations; 25 settled font
  checks**; no runtime/server errors. Phone layout inspected.
- `npm run build:cloudflare`: **passed, 24 static pages**, with the repository
  configuration unchanged and its configured live Clerk publishable key.
- Pipeline synthetic suite: **685 passed** before the Travel source commit.
  No pipeline code changed here. Shared COORDINATION and UI_TRANSFORMATION
  copies match byte for byte; concurrent source-data work is preserved.
- This is a local branch integration. No main merge, push, deployment,
  extraction, published bundle/schema change or D1 migration. The owner's dev
  server remains running at `http://127.0.0.1:8792` on the parent checkout.

Evidence under `A:/Cache`: `travel-parent-precommit-unit.log`,
`travel-parent-precommit-pipeline.log`, `travel-parent-merged-unit.log`,
`travel-parent-merged-build.log`, `travel-parent-merged-browser` and
`travel-parent-merged-alchemy` (reports, screenshots and axe audits).

## 22. CALC-4 selected-ingredient source lookup — 1 October locally

Resumed `launch/calc-4-where-to-get` at `85e6a5e`, preserving its draft wiring.
Each filled Alchemy slot has a "Where to get it" button, independent of the
effect finder; pairs retain their shortcut. Opening either loads Places and the
optional IngredientSources catalog in the current world. Replacement, clearing
and world changes discard old panels. Loading is neutral, failed requests have
Retry, older bundles show an unavailable notice, and absent/truncated sources
are explicit. Stock/restocking, locations, quantities and player-level qualifiers
remain visible; only matching draws combine, without mutating frozen records.

- `npm test`: **911 passed**, zero failures/skips/todos. Coverage includes
  malformed/null/impossible sources, distinct draws and levels, frozen records,
  concrete find locations, locked containers, optional-catalog absence, lazy
  activation, selected-ingredient replacement and inherited TR/ARCE provenance.
- Chrome Alchemy: **26/26 passed** on this checkout at `127.0.0.1:8793`:
  twelve effect-finder cases, twelve selected-ingredient cases across all three
  profiles, both themes and 1366/375 px, plus two held/failed-request Retry cases.
  The selected-ingredient cases need no pair, check native keyboard activation,
  all four slot buttons, replacement/clearing and world isolation. **26 axe
  audits, zero violations; 51 settled font checks**; no unexpected runtime/server
  errors. Desktop and phone screenshots inspected.
- Final `npm run build:cloudflare`: **passed, 24 static pages**, configured
  live Clerk publishable key and repository configuration unchanged.
- Pipeline synthetic suite: **685 passed**. No pipeline code changed here.
  COORDINATION and UI_TRANSFORMATION are synchronized, preserving the parent's
  separate Travel handoff. No parent/main merge or push is part of this task.
- The first preview attempt met an existing Next dev server lock; it was reused
  on 8766. When that server stopped responding, a new preview was started on 8793.
  Test-harness fixes mapped the new shared source component in calculator tests,
  included native Enter text in CDP events, and used unambiguous ingredients for
  the four-slot case. Vanilla's valid empty Health + Fatigue result remains intact.
- The staged bundle remains `27db1d54d3027e76ce07debf`. It predates pipeline
  correction `41da92c`: a read-only check still found 819 TR creature draws below
  the builder's dependable-drop threshold. The owner must rebuild and stage the
  correction (test cells and random creature loot) before release. CALC-4 stays
  open for corrected data publication and integration. No extraction, immutable
  bundle modification, API, migration, deployment or remote write ran here.

Evidence under `A:/Cache`: `calc-4-sources-precommit-unit.log`,
`calc-4-sources-pipeline.log`, `calc-4-selected-sources-build-final.log`, and
`calc-4-selected-sources-browser-passed` (report, screenshots, audits and network
trace). The dev preview remains available for the owner.

## 23. Corrected ingredient sources staged locally — 1 October locally

The owner authorized "stage pipeline fix" on `launch/calc-4-where-to-get` at
`5965af7`. Rebuilt IngredientSources with pipeline `41da92c` using the existing
world, acquisition and services databases, then packaged and validated the bundle
before switching the local pointer. This supersedes §22's pending-rebuild note.

- Bundle: **`a29adea046e6086c2c7ee654`**, replacing local pointer `27db1d54d3027e76ce07debf`.
  The old immutable release remains available. Extraction snapshot
  `1613a1123ed9f5102fa3b266df33a4820d0128e9a9bdf680b8b7a1b40296fd1f` is unchanged.
  Payload-hash comparison across every profile/catalog found **only
  IngredientSources changed**; profile provenance and every other payload match.
- Coverage: **126 vanilla, 921 TR and 921 TR + ARCE ingredients**. ARCE inherits
  TR's identical sources. No truncated records, excluded test/holding-cell sources
  or creature draws below the builder's dependable-drop threshold remain.
  The cell check applies the real policy's 16 exact exclusions and `interior:tr_hold_`
  prefix to 2,191 vanilla and 10,446 TR source-cell references. Staging verified
  all file hashes, identities, record counts and inherited/delta catalogs.
- Pipeline synthetic tests: **685 passed**, zero failures. Site `npm test`:
  **911 passed**, zero failures/skips/todos.
- Chrome Alchemy: **26/26 passed** using the new bundle on `127.0.0.1:8793`:
  all three profiles, both themes, 1366/375 px, selected-ingredient and pair
  lookup plus loading/failure/Retry. **26 axe audits, zero violations; 51 settled
  font checks**; no runtime/server errors. Desktop and phone screenshots inspected;
  Marshmerrow no longer suggests the old random creature-loot entries.
- `npm run build:cloudflare`: **passed, 24 static pages**, repository configuration
  unchanged. Both changelogs and the shared coordination/roadmap record the correction.
  No new extraction, API/schema change, migration, parent/main merge, push or
  deployment ran. CALC-4 remains open for integration and release.

Evidence: `A:/Cache/calc-4-stage-fix-pipeline.log` and
`A:/Cache/calc-4-stage-fix/` (`ingredient-build.log`, `bundle-build.log`,
`comparison.json`, `previous-current.json`, `stage.log`, `site-unit.log`,
`build.log`, and `browser/` reports, network trace, screenshots and audits).
The site's `public/game-data` junction shares these local assets with the other
worktrees. Both previews remain running; reload existing tabs to use the corrected
bundle because the loader pins a release for each page lifetime.

## 24. Ingredient sources integrated with Travel on the CALC-4 parent — 1 October locally

With owner approval, merge `launch/calc-4-where-to-get` at `be29f68` into its
original parent, `launch/calc-4-reverse-alchemy` at `e0704b9`, with `--no-ff`.
The parent already contains Travel `f07425c`. Five conflicts are documentation
only: both changelogs retain all October 1 entries in one day's list; shared
coordination/roadmap retain both implementations and the corrected staged data;
verification retains Travel §§19–21 and renumbers the source history to §§22–23.
Application code and tests merge cleanly and match their tested source branches.

- Actual merged checkout `npm test`: **936 passed**, zero failures/skips/todos,
  before the merge commit. Pipeline synthetic suite: **685 passed**.
- Chrome: **59/59 passed** on `127.0.0.1:8792`, using corrected bundle
  `a29adea046e6086c2c7ee654`. Travel has 27 routing/loading cases, two saved-choice
  cases and four default-journey cases; Alchemy has 26 finder, selected-ingredient
  source and loading/failure/Retry cases. Both themes, 1366/375 px and all three
  profiles are covered. **54 axe audits, zero violations; 180 settled font
  checks**; no runtime/server errors. Desktop and phone screenshots inspected.
- `npm run build:cloudflare`: **passed, 24 static pages**. Worker and Next.js
  configuration are unchanged. COORDINATION and UI_TRANSFORMATION copies in
  the pipeline are byte-identical to this parent checkout.
- No main merge, push, deployment, data rebuild, new extraction or D1 migration
  ran in this integration. The corrected local bundle is retained. Both dev
  servers remain available; the combined branch is served on port 8792.

Evidence: `A:/Cache/calc-4-integrated/` (`unit.log`, `pipeline.log`, `build.log`,
`browser-summary.json` and the `browser-travel`, `browser-travel-save`,
`browser-travel-defaults`, `browser-alchemy` reports, network traces,
screenshots and audits). Browser reports identify the pre-commit parent tip
because verification ran before committing the resolved merge.

## 25. CALC-4 and Travel merged to updated main — 1 October locally

With owner authorization, merge `launch/calc-4-reverse-alchemy` at `c2bf5d8`
into clean main with `--no-ff`. The owner pushed checklist commit `55fd07e`
while preparation was in progress; the uncommitted merge was aborted and
recreated from that updated tip. Its QA findings, decisions and launch bar
remain unchanged. Only CALC-4's completion records are updated; deployment
remains pending, and QA-13 stays open for the owner's review.

The sole conflict is `docs/BROWSER_TESTS.md`: retain main's signed-in Vault
instructions and add the Travel city-transfer/fallback and Alchemy source cases.
Application code merges cleanly. Main's Cloud Vault fixes and repository build
configuration are unchanged; Travel and Alchemy match the integrated parent.
Both changelogs retain the new player-facing entries and main's Vault entries.

- Actual merged checkout `npm test`: **940 passed**, zero failures/skips/todos.
  An earlier run failed the unchanged copied-Builder-link assertion while
  builds ran concurrently (939 passed); the complete fresh run with builds
  finished passed. Both logs are retained.
- `npm run build:cloudflare`: **passed, 24 static pages**, using the repository's
  configured production publishable key and unchanged configuration.
- Full Chrome suite: **203/203 passed** on `127.0.0.1:8794` with corrected
  bundle `a29adea046e6086c2c7ee654`. Covers the page matrix and Travel, Builder,
  calculators, Challenge Runs, Alchemy finder/selected-ingredient sources,
  Faction Journal, Level Simulator, saved Travel choices, settings and navigation.
  All three worlds, both themes and 1366/375 px; navigation also checks
  900/1024/1440/1920 px. **282 axe audits, zero violations; 585 settled font
  checks**; no unexpected runtime/server errors. Representative desktop/phone
  screenshots inspected, including city transfers, swimming, sources and Vault.
- Local signed-in Vault: **10/10 passed**, synthetic identities and disposable
  local D1 only. **12 axe audits, zero violations**; no unexpected runtime or
  server errors. Includes owner/token checks, save/rename/reload/load/delete,
  renewal after 401, damaged-save refusal, quotas, and both themes at 1366/375 px.
- Pipeline synthetic suite: **685 passed**, zero failures. COORDINATION and
  UI_TRANSFORMATION are synchronized byte-for-byte with the pipeline repository.
- Initial setup rejected a dependency junction outside Turbopack's filesystem
  root. Installing the unchanged lockfile locally resolved that setup failure.
  The Vault build then ran after the production build to avoid Next's build lock.
  No application or configuration change was needed for either setup issue.
- Corrected local bundle `a29adea046e6086c2c7ee654` is retained. No extraction,
  bundle rebuild, API/schema change, D1 migration or deployment ran. Production
  remains `216cd90` / `d523b9ba`. The existing previews were left running;
  this merged main has its own preview on `127.0.0.1:8794`.

Evidence: `A:/Cache/calc-4-main-merge/` (`unit-updated-main.log`, `unit-final.log`,
`build.log`, `pipeline.log`, `browser-summary.json`, and the `browser/` and
`vault-verified/` reports, screenshots and audits). Browser reports identify
main `55fd07e`, the pre-commit tip; all verification ran on the resolved merge.

## 26. CALC-4 and Travel released to production — 1 October locally

The owner authorized "Stop test servers. Deploy" after merging and pushing main.
Verified clean main and `origin/main` at **`ef67b3eae60360259435cc99181585c5d99e030d`**.
Stopped the verified Next dev servers and their launchers on **8792, 8793 and
8794**. No application code or repository configuration changed in this release.
The owner's `55fd07e` QA checklist and open QA-13 remain intact.

- Fresh release `npm test`: **940 passed**, zero failures/skips/todos.
  `npm run build:cloudflare`: **passed, 24 static pages**, configured live Clerk
  publishable key. Wrangler 4.134.0 `deploy --dry-run --keep-vars` passed.
  The full pre-merge Chrome/Vault verification remains in §25.
- Release-record pipeline tests: **685 passed**, zero failures. COORDINATION and
  UI_TRANSFORMATION are byte-identical in both repositories, recording the live
  version and the owner's request to stop the test servers.
- Deployed with `--keep-vars --tag ef67b3e` and the full commit in the message.
  Worker **`3879ce7b-c397-4698-83c4-e9d185d9ed5c`**, deployment
  `9d1a4f0c-a737-446d-adfa-6595620c33e7`, created **2026-10-01 05:22:43 UTC**,
  **100% traffic**, existing `plain-disk-78e6` and both configured domains.
  Uploaded 73 changed assets; 1,675 assets were already uploaded.
- Published corrected bundle **`a29adea046e6086c2c7ee654`**, extraction snapshot
  `1613a1123ed9f5102fa3b266df33a4820d0128e9a9bdf680b8b7a1b40296fd1f`.
  No extraction or bundle rebuild. A fresh live pointer/manifest and vanilla/TR
  IngredientSources fetch matched the built files by SHA-256, as did sampled
  CSS/JavaScript. The historical immutable bundles remain available.
- Live HTTP smoke: **15 checks passed**. Home, Travel, Alchemy, Builder, Faction
  Journal, Level Simulator and changelog return 200; assets and data match the
  build. `www/builder` returns 301 to the root domain; anonymous `/api/account`
  returns 401. Nosniff and frame-denial headers are present.
- Live signed-out Chrome: **38/38 passed**. Alchemy has 26 cases across all
  three worlds, both themes and 1366/375 px, covering the finder and selected
  ingredient sources, lazy loading, replacement/clearing and failure/Retry.
  Vanilla city transfers and swimming fallback have four cases each across both
  themes and widths. Saved-Travel edits, storage, navigation, profile isolation
  and reset passed **twice at each width** with synthetic browser-only data.
  **34 axe audits, zero violations; 131 settled font checks**; no unexpected
  runtime/server errors. A cache-only wrapper limited checks to this production
  host and blocked all account API requests; the repository's local-only runner
  is unchanged, and the temporary wrapper was removed. This did not exercise
  production sign-in or perform cloud saves/payments.
- Existing D1 UUID `141a1409-3956-4267-a078-02483bbb2bf6`: **0001–0007 applied,
  none pending**. The migration-name query wrote zero rows. Fresh pre-release
  bookmark: `0000005d-00000000-000050f7-7e6a447a113fd39c04e571109bfaee6c`.
  No migration, database restore or private-data export ran.
- Code rollback: **`d523b9ba-92b1-4fed-9056-89ee19916a49` / `216cd90`**, the
  previous active 100% deployment captured before this release. Its code and
  assets restore account settings/tool polish before this batch; additive
  migration 0007 and database writes remain intact.

Recovery records and evidence are outside Git at
`A:/Cache/deploy-ef67b3e-20261001/`: `recovery.json`, deployment history before
and after, D1 info/bookmark/migration lists, release pointer/manifest, unit/build/
dry-run/deploy logs, `live-http.json`, and `live-browser-summary.json` plus each
live run's report, network trace, screenshots and audits.

## 27. QA reproduction — 1 October 2026

Reproduction only, on `qa/reproduce` from `origin/main` `a8139c5`; claims were
published first as `e25a7ed`. The signed-out production checks targeted release
`3879ce7b`. The local dev server used the unchanged staged bundle
`a29adea046e6086c2c7ee654`. No application/published-data changes, migration, production
writes, merge or deployment. QA-13 and QA-14 were left intact.

Rates below count valid observations, not failed selector/fixture setup. Unless
specified otherwise, each browser case ran locally and live at 1366 and 375 px
in both themes. Unit expectations marked `{ todo: '<QA-id> not fixed yet' }`
were also run with `QA_UNMARK_TODOS=1`: all **35** marked unit cases failed on
their behavior assertions; six unmarked controls passed. The eight marked
phone-layout cases likewise failed unmarked against the captured live report;
the Race popover control passed. These are open findings, not fixes.

Full pre-commit `npm test`: **951 passed, zero failures, 35 TODO** (986 tests).
QA-20's final catalog/UI batch passed **20/20 locally and 20/20 live**.

| Item | Reproduced | Rate / evidence | Cause (file and function) | Test | Smallest proposed fix |
|---|---|---|---|---|---|
| QA-01 | Yes | Two Constant effects show 50 instead of 75, 4/4 locally and 4/4 live; three effects and mixed ranges fail unit expectations too. | `lib/enchant-math.mjs`, `calcEffectCost` / `calcEnchantmentTotalPoints`: final accumulated cost is rounded instead of summing each running cost's floor; range/Constant handling also differs. | `test/qa-calculation-reproduction.test.js`, `QA-01 accumulated points` (five cases, including a passing one-effect control). | Preserve each cumulative float cost and sum its floor; apply OpenMW's area minimum, Target and Constant rules in the same order. |
| QA-02 | Partly | Floor, chance and price expectations fail directly. Common Ring UI setup failed on two attempts; its exact visible capacity case is not claimed as reproduced. | `lib/enchant-math.mjs`, `calcEnchantmentTotalPoints`, `calcSelfEnchantChance`, `calcEnchantGoldCost`: rounding, different chance coefficients, and price from rounded capacity with an extra Constant multiplier. | Same file, `QA-02 per-effect floor` (four cases), `QA-02 chance uses OpenMW…`, `QA-02 base price truncates…`. | Separate capacity points from final precise effect cost; use engine chance coefficients/fatigue/type multiplier and price truncation. |
| QA-03 | Yes | +3 shown instead of +3.5, 4/4 locally and 4/4 live; five gains total 21 instead of 22.5. | `lib/level-math.mjs`, `calculateHealthGain`: `Math.floor(Endurance / 10)`. | Same file, `QA-03 fractional Health` (35/45/55), `QA-03 five level gains preserve 22.5 Health`. | Keep fractional Health through progression and formatting. |
| QA-04 | Partly | All five pure chart expectations fail. Live captured chart begins at 50 for a sheet with Health 35. Synthetic-save chart UI setup failed twice, so the save-specific chart claim is not reproduced. | `lib/level-math.mjs`, `normalizeCharacterState` / `calculateHealthGrowthCurve`: normalized state is treated as a build and recomputed; chart normalization and Bitter Cup do not preserve the supplied sheet. | Same file, `QA-04 chart starts…` (35/45/67.5), `QA-04 Endurance 30…`, `QA-04 Bitter Cup…`. | Normalize once and pass the actual initial sheet and completed picks to the chart; preserve Health and identity fields. |
| QA-05 | Partly | Hydrated Builder retains the premade title after edits. Simulator stale identity reproduced at desktop in both themes locally/live; live phone did not reproduce it; local phone selector setup failed twice. | `components/character-context.jsx`, `updateField`; `components/character-builder/character-sheet.jsx`, title rendering; `lib/level-math.mjs`, `normalizeCharacterState`: name survives edits and sheet normalization loses identity. | `test/qa-hydrated-title.test.js`, `QA-05 hydrated fresh premade…`; calculation test `QA-05 Simulator sheet keeps…`; browser `QA-05/title`. | Label an edited premade as derived from its source or update its title, and carry configured identity into the Simulator. |
| QA-06 | Yes | Three unobtainable tools in TR and TR + ARCE, 8/8 locally and 8/8 live; Vanilla control passes. | `lib/alchemy-catalogs.mjs`, `adaptAlchemy`: vanilla ID / `Secretmaster` prefix filter misses TR IDs and the name's space. | `test/qa-catalog-reproduction.test.js`, `QA-06` for TR and TR + ARCE; browser apparatus case. | Match the actual unobtainable apparatus records across profiles. |
| QA-07 | Yes | Apostrophe search has no match while the prior Silt Strider route remains visible, 4/4 locally and 4/4 live. | `lib/travel-search.mjs`, `searchTravelOptions` / normalization; `matchPlaces`; Travel picker query and committed endpoint are separate, so rejected text leaves the previous route. | Same catalog test file, `QA-07` apostrophe spellings and `matchPlaces`; browser `QA-07/search`. | Normalize apostrophe/hyphen variants and visibly mark a route stale while an uncommitted search fails, preserving cancel behavior. |
| QA-08 | Yes | Early and Late tables break words in all eight checks per host at 375/390 px, both themes; the table boxes themselves fit. | `components/character-builder/gear-sources.jsx`, `SourceRow`, and `components/character-builder/best-in-slot-view.jsx`, compact table rendering; inherited word wrapping with narrow columns. | `test/qa-layout.browser.cjs`, `QA-08` Early/Late at both widths; runner `QA-08`. | Stack Slot / Item / Where at phone widths and keep words intact. |
| QA-09 | Partly | Birthsign, Specialization and both Favored Attribute popovers overflow right in 16/16 observations per host. Race stayed inside the viewport in 4/4 per host; its reported below-tab-bar symptom was not reproduced. | `components/character-builder/configurator.jsx`, `InfoTip`: fixed-width absolute popup without viewport clamping or flipping. | Same layout test file, four TODO cases and a passing Race control; runner `QA-09`. | Clamp/flip the popup within the viewport and above the phone tab bar. |
| QA-10 | Yes | Optimized kit/alternatives show forbidden body parts for Argonian, Khajiit and ARCE Cathay-raht, 12/12 per host. An earlier Suthay control was discarded because that record is not a beast. | `lib/best-in-slot.mjs`, `resolveBestInSlotPicks`: named/fallback premade paths bypass `scoreItem`'s beast check; weapon-preference replacement spreads original slots back into the result. `recommended-loadout` checks only when applying gear, too late for display. | Catalog test file, three `QA-10` races; runner `QA-10/endgame`. | Apply the published body-part eligibility to every final slot and runner-up before presentation. |
| QA-11 | Yes | Twelve `<Deprecated>` entries in each TR profile, 8/8 per host; raw relation labels also fail rendered-component tests. All three requested names exist in the published catalog. | `components/journal-factions/faction-roster.jsx`, roster filtering; `faction-detail-view.jsx`, relation rendering: deprecated entries retained, raw IDs title-cased rather than looked up. | `test/qa-copy-reproduction.test.js`, `QA-11 roster…` / `QA-11 relation display…`; catalog-name passing control. | Filter deprecated rows and resolve reaction IDs through Factions. No missing-name pipeline request is needed. |
| QA-12 | Yes | Required playstyle/trade-off copy absent in visible premade cards, 4/4 per host and rendered-component test. | `components/character-builder/premade-browser.jsx`, premade card copy. | Copy test file, `QA-12 premades describe…`; browser `QA-12/premade-copy` (runner now expands all cards). | Add curated plays-like/trade-off lines and spell out Major/Minor skills. |
| QA-15 | Yes | About lacks attribution/license/repository copy, 4/4 per host; claim-scan control permits “open source” for code. | `components/views/about-view.jsx`, About copy; `test/site-claims.test.js` is not the blocker. | Copy test file, `QA-15 About attributes…` and passing claim-scan control; runner `QA-15/about`. | Add the requested AGPL code attribution, game/mod-data distinction and LowGraph repository link. |
| QA-16 | Yes — High | Ebonheart → Mournhold returns No Route in all three worlds, walking on/off: 24/24 per host. | `lib/travel-stops.mjs`, `buildTransitStops` / `transitEndpointStops`: the teleport's exact destination exists in the graph but the Mournhold city choice does not expand to it. `usableTeleport` and `addTeleports` retain the route. | Catalog test file, three `QA-16 Mournhold city choice…`; runner `QA-16/Mournhold`. | Attach teleport endpoint town information from Places/settlements and resolve the city to its actual destination stop. |
| QA-17 | Partly — expected 404 only | 1,168 first navigations across both hosts: 1,104 strict passes, 64 expected HTTP 404 console errors; zero React hydration warnings or uncaught exceptions. | No hydration cause found. Chrome logs the intentional missing-page request as an error; the requested fail-on-any-error policy catches it. | `scripts/test-browser.cjs --suite hydration`; 456-case full matrix per host, plus populated challenge-link and visible-loaded-save reruns, 64 each per host. | No application fix proposed. Decide whether freeze acceptance should exempt the expected 404 resource error. |
| QA-18 | Not reproduced on phone; laptop unverified | 31/31 phone interaction cases per host; stored Travel edits survive actual taps/navigation 20/20 per host. Touch=5/coarse/hover-none verified before testing. Two touch-plus-fine-pointer emulation attempts still reported coarse, so laptop hint behavior is unverified. | No phone defect found; CDP failed to supply the required laptop capability combination. | Runner `--suite touch --touch`: hints, five popovers, header/phone navigation, ingredient/effect pickers, saved Travel; laptop capability assertion. | No speculative fix. Test a physical touchscreen laptop with a fine pointer before accepting that condition. |
| QA-19 | No | All nine requests return 401 with no Set-Cookie or account data: five local (including PUT), four production GETs. | No fault found; anonymous guard rejects before database access. | `test/qa-signed-out-api.test.js`, five API guards; recorded HTTP checks against `scripts/local-stack.cjs` and production. | None. Production PUT was not attempted. |
| QA-20 | No | All 5,755 suggested pairs (55 Vanilla, 2,850 per TR profile) contain Restore Health on both catalog ingredients; all 20 Vanilla guild ranks match. | No mismatch found in `findAlchemyPairs`, `solvePromotionGaps`, or the staged Ingredient/Factions records. | Catalog test file `QA-20 every suggested…`; copy test file `QA-20 Vanilla Fighters/Mages…`; runner `QA-20` compares visible suggestions and all rank meters. | None; no High catalog mismatch. |
| QA-21 | Yes, including real development session | Isolated signed-in Worker: 4/4 at both widths/themes stay Vanilla, show Argonian and remain calculating. A repeat with account theme explicitly verified gives the same 4/4. Real Clerk development session at 1102 px: 1/1 also stays Vanilla, shows Argonian and remains calculating. | `components/app-shell.jsx`, `AppShell` supplies `onApplyBuild={setBuild}`; `components/character-context.jsx`, `setBuild` and `loadBuild: setBuild` do not activate the build's world. | `test/qa-account-reproduction.test.js`, `QA-21 Vault load applies…`; `scripts/test-vault.cjs --qa-reproduction`, `QA-21/Vault-world`. | Give Vault a profile-aware load operation that applies world/ARCE before resolving the sheet, using the LINK-1 precedence. |
| QA-22 | Yes | Imported-save links fail 4/4 local Worker cases in each of two runs. Challenge links fail 4/4 locally and 4/4 signed-out live. Actual generated URLs were decoded. Real Clerk imported-save check at 1102 px also fails 1/1: raw IDs, male gender, empty skills and Vanilla world. | `components/character-vault/use-cloud-vault.js`, `shareBuildLink`: game-save branch uses only summary race/class/sign, dropping profile, gender and skills. `components/challenge-runs/challenge-runs-root.jsx`, `handleCopyPermalink`: uses current `shell` world rather than the run's rolled profile. | Same unit file, two `QA-22` tests; Vault `QA-22/save-permalink`; Chrome `QA-22/challenge-permalink`. | Resolve the full imported save in its own catalogs before building a permalink; retain/use the run's original profile when sharing. |
| QA-23 | Yes, including real development session | HydrateRoot restores the actual sign-in hand-off without hydration errors; an untouched revision-0 account response then changes TR + ARCE to Vanilla, 1/1 controlled response. Real Clerk sign-in at 1102 px with no URL world and an untouched account also changes TR + ARCE to Vanilla, 1/1; the account still says no saved settings. Switching the header world then creates a saved Preferred world without selecting that account control, 1/1. | `components/shell-context.jsx`, `ShellProvider` selects `preferences.settings.world` whenever ready; `setProfile` automatically calls `preferences.update`. `AccountSettingsSession.update` persists header/save-derived world changes, so the document cannot distinguish an explicit account preference. | Same unit file, `QA-23 hydrated sign-in hand-off keeps…` (proved failing unmarked after correcting the session-storage fixture). | Track whether Preferred world was explicitly selected on the account; preserve browser/handoff world until then. |
| QA-24 | Yes, including real development session | Actual AccountPage sign-out callback calls Clerk with no unsaved-character hand-off, 1/1 controlled case. Real Clerk sign-out at 1102 px reloads Home and replaces the unsaved Female Breton / The Tower with an Imperial Male / The Lady premade, 1/1. Loaded-save control survives with Female Cathay-raht / The Thief unchanged, 1/1. | `components/account-page.jsx`, `auth`: announces only `openSignIn`; `character-context.jsx` listens only to `SIGN_IN_EVENT`. `lib/sign-in-handoff.mjs`, `takeCharacterAfterSignIn` rejects a signed-out return. | Same unit file, `QA-24 sign-out preserves…` (fails unmarked). | Preserve before sign-out and restore through a separate signed-out return marker with the same expiry/one-shot safeguards; dispatching SIGN_IN_EVENT alone is insufficient. |
| QA-25 | Partly — unit assertion only | Two direct DOM reproduction attempts stalled at fixture readiness and were stopped. The required full TODO suite subsequently reaches the assertion: origin becomes Seyda Neen instead of Balmora while `plan=time` stays. No additional Chrome/live attempt was made after the two failures. | `components/calculators/travel/travel-workstation.jsx`, link-reading and save-origin effects: a link read before asynchronous restore records `startedFrom="link"`; the new save token then causes `setOrigin(saveOrigin)`. | Same unit file, `QA-25 loaded save cannot override…`; assertion executes/fails as TODO in the full suite, separate unmarked/browser confirmation remains limited. | Keep an explicit link-origin precedence marker through asynchronous restoration, distinct from the save token. |

QA-21–QA-25 were copied from `origin/main` `fdee9b6` as documentation only and
claimed/pushed first in `b9ed125`. Main's application changes were not merged.
The new full unit run is **951 passed, zero failures, 41 TODO** (992 tests).
The five QA-21–QA-24 expectations were observed failing unmarked; the QA-25
limit is recorded above. All six fail on behavior assertions in the full TODO
run. The optional Vault QA suite intentionally reports eight expected behavior
failures, no runtime/server errors, and deletes both “QA – ” saves in `finally`;
its synthetic tokens never contact a real Clerk account. Account theme writes
are confined to that fresh local synthetic database.

The owner completed the new-password signup step for the authorized throwaway
Clerk development account; the test email-code flow then completed. Real-session
checks ran on `http://localhost:8795` at the browser's 1102 px viewport, separately
from the synthetic 1366/375 px, two-theme matrix. QA-21, imported-save QA-22,
QA-23 and QA-24 reproduced; the loaded-save sign-out control passed. No signed-in
production check or production write ran. Both real-session Vault records
("QA – Real ARCE build" and "QA – Real Imported Cathay-raht") were deleted through
the UI, which reported 0/5 slots used. The loaded save was cleared through the UI.
The exact newly created development account and its isolated local settings row
were removed; all eight application-table counts for that account were verified
zero. Cleanup evidence is `real-session-cleanup.json` in the QA cache. No account
credentials are retained in Git.

### Engine expectations and exact records

Checked the pinned [OpenMW 0.51 enchanting implementation](https://raw.githubusercontent.com/OpenMW/openmw/openmw-0.51.0/apps/openmw/mwmechanics/enchanting.cpp),
[NpcStats implementation](https://raw.githubusercontent.com/OpenMW/openmw/openmw-0.51.0/apps/openmw/mwmechanics/npcstats.cpp),
[NpcStats declarations](https://raw.githubusercontent.com/OpenMW/openmw/openmw-0.51.0/apps/openmw/mwmechanics/npcstats.hpp)
and `MechanicsManager::buildPlayer`, rather than the report's 0.49 reference.

- Enchanting accumulates precise effect cost, floors each running value for
  capacity, then sums those floors. Area has a minimum of one. Target multiplies
  the running cost by 1.5; Constant uses duration 100. Two 5/5 Constant effects
  have running costs 25.025 and 50.05: capacity **75**, base price **50,050**
  before barter (site: 50 points and 250,000). Three effects need 150 points.
- A 5/5, five-second Target effect has precise cost **1.9125**, capacity **1**
  and base price **1,912**, so it fits a Common Ring. Price is based on the final
  precise cost, not the sum of capacity points; simply changing points would
  still leave price wrong. At Enchant 50 / Intelligence 40 / Luck 40 and full
  fatigue the one-point chance is **73%**. Chance includes fatigue, effect count
  and a Constant multiplier; the site's current coefficients differ. The
  original reported chance discrepancy cannot be matched without its stats.
- `levelUp` adds a float Endurance gain; `updateHealth` calculates the base half
  from base Strength/Endurance and is documented/called at character creation.
  `levelUp` does not retroactively recompute that base half. The chart must retain
  supplied Health and apply future fractional gains, rather than reconstruct it
  from current Strength/Endurance.
- The missed TR apparatus keys are `tr_m7_apparatus_sm_alembic_02` (“Secret
  Master's Alembic”), `tr_m7_apparatus_sm_calcin_02` (“Secret Master's
  Calcinator”) and `tr_m7_apparatus_sm_retort_02` (“Secret Master's Retort”).
  They occur in both TR profiles. The mortar's different name already matches
  the filter.
- Factions already publishes `t_cyr_fightersguild` → “Cyrodiil Fighters Guild”,
  `t_glb_archaeologicalsociety` → “Imperial Archaeological Society”, and
  `t_mw_imperialnavy` → “East Navy”.
- `mhtransportscript` is present and usable in every Teleports catalog, with no
  required quest. Asciene Rane connects Ebonheart's Grand Council interior to
  Mournhold's Royal Palace reception; the destination city expansion is missing.

### Limits, rerun commands and evidence

Two failed attempts ended the Common Ring UI, synthetic-save chart UI and
touch/fine-pointer emulation reproductions. Selector/storage setup failures are
listed as limits, not counted as confirmed application failures. Earlier full
QA runner reports include such failures and must not be used as acceptance
failure totals. No patch was made to the application for any finding.

`npm test` keeps known failures as TODO. To prove the calculation/catalog/copy/
hydrated-title expectations still fail, set `QA_UNMARK_TODOS=1` and run their
four test files explicitly; unset it afterwards. Phone assertions are separate:
set `QA_BROWSER_REPORT` to a fresh QA browser `report.json`, then run
`node --test test/qa-layout.browser.cjs`, optionally with the same unmark flag.
See `docs/BROWSER_TESTS.md` for the reusable QA, hydration and touch commands.

Evidence is in `A:/Cache/qa-reproduce-20261001/`: unit unmarked/TODO logs,
API results, local Worker build/log/state, all Chrome reports, first-navigation
console streams, HTML and screenshots, and pinned OpenMW sources. Production
browser requests block account writes; only signed-out public views and GET API
checks ran. The local Worker uses its own synthetic database under that cache.

## 28. QA-24 character through sign-out — 1 October 2026

Implemented in `aebd6c0` on `launch/character-signout-preservation` from main `0c55696`.
QA-21/23 belong to the other session's `launch/character-preservation`; its
uncommitted edits were left intact. The account button announces sign-out before
Clerk navigates. A separate tab marker restores the entire unsaved character,
including its world, once on a signed-out return within 15 minutes. Shared build
links win, loaded saves keep using their existing storage, and failed sign-out
discards the marker. No settings format, D1 migration or published data change.

- Targeted hand-off/account tests: **16 passed, zero failures, five unrelated TODO**.
- Full `npm test`: **961 passed, zero failures, 40 TODO** (1,001 tests).
  QA-24's reproduction expectation is now enforced; nine new tests cover expiry,
  malformed/future markers, cancelled/failed authentication, denied storage,
  actual hydration with an ARCE identity and loadouts, shared links and saves.
- Normal Turbopack static export: **24 pages generated**, configuration unchanged.
- Local Chrome `--signout-preservation`: **8/8 passed**, unsaved ARCE and loaded-save
  cases at 1366/375 px, both themes, with zero runtime/server errors. After a full
  Home return the identity matches; the marker is gone; a later ordinary refresh
  starts afresh. Screenshots captured and the phone Morrowind sheet inspected.
- Existing local Vault regression: **10/10 passed**, including signed-out API,
  account isolation, quota, save/rename/load/delete, token renewal, corrupt-save
  handling and signed-in axe checks in both themes/widths; zero runtime/server errors.

The new worktree first needed its own locked dependencies: Turbopack rejects a
node_modules junction outside its root. The fresh runner then exposed a padded
Base64 placeholder publishable key; the test-only key now uses Base64url. Neither
setup failure reached a browser case. No real Clerk key/account was needed for
these checks: Clerk sign-out is simulated, while local pages/Worker and the full
navigation are real. Final real-Clerk acceptance remains required. No production
request, push, merge or deployment ran for this branch. Temporary runner servers
closed on completion; the owner's existing test server is untouched.

Evidence: `A:/Cache/qa-reproduce-20261001/signout-*.log`,
`A:/Cache/signout-preservation-20261001-browser/` and
`A:/Cache/signout-vault-regression-20261001/` (reports, screenshots, audits and
isolated local Worker state).

## 29. QA-24 merge verification — 1 October 2026

Owner authorized merging `launch/character-signout-preservation` (`bce1401`)
into main. Fetched `origin/main` was `0c55696`, unchanged on the final fetch.
`git merge-tree` preview was clean; the no-fast-forward merge was performed in
the clean `A:/Claude/mt-signout-main-merge` worktree and verified there before
the merge commit. No conflicts or changed resolutions. QA-21/23's other worktree
and uncommitted changes were left untouched. Changelog and the QA-24 checklist
completion are included; the coordination copy is synchronized with the pipeline.

- `npm test`: **961 passed, zero failures, 40 TODO** (1,001 tests).
- `npm run build:cloudflare`: passed, **24 static pages**, configuration unchanged.
- Local Chrome `--signout-preservation`: **8/8 passed**, unsaved ARCE and loaded-save
  cases, 1366/375 px, both themes; zero runtime/server errors.
- Existing local signed-in Vault/axe regression: **10/10 passed**, both widths/themes;
  zero runtime/server errors. Synthetic Clerk, local pages/Worker and isolated D1 only.

No push, deployment, migration or production write was authorized or performed
for this merge. Real Clerk acceptance remains for the final acceptance pass.
Runner servers closed after both suites; the owner's existing test server remains.
Evidence: `A:/Cache/qa-reproduce-20261001/signout-main-*.log`,
`A:/Cache/signout-main-browser-20261001/` and `A:/Cache/signout-main-vault-20261001/`.


## 30. QA-21/23 character world preservation — 1 October 2026

Branch `launch/character-preservation`, taken over 18:14 UTC from the unfinished
implementation at `8cd2975`; claim pushed as `c4612b6`. Main `4f9c4bb` incorporated
as `993b812`, including QA-24 and both README updates. No merge to main,
deployment, production write, D1 migration or game-data rebuild in this work.

| Item | Result | Cause / change | Enforced tests |
| --- | --- | --- | --- |
| QA-21 | Fixed on branch; standalone and modal Vault load TR + ARCE from Vanilla, correct race/sign and populated sheet | `AppShellMain` and `CloudVaultWorkstation` used plain `setBuild`; now use `CharacterProvider.loadBuild`, validate world/identity, prepare catalogs before applying, and await load/errors | `test/qa-account-reproduction.test.js`: Vault world, old builds, malformed inputs, unavailable catalogs; `test/local-save-review.test.js`: asynchronous load failure; Chrome `QA-21/Vault-world` and `QA-21/modal-world` |
| QA-23 | Fixed on branch; browser world survives untouched accounts and sign-in hand-off, including restored ARCE save | `ShellProvider` used every stored world; settings v2 `worldChosen` records explicit account choice. Header and character loads keep session selection without updating the account default | Hydrated tests in `test/qa-account-reproduction.test.js`, `test/account-settings-ui.test.js`; version/intent cases in `test/account-settings.test.js`, read-only legacy upgrade in `test/account-settings-api.test.js`; Chrome `QA-23/sign-in-handoff` and `QA-23/explicit-preference` |

Version 1 retains its other settings but upgrades to `worldChosen: false`: it
cannot distinguish explicit account intent from automatically recorded worlds.
No settings row is rewritten on read. The next deliberate settings write uses
version 2 and existing revision guards. Previously chosen account worlds must be
chosen again. A pre-v2 Worker refuses v2 settings instead of erasing them; a future
release's rollback plan needs a compatible settings reader. See ACCOUNT_SETTINGS.

Final verification:

- Full unit suite: 1,012 tests, 974 passed, 38 existing TODO, 0 failures.
- `npm run build:cloudflare`: passed with repository config unchanged; 24 pages.
- Chrome QA-21/23 matrix: 16/16, 1366/375 px and both themes, 0 runtime/server errors.
- Main's QA-24 sign-out matrix: 8/8, unsaved ARCE and loaded save, both widths/themes.
- Normal local Vault regression: 10/10, API/account isolation, quota, save actions,
  token renewal, damaged records and axe on pages/dialog in both widths/themes.

The initial browser pass found the standalone Vault callback omitted by the
inherited changes; that callback is now fixed. The modal/phone runner now opens
visible phone controls and focuses the modal load control before scrolling, waits
for paint, and confirms a pointer hit rather than clicking clipped controls. One
Cloudflare build generated 24 pages then hit Windows `kill EPERM`; its isolated
rerun passed. Synthetic Clerk authentication tests the real local pages, Worker
and fresh D1, not Clerk email-code screens or production redirects; real Clerk
acceptance remains in the final release pass. QA records were deleted in `finally`
and runner servers shut down. QA-22/25 remain open and TODO.

Evidence under `A:/Cache/`: `character-preservation-unit-final.log`,
`character-preservation-build-final-retry.log`,
`character-preservation-browser-visible-20261001/`,
`character-preservation-signout-painted-20261001/`, and
`character-preservation-vault-painted-20261001/`.

## 31. QA-22 share the source character and run — 1 October 2026

Claimed at 18:50 UTC on `launch/character-preservation`, claim `f17ae43` pushed
before implementation. This push also published the completed QA-21/23 branch
work (`1029357`); main and production are unchanged.

Both original TODOs failed when unmarked before the fix: the imported save link
contained raw IDs, empty skill groups, male gender and Vanilla; the Vanilla run
link used the visitor's TR world. They are now enforced tests.

| Item | Result / rate | Cause (file and function) / fix | Tests |
| --- | --- | --- | --- |
| QA-22, imported saves | Fixed on branch; 4/4 Chrome cases, 1366/375 px in both themes; copied links reopen the resolved character with a populated sheet | `use-cloud-vault.js`, `shareBuildLink`, used the list summary. Fetch the full owned record, then `save-share-link.mjs`, `generateSaveShareUrl`, resolves the save's content-file profile and its character catalogs through `buildFromSave`. Preserve gender, race/sign labels, class, favored attributes and major/minor choices; never apply the save or borrow active-character defaults. Unresolved identity, invalid class data and fetch failures return an error, without copying a substitute | `test/qa-account-reproduction.test.js`, imported link, full-record fetch without session changes, unresolved/unsupported rows and existing build links; `test/save-share-link.test.js`, all profiles, custom classes, missing identity, malformed save, duplicate skills/attributes, unavailable catalogs; Chrome `QA-22/save-permalink` |
| QA-22, challenge runs | Fixed on branch; 4/4 Chrome cases, same widths/themes; change header to TR, copy a Vanilla run, reopen it in Vanilla with its character/restrictions/objectives intact | `challenge-runs-root.jsx`, `handleCopyPermalink`, encoded the shell's world. `challenge-engine.mjs`, `profileForRun`, uses retained run metadata, or its old seed; seeded generation and sanitizing retain profile. `challenge-run-context.jsx` captures the opening profile for seedless links before removing the query | Enforced hydrated challenge copy test; `test/save-share-link.test.js`, Vanilla/TR/ARCE, legacy seeds, seedless/invalid metadata; `test/share-link-world.test.js`, link capture with/without world; Chrome `QA-22/challenge-permalink` |

Build permalinks still carry character creation choices, not the save's level,
progression or inventory. Older seedless stored runs that never recorded a world
cannot recover it; the existing visitor-world fallback remains for those records.
No game-data/schema, D1 migration, account preference or production change.

Final verification: `npm test`: **1,022 tests, 986 passed, 36 existing TODO,
0 failures**. Cloudflare build with unchanged config: **24 pages, passed**.
Chrome: **8/8** local Vault cases (4 QA-21 and 4 QA-22), plus **4/4** challenge
recipient cases; zero runtime/server errors. All synthetic "QA – " records were
deleted in `finally`, and isolated runner servers closed. No real Clerk or
production writes. Main/deployment remain separate owner actions.

The first recipient check used a nonexistent `.character-sheet-root` selector;
the runner was corrected to the actual `.character-sheet` and active gender
button, then the full matrix passed. The new catalog test also corrected its
expectation: `Hara` resolves to **The Thief**, as published, rather than The Tower.
Application resolution follows those catalogs without editing them.

Evidence in `A:/Cache/`: `qa22-before-fix.log`, `qa22-unit-final.log`,
`qa22-cloudflare-build-final.log`, `qa22-vault-verified-20261001/`, and
`qa22-challenge-verified-20261001/`. QA-25 and the other open checklist items remain
outside this task.

## 32. QA-01/02 enchanting running costs — 1 October 2026

Claimed 19:11 UTC on `launch/character-preservation`; claim `3c45912` pushed before
implementation. Main, production, game data, migrations and repository build
configuration are unchanged.

Source comparison: OpenMW **0.51.0**, [enchanting.cpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/enchanting.cpp)
(`getEffectCosts`, `getEnchantPoints`, `getEnchantChance`, `getEnchantPrice`),
[enchanting.hpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/enchanting.hpp)
(precise points are the default), [enchantingdialog.cpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwgui/enchantingdialog.cpp)
(capacity/display uses floors), and [creaturestats.cpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/creaturestats.cpp)
(`getFatigueTerm`). Read the staged GameSettings directly; all three profiles
currently provide cost multiplier 0.5, Constant duration 100, chance penalty 3,
Constant chance multiplier 0.5, value multiplier 1000, fatigue base 1.25 and
fatigue multiplier 0.5. No real-data rebuild was performed.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-01 | Fixed on branch; 12/12 Chrome cases, all profiles, both widths/themes | `lib/enchant-math.mjs`, `calcEnchantmentTotalPoints`, kept only the final cost. `calcEnchantmentCosts` now retains each running float cost; capacity adds its floor, chance adds its precise value, and price uses the final one. Minimum magnitude/area/cost and Target multiplication follow source order; Constant changes duration | `test/qa-calculation-reproduction.test.js`: one/two/three effects, area and Target→Self; `test/enchanting-costs.test.js`: separate outputs, order-sensitive price, area/Constant/float cases and settings; `test/enchanting-first-case.test.js`: two-effect UI; Chrome `QA-01/enchanting` |
| QA-02 | Fixed on branch; 12/12 Chrome cases, same matrix; Common Ring setup now completes | `calcEnchantmentTotalPoints` rounded instead of adding floors, `calcSelfEnchantChance` had different coefficients, and `calcEnchantGoldCost` took rounded capacity with an extra Constant price multiplier. Workstation now passes distinct precise chance and final price inputs; chance uses source coefficients/fatigue/Constant multiplier then truncates and clamps; base price truncates before existing barter | Original four floor cases plus chance/price tests now enforced; `test/enchanting-costs.test.js`: Common Ring downstream outputs, fatigue, item/type multipliers, custom/malformed settings and empty/minimum rows; real UI test checks no overflow and 70% / 1,912 gold; Chrome `QA-02/enchanting` |

Before fixing, **9/11** unmarked reproduction cases failed. Afterward:

| Example (base cost 1) | Capacity points | Precise chance points | Final cost for price | Base gold | Chance at Enchant 50 / Int 40 / Luck 40, full fatigue |
| --- | ---: | ---: | ---: | ---: | ---: |
| One 5/5 Constant Effect | 25 | ≈25.025 | ≈25.025 | 25,025 | 0% |
| Two 5/5 Constant Effects | 75 | ≈75.075 | ≈50.05 | 50,050 | 0% |
| Three 5/5 Constant Effects | 150 | ≈150.15 | ≈75.075 | 75,075 | 0% |
| One 5/5, 5-second Target effect | 1 | ≈1.9125 | ≈1.9125 | 1,912 | 70% |

Correction to §27: its **73%** for the Target example used the floored point.
The header declares precise points as the default, so that example is **70%**.
Its effect count matters through accumulated points; `getEnchantItemsCount` is
the number of items (normally one), not the number of effects. Chrome uses
Enchant 300 for the two-Constant case to check the nonzero **54%** result too.
Float arithmetic and truncation are retained: reversing Self/Target can change
the final price, and a nominal 3.825 float cost can truncate to 3,824 gold.
The site still estimates full fatigue for one item; this work does not add an
ammunition batch workflow or address FLOW-01's On Strike item restrictions.

Final verification: `npm test`: **1,033 tests; 1,006 passed, 27 existing TODO,
0 failures**. `npm run build:cloudflare`: **24 pages, passed**. Chrome:
**24/24**, 1366/375 px, Ashfall/Morrowind themes, Vanilla/TR/TR + ARCE,
zero runtime/server errors; screenshots reviewed at desktop and phone widths.
Only isolated local pages/Worker and browser state were used; no accounts or
production writes. The server closed after the matrix. First run on another
checkout: `npm test`, then BROWSER_TESTS' `--suite qa --filter '/enchanting/'`.

Evidence under `A:/Cache/`: `qa01-02-before-fix.log`, `qa01-02-unit-final.log`,
`qa01-02-cloudflare-build-final.log` and `qa01-02-browser-final-20261001/`.

## 33. QA-03/04 Level Health and chart — 1 October 2026

Claimed 19:34 UTC on `launch/character-preservation`; `bb02f56` pushed before
implementation (also publishing the preceding enchanting fix `df261d0`). Main,
production, game data, migrations and repository build configuration are unchanged.

Checked OpenMW **0.51.0** [npcstats.cpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/npcstats.cpp)
(`levelUp`, `updateHealth`) and [mechanicsmanagerimp.cpp](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/mechanicsmanagerimp.cpp)
(`buildPlayer`). `levelUp` adds the post-pick Endurance times
`fLevelUpHealthEndMult` to existing Health as a float. All three staged profiles
provide the float representation of 0.1; the site's default-rule calculation
keeps fractions using Endurance / 10. `updateHealth` floors the creation base
half; the level-up path does not recalculate it. Neither later Strength nor
Bitter Cup changes can retroactively replace that starting Health. The simulator
continues to use its default leveling rules, with the existing modded-save notice.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-03 | Fixed on branch; all 12 build cases show +3.5 for Endurance 35 | `lib/level-math.mjs`, `calculateHealthGain`, floored each gain. Keep the fraction through steps and chart; five gains at 35/40/45/50/55 total 22.5. `lib/character-math.mjs`, `computeSheet`, now fixes creation Health before Bitter Cup. Simulator, About and FAQ explanations remove the floor | Original four QA-03 cases; `test/level-health-preservation.test.js`: five actual steps end at 57.5 from 35, Strength/Cup do not recalculate the base, and creation Health in all profiles; existing malformed/infinite/uncapped Endurance tests updated |
| QA-04 | Fixed on branch; 28/28 Chrome cases overall: 12 build, four Cup, 12 loaded-save | `normalizeCharacterState` treated normalized `attributes`/`skills` as a raw build and recomputed with catalogs; `calculateHealthGrowthCurve` repeated it. Preserve existing values and applied Cup metadata; apply Cup only once. Chart starts from supplied Health/Endurance and marks level 15 from Endurance 30. Keep marker text within the phone chart | Original five QA-04 cases; new state round-trip tests at Health 0/35/67.5, level 12, Endurance 30/95/100 boundaries and unchanged one-step picks; `test/level-simulator-ui.test.js` renders with catalogs; Chrome `--filter '/level-health/'` |

All **9/9** original unmarked QA-03/04 cases failed before the fixes and are now
enforced. Independent Bitter Cup checks isolate a completed one-step forecast:
Personality/Willpower change, picks remain unchanged, and Health is identical.
The browser example stays at **40 → 47 rushed / 46.5 delayed** before and after;
the unit example stays at **35 → 38.5**. If Cup changes Endurance, future gains
change legitimately, while starting Health remains fixed. Three synthetic-save
values (**35, 45, 67.5**) remain the first chart point at the save's level 3.
The historical 58/57 report is not used as a new starting-Health assumption.

Verification: `npm test`: **1,046 tests; 1,028 passed, 18 existing TODO,
0 failures**. `npm run build:cloudflare`: **24 pages, passed**. Chrome:
**28/28**, 1366/375 px, Ashfall/Morrowind themes; build checks in Vanilla/TR/
TR + ARCE, no runtime/server errors. A first screenshot review caught the
level-15 marker clipping on phone; after repositioning it, the full matrix
was repeated with a label-bounds assertion. Screenshots reviewed. Pipeline:
**685 passed** after copying the identical COORDINATION.md; no pipeline code
changed. Only isolated local pages/Worker and synthetic browser state were used;
the local server closed afterward. QA-05 and other open findings remain separate.

Evidence under `A:/Cache/`: `qa03-04-before-fix.log`, `qa03-04-unit-final.log`,
`qa03-04-cloudflare-build-final.log`, `qa03-04-pipeline-tests.log`, and
`qa03-04-browser-final-20261001/`. First command on another checkout: `npm test`,
then BROWSER_TESTS' `--suite qa --filter '/level-health/'`.

## 34. QA-05 character identity labels — 1 October 2026

Claimed 19:50 UTC on `launch/character-preservation`; `da380f4` pushed before
implementation (also publishing the preceding Health fix `4c89666`). Main,
production, datasets, migrations and repository build configuration are unchanged.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-05 | Fixed on branch; both original unmarked tests failed before the fix; 12/12 final Chrome flows | `CharacterProvider::updateField` retained a premade's name after edits; `CharacterSheet`, `characterSummary` and `ProgressionSheet` presented it as a current title. New premades carry optional `premadeSource`, and all three use `characterName`: an edited source reads "Based on …". `computeSheet` omitted gender and selected race/sign display names; staged catalog objects do not have the `name` normalization expected, so `normalizeCharacterState` defaulted to Male Dark Elf / The Lady. Retain identity/class choices and explicit raceName/signName in computed sheets; normalize those labels | `test/qa-hydrated-title.test.js`: hydrateRoot with actual Builder, Home and Simulator components; `test/qa-calculation-reproduction.test.js`: Female Breton / The Tower identity; `test/character-identity.test.js`: seven edited choices, custom/legacy names, invalid markers, build-link/cloud round trips and all-profile progression identities; Chrome `QA-05/title` |

Fresh premades retain their original title until their creation choices change.
New edits keep that title as an explicitly labeled source, with the current
race, gender and birthsign displayed below. Choosing a new premade starts a
new source; custom names remain names. The source marker is optional and
validated against the premade pool, retained in share links, sanitizing and
full build snapshots. Older builds without a marker retain their stored names:
the site cannot infer whether a player entered a name matching a premade.
No stored records were migrated or rewritten. The fixed server/first-client
render remains unchanged; random starts still occur only after hydration.

Chrome matrix: Vanilla/TR/TR + ARCE × 1366/375 px × Ashfall/Morrowind. Fresh
Vanilla/TR starts use the Altmer Atronach Spellweaver, and TR + ARCE uses the
Duadri female Mysticism/Acrobatics premade. Edit to Female Breton / The Tower,
then use the actual header/phone navigation to Home and Level Simulator.
All three headings agree on the source and current identity. Each case checks
first-navigation console hydration messages and heading overflow and saves
three screenshots. Desktop and phone screenshots reviewed; no clipped titles.
Unit cases also keep the disambiguated **Khajiit (Cathay-raht)** label through
sheet normalization and later progression, and preserve custom class choices.

Verification: `npm test`: **1,058 tests; 1,042 passed, 16 existing TODO,
0 failures**. `npm run build:cloudflare`: **24 pages, passed**. Chrome:
**12/12**, zero runtime/server errors. Pipeline: **685 passed** after copying
identical COORDINATION.md; only that document changed in the pipeline. Only an
isolated local Worker and synthetic browser state were used; the server closed
afterward. No account or production writes. QA-06 and other open items remain
separate. Evidence under `A:/Cache/`: `qa05-before-fix.log`, `qa05-unit-final.log`,
`qa05-cloudflare-build-final.log`, `qa05-pipeline-tests.log`, and
`qa05-browser-20261001/`. First command: `npm test`, then BROWSER_TESTS'
`--suite qa --filter 'QA-05/'`.

## 35. Test portability — 1 October 2026

Claimed 20:16 UTC on `launch/character-preservation`; claim `16d27c6` was pushed
before implementation, also publishing checklist priority reordering `9479261`.
Only tests and handoff/verification documents change; no application code, data,
build configuration, main merge or deployment.

The checklist named three passing checks: QA-11's published faction names and
both QA-20 catalog comparisons. Later enforced character/world, sharing,
Enchanting, Health and hydrated-title regressions also read the staged bundle.
An isolated copy of tracked files, with dependencies linked but no game-data
folder, initially reported **37 failures**. Two came from incomplete BestInSlot
fallback UI fixtures; a shared-link UI case passed in isolation and the final
full no-bundle run without changing it. The other failures required catalogs.

`test/helpers/qa-staged-data.cjs` now supplies `staged()` test options. Only a
missing `current.json` skips a catalog-dependent case, with an explicit staging
instruction. Existing TODO metadata remains intact. A present pointer does not
skip malformed JSON, missing manifests/payloads, or corrupt data; other filesystem
errors are rethrown. Pure calculations, synthetic saves, share codecs and
catalog-independent hydration tests continue to run. BestInSlot's existing
synthetic fallback now includes a one-handed weapon type, boots warnings and a
second helmet recommendation, keeping its UI assertions meaningful without data.

`test/qa-staged-data.test.js` adds **4 passing synthetic tests**: missing data
folder/pointer with preserved options; malformed pointer; missing manifest;
and a valid catalog followed by missing/corrupt payloads. Fixtures use the
configured temporary directory and are removed after each test. The real staged
bundle was neither moved nor modified.

Verification:

- **With staged data:** `npm test`: **1,062 tests; 1,046 passed, 16 existing TODO,
  0 skipped, 0 failures**. All three requested catalog checks run and pass.
- **Without staged data:** full `npm test` in `A:/Cache/test-portability-20261001`:
  **1,062 tests; 1,006 passed, 51 skipped, 5 TODO, 0 failures**. These skips include
  six existing skip cases and eleven catalog-dependent TODO cases; those TODOs
  are still present and run when data is staged.
- **Pipeline:** **685 passed**, after synchronizing the identical COORDINATION.md;
  only that document changes in the pipeline. UI_TRANSFORMATION.md remains identical.

No browser/build run is needed for these test-only changes. QA findings remain
open independently; **QA-10** is the next unfinished priority, then **QA-16**.
Evidence: `A:/Cache/test-portability-before.log`, `test-portability-helper.log`,
`test-portability-without-bundle.log`, `test-portability-staged.log`, and
`test-portability-pipeline.log`. First command on another checkout: `npm test`;
run `npm run data:stage` when catalog acceptance is needed.

## 36. QA-10 beast equipment eligibility — 1 October 2026

Claimed 20:28 UTC on `launch/character-preservation`; claim `3c734a5` was pushed
before implementation. Main, production, datasets, migrations and repository
build configuration are unchanged.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-10 | Fixed on branch; original browser reproduced 12/12, final expanded matrix passes 28/28 | `lib/best-in-slot.mjs`, `resolveBestInSlotPicks`: named/fallback records bypassed the dynamic scorer's beast check, and weapon preferences restored original armor slots. Filter every final primary and runner-up after those paths: explicit wearable flag, no footwear, and no closed-head body parts from Armor. Respect Races' boolean `beast` instead of overriding an explicit false with the race name. Carry the flag through `recommendedLoadouts`, `validateSlotEquip`/`equipItem`, Builder, Equipment Studio, ledger and picker | Three original catalog cases now unmarked; `test/beast-recommendations.test.js` has 14 cases; `test/equipment-studio-ui.test.js` adds three actual inspector/picker interactions; Chrome `--suite qa --filter 'QA-10/'` |

All **3/3 original unmarked catalog cases failed before the fix**. Combined with
the first synthetic path/edge tests, the corrected baseline was **12 failures,
3 passing dynamic-path controls out of 15**. The initial synthetic weapon fixture
needed its WEAP record type before that baseline; no production code was changed
to accommodate it. The named, dynamic and closest-premade paths now share the
final gate, including no weapon preference, one-handed and two-handed modes.
Eligible open helmets remain; filtering retains ranking order without mutating
catalogs. Missing item metadata, null picks, absent wearable flags and flags
contradicted by closed-head body parts/footwear cannot leak into a beast's kit.

Races' published flags distinguish **Cathay-raht/Naga (beasts)** from
**Khajiit (Suthay) (not a beast)**. The latter keeps eligible boots and helmets,
and the inspector/picker must not call them restricted merely because its name
contains Khajiit. An optional boolean is passed through equip validation; legacy
callers without one retain race-name inference. This is session/catalog context,
not a new stored-build field. No catalog, extraction or data-schema change.

Browser matrix: 1366/375 px × Ashfall/Morrowind × seven profile/race cases:
Vanilla Argonian, Khajiit and High Elf; TR Argonian; TR + ARCE Cathay-raht,
Naga and Suthay. Each of **28 cases** checks both weapon preferences (**56 kit
states**), opens every real runner-up control, then equips the late-game kit
(**28 transfers**). The old runner looked for "Show alternatives", while the
actual control says "View … runner-up picks"; that selector is corrected and
asserted. An initial expanded run passed 24/28: the Suthay control incorrectly
required Boots of Blinding Speed, while its valid catalog recommendation was
Honor's March. After changing that expectation to catalog footwear, the final
full run passes **28/28**, with **zero runtime/server errors** and **84 screenshots**.
Desktop/phone screenshots reviewed; the existing phone table word-breaking
finding remains **QA-08**, outside this eligibility fix.

Verification before committing:

- `npm test`: **1,079 tests; 1,066 passed, 13 existing TODO, 0 failures**.
- No-bundle full suite: **1,079 tests; 1,022 passed, 52 skipped, 5 TODO,
  0 failures**. New synthetic cases run; the real catalog matrix skips explicitly.
- `npm run build:cloudflare`: **24 pages, passed**, with config unchanged.
- Pipeline: **685 passed**, after copying identical COORDINATION.md;
  only that document changes there. UI_TRANSFORMATION.md remains identical.

Both player changelogs and BROWSER_TESTS are updated. This checkout already had
a dev server on **http://127.0.0.1:8794**; it was reused and left running, without
stopping another session. No account or production writes. **QA-16** is the next
unfinished priority, then **QA-07 + QA-25**. Evidence under `A:/Cache/`:
`qa10-before-fix-final.log`, `qa10-browser-before/`, `qa10-unit-final.log`,
`qa10-without-bundle.log`, `qa10-build-final.log`, `qa10-pipeline.log`, and
`qa10-browser-verified/`. First command: `npm test`, then BROWSER_TESTS'
`--suite qa --filter 'QA-10/'`.

## 37. QA-08 phone gear tables — 1 October 2026

Claimed 20:51 UTC on `launch/character-preservation`; claim `e3bade4` was pushed
before implementation, after pushing QA-10 in both repositories. The owner
requested QA-08 ahead of QA-16. Main and production are unchanged.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-08 | Fixed on branch; baseline reproduces 8/8, final matrix passes 36/36 | `gear-sources.jsx` `SourceRow`, `best-in-slot-view.jsx` `BisPickRow`, and `app/globals.css`: three narrow phone columns inherit mid-word wrapping. At up to 640 px, stack slot, item and source in each row, including alternatives; retain whole words and add a visible source label. Desktop retains columns; native table headings, column scopes and accessible names remain | Six enforced cases in `test/qa-layout.browser.cjs`, fed by Chrome `--suite qa --filter 'QA-08'` |

The original four browser-report tests all failed with TODO marks removed before
the fix. Names such as Dandera and Pelagiad broke across lines in both Early and
Late tables at 375/390 px in both themes. The expanded checks now inspect every
visible cell, including item names, group headings, acquisition notes and opened
runner-ups; they check whole words, text bounds, table bounds and row layout.
Source labels must appear on phones, and desktop rows must remain columns.
Chrome's accessibility tree must retain each named native table.

Final matrix: Early/Late × Vanilla/TR/TR + ARCE × 375/390/1366 px ×
Ashfall/Morrowind. A fixed build keeps the comparisons reproducible; every real
runner-up control is opened. **36/36 cases pass**, measuring **1,374 rows across
the matrix**, with **0 runtime errors**, **0 server errors** and **54 screenshots**.
Early/Late, runner-up and desktop captures were visually reviewed.

Verification before committing:

- `npm test`: **1,079 tests; 1,066 passed, 13 existing TODO, 0 failures**.
- Browser-report assertions: **6 passed, 0 TODO, 0 failures**.
- `npm run build:cloudflare`: **24 pages, passed**, with config unchanged.
- Pipeline: **685 passed**; only COORDINATION.md changes there. Both copies of
  COORDINATION.md and UI_TRANSFORMATION.md remain identical.

Both player changelogs and BROWSER_TESTS are updated. No ranking, calculation,
data, exported schema, account, migration or deployment change. **QA-09 popovers
remain open**; next priority is **QA-16**, then **QA-07 + QA-25**, after owner
go-ahead. The existing dev server at **http://127.0.0.1:8794** stays running.
Evidence under `A:/Cache/`: `qa08-browser-before/`, `qa08-wrapper-before.log`,
`qa08-browser-after/`, `qa08-wrapper-final.log`, `qa08-unit-final.log`,
`qa08-build-final.log` and `qa08-pipeline.log`. First command: `npm test`, then
BROWSER_TESTS' QA-08 runner and report-wrapper commands.

## 38. QA-09 Configure explanations — 1 October 2026

Claimed 21:10 UTC on `launch/character-preservation`; claim `7cd2ed9` was pushed
before implementation. Main and production are unchanged.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-09 | Fixed on branch; initial centered-pointer run reproduces 16/20; final 30/30 mouse and 30/30 touch | `configurator.jsx`, `InfoTip`: fixed-width absolute boxes always opened below/right, with no screen or navigation bounds. A body portal clamps fixed coordinates to the visual viewport, header and phone tab bar; flip above when needed, constrain long text with internal scrolling, reposition on resize/page scroll/font load | Eight cases in `test/configuration-info-tip.test.js`; five original report tests in `test/qa-layout.browser.cjs` now enforced; Chrome `--suite qa --filter 'QA-09'`, repeated with `--touch` |

The original report wrapper passed Race and failed the other four tests without
TODO marks. Centering the trigger did not reproduce Race's bottom overlap;
the new bottom-edge component test failed on the old code and now passes.
The corrected component harness produced eight pre-fix failures. It covers
right/bottom edges, long text in a 320 px-high viewport, offset visual viewport,
resize, off-screen anchors, updated text, dismissal and clean hydration.

Each final browser case opens the explanation normally and near the bottom at
360 px height, resizes to 420 px, scrolls while open, opens by Enter and closes
by Escape from the explanation with focus restored, and checks outside dismissal.
The pointer/touch toggle must close it as well. Boxes clear both visible navigation
bars. Five controls × 375/390/1366 px × two themes, repeated with real CDP touch:
**60/60 cases, 360 placement measurements, zero runtime/server errors**.
The first expanded run lacked Enter's CDP character input; using the existing
runner's Enter pattern corrected that test input. Final mouse/touch reports each
pass all five enforced wrapper tests. **120 screenshots**; phone, bottom-edge,
touch and desktop captures reviewed. Focusable explanations keep trigger/control
linkage and stable hydration IDs; internal scrolling does not reset itself.

Verification before committing: `npm test` **1,087 tests, 1,074 passed, 13 existing
TODO, 0 failures**; release build **24 pages passed** with config unchanged;
pipeline **685 passed** after syncing identical COORDINATION.md. Only that
document changes in the pipeline; UI_TRANSFORMATION.md remains identical.
Both player changelogs and BROWSER_TESTS are updated. No game-data, ranking,
schema, migration, account or deployment changes. Existing server **8794** stays
running. Evidence in `A:/Cache/`: `qa09-browser-before/`, `qa09-wrapper-before.log`,
`qa09-component-before.log`, `qa09-unit-final.log`, `qa09-build-final.log`,
`qa09-pipeline.log`, `qa09-browser-verified/`, `qa09-touch-verified/`, and
`qa09-wrapper-{mouse,touch}.log`. First command: `npm test`, then BROWSER_TESTS'
QA-09 commands. Next authorized items: QA-16, QA-07/25, QA-06 and QA-05 recheck.

## 39. QA-16 Ebonheart to Mournhold — 1 October 2026

Claimed 21:38 UTC on `launch/character-preservation`, claim `d3f4dc3`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-16 | Fixed on branch; baseline 24/24 reproduced, final 24/24 pass | `travel-stops.mjs`, `buildTransitStops`/`transitEndpointStops`: the Teleports catalog contains the Royal Palace landing, but Travel metadata has no node for that room, so the Mournhold city choice cannot reach it. Missing interior metadata now uses the published Places name, with the cell-name fallback; its comma-separated town prefix supplies a case-insensitive boundary alias | Three original catalog cases enforced; six synthetic cases in `test/teleport-stop-aliases.test.js`; Chrome `--suite qa --filter 'QA-16'` |

`mhtransportscript` is everyday dialogue from Ebonheart's Grand Council Chambers
to Mournhold's Royal Palace Reception Area. `usableTeleport` and `addTeleports`
already retained it; no teleport policy change. Keep full room labels and exact
stop IDs. Explicit node metadata wins. Exterior positions remain separate and
aliases create no free graph edges; quest and item restrictions still apply.
No bundle rebuild or schema change; the workstation passes its existing Places
catalog to the stop builder. All three original catalog cases failed unmarked
before the fix. New tests cover four route objectives, absent/malformed/frozen
Places, case, metadata priority, separate rooms and quest/held-item gates.

Final matrix: three worlds × walking on/off × 1366/375 px × both themes:
**24/24 passed**, with **24 screenshots**, **zero runtime/server errors**.
Verification: `npm test` **1,093 tests, 1,083 passed, 10 remaining TODO, 0 failures**;
release build **24 pages passed**, config unchanged; pipeline **685 passed**.
Both changelogs and BROWSER_TESTS updated; shared coordination/roadmap copies
remain identical. Main, production, migrations and account data are unchanged.
The existing dev server at 8794 remains running. Evidence in `A:/Cache/`:
`qa16-before-tests.log`, `qa16-browser-before/`, `qa16-targeted.log`,
`qa16-unit-final.log`, `qa16-build-final.log`, `qa16-browser-verified/`,
`qa16-pipeline.log`. First command: `npm test`, then the QA-16 Chrome case.
Next authorized work is QA-07/25, QA-06 and the QA-05 regression recheck.

## 40. QA-07/25 Travel search and link precedence — 1 October 2026

Claimed 21:54 UTC on `launch/character-preservation`, claim `e8d72e2`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-07 | Fixed on branch; original spelling tests 3/3 failed, final Chrome 12/12 pass | `travel-search.mjs` searchTravelOptions and `travel-walk.mjs` matchPlaces compared punctuation literally; shared search-only normalization preserves canonical IDs. TravelLocationPicker now reports draft state so TravelWorkstation hides the previous dossier/map until selection or cancellation | Three original tests enforced, three frozen/null/specific-room spelling cases and three draft lifecycle cases; Chrome QA-07 |
| QA-25 | Fixed on branch; original hydrated save test failed, final Chrome 12/12 pass | TravelWorkstation save-origin effect replaced the link marker with the restored save's token. Capture the initial explicit from before the URL writer fills defaults and preserve it through that first restoration | Original hydrateRoot test enforced; missing-from, destination-only and plan-only controls; later imported save updates origin; Chrome QA-25 |

Desktop/phone screenshots reviewed. Both browser matrices have zero runtime or
server errors. The first QA-25 runner attempt used an unavailable readiness helper;
replaced it with the network-status predicate, then all 12 passed. Synthetic saves
match the selected profiles; no account writes, data rebuild or production changes.
Full suite: **1,102 tests, 1,096 passed, 6 remaining TODO, 0 failures**. Release
build: **24 pages passed**, config unchanged. Pipeline: **685 passed** after
copying identical coordination. Both changelogs updated. Existing server 8794
stays running. Evidence: `A:/Cache/qa07-browser-final/`, `qa25-browser-verified/`,
`qa07-25-unit.log`, `qa07-25-build.log` and `qa07-25-pipeline.log`.
Next authorized work: QA-06, then recheck completed QA-05.

## 41. QA-06 obtainable Alchemy apparatus — 1 October 2026

Claimed 22:04 UTC on `launch/character-preservation`, claim `cb15b35`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-06 | Fixed on branch; original staged tests 2/2 failed, final Chrome 12/12 pass (48 selectors) | `lib/alchemy-catalogs.mjs`, adaptAlchemy filtered only leading apparatus_sm_ keys and unspaced Secretmaster names. Match the key segment after a mod prefix and spaced names, including apostrophes, without matching incidental name fragments | Both original catalog cases enforced; five synthetic adapter edge cases; Chrome QA-06 |

The staged TR and TR + ARCE leaks were `tr_m7_apparatus_sm_alembic_02`,
`tr_m7_apparatus_sm_calcin_02` and `tr_m7_apparatus_sm_retort_02`, named Secret
Master's Alembic/Calcinator/Retort (the UI adds 2x quality). No catalog edits:
source records and provenance remain intact. Ordinary Master/Grandmaster tools
remain, with effectiveness descending and stable name/ID ties. All four types,
renamed tools and frozen inputs have synthetic coverage.

Chrome: three worlds × 1366/375 × both themes, **12/12 passed**, 12 screenshots,
zero runtime/server errors; desktop/phone reviewed. Full suite: **1,107 tests,
1,103 passed, 4 remaining TODO, 0 failures**. Release build: **24 pages passed**,
config unchanged. Pipeline: **685 passed** after identical coordination sync.
Preserved the concurrent Morrowind theme coordination entry added by another
session. Both changelogs updated. No data rebuild, schema, migration, account or
production change. Existing server 8794 stays running. Evidence:
`A:/Cache/qa06-browser-final/`, `qa06-unit.log`, `qa06-build.log`,
`qa06-pipeline.log`. Next: QA-05 regression recheck (already fixed in §34).

## 42. QA-05 identity regression recheck — 1 October 2026

Recheck claimed 22:08 UTC on `launch/character-preservation`, claim `d041fe9`.
Implementation already fixed in `fdb9c9c` (§34); no further application changes.

| Item | Result / rate | Cause / runner change | Enforced tests |
| --- | --- | --- | --- |
| QA-05 | Existing fix passes the current branch: Chrome 12/12, all three views in each case | Keep computeSheet identity fields and characterName's premade-source label from §34. The browser case now uses a real random start and always changes race/sign; it waits for first-visit initialization and excludes Next dev's toolbar | 33 identity, hydrateRoot and first-visit tests passed, plus the original Simulator identity case; Chrome QA-05 |

Before correction, a global Math.random=0 override allowed the click to reach
Configure but its React handler did not change the tab. Native randomness passed.
The next phone setup clicked Next's dev indicator instead of Home; the captured
screenshot showed its open menu covering the tab. Hide only nextjs-portal in
this test, then the isolated phone case passed in six seconds. No production UI
change. Interrupted long retrying runners and their isolated Chrome processes
were stopped; the final matrix used an enforced **60-second overall timeout**.
After the interrupted server stopped, restored dev port **8794** and reran.

Final Chrome: **12/12 passed in 51 seconds** (three worlds × 1366/375 × both themes), **36
screenshots**, zero runtime/server errors or hydration warnings. Edited race,
gender and birthsign agree across Builder, Home and Simulator; titles retain
"Based on" and headings do not overflow. Phone/desktop captures reviewed.
Full suite before commit: **1,107 tests, 1,103 passed, 4 remaining TODO, 0 failures**.
Release build remains §41's **24 pages passed**: no application/config change in
this recheck. Pipeline: **685 passed** after syncing identical coordination.
Both player changelogs already contain the QA-05 fix; no duplicate release entry.
Evidence: `A:/Cache/qa05-recheck-final-verified/`, `qa05-phone-bounded/`,
`qa05-recheck-hydration.log`, `qa05-recheck-unit-final.log`, and
`qa05-recheck-pipeline.log`. All work in the authorized batch is complete locally;
no push, merge, deployment, account write or dataset rebuild. Server 8794 stays
available. First command: `npm test`, then BROWSER_TESTS' QA-05 filter.

## 43. QA-12 premade explanations — 1 October 2026

Claimed 22:38 UTC on `launch/character-preservation`, claim `605501a`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-12 | Fixed on branch; original unmarked test failed, final Chrome 12/12 pass | PremadeBrowser had no playstyle/trade-off copy and abbreviated/clamped skill labels. Add concise copy per playstyle, race-mode copy using the first Major skill, full labels and specialization explanation | Original copy assertion enforced; nine new component/copy cases in premade-copy.test.js; Chrome QA-12 |

This is presentation only: premade stats, pools, save/link fields and selection
callbacks remain unchanged. All 41 playstyle builds, 20 base race builds and
42 additional ARCE race builds have both explanations. Missing/unknown copy uses
a generic fallback; frozen records stay unchanged. The browser matrix covers
both grouping modes in three worlds at desktop/phone widths and both themes,
**12/12 passed / 24 groups**, 24 screenshots, zero runtime/server errors.
Phone and desktop captures reviewed. Full suite: **1,116 tests, 1,113 passed,
3 remaining TODO, 0 failures**. Release build: **24 pages passed**, config
unchanged. Pipeline: **685 passed** after identical coordination sync. Both
player changelogs updated. Evidence: `A:/Cache/qa12-browser-verified/`,
`qa12-phone-first/`, `qa12-unit.log`, `qa12-build.log`, `qa12-pipeline.log`.
No dataset rebuild, migration, account write or deployment. Server 8794 remains
available. Next authorized work: QA-11, then QA-15; push after each item.

## 44. QA-11 faction names and deprecated entries — 1 October 2026

Claimed 22:45 UTC on `launch/character-preservation`, claim `b778518`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-11 | Fixed on branch; both original unmarked tests failed, final Chrome 12/12 pass | FactionRoster and JournalFactionsRoot displayed all records; FactionDetailView title-cased raw reaction IDs. faction-display.mjs filters deprecated display records and resolves case-insensitive published names; the detail receives the full catalog | Both original cases enforced; six new display/integration cases in faction-display.test.js; Chrome QA-11 |

The catalog already provides Cyrodiil Fighters Guild (`t_cyr_fightersguild`),
Imperial Archaeological Society (`t_glb_archaeologicalsociety`) and East Navy
(`t_mw_imperialnavy`). No pipeline request or rebuild is needed. Vanilla keeps
29 displayed factions; TR and TR + ARCE show 91 of 103, hiding 12 deprecated
records. Saved memberships, source records and numeric relations stay intact.
The visible membership count excludes hidden records. Unknown internal IDs use
Unknown faction; ordinary human-readable fallback names remain available.

Chrome: three worlds × 1366/375 × both themes, **12/12 passed**, 28 screenshots,
zero runtime/server errors. Each reported name is checked against the staged
catalog and scrolled into view for its capture; phone and desktop reviewed.
The initial phone assertion overlooked uppercase CSS in innerText; the runner
now waits for the loaded badge and reads textContent. Full suite: **1,122 tests,
1,121 passed, 1 remaining TODO, 0 failures**. Release build: **24 pages passed**,
configuration unchanged. Pipeline: **685 passed** after identical coordination
sync. Both player changelogs updated. Evidence: `A:/Cache/qa11-browser-verified/`,
`qa11-phone-verified/`, `qa11-unit.log`, `qa11-build.log`, `qa11-pipeline.log`.
No dataset, schema, migration, account or production change. Server 8794 remains
available. Next authorized work: QA-15, after this item's push.

## 45. QA-15 About attribution and licence — 1 October 2026

Claimed 22:58 UTC on `launch/character-preservation`, claim `65fa0bf`.

| Item | Result / rate | Cause (file/function) and change | Enforced tests |
| --- | --- | --- | --- |
| QA-15 | Fixed on branch; original unmarked test failed, final Chrome 4/4 pass | AboutView's Colophon omitted the author, code licence and repository link. Add LowGraph attribution, AGPL-3.0-or-later for the code and the GitHub link; distinguish game/mod-data, font and branding rights | Original About case enforced and strengthened in qa-copy-reproduction.test.js; license.test.js covers the actual view; unchanged site-claims tests; Chrome QA-15 |

The AI-assistance paragraph and Pelagiad's SIL Open Font License 1.1 credit stay
unchanged. The code licence does not cover Bethesda or community game/mod data;
the name, logo and social card image remain unlicensed for reuse. The repository
link opens with noopener/noreferrer. No README, LICENSE or package changes.
Chrome: 1366/375 px × both themes, **4/4 passed**, four screenshots, zero runtime
or server errors and no page overflow. Phone/desktop captures reviewed.

Full site suite: **1,122 passed, 0 failures, 0 remaining TODO**. Focused copy,
claim and licence checks: **12/12 passed**, including all three licence checks.
Release build: **24 pages passed**, configuration unchanged. Pipeline: **685
passed** after identical coordination sync. Both player changelogs updated.
Evidence: `A:/Cache/qa15-browser-final/`, `qa15-before.log`, `qa15-unit.log`,
`qa15-build.log`, `qa15-pipeline.log`. All authorized QA-12/11/15 items are
complete on this branch, pushed separately. No merge, deployment, dataset,
migration or account change. Server 8794 remains available. First command:
`npm test`, then the documented QA browser filters; freeze acceptance and
release preparation remain a separate step against the final build.

## 46. Character-preservation branch merge — 1 October 2026

Owner-authorized no-ff merge of `launch/character-preservation` (`c065581`) into
clean main (`4f9c4bb`) in `A:/Claude/mt-signout-main-merge`. Fresh fetch and
merge-tree preview found no conflicts. Verification below used the actual
uncommitted merged checkout, staged bundle `a29adea046e6086c2c7ee654`, dev server
8798 and the built local Worker; the production table and release history remain
unchanged. This integrates test portability, QA-21/23/22, QA-01/02/03/04/05/06/07,
QA-08/09/10/11/12/15/16/25, retaining main's earlier QA-24 merge and README update.

| Check | Result |
| --- | --- |
| `npm test` | **1,122 passed, 0 failed, 0 TODO**, including licence and hydrated character/world tests |
| `npm run build:cloudflare` | **24 pages generated**, repository configuration unchanged |
| Chrome page matrix | **96/96 passed**, all 16 views × three worlds × 1366/375; both themes per case, including axe and overflow checks |
| Chrome QA regressions | **270/270 distinct cases passed**, all documented QA targets; phone tables/popovers also at 390 px |
| Synthetic local Worker/Vault | **32/32 passed**: QA-21/23 character preservation 16, QA-21/22 save shares 8, QA-24 sign-out 8; 1366/375 in both themes |
| Browser layout evidence wrapper | **11/11 passed** against consolidated current QA reports |
| Pipeline | **685 passed** after identical coordination sync |

All completed browser reports have zero runtime/server errors. Reviewed phone
Health/faction and desktop Loadouts/About captures. No application resolution or
new fix was needed; branch code merged unchanged. Checklist records the original
implementation commits and integration in this merge, without deployment claims.
Both changelogs retain the existing player entries; shared coordination records
the main handoff. README, LICENSE, package files, configs, bundle and migrations
are unchanged relative to pre-merge main.

The first broad Vanilla matrix hit its 60-second limit while opening Loadouts;
the isolated case and the final 32-case matrix passed. The combined QA run hit
its five-minute limit before completion, without assertion failures. Replaced it
with focused groups and split the intensive gear check by race: all 270 cases
have completed reports. TR + ARCE matrix and sign-out wrappers reached their
shutdown deadline after writing fully passing reports; those reports are checked
explicitly. No timed-out/incomplete QA run is included in the 270 count. Temporary
orchestration stopped each isolated runner after its completed report or deadline;
no repository runner or application patch was introduced.

Evidence: `A:/Cache/qa-main-merge-unit.log`, `qa-main-merge-build.log`,
`qa-main-merge-qa-report.json`, `qa-main-merge-browser-batch.json`,
`qa-main-merge-beast-batch.json`, the three `qa-main-merge-matrix-*` reports,
`qa-main-merge-character/`, `qa-main-merge-vault-shares/`,
`qa-main-merge-signout/`, and `qa-main-merge-pipeline.log`.
No deployment, real-account write, production migration or data rebuild.
Freeze-day hydration, physical-device and real-provider sign-in acceptance remain
separate. First command: `npm test`, then the documented browser/Vault runners.

## 47. Morrowind game theme merge — 1 October 2026

Owner-authorized no-ff merge of `origin/design/morrowind-game-theme` (`d85a931`)
into clean main (`c3e740b`) in `A:/Claude/mt-signout-main-merge`. Fetch and
merge-tree preview found three documentation/changelog conflicts. Kept main's
QA records and both sets of 1 October changelog entries. Application files merged
without conflicts; no additional application fix was introduced. The theme spec
now records implementation, the checklist records integration, and the existing
single DESIGN coordination entry records the main handoff.

Verification used the actual merged checkout, bundle `a29adea046e6086c2c7ee654`,
dev server 8798 and a fresh built local Worker on 8797. The Modern UI baseline
was the prior QA checkout on 8794, whose application matches pre-merge main.
Production state and release history remain unchanged.

| Check | Result |
| --- | --- |
| `npm test` | **1,130 passed, 0 failed, 0 TODO**, including eight new theme checks and the licence/character-preservation tests |
| `npm run build:cloudflare` | **24 pages generated**, repository configuration unchanged |
| Chrome page matrix | **96/96 passed**, 16 views × three worlds × 1366/375; both themes per case, with axe and overflow checks |
| Chrome QA regressions | **102/102 passed**: phone gear tables 36, Configure popovers 30, character identity 12, Enchanting calculations 24; gear/popovers also at 390 px |
| Chrome tool interactions | **50/50 passed**: reverse Alchemy and ingredient sources 24, loading/failure/retry 2, Faction Journal/Level Simulator 12, tool inputs/sharing/navigation 12 |
| Synthetic local Worker/Vault | **10/10 passed**, including save lifecycle, ownership, quotas and signed-in Vault/account axe at 1366/375 in both themes |
| Modern UI comparison | **30/30 passed**, all 15 routes at 1366/375; zero changed pixels outside the excluded theme-toggle capture region and intentional changelog entry |
| Keyboard focus | Account and Vault at both widths: five successive keyboard stops each retain a visible outline of at least 2 px in Morrowind UI |
| Pipeline | **685 passed** after identical coordination sync; roadmap already identical |

The **258 completed browser cases** have zero runtime/server errors and no
captured React hydration warning. Full-page captures use the same fixed character
on both checkouts. The comparison hides the Next.js dev toolbar, disables
animation/carets, excludes the theme-toggle paint region (24 px around its measured
box), and removes only the newly added theme changelog line from the comparison
DOM. The ordinary page matrix captures that line unchanged. Inspected the new
Home stats window beside the approved mockup and the phone calculator layout.

The spec's broad colour heuristic still flags semantic green status/skill
indicators, red hostile-faction badges and the tan Health-chart legend. These
are existing status/chart elements, not brown window panels; preserved their
meaning and recorded their computed colours in the visual report. This replaces
the branch's older blanket claim of zero heuristic matches on every route.

The first combined Alchemy and tool-sharing groups reached their 90-second bounds
without an assertion failure. Split them by interaction/world; every case then
completed. Incomplete runs are excluded from the count. The temporary screenshot
script also needed corrections for legal pages without a theme toggle and its
comparison variables; these were capture-harness errors, with no application
patch. Final aggregate assertions pass. Temporary capture/orchestration scripts
are removed after verification; reports, screenshots and logs stay in the cache.

Evidence: `A:/Cache/theme-main-merge-unit.log`, `theme-main-merge-build.log`,
`theme-merge-verification.json`, `theme-merge-browser*-batch.json`,
`theme-merge-browser*/`, `theme-merge-visual-*/`, `theme-merge-vault/`, and
`theme-merge-pipeline.log`. Shared coordination is synchronized to the pipeline;
README, licence, package/config files, bundle and migrations are unchanged.
No deployment, production write, real-account change or data rebuild. Freeze-day
acceptance remains separate. First command: `npm test`, then BROWSER_TESTS.md's
Chrome matrix, QA-08/09 and local Vault suites against the final release checkout.

## 48. Recovery record before the QA/theme release — 1 October locally

Owner authorized recording recovery information, then deploying **`6fab4c5`**.
This record is written before deployment. Recovery information was captured on
**2026-10-02 00:08 UTC** (1 October, 21:08 in São Paulo).

| Item | Pre-release value |
| --- | --- |
| Release source | `6fab4c54af827965387ce336885907664deeff14`, clean detached checkout `A:/Claude/mt-release-6fab4c5` |
| Active Worker / selected code rollback | **`3879ce7b-c397-4698-83c4-e9d185d9ed5c`**, 100% traffic, tagged `ef67b3e` |
| Rollback source commit | **`ef67b3eae60360259435cc99181585c5d99e030d`**, confirmed by the version's release message |
| Active deployment | `9d1a4f0c-a737-446d-adfa-6595620c33e7`, created 2026-10-01 05:22:43 UTC |
| Worker / account | `plain-disk-78e6` / `4653c1ab885ae65ebea83b3804643010` |
| D1 | `141a1409-3956-4267-a078-02483bbb2bf6`, production backend, nine tables, 155,648 bytes |
| Applied migrations | **0001–0007**, names read directly; none pending; query wrote zero rows |
| Fresh database recovery bookmark | **`0000006d-00000000-000050f8-1d7bc74cdeb236e19f0c9943a3fe9824`** |
| Bundle retained by both releases | `a29adea046e6086c2c7ee654`, snapshot `1613a1123ed9f5102fa3b266df33a4820d0128e9a9bdf680b8b7a1b40296fd1f` |

**Code-only rollback:** switch the Worker to the selected version above. This
restores the preceding code and assets, dropping this QA/theme release while
retaining CALC-4 and the earlier Travel work. No migration is part of this release;
there is no database restore or schema rollback in the code-recovery procedure.
Existing database writes, migrations and Clerk accounts remain intact. The D1
bookmark is recovery information for a separate data incident, not an instruction
to restore the database. No full private-data SQL export was needed for this release.

Reviewed incident command, **not executed**:

```powershell
node node_modules/wrangler/bin/wrangler.js rollback 3879ce7b-c397-4698-83c4-e9d185d9ed5c --message 'Rollback QA/theme release to ef67b3e'
```

Fresh tests from the pinned checkout: **1,130 passed, no failures/skips/TODO**.
Production build: **24 pages**, existing live Clerk publishable key; no test key.
Wrangler 4.134.0 `deploy --dry-run --keep-vars` passed with the unchanged D1 binding,
routes and configuration. The isolated checkout initially used a dependency
junction that Turbopack rejected; replaced only that ignored link with a copy of
the existing dependencies. The successful build changes no tracked file.

Wrangler's D1 metadata/bookmark reads returned authentication error 10000; the
authenticated Cloudflare connector retrieved and verified the same production
UUID and fresh bookmark. Wrangler's migration list and read-only migration-name
query succeeded. Saved recovery metadata, current pointer/manifest and release
logs under `A:/Cache/deploy-6fab4c5-20261001/`, outside Git/public assets. This
record does not claim a deployment; the completed release is recorded separately.

## 49. QA fixes and Morrowind theme deployed — 1 October locally

Owner-authorized release **`6fab4c54af827965387ce336885907664deeff14`** is live
as Worker **`e29663d3-68eb-45ff-bbef-13447c3b0cbf`**, tagged `6fab4c5`, at
**100% traffic**. Deployment `609140d4-fc59-45e4-a357-d3e15d92041b` was created
**2026-10-02 00:13:37 UTC** (1 October, 21:13 in São Paulo). This publishes the
QA implementation batch and the Morrowind theme from the merged main checkout.

Recovery information in §48 was committed and pushed as **`7c08d3f` before
deployment**. Selected code rollback is **`3879ce7b` / `ef67b3e`**; the fresh D1
bookmark is **`0000006d-00000000-000050f8-1d7bc74cdeb236e19f0c9943a3fe9824`**.
Rolling back this release means switching the Worker version. No migration,
database restore or Clerk-account change is involved.

Built and deployed the clean detached `6fab4c5` checkout, with the existing staged
bundle, production Clerk publishable key and unchanged repository configuration.
Wrangler used `--keep-vars`; existing bindings and domains remain. Uploaded 70
changed assets; 1,681 were already uploaded. Deployment history and the version's
source message confirm the released commit. Final documentation is recorded on
main separately and does not trigger another deployment.

| Check | Result |
| --- | --- |
| Pinned release `npm test` | **1,130 passed, 0 failed, 0 skipped, 0 TODO** |
| Final main documentation `npm test` | **1,130 passed, 0 failed, 0 skipped, 0 TODO**, including licence and site-claim checks |
| `npm run build:cloudflare` | **24 pages generated**, unchanged configuration; production Clerk key |
| Wrangler dry run | Passed before publishing; version 4.134.0, existing D1 binding and routes |
| Live HTTP checks | **30/30 passed**: 15 pages, security headers, four signed-out API GETs, the www redirect with world query, built CSS/JS, bundle/manifest, theme textures and IngredientSources hashes |
| Live Chrome QA regression suite | **270/270 passed**: Enchanting, Health, character titles, apparatus, Travel search/link precedence, Mournhold, faction/premade/About copy, share links, catalog checks, phone tables/popovers and beast-race gear |
| Live touch checks | **31/31 passed** at 375 px with actual CDP touch input and confirmed coarse pointer: shortcut hints, navigation/search, five popovers, ingredient/reverse picker and **20 saved-Travel edit/store/navigate/restore repetitions** |
| Live first-navigation hydration | **120/120 passed** on Home and Builder: fresh starts repeated ten times per route/width/theme, stored TR + ARCE, loaded save, build links with/without world and challenge links; console capture enabled before navigation |
| Pipeline | **685 tests passed** before pushing `6372e65`; shared COORDINATION and UI_TRANSFORMATION are byte-identical in both repositories |

The **421 completed live browser cases are unique**, with **zero assertion,
runtime or server failures**. QA and hydration cases cover both themes at 1366
and 375 px; the gear tables and Configure popovers also cover 390 px. Hydration
checks captured no React mismatch warning or uncaught exception. Fresh Chrome
profiles are signed out; synthetic saves stay in browser localStorage. Production
browser requests are guarded against API writes. The four signed-out API GETs
returned **401**, without account data or Set-Cookie.

The initial 20-repeat Travel touch group reached its 90-second bound after 15
passes, with no assertion failure. Excluded that incomplete group and reran all
20 repetitions in smaller bounded groups using the unchanged runner. All completed;
the aggregate checks reject duplicate cases and verify the expected counts.

No production API write, real-account test, private-data export, extraction or
catalog rebuild was performed. Bundle `a29adea046e6086c2c7ee654` and migrations
0001–0007 are unchanged; none is pending. The synthetic signed-in Worker/Vault
suite had already passed **10/10** against the merged build (§47); this release's
live checks do not claim a new real Clerk sign-in test.

Freeze acceptance remains open. Its full all-route hydration matrix, expected-404
policy, physical-phone/touchscreen-laptop checks and real provider session checks
remain separate. CDP's mobile touch setup does not establish a device with touch
and a fine pointer. No monitoring automation or later deployment was scheduled.

Evidence: `A:/Cache/deploy-6fab4c5-20261001/`: recovery metadata and selected bundle,
`unit.log`, `final-docs-unit.log`, `build-final.log`, `dry-run.log`, `deploy.log`,
deployment/version records, `live-http.json`, `live-browser-summary.json`, both
browser batch reports, per-case reports/screenshots and `pipeline.log`. Temporary
capture/orchestration scripts are removed; evidence and recovery records remain.
First command for the next agent: `npm test`, then BROWSER_TESTS.md's read-only
browser checks against `https://siltstrider.tools`; use the full freeze matrix at
the release cut.

## 50. Signed-in live retest of QA-21 to QA-24 — 2 October 2026

A Claude QA agent retested the four signed-in fixes on the live release from §49
(`6fab4c5` / Worker `e29663d3`) with real Clerk email sign-in, using one existing
throwaway account (qa1) and one new account (qa4). Each case ran twice in two
separate browser profiles. This is the real-account check §49 did not claim.

| ID | Result | Case and evidence |
| --- | --- | --- |
| QA-21 | **Pass 2/2** | TR + ARCE build saved to the Vault, site switched to Vanilla, "Load this build into Character Builder": back to `?world=tr&arce=1`, race correct (Argonian; Khajiit (Ohmes) restored from the plain Khajiit the Vanilla switch showed), sheet finished calculating |
| QA-23 (unsaved character) | **Pass 2/2** | New account, no `?world=` in the address, TR + ARCE character, sign-in: TR + ARCE kept, all 16 Builder fields identical; account stayed revision 0, `worldChosen: false` |
| QA-23 (opened save) | **Pass 2/2** | Ba'Ta save opened as TR + ARCE, sign-in: still TR + ARCE, Khajiit (Cathay-raht), class "Cat", The Thief; not re-read as Vanilla |
| QA-23 (which world wins) | As designed | A signed-in header switch to TR is session-only; after sign-out and sign-in the browser's TR + ARCE wins, since the account never chose a world |
| QA-24 | **Pass 2/2** | Unsaved TR + ARCE characters (Tsaesci, Naga) unchanged after sign-out; a loaded save also survived sign-out twice |
| QA-22 (imported save) | **Pass 2/2** | Permalink carries `world=tr&arce=1`, sex, race, custom class, sign and all ten skills; opened identically in a fresh signed-out profile |
| QA-22 (challenge run) | **Pass 2/2** | Rolled in Vanilla, site switched to TR, link carries `world=vanilla&arce=0` and reopens the same seed and character in Vanilla |
| QA-22 (Builder link) | **Pass 2/2** | TR + ARCE Khajiit (Suthay) link reopened field for field |

No errors, lost data or wrong worlds. Observations and the owner's decisions
(2 October), recorded in the checklist's section 6:

- Once in four logged qa4 sign-ins the tab ended on `/account` instead of `/builder`
  (character and world intact): not a bug, the owner switched windows by accident (F-18).
- A signed-in world switch is session-only; only Your account's Preferred world is
  stored. After launch, offer to save the switched world as Preferred (F-19).
- Email sign-in reloads the page; the character and world now survive it. Desired
  behaviour, no change (F-6).

Cleanup: qa1's four QA saves deleted (0/5), settings unchanged at revision 26; qa4
saved nothing and its settings were never written. Both profiles signed out and
verified after reload. Evidence: `A:\Cache\qa-retest`; browser profiles
`A:\Cache\qa-retest-browserA` and `A:\Cache\qa-retest-browserB`.

## 51. Signed-out live retest of the QA fixes — 2 October 2026

A live-URL QA agent retested the release in §49 (`6fab4c5` / Worker `e29663d3`),
signed out, with a supplied save (Pe.omwsave), in Vanilla, TR and TR + ARCE where
relevant, at 1366, 390 and 375 px, and in both themes on Home, Builder, Travel, Alchemy
and the Vault (20 page/theme/width combinations). 29 focused cases.

| ID | Result | Evidence |
| --- | --- | --- |
| QA-01 | Pass | Two Constant magnitude-5 Fortify Attribute: 75 / 120 points in all three worlds |
| QA-02 | Pass | 5/5, 5 s Target Fortify Attribute: 1 / 1 points, fits a Common Ring, base value 1,912 g; self-enchant 11% (Enchant 5, INT 30, Luck 40) |
| QA-03 | Pass | Endurance 35→55 over five levels: gains 3.5, 4, 4.5, 5, 5.5 = 22.5; Health 57.5 |
| QA-04 | Partial | Chart starts at 35 and 45; END 30→100 in 14 steps (Lv 15); Bitter Cup change explained. The END 100 marker is hidden when it falls on the target level (QA-28) |
| QA-05 | Partial | Titles agree through Builder, Home and Level Simulator ("Based on Imperial Knight of Stendarr"). The endgame kit still names and uses the premade (QA-26) |
| QA-06 | Pass | No Secret Master's apparatus in any world or selector |
| QA-07 | Pass | "Ald'ruhn", "Ald-ruhn" and "Aldruhn" find Ald-ruhn; Vos, Sadrith Mora, Ebonheart, Mournhold found; stale route replaced by a prompt |
| QA-08 | Pass | Where/Acquisition text intact at 375 and 390 px |
| QA-09 | Pass | All five Configure popovers on screen at 375 px and dismissible |
| QA-10 | Pass | No boots or closed helmets for beast races. The reported Helm of Oreyn Bearclaw in a Vanilla Argonian's kit is an open helmet beast races can wear (owner check against UESP and the game files): not a bug |
| QA-11 | Pass | 91 + 91 relation panels, no codes, no "<Deprecated>" |
| QA-12 | Pass | 41/41 cards have Plays like, Trade-off, Major and Minor skills |
| QA-13 | Pass | Restore Health: 55 pairs Vanilla, 2,850 TR / TR + ARCE |
| QA-14 | Pass | Open save and Local Browser Saves (0) described separately |
| QA-15 | Pass | "Made by LowGraph", AGPL-3.0-or-later for the code, data excluded, repository link loads |
| QA-16 | Pass | Ebonheart→Mournhold: 1 leg, Dialogue Teleport, all worlds, walking on and off |
| QA-19 | Pass | Five signed-out requests: 401, error body only, no Set-Cookie, `no-store` |
| QA-25 | Pass | With the save loaded, `/travel?from=Balmora&to=Vivec` plans from Balmora |

Themes: Home, Travel and the Vault pass at both widths in both themes. Builder fails in
Morrowind UI at 375 px (premade categories break mid-word, QA-29); Alchemy clips the
selected apparatus at 375 px in both themes (QA-30). Also found: Health floating-point
noise, "208.00000000003 HP" (QA-27). Triage and causes are in the checklist, section 5,
item 17. Unconfirmed first impressions (stale Home character, open helmets in early game,
varying fresh default builds, Vault category scrolling) were not reported as bugs.

## 52. Edited premade endgame kits (QA-26) — 1 October locally

Owner requested QA-26 on a new branch. Fetched `origin/main` at `b2e8d94` and
claimed it at **2026-10-02 02:05 UTC** (1 October, 23:05 in São Paulo) on
**`launch/qa-26-edited-endgame-kit`**, isolated checkout `A:/Claude/mt-qa-26`.

Cause: `resolveBestInSlotPicks` (`lib/best-in-slot.mjs`) selected a published
record by retained build name alone. With the default weapon preference it
scored weapons/shields, then restored that record's other slots. Race, skill,
birthsign and other edits consequently left the old armour/clothing/jewellery
in place. `BestInSlotView` also used the record name rather than `characterName`.

Named records now require `isUnchangedPremade`, a comparison against the full
known premade using `sameCharacter`, shared with the title rule. Edited and custom
namesakes use the bundle scoring model for every slot. Weapon preference restores
non-weapon published picks only for unchanged premades; reverting the character
restores eligibility. The explanation uses `characterName`, including "Based on …"
and player-entered names. Existing beast gates, runner-ups, source toggles and equip
transfer remain. No model, game-data record, schema, dependency or configuration change.

| Check | Result |
| --- | --- |
| Before-fix regressions | **9 failures / 12 tests** in `test/edited-premade-gear.test.js`; three unchanged-premade controls passed |
| Focused fix verification | **38/38 passed**, new regressions plus existing endgame and character-identity tests |
| Full `npm test` | **1,142 passed, 0 failed, 0 skipped, 0 TODO**, including licence/site claims |
| `npm run build:cloudflare` | **24 pages generated**, repository configuration unchanged; no deployment |
| Chrome QA-26 | **12/12 completed cases**, Vanilla/TR/TR + ARCE × 1366/375 × both themes; **48 character configurations, 96 weapon-preference configurations, 12 equip transfers** |
| Pipeline | **685 tests passed**, unchanged pipeline code; shared-doc handoff on `handoff/qa-26-edited-endgame-kit` |

Active synthetic tests pin unchanged published picks under both source toggles,
race-only edits, skill-driven changes to armour/clothing/jewellery, custom premade
namesakes, both weapon preferences, no preference, other identity edits, reverting,
catalog immutability and the rendered title. Existing tests that called partial
characters "unchanged premades" now use their complete original choices.

The browser case uses the reported **Argonian female — Marsh mage**, edits its
race to High Elf through Configure, then changes a Major skill to Light Armor.
It compares every displayed primary item and score with dynamic ranking of the
same choices under a neutral name, opens runner-ups and retains beast exclusions.
The unchanged control is checked against its published non-weapon picks. Both
weapon preferences are checked before equipping the edited two-handed kit; every
recommended item appears in the loadout. A separately linked custom namesake also
ranks dynamically. Screenshots and overflow assertions cover both layouts; inspected
the phone Morrowind and desktop Modern captures. Completed reports have **zero
runtime/server errors or captured React hydration warnings**.

The first capture harness looked only in the playstyle premade list; corrected it
to use the full pool containing the reported race-based premade. Two initial TR
cases missed their Configure edits while the concurrent build refreshed the dev
server. After the build, reran TR and TR + ARCE in bounded groups: all passed.
Failed attempts remain in the evidence and are excluded from the final case count.
The requested port 8765 was occupied, so verification used isolated server **8801**.

Evidence: `A:/Cache/qa26-red.log`, `qa26-focused-final.log`, and `A:/Cache/qa26/`
(`unit.log`, `unit-final.log`, `build.log`, `pipeline.log`, `matrix-summary.json`,
batch reports, per-case reports and screenshots). Temporary orchestration scripts
are removed after verification. The shared records are byte-identical in the site
branch and isolated pipeline handoff checkout `A:/Claude/omw-qa-26`; other agents'
checkouts remain unchanged. No production/account write, extraction, migration,
push, merge or deployment. QA-27–30 remain open. First command: `npm test`, then
BROWSER_TESTS.md's QA-26 browser filter, split by profile/width for bounded runs.

## 53. QA-26 merge verification — 1 October locally

Owner authorized merge and push. Fetched `origin/main` at `b2e8d94`, then merged
`launch/qa-26-edited-endgame-kit` (`2b86443`) into a clean main checkout with
`--no-ff`. No conflicts or additional application changes: the merged application,
tests, runner, configuration and staged bundle match the verified branch in §52.
Updated the checklist and shared handoff records to reflect integration.

| Check on the merged checkout | Result |
| --- | --- |
| Full `npm test` | **1,142 passed, 0 failed, 0 skipped, 0 TODO**, including licence/site claims |
| `npm run build:cloudflare` | **24 pages generated**, repository configuration unchanged |
| Chrome QA-26 | **12/12 passed**, Vanilla/TR/TR + ARCE × 1366/375 × both themes; **48 character configurations, 96 weapon-preference configurations, 12 equip transfers** |
| Browser errors | **0 runtime/server/console errors and 0 captured hydration warnings**; phone Morrowind capture inspected |
| Pipeline tests | **685 passed** before the shared-document merge commit |
| Pipeline handoff | `673b531` merges `ff6cb54` into remote master `6372e65`; `COORDINATION.md` and `UI_TRANSFORMATION.md` are byte-identical across the integration checkouts |

The browser matrix ran after the build, using this main checkout's isolated server
on **8801**; all six bounded profile/width runs completed without a retry. Evidence:
`A:/Cache/qa26-main/` (`unit.log`, `build.log`, `pipeline.log`,
`browser-summary.json`, per-case reports and screenshots). Temporary orchestration
script and the owned server are removed/stopped after verification.

The pipeline merge uses an isolated worktree based on remote master, preserving
another agent's unpublished polish-documentation commit in its original checkout.
Only QA-26 and its matching handoff are integrated. No extraction, dataset/schema
change, migration or production write. Production remains `6fab4c5` / Worker
`e29663d3`; **not deployed**. QA-27–30 remain open. First command: `npm test`;
the reusable Chrome check is documented in BROWSER_TESTS.md under QA-26.

## FLOW-01 — local launch polish

Branch: `polish/flow-01`. Reproduced locally: Common Ring enabled On Strike (before report). Cause: all three buttons were offered independently of the selected item. Cast-style eligibility now follows OpenMW 0.51 enchanting.cpp nextCastStyle, including weapon classes, books and soul thresholds; the rendered selection is normalized immediately and retained state follows it. Custom item kind is explicit. QA-01/02 cost, chance and price functions are unchanged. npm test: 1,133 passed, zero failures/skips/TODO. Chrome: 4/4 passing at 1366/375 in both themes, zero axe blockers, overflow or runtime/server errors. Evidence: A:/Cache/launch-polish/flow-01-final and flow-01-unit.log. The first sandbox CDP session timed out; unsandboxed Chrome works. Two early capture-harness selector/serialization mistakes were corrected before the passing run.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## UI-03 — local launch polish

Branch: `polish/ui-03`. Reproduced locally with an invalid seed followed by Generate Run. Cause: generation never cleared seedError; valid loading already did. Successful rollFromSeed now clears feedback only after generating the run. Three active component cases cover generation, same-world loading, repeated invalid input and cross-world valid loading. npm test: 1,136 passed, zero failures/skips/TODO. Chrome: 4/4 passed at 1366/375 in both themes, with screenshots, accessibility and overflow checks; no runtime/server errors. Evidence: A:/Cache/launch-polish/ui-03-before, ui-03-final, ui-03-unit-final.log. Initial unit fixtures incorrectly started with null instead of the provider empty run; corrected fixture, no application workaround.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## UI-04 — local launch polish

Branch: `polish/ui-04`. Reproduced with zero Alchemy, Intelligence and Luck plus Saltrice and Marshmerrow. Cause: the chance used potion.isValid, which also rejects fully calculated effects rounding to zero. calculatePotion now marks completed calculations separately; the chance reads that flag. Potion validity, strength, price and formulas are unchanged. Three regression tests cover zero and positive results, incomplete/unmatched/duplicate recipes, unavailable rules/settings and invalid stats. npm test: 1,139 passed, zero failures/skips/TODO. Chrome: 4/4 passed at 1366/375 in both themes; zero axe blockers, overflow or runtime/server errors. Evidence: A:/Cache/launch-polish/ui-04-before, ui-04-final, ui-04-unit.log.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## UI-05 — local launch polish

Branch: `polish/ui-05`. The original labels implied the same scope. availableStops counts graph nodes excluding named-place endpoints; mapData groups physical platforms by town, excludes unplaced positions, and routePositions adds route points. Staged TR with a synthetic outsider save has 490 routing stops and 101 mapped locations, unlike the older QA bundle. Both scopes are now explicit with a map explanation; no counts are hard-coded and routing is unchanged. Three map-scope edge cases cover singular, route points/unplaced locations and an empty map. npm test: 1,142 passed, zero failures/skips/TODO. Chrome: 24/24 passed across Vanilla/TR/TR + ARCE, manual/synthetic save, both themes and 1366/375; saved cases toggle guild access and restore save defaults. Zero axe blockers, page overflow or runtime/server errors. Evidence: A:/Cache/launch-polish/ui-05-options, ui-05-unit.log and the before report.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## SS-08 — local launch polish

Branch: `polish/ss-08`. Cause: the roster and detail heading scroll independently, so the visible list card does not identify the detail selection. A persistent, polite live Viewing label now sits above the scrolling detail pane and follows the same selectedFaction as the details. Initial load, refreshed catalog, empty roster, search and selection have three active component tests. npm test: 1,145 passed, zero failures/skips/TODO. Chrome: 6/6 passed at 1366/375/390 in both themes, including initial load, refresh, searches hiding selection and scrolled details; screenshots reviewed, no page overflow or runtime/server errors. Evidence: A:/Cache/launch-polish/ss-08-verified and ss-08-unit.log. The empty-search state correctly retains its label but exposes a pre-existing aria-required-children issue in the empty roster listbox (ss-08-final axe reports); nonempty filtered and refreshed states have clean scoped axe checks. This unrelated roster issue remains an acceptance limitation.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## SS-09, U28 — local launch polish

Branch: `polish/ss-09`. Reproduced broken Prev and Next words using text Range line boxes at 375 px. Cause: the itinerary heading squeezed an unwrapped navigation row, and misc-training name, numbers and governing-attribute chip shared another unwrapped row. Navigation now moves below the heading on phones; its buttons cannot shrink or wrap inside words. Training details wrap between fields and keep skill names whole. Browser regression measures every itinerary word, uses an actual Acrobatics training plan, exercises both modes and Next/Previous, and checks axe plus page overflow. npm test: 1,145 passed, zero failures/skips/TODO. Chrome: 6/6 passed at 1366/375/390 in both themes (12 mode states/screenshots), zero runtime/server errors. Evidence: A:/Cache/launch-polish/ss-09-before, ss-09-final and ss-09-unit.log. Screenshots reviewed for visible names and controls; no calculation, character or saved-state changes.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## SS-10 — local launch polish

Branch: `polish/ss-10`. Cause: faction search always used the plural word and suppressed zero counts. Fixed catalog and fallback counts, including invalid fallback values. Three active regression tests cover zero, one and multiple ranks. The staged Twin Lamps result reproduced “1 ranks” in ss-10-reproduced; ss-10-verified passes 4/4 Chrome cases across both themes at 1366 and 375 px, with Escape dismissal, overflow and axe checks. The initial browser selector was corrected to the existing search-dialog class before capturing the actual baseline. npm test: 1,148 passed, no failures, skips or TODOs (ss-10-unit-final.log). Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## SUS-02 — local launch polish

Branch: `polish/sus-02`. Cause: each leg and the precise aggregate are independently rounded by formatDuration; routing costs are unchanged. Added a visible rounding explanation next to valid in-game totals, separately from Real Time Approximation. Three active tests cover the exact 4 h 22 min / 4 h 23 min arithmetic, precision preservation, minute boundaries, zero and unavailable estimates, and a real staged Old Ebonheart journey. Current staged precise hours: total 6.182688219202264, legs [2, 0.18268821920226358, 4] (sus-02-precision.log). The earlier report lacks enough character/origin choices to reproduce its exact itinerary on the current routing network; its rounding discrepancy is reproduced numerically. sus-02-before captures the missing explanation; sus-02-final passes 4/4 Chrome theme/1366/375 cases with axe, overflow and screenshots. npm test: 1,151 passed, no failures/skips/TODOs (sus-02-unit.log). Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## F-7 — local launch polish

Branch: `polish/f-7`. Cause: the inline confirmation removed the focused Delete button, had no dialog name/focus handling, and successful refresh replaced the remaining cards. Added a portal alertdialog labelled Delete save?, initial Cancel focus, Tab/Shift+Tab trap, Escape/cancel restoration, announced request failures and stable-record focus restoration after deletion, including the last record. Three active component tests cover cancellation, returned/thrown failure, and remaining/last-save deletion. f-7-before captures the original missing alertdialog; f-7-complete passes all 8 synthetic signed-in page/dialog Chrome cases, both themes at 1366/375, including real 409 conflicts, Enter confirmation, axe, overflow and screenshots. Chrome key events were corrected to use the Shift bit and Enter character event; the test uses PUT for revision changes and waits for initial Vault refreshes. npm test: 1,154 passed, no failures/skips/TODOs (f-7-unit-complete.log). All QA – records were deleted from the disposable local Worker; no real Clerk account or production write. Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## F-10 — local launch polish

Branch: `polish/f-10`. Cause: Reset all settings directly changed world and preferences. Added an accessible, named confirmation using the tested dialog contract; Cancel/Escape preserve every field and revision, and confirmation restores the exact documented default document. Account changes dismiss a pending confirmation. Failed sync remains announced through existing retry/conflict controls; a disabled fieldset now restores body-lost focus to its recovery action. Three active component tests plus the existing provider/run-preservation test cover cancellation, defaults/scoped overrides, failure and owner changes. f-10-before captures immediate reset; f-10-verified passes 4/4 signed-in Chrome theme/1366/375 cases, keyboard Enter, stored-default comparison, a real 409 conflict, axe, overflow and screenshots. The synthetic settings rows were removed from local D1. npm test: 1,157 passed, no failures/skips/TODOs (f-10-unit-complete.log). Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.


## F-13 — local launch polish

Branch: `polish/f-13`. Cause: the header squeezed Close and the nonwrapping action row compressed labels below word width. Header/action groups now wrap between controls; labels stay whole with adequate hit areas. f-13-before reproduces Duplicate on /vault and Close/Duplicate in the dialog at 375 px. f-13-theme-verified passes 12/12 local signed-in Chrome cases across page/dialog, both actual themes at 1366/375/390, with word-range and bounds checks, Enter duplication, Close reachability, axe and screenshots. The test harness now sets the synthetic account theme because account preferences outrank browser storage, and asserts data-theme; final regression will repeat F-7 under those actual themes. All QA – saves and settings rows were cleaned up. npm test: 1,157 passed (f-13-unit-accepted.log); an earlier existing Copy Build Link timing failure passed isolated and in the full rerun after Chrome finished. No site behavior changed for that unrelated test. Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.

## F-7 — deferred-focus regression correction

On the cumulative polish/ingredient-labels branch, the loaded full suite exposed a delayed focus callback after its Vault scope was detached. A boolean short circuit reached optional querySelector and threw. The callback now exits when its scope is gone. Four active card tests include deterministic animation-frame queues and an explicit detached-Vault case, removing the old 25 ms timer assumption. npm test -- --test-concurrency=4: 1,164 passed, no failures/skips/TODOs (A:/Cache/launch-polish/final-f7-correction-unit.log). The separate correction commit preserves the one-finding-per-implementation-commit rule. The cumulative signed-in launch suite is being repeated with actual account-theme assertions; its results are recorded in the final batch verification.


## F10, CALC-4-01 — local launch polish

Branch: `polish/ingredient-labels`. Cause: duplicate catalog names were suffixed with their raw record key; global search could also collapse distinct records or append IDs. Added shared labels using only catalog weight, value, ordered effects/targets, origin and attached-script presence. Braided Bread uses its actual weights; Emerald uses actual origin/script qualifiers, with an explanation that script behavior is unavailable. No curse, size or quest behavior is inferred from IDs. Identical facts deliberately retain identical readable labels and distinct keys. Selection, potion calculations, reverse-pair identity, source lookup and console commands retain canonical IDs. Six active regressions cover catalog differences, scripts/origins, identical/missing/frozen facts and every staged world, plus updated adapter coverage. ingredient-reproduced captures raw autocomplete IDs. Chrome passes 12/12 cases: ingredient-vanilla-verified, ingredient-tr-complete and ingredient-arce-complete, both themes at 1366/375, covering autocomplete, selected slots, reverse pairs/use focus, Braided Bread, source disclosures, global ingredient category, canonical preview command, axe, overflow and screenshots. npm test -- --test-concurrency=4: 1,164 passed with no failures/skips/TODOs (final-f7-correction-unit.log). The unrelated deferred F-7 regression has its own correction commit. Evidence: A:/Cache/launch-polish.

Completed on this branch only. No push, merge, deployment, production migration or data rebuild.

## Cumulative twelve-item launch polish verification — 2 October 2026 UTC

All twelve assigned items are implemented and committed in order on the requested
stack, ending at `polish/ingredient-labels`. The final implementation commit is
`308443edee795b3ebdae0902bd8876b41cf80e9c`; the later verification commit changes
documentation and test runners only. Every preceding item branch is an ancestor
of the cumulative branch. The clean worktree began at fetched main `2968fa3`;
other sessions later advanced `origin/main` to `b2e8d94` with retest documentation.
No active site checkout was switched, and this batch did not merge, rebase, push
or deploy. The earlier fixes and their histories remain in the stack.

Each implementation commit contains its regression tests, completed checklist
entry, cause/fix/results record and entries in both player changelogs. All logic
items have at least three active edge cases; no assigned fix is left as a TODO.

| Item | Branch | Implementation commit | Resulting behavior | Final focused Chrome result |
| --- | --- | --- | --- | --- |
| FLOW-01 | `polish/flow-01` | `70b8022` | OpenMW cast-style eligibility; switching items and explicit custom kinds stay valid | 4/4; QA-01/02 additionally 24/24 |
| UI-03 | `polish/ui-03` | `4a2d3e2` | Successful generation/loading clears stale seed errors; invalid input still errors | 4/4 |
| UI-04 | `polish/ui-04` | `523c203` | A completed zero chance displays 0%; incomplete/unavailable results remain distinct | 4/4 |
| UI-05 | `polish/ui-05` | `27691e6` | Routing stops and mapped locations are explicitly labelled and explained | 24/24, three worlds and save-dependent options |
| SS-08 | `polish/ss-08` | `469e526` | Persistent active faction identity beside the details follows load, search and selection | 6/6, including 390 px |
| SS-09 / U28 | `polish/ss-09` | `65a052c` | Whole navigation and skill words in both itinerary modes | 6/6, 12 mode states, including 390 px |
| SS-10 | `polish/ss-10` | `8e1215f` | Zero/multiple ranks and singular rank are correctly labelled | 4/4 |
| SUS-02 | `polish/sus-02` | `cc5e394` | Visible explanation of independently rounded in-game estimates; precise routing retained | 4/4 |
| F-7 | `polish/f-7` | `2ec4a78`, correction `5af5bba` | Named deletion confirmation, focus trap, cancellation/error recovery and deletion focus restoration | 8/8, page and dialog |
| F-10 | `polish/f-10` | `1aaa486` | Accessible reset confirmation; cancellation preserves settings, confirm uses exact defaults, sync failure recovers focus | 4/4 |
| F-13 | `polish/f-13` | `692b67b` | Whole Close/Duplicate/action labels with reachable controls | 12/12, page/dialog at 1366/375/390 |
| F10 / CALC-4-01 | `polish/ingredient-labels` | `308443e` | Readable catalog qualifiers across every ingredient label; separate canonical records and sources retained | 12/12, all three worlds |

Final checks:

| Check | Result | Evidence under `A:/Cache/launch-polish` |
| --- | --- | --- |
| Full unit suite | **1,164/1,164 passed**, zero failures/skips/TODOs; final rerun after runner changes also passed | `final-unit.log`, `final-docs-unit.log` |
| Cloudflare build | **Passed**, optimized static export; no deployment | `final-cloudflare-build.log` |
| Public focused launch checks | **68/68 passed** | `final-browser/launch-*` |
| Existing tool interactions | **52/52 passed**, including saved Travel options, share links, equipment focus, reverse alchemy and ingredient sources | `final-browser/tools-*`, `final-browser-recovery`, `final-travel-recovery` |
| Existing Travel interactions | **15/15 passed**, keyboard search/cancellation, network retry and actual city transfers in all worlds | `final-travel-recovery`, `final-city-regression` |
| Corrected Enchanting calculations | **24/24 passed**, QA-01 and QA-02 in every world | `final-browser/qa-QA-01-*`, `qa-QA-02-*` |
| First-navigation hydration | **288/288 passed** on Home, Builder, Travel, Alchemy, Enchanting, Factions, Challenge, Vault and Account | `final-browser/hydration-*` |
| Synthetic signed-in launch suite | **24/24 passed**, actual account themes, keyboard, focus, failure and phone layout | `final-vault-launch/report.json` |
| Existing synthetic Vault suite | **10/10 passed**, ownership/auth, CRUD, token renewal, integrity, quota and both-theme accessibility | `final-vault-full-verified/report.json` |
| Pipeline | **685/685 passed**, cache-isolated TEMP/TMP, no uncaught warnings | `final-pipeline-tests.log` |

The accepted aggregate contains **481 unique passing Chrome cases**, with zero
assertion, runtime or server failures. Both themes at 1366/375 px are covered for
every UI fix; phone layout findings include 390 px. Screenshot review confirms
whole labels and readable qualifiers. Checks include keyboard focus/escape,
dialog accessibility, text ranges, overflow, fonts, lazy source requests and
canonical ID preservation. Hydration covers fresh starts (Home/Builder repeated
ten times per width/theme), stored TR + ARCE, loaded saves, build links with/without
world and challenge links. This is the relevant nine-route matrix, not a claim
that the separate full freeze/404/device acceptance matrix is complete.

All groups used external bounds (120 seconds for public groups, 150 for the built
signed-in suites) and saved logs/reports. One all-world tools group reached its
bound after nine passes; three smaller world groups completed. The saved-Travel
filter was initially sent to the wrong suite (zero cases). Older Travel runner
assertions expected the itinerary to remain visible during draft search, contrary
to the already-fixed QA-07; they now assert its prompt and Escape restoration.
Those three public runs are excluded from `final-summary.json`, which verifies
unique case names and expected counts. The existing Vault runner also needed its
Confirm selector updated for the portal alertdialog; its complete corrected rerun
is accepted. No Travel routing behavior changed to satisfy these runner repairs.

The signed-in tests used `scripts/local-stack.cjs`, a built local Worker, fresh
local D1, synthetic users and `QA – ` records. Real 409 conflicts exercised failed
requests. Created records, settings and tier overrides were removed; the ordinary
Vault report records `cleanedSyntheticRecords: true`. The launch signed-in report
predates added commit metadata, but uses the same unchanged built implementation.
No ordinary account, real Clerk session or production API write was used. No
production migration, data rebuild, dependency or licence change was made.

Acceptance limits: SS-08's empty-search identity is verified, but the existing
empty faction roster listbox still has an unrelated axe `aria-required-children`
issue. SUS-02's exact old itinerary is not reconstructible from the earlier
report/current network; its 4 h 22 min / 4 h 23 min arithmetic is reproduced in
active tests and the staged route's precise durations are recorded above. Physical
phones and actual screen-reader announcements were not manually exercised; Chrome
viewport/keyboard/ARIA checks and synthetic authentication establish this batch's
local acceptance. No assigned item is marked blocked or claimed merged/live.

COORDINATION is synchronized byte-for-byte with the pipeline repository, committed
there locally as `d497aaf42ef3a824748249738ed0039d5a5ba039`; UI_TRANSFORMATION is
unchanged and byte-identical. First command for the next agent, from this worktree:
`npm test -- --test-concurrency=4`, followed by the bounded groups in BROWSER_TESTS.
Temporary orchestration/capture runners are removed; reports and screenshots remain.

## Integration branch preparation — 1 October 2026

The owner authorized combining this batch and pushing it, in preparation for a
later main merge. `polish/launch-checklist-batch` starts at fetched `origin/main`
`b2e8d942d48d06e5947c34afa84b532db46c5236` and merges the complete twelve-branch
stack at `690cd742a7b74f245e6a2db84d619e64248d81bf`. Every individual branch and
implementation commit is retained in its history. Main and the other agents'
active checkouts are unchanged by this preparation; no deployment is authorized.

Conflicts were documentation only: retain main's F-6 owner decision alongside
F-7's completed claim, and retain both newer live retest records (§§50–51) before
the launch-polish records. QA-26–30 and all other unassigned findings remain as
recorded by their owners. Shared COORDINATION/UI_TRANSFORMATION are unchanged and
still byte-identical with the pipeline repository.

Before committing the merge, the full unit suite passed **1,164/1,164**, with no
failures, skips or TODOs, and the Cloudflare build passed. Both checks used
120-second external bounds. Evidence: `A:/Cache/launch-polish/integration-unit.log`
and `integration-build.log`. The only differences from the previously verified
`690cd74` tree are these two documentation files, so the **481 passing Chrome
cases** above still verify the combined branch's application code. No additional
implementation or catalog change was introduced by integration.

## 54. Twelve-item polish merge into main — 2 October 2026

Owner authorized merging `polish/launch-checklist-batch` (`8c7b98e`) into clean
main `c9052a9`, retaining all twelve item commits and QA-26. Fetched both remote
tips before retrying. The three conflicts were documentation only: retained both
sets of player-facing entries in the existing day's two changelogs, and retained
main's QA-26 records (§§52–53) before the branch's complete polish history.
Checklist records now identify each implementation commit and this merge;
unassigned findings, production state and release history remain unchanged.

The first attempt was aborted after `F-7/morrowind/375/dialog` timed out on a
refreshed Vault-card wait and its isolated rerun timed out on the theme assertion.
The owner authorized another attempt without the two-failure stop rule. Found a
runner setup bug: `signIn` installs the next document's user, while `theme` read
the departing document's Clerk user. It now tracks the intended synthetic user
and sets that account's theme before navigation. `open` also waits for enabled
shell controls after HTML load before dispatching Vault events. Timed-out waits
capture their actual URL/theme/user/readiness/card state, HTML and screenshot
before cleanup navigates away. No assertion was removed, timeout increased or
application workaround added. The original refresh timeout's cause was not
captured because its evidence followed cleanup; the readiness wait addresses the
identified early-dispatch risk. All subsequent checks below completed.

| Check on the combined checkout | Result |
| --- | --- |
| Full unit suite | **1,176 passed, 0 failed, 0 skipped, 0 TODO**, including QA-26, licence and site-claim tests |
| Cloudflare and separate Vault builds | **Both passed, 24 pages each**, repository configuration unchanged |
| Public launch fixes | **68/68 passed**: both themes, 1366/375, SS-08/09 also 390; world-specific count/ingredient checks include all three worlds |
| QA-26 regression | **12/12 passed**, all three worlds, both themes and 1366/375 |
| Enchanting QA-01/02 | **24/24 passed** in fresh retry reports, all three worlds, both themes and 1366/375 |
| Formerly failing Vault case | **3/3 passed** in separate fresh-profile/local-database runs |
| Full signed-in launch suite | **24/24 passed**, including actual themes, reset/delete confirmations, focus, cancellation, real revision conflicts and phone labels |
| Existing signed-in Vault suite | **10/10 passed**, including auth/ownership, CRUD, renewal, integrity, quota and both-theme accessibility |
| Pipeline | **685 passed**, cache-isolated TEMP/TMP |
| Synthetic cleanup | **0 saves, settings or tier overrides** left in each of the five disposable local databases |

The **138 unique passing Chrome cases**, plus three isolated repetitions, combine
the accepted 68 launch and 12 QA-26 reports from `A:/Cache/polish-main/browser/`
with the fresh Enchanting and signed-in reports in `A:/Cache/polish-main-retry/`.
Public application/test-case files match the first merge attempt; this retry adds
only the Vault runner corrections and documentation. Incomplete public groups
and the two original failures are excluded from acceptance and retained as evidence.
Accepted reports have zero runtime/server errors. Reviewed the phone Level
Simulator capture and the corrected phone Morrowind deletion confirmation.

Fresh unit/build/pipeline logs, browser summaries and `cleanup-summary.json` are
under `A:/Cache/polish-main-retry/`; the original failures and preserved merge
diff remain under `A:/Cache/polish-main/`. Groups retain 120/150-second outer
bounds. Shared COORDINATION/UI_TRANSFORMATION are synchronized in the isolated
pipeline handoff; other agents' checkouts are preserved. Temporary runners and
owned servers are removed/stopped after verification. No extraction, dataset or
schema change, migration, dependency/licence change, production write or deploy.
Production remains `6fab4c5` / Worker `e29663d3`. SS-08's existing empty-roster
accessibility limit and physical-device/freeze acceptance remain as recorded
above. First command: `npm test -- --test-concurrency=4`, then BROWSER_TESTS.md's
bounded launch and synthetic Vault groups.

## QA-27 — local launch polish

Branch: `polish/qa-27`. Reproduced 208.00000000000003 HP at target 55 from starting Health 35 and Endurance 10. The chart interpolated precise arithmetic directly into visible and accessible text. A display-only formatter now covers its legend, endpoints, advantage, hover readout, aria summary and accessible table. Narrow hover readouts wrap between complete values. Four active edge tests cover integer noise and zero, fractional gains and display rounding, unavailable values and actual chart rendering with unchanged precise curves. Chrome covers all three worlds at 1366 and 375 px in both themes, keyboard target selection, hover formatting and chart containment. Full npm test: 1146 passed, no failures/skips/TODOs. Chrome: 12/12 passed with both themes, screenshots, overflow and scoped axe checks; no runtime/server errors. Evidence: A:/Cache/qa27-30/qa27-unit-final.log and qa27-browser-final. Completed on this branch only; not merged into main or live. No deployment, production write, data rebuild or migration.


## QA-28 — local launch polish

Branch: `polish/qa-28`. Reproduced with starting Endurance 30: target 15 hid the milestone while target 16 showed Lv 15. A strict endpoint comparison excluded a valid final-level achievement. The marker now includes the target endpoint, retaining its existing exclusion of an already-maxed starting level. Four active chart-rendering tests cover target 14, exact target 15, later target 16, starting Endurance 100 and a one-level forecast. Chrome checks these boundaries in all three worlds, both themes and 1366/375 px, with keyboard range interaction and measured marker-label containment. Full npm test: 1150 passed, no failures/skips/TODOs. Chrome: 12/12 passed with both themes, screenshots, overflow and scoped axe checks; no runtime/server errors. Evidence: A:/Cache/qa27-30/qa28-unit-final.log and qa28-browser-final. Completed on this branch only; not merged into main or live. No deployment, production write, data rebuild or migration.


## QA-29 — local launch polish

Branch: `polish/qa-29`. Reproduced Alchemist and other categories splitting mid-word at 375 px in Morrowind UI. The category, count and action competed for one narrow flex row while inherited emergency word wrapping split the title. Phone headers now stack the action beneath a wrapping category/count group, keep counts and actions whole, and wrap category names at word boundaries. Desktop retains its horizontal layout. Eighteen active Chrome cases cover all three worlds, both grouping modes and 1366/375/390 px in both themes. DOM text-range measurements reject split words and clipped labels; Enter and Space expand/collapse the categories while retaining focus. Existing premade unit coverage verifies all catalog counts, descriptions and unchanged build selection. Full npm test: 1150 passed, no failures/skips/TODOs. Chrome: 18/18 passed with both themes, screenshots, overflow and scoped axe checks; no runtime/server errors. Evidence: A:/Cache/qa27-30/qa29-unit-final.log and qa29-browser-final. Completed on this branch only; not merged into main or live. No deployment, production write, data rebuild or migration.


## QA-30 — local launch polish

Branch: `polish/qa-30`. Reproduced clipping in the original two-column phone rack: the selected Grandmaster label needed 127.3 px but had 86 px after padding. Phone controls now use a full-width column and wider layouts use two columns, keeping native selects and every existing option, ID and quality. Eighteen active Chrome cases cover all three worlds, 1366/375/390 px and both themes. Each available option is selected by canonical ID, including distinct records sharing a readable label; font measurements check its full text fits. Home/End/Escape selection retains focus. No apparatus eligibility, ingredient selection or potion calculation changed. The initial all-world group hit its 120-second bound and was discarded; three complete world groups of six cases supply the acceptance aggregate. The existing label-based test helper was replaced here with explicit ID selection so duplicate labels are correctly exercised. Full npm test: 1150 passed, no failures/skips/TODOs. Chrome: 18/18 passed with both themes, screenshots, overflow and scoped axe checks; no runtime/server errors. Evidence: A:/Cache/qa27-30/qa30-unit-final.log and qa30-browser-final. Completed on this branch only; not merged into main or live. No deployment, production write, data rebuild or migration.


## 55. QA-27–30 cumulative preparation — 2 October 2026

Each item was claimed, reproduced with staged bundle a29adea046e6086c2c7ee654, fixed, tested and committed separately before its successor branch started. The stack starts at main c9052a9. Preparation branch polish/qa-27-30-batch combines the completed stack with freshly fetched main ab3a21a, which already includes the earlier twelve launch fixes. Merge 2093b62 retains both verification histories and both sets of browser checks. Its application/test source is the source verified below.

| Item | Branch | Implementation | Focused Chrome | Unit tests before item commit |
| --- | --- | --- | --- | --- |
| QA-27 | polish/qa-27 | 7e5b278 | 12/12 | 1,146 passed |
| QA-28 | polish/qa-28 | 4d9c1e0 | 12/12 | 1,150 passed |
| QA-29 | polish/qa-29 | cd91229 | 18/18 | 1,150 passed |
| QA-30 | polish/qa-30 | bfc074f | 18/18 | 1,150 passed |

Cumulative npm test: **1,184 passed, 0 failed/skipped/TODO**. The Cloudflare build passed (24 pages); the separate synthetic Vault build also passed. Pipeline: **685 passed**, with cache-isolated TEMP/TMP. Both shared documents are byte-identical in the isolated pipeline handoff at A:/Claude/qa27-30-pipeline; other active checkouts are preserved.

**418 unique Chrome cases passed**: 60 new-fix cases, 64 existing QA cases (saved starting Health/fractional gains, Bitter Cup, premades, apparatus eligibility and edited kits), 68 earlier public launch cases, 192 hydration cases and 34 synthetic signed-in Vault cases. Worlds are Vanilla, TR and TR + ARCE; both themes use 1366/375 px, with 390 for phone-label cases. Reports include screenshots, loaded-font state, keyboard/focus, text/overflow measurements and scoped axe checks; accepted reports have zero runtime/server errors. Hydration covers fresh, stored-world, synthetic loaded-save and shared-link states across Home, Builder, Level Simulator, Alchemy and Changelog.

Evidence: A:/Cache/qa27-30/acceptance-summary.json lists the exact accepted reports; accepted-cases.json records every case. integration-unit.log, integration-build.log and pipeline-unit.log record the suites. final-vault-launch and final-vault-existing use local-stack.cjs and fresh local D1 with synthetic users and QA-prefixed records. cleanup-summary.json confirms **zero saves, settings and tier overrides** remain in both databases.

Incomplete all-world QA-30 and QA-26 groups reached their 120-second outer bounds and are excluded. Smaller complete world groups replaced them without extending limits or removing assertions. Public groups use 120-second bounds; signed-in checks use 150 seconds after the build (the initial build plus launch run used 180 seconds). No tests are accepted from partial output.

Remaining acceptance limits: Chrome emulation does not replace physical-device or assistive-technology speech checks; synthetic JWT/Clerk stubs do not exercise the live Clerk provider. The existing empty-faction-roster axe limit remains as recorded above and is outside these assigned items. No production API write, data rebuild, dataset/schema change, migration, dependency/licence change or deployment occurred. The owner subsequently authorized main merge and push conditional on all required checks passing; the final main integration record follows.

## 56. QA-27–30 main integration — 2 October 2026

The owner authorized main merge and push conditional on all required checks passing.
Freshly fetched main b8eeb50 includes the later launch-checklist owner records;
those records are preserved. Integration candidate integration/qa-27-30-main
merges polish/qa-27-30-batch (0b36c72) without conflicts. All four individual
branches/commits and the earlier twelve fixes remain in main history. Other
agents' active checkouts are preserved; the remote main update uses this isolated
candidate, with no force push.

Application and test files are identical to the verified 2093b62 source tree.
All 418 accepted Chrome cases in section 55 therefore cover the exact candidate
application. Fresh full npm test and Cloudflare build are run on this candidate
before its merge commit and push; evidence is main-unit.log and main-build.log
under A:/Cache/qa27-30. Shared handoff documents are byte-identical in the isolated
pipeline branch polish/qa-27-30-coordination, whose 685 cache-isolated tests pass
before its local commit. No production API write, data/schema change, migration,
rebuild, dependency/licence change or deployment. Physical-device/provider and
existing empty-roster accessibility limits remain as recorded in section 55.

Final candidate results: **1,184/1,184 unit tests passed**, with zero failures,
skips or TODOs; the **Cloudflare build passed (24 pages)**. Both fresh commands
completed inside their 120-second bounds. The application/test diff against
2093b62 is empty, so all **418/418** accepted browser cases verify this candidate.
The pipeline handoff is committed locally as f730ac3 after **685/685** passing
tests. Both shared file hashes match exactly. Main integration retains the
owner's newer checklist triage without changing any unassigned item's status.
The owner-authorized push publishes this verified merge and preparation branch;
production deployment remains separate.

## 57. Selected rollback target for the next release — 2 October 2026

The owner selected **`e29663d3`** as the next release's rollback target.

| Item | Selected value |
| --- | --- |
| Worker version | **`e29663d3-68eb-45ff-bbef-13447c3b0cbf`**, tagged `6fab4c5` |
| Source commit | **`6fab4c54af827965387ce336885907664deeff14`**; version/source mapping recorded in §49 |
| Baseline deployment | `609140d4-fc59-45e4-a357-d3e15d92041b`, deployed 2026-10-02 00:13:37 UTC (§49) |
| Prepared main | `1a5224f`: QA-26, the twelve-item polish batch and QA-27–30 are integrated but not deployed |
| Bundle retained | `a29adea046e6086c2c7ee654` |
| Schema compatibility | Migrations **0001–0007**; no migration-file changes between `6fab4c5` and prepared main |
| Last recorded D1 recovery bookmark | `0000006d-00000000-000050f8-1d7bc74cdeb236e19f0c9943a3fe9824`, captured 2026-10-02 00:08 UTC before the baseline release (§48); historical recovery evidence |

After a subsequent release, rollback means switching the Worker to this version.
It restores the previous code/assets, retaining the earlier QA fixes and Morrowind
theme while dropping QA-26, the twelve-item polish batch and QA-27–30. Database
writes, migrations and Clerk accounts remain intact; database recovery is a
separate operation. Preserve §§48–49 as the earlier release's historical recovery
record. This entry records the selected target only; no rollback or deployment
was executed. Capture a fresh D1 bookmark when preparing the next deployment.

## 58. Main branch release deployed to production — 2 October 2026

Owner-authorized release **`250b1b5425dbc514bbd2f97dbec8c7841f3edd22`** is live
as Worker **`73df6e58-912e-48db-9786-5866ce793efd`**, tagged `250b1b5`, at
**100% traffic**. Deployment was completed **2026-10-02 04:47:09 UTC** (01:47 in São Paulo).
This publishes QA-26 (edited premade endgame kits dynamic scoring), the twelve-item
launch polish batch, and QA-27 through QA-30 (Health forecast formatting without floating-point
noise, END 100 target milestone marker, phone premade category wrapping, and selected Alchemy
apparatus label widening).

Selected code rollback target is **`e29663d3-68eb-45ff-bbef-13447c3b0cbf` / `6fab4c5`** (§57);
fresh D1 recovery bookmark is **`00000073-00000000-000050f8-07bcfcc5cabac281c64e4bebf751ce41`**.
Rolling back this release means switching the Worker version. No migration, database
restore or Clerk-account change is involved.

Built and deployed the clean `main` checkout, with the existing staged bundle,
production Clerk publishable key (`pk_live_...`) and unchanged repository configuration.
Wrangler used `--keep-vars`; existing bindings and custom domains remain. Uploaded 66
changed assets; 1,685 were already uploaded. Deployment history and version annotations
confirm the released commit.

| Check | Result |
| --- | --- |
| Pinned release `npm test` | **1,184 passed, 0 failed, 0 skipped, 0 TODO** |
| `npm run build:cloudflare` | **24 pages generated**, production Clerk live key |
| Wrangler dry run | Passed before publishing; version 4.134.0, existing D1 binding and routes |
| Live HTTP checks | **9/9 verified**: homepage (200), builder (200), alchemy (200), leveler (200), travel (200), current.json bundle pointer (200), www redirect to apex (301), unauthenticated /api/account (401), unauthenticated /api/saves (401) |
| Security headers | Live responses verify `nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and HSTS |
| Pipeline | **685 tests passed** cleanly |

Evidence: `A:/Cache/deploy-250b1b5-20261002/`: recovery metadata (`recovery.json`),
deployed version inspect (`release-version.json`), rollback version inspect
(`rollback-version.json`), deployment list (`deployments.json`), and live endpoint
audit (`live-http.json`).

## 59. Signed-out live retest of `250b1b5` — 2 October 2026

A live-URL QA agent retested the release in §58 (`250b1b5` / Worker `73df6e58`),
signed out, in all three worlds, at 1366 and 375 px (SS-09 also 390), both themes for
layout checks. Local Vault fixtures were made with "Save this character".

| ID | Agent's verdict | Triage |
| --- | --- | --- |
| QA-26 | Fail | **Pass.** Edited Spear scout → Nord, Long Blade, Heavy Armor: the cuirass changes in every world (Vanilla Ebony Mail → Soscean's Cuirass; TR/ARCE St. Nerevar → War Cuirass of Pasoroth) and TR rings change; the unedited kit keeps its own. "Based on …" is QA-05's intended title. Copy follow-up QA-39 |
| QA-27 | Partial | Pass for the noise (498.5 / 208 / −290.5 HP); new "-0 HP" for a zero difference (QA-37) |
| QA-28 | Pass | "Endurance 100 at Lv 15" shown at the endpoint |
| QA-29, QA-30 | Pass | Category names and "Journeyman's (1x)" whole at 375 px, both themes |
| SS-08, SS-09 | Pass | "Viewing Mages Guild"; Prev, Next, Acrobatics whole at 375/390 |
| SS-10 | Pass | Search says "1 rank"; Faction Journal details still say "1 ranks" (QA-38) |
| UI-03, UI-04, UI-05 | Pass | Seed error cleared; 0% chances; TR counts labelled (490 stops / 101 mapped / 201 connections) |
| SUS-02 | Pass | Totals equal the leg sums; rounding explained |
| FLOW-01 | Pass | On Strike disabled on rings and shirts, enabled on a weapon |
| F10 | Partial | No raw IDs; TR reverse-pair list overlaps its "Show more pairs" area at 1366 (QA-34) |
| F-13 | Partial | Close and Load whole at 375; Duplicate exists only on cloud cards (covered by the signed-in suite, §54) |
| F-7 | Fail | Tested the Builder's local list, not the cloud card F-7 fixed: deleting a local character is immediate, with no confirmation and lost focus (**QA-31**) |
| QA-07 | Fail | Tested the global search, not Travel: "Ald'ruhn" finds nothing there in any world (**QA-32**) |
| QA-01, QA-09, QA-16 | Pass | 75 / 120 points; all ten popovers on screen; Ebonheart→Mournhold by Dialogue Teleport |
| Layout | Partial | 1366 readable; at 375 px mid-word breaks on Home and Builder (QA-35) and a cramped Morrowind Travel map heading (QA-36) |

Also found: an unedited Spear scout starts with One-handed + shield and is offered a short
blade and shield (QA-33). An unconfirmed collapse-all anomaly and a Vanilla Bread-source
question were not reported as bugs. Triage: checklist section 5 item 18 (QA-31, QA-32,
before the freeze) and section 4 (QA-33 to QA-39).

## 60. QA-31 — confirm deletion of local characters — 2 October 2026

Branch: `fix/qa-31-32-local-delete-search`, from main `ae5520d`. The new opening
regression failed on unchanged main: clicking Delete immediately removed the
selected record from browser storage. The Builder now reuses ConfirmationDialog:
Cancel is focused first, Tab stays inside, Escape/Cancel preserve storage and
restore the opener. Confirmation removes the selected ID only, announces storage
failure inside the dialog, and focuses the next/previous saved character or
Save this character after the list updates. Missing IDs cannot request deletion;
an entry removed in another tab does not delete another character.

| Verification | Result |
| --- | --- |
| Full site suite | **1,191 passed, 0 failed, 0 TODO** |
| Targeted local-save and cloud-delete tests | **25 passed** |
| Chrome QA-31 | **12 passed**, Vanilla/TR/TR + ARCE, Modern/Morrowind, 1366/375 px |
| Real-touch Chrome QA-31 | **2 passed**, Vanilla, both themes, 375 px |
| Modal/focus/accessibility | Confirmation fits; selected data stays intact until confirmed; remaining/empty focus works; no critical/serious axe findings |

Seven regression cases: `test/local-delete-confirmation.test.js`. Reusable browser
cases: `scripts/qa-local-save-search-browser-cases.cjs`, via `--suite qa --filter
'QA-31/'`; commands are in BROWSER_TESTS. Screenshots/logs/reports:
`A:/Cache/qa31-32/qa31-browser/`, `qa31-touch/` and `qa31-unit.log`.
The 375 px Morrowind confirmation screenshot was reviewed. Both player changelogs
record the behavior. No exported data/schema, migration, rebuild, merge or deployment.

## 61. QA-32 — global place-search spelling — 2 October 2026

Branch: `fix/qa-31-32-local-delete-search`, after QA-31 `2af6d1d`. The new
apostrophe regression failed before the fix: "Ald'ruhn" returned no place hit.
`lib/site-search.mjs` now compares joined normalized place names in `scoreEntry`
for exact/prefix matches; the existing word, keyword and typo paths remain.
`highlightRanges` maps joined matches back to the original characters. Displayed
labels and canonical stop IDs stay unchanged: selecting Ald'ruhn opens Travel
with Ald-ruhn as the destination. No data change or rebuild is needed.

| Verification | Result |
| --- | --- |
| Full site suite | **1,200 passed, 0 failed, 0 skipped, 0 TODO** |
| Targeted search tests | **19 passed**, including nine new QA-32 cases |
| Synthetic pipeline suite | **685 passed** |
| Chrome QA-32 | **12 passed**, Vanilla/TR/TR + ARCE, Modern/Morrowind, 1366/375 px |
| Real-touch Chrome QA-32 | **2 passed**, Vanilla, both themes, 375 px |
| Search/navigation/accessibility | All/Places search, Ctrl K on desktop, canonical labels/highlights and Travel handoff passed; no page overflow, critical/serious axe findings, console or runtime errors |

Regression file: `test/site-search-place-names.test.js`. It covers ASCII/curly
apostrophes, Unicode hyphens, joined/repeated spaces, Sadrith Mora and Vos,
partial/reversed words, accented original offsets, rank/typo controls, blank and
unknown queries, and the staged Travel catalogs in all three worlds. Browser
cases in `scripts/qa-local-save-search-browser-cases.cjs` clear previous results
before each spelling, so deferred stale results cannot pass the next assertion.
The first Chrome attempt exposed a test selector error (group headings precede
options); it was corrected before the full successful matrix.

Commands: BROWSER_TESTS `--suite qa --filter 'QA-32/'`, with `--touch --filter
'QA-32/vanilla/375/'` for phone taps. Evidence: `A:/Cache/qa31-32/qa32-browser/`,
`qa32-touch/`, `qa32-unit.log` and `qa32-pipeline.log`. The Modern and Morrowind
375 px search screenshots were reviewed. Both player changelogs and the shared
COORDINATION handoff are updated. No schema, migration, merge or deployment.

## 62. QA-31/32 main integration — 2 October 2026

Owner-authorized no-fast-forward merge of `fix/qa-31-32-local-delete-search`
(`c5eb0ab`, including QA-31 `2af6d1d`) into clean, freshly fetched main `0d91ba0`.
The newer targeted browser planner from `e2d3d6e` is retained. Merge-tree preview
and the actual merge had no conflicts. Application files, Worker code and staged
data match the verified fix branch; configuration and dependencies match updated
main. The planner's Search/Vault mappings now include QA-32/QA-31 respectively,
and its obsolete missing-search-cases note is removed. Its nine tests pass.

Checks below ran on the pending merged checkout before committing. Pipeline
master `2928ad8` receives the coordination-only `handoff/qa-31-32` (`d359cf6`)
merge, with COORDINATION and UI_TRANSFORMATION identical between repositories.

| Verification | Result |
| --- | --- |
| Full site suite | **1,209 passed, 0 failed, skipped or TODO** |
| Synthetic pipeline suite | **685 passed** |
| Cloudflare build | **Passed, 24 static pages**, unchanged repository configuration |
| QA-31/32 Chrome | **28 passed**: three worlds, both themes, 1366/375 px, plus four real-touch phone checks |
| Builder regressions | **72 passed**: QA-05, QA-09, QA-12, QA-29; 390 px also covered for popovers and premade headings |
| Settings and search integrations | **20 passed**: four settings, four SS-10 and twelve ingredient-label/search checks |
| Configure real-touch popovers | **5 passed** |
| Synthetic signed-in Vault | **18 passed**: ten existing workflows and eight F-7 page/window deletion, cancellation, conflict, keyboard and focus checks |

Total: **143 targeted Chrome checks** from sixteen complete reports, all with
zero runtime/server errors. Public reports also contain no console errors.
Screenshots and scoped axe checks pass; the merged phone confirmation and search
screenshots were reviewed. Synthetic saves, settings, tiers and account profiles
are removed from both disposable local test databases, verified with counts.

Evidence: `A:/Cache/qa31-32-merge/acceptance-summary.json`, `unit.log`,
`pipeline.log`, `build.log`, `cleanup-summary.json` and each named browser folder.
Public groups use 120-second limits; the Vault build-plus-run used 180 seconds,
and the separate already-built cloud-delete run used 150 seconds. No incomplete
report is accepted. This is targeted pre-freeze validation of the application
paths changed by the fixes; the browser-runner edit only registers their case
module. Full freeze acceptance remains the checklist's separate final task.
Synthetic Clerk sessions do not replace the live provider or physical-device
check. Both player changelogs retain the fixes. Production release history,
bundle `a29adea046e6086c2c7ee654`, migrations and rollback choice are unchanged.
No data rebuild, production write or deployment.

## 63. QA-33–39 ordered polish — 2 October 2026

One branch: `fix/qa-33-39`, from freshly fetched main `39a82db`. Each item is
committed after its relevant tests; full validation follows the seventh item.
No data, schema, migration or production changes.

### QA-33 — weapon setup

Cause: GearAdvisorView initialized a permanent one-handed default. The default
now uses gearRanking’s primary weapon, including restored/edited builds, until
the player chooses. Spear/Marksman use two hands; other/missing weapons use one.
54 relevant tests passed, including three new edge/component cases in
`test/gear-weapon-default.test.js`; 12 Chrome QA-33 cases passed across three
worlds, both themes and 1366/375 px, with screenshots/axe and manual overrides.
Nine planner tests passed. An initial selector quotation error was corrected.
Evidence: `A:/Cache/qa33-39/qa33-final/`. No merge or deployment.

### QA-34 — reverse-pair pagination

The TR/Morrowind 1366 px reproduction found the footer touching the 320 px
scroll viewport exactly; the third partially visible card is clipped by that
viewport, not covered by an overlapping button. Explicit grid spacing now puts
12 px between list and pagination and keeps the button at its natural width.
28 reverse-Alchemy/live/source tests and 12 Chrome cases passed in three worlds,
both themes and 1366/375 px. All 24 measured list/button states retain at least
8 px separation; last-pair selection and output focus pass. Screenshots reviewed.
Evidence: `A:/Cache/qa33-39/qa34-before/` and `qa34-final/`.

### QA-35

Cause: body-wide anywhere wrapping plus shrinking action rows broke short labels.
Home keeps identity labels intact; loadout actions wrap as whole buttons; premade
Specialization footers wrap at spaces and move Load Build below when necessary.
44 relevant Home/premade/equipment tests and six Chrome cases passed at 375/390/
1366 px in both themes. The first browser assertion also inspected unrelated
premade titles; the accepted case checks the requested footer and labels.
Evidence: A:/Cache/qa33-39/qa35-accepted/. No behavior or data change.

### QA-36

Cause: a fixed 280 px minimum scaled SVG text down inside narrower panels; region
width estimates omitted tracking; heading/counts could crowd one row. TransitMap
now measures its real panel width, wraps a spaced header, uses 12 px region and
13 px stop labels, and includes tracking/clamping in region placement. Legend
and region copy use stronger readable text tokens. Routing and map positions
are unchanged. 38 relevant map/layout tests and 18 Chrome cases passed across
all worlds, both themes, 375/390/1366 px. Three new edge tests cover resizing,
region edges, empty/singular maps. Browser waits for measured SVG sizing before
checking containment and font size. Evidence: A:/Cache/qa33-39/qa36-accepted/.

### QA-37

Cause: the loss caption prepended a minus sign outside formatHealth, producing
-0 even though the formatter already collapses signed zero. It now formats the
signed value itself. Precision and progression calculations are unchanged.
27 relevant Health/chart tests passed, with three new component regressions for
zero at level 55, a short zero-loss forecast and a nonzero fractional-start case.
Four Chrome cases with an Endurance-100 synthetic save passed at desktop/phone
widths in both themes. Evidence: A:/Cache/qa33-39/qa37-final/.

### QA-38

Cause: FactionDetailView always appended ranks for any nonempty rank list.
Its caption now uses rank for one and ranks for multiple; non-joinable factions
remain unchanged. 24 relevant Journal/faction tests passed, including explicit
zero/one/ten-rank component cases on frozen records. Twelve Chrome cases passed
for Twin Lamps in all worlds, both themes and desktop/phone widths. The runner
checks the exact caption node, avoiding concatenated neighbouring text.
Evidence: A:/Cache/qa33-39/qa38-accepted/.

### QA-39

Cause: BestInSlotView described the premade source title as a class archetype.
The explanation now says the kit is ranked for this character’s current attributes
and skills. Edited/custom names no longer appear as archetypes. Ranking, source
identity labels elsewhere, unchanged-premade picks and equipment eligibility are
preserved. 42 relevant kit/loadout/identity tests and 12 Chrome cases passed;
each browser case checks unchanged, edited and custom characters in all worlds,
both themes and desktop/phone widths. Existing QA-26 checks retain full-kit
comparisons and current Builder identity while enforcing the updated copy.
Evidence: A:/Cache/qa33-39/qa39-final/. No merge or deployment.

### Full preparation after all seven items

The ordered fix commits are QA-33 `43cd17c`, QA-34 `c66658e`, QA-35 `24a6b1b`,
QA-36 `cfdc2a3`, QA-37 `9b15341`, QA-38 `4382a01` and QA-39 `319e2d8`.
Full verification uses the completed application at `319e2d8`, the unchanged
staged bundle `a29adea046e6086c2c7ee654` and repository build configuration.

| Check | Result |
|---|---|
| Site `npm test -- --test-concurrency=4` | 1,221 passed; zero failed, skipped or TODO. Repeated after the final runner/planner edits. |
| Pipeline synthetic `python -B -m unittest discover -s . -p "test_*.py"` | 685 passed; no uncaught warnings. Repeated before the docs-only handoff commit. |
| `npm run build:cloudflare` | Passed; 24 static pages. No configuration changes. |
| General browser matrix and tool suites | 203 passed, including every route, calculators, Builder, Travel, Journal, Simulator and settings. |
| QA regressions | 442 passed, including 76 new QA-33–39 cases and all retained QA groups. |
| Launch polish | 68 passed. |
| First-navigation hydration | 432 passed across all 15 real routes, both themes, 1366/375 px, fresh/stored-world/save/build-link/challenge-link states. Home and Builder each retain ten fresh repetitions per width/theme. |
| Real mobile touch | 31 passed, including all 20 saved-Travel repetitions, plus 30 popover regressions at 375/390/1366 px. Touch capability assertions pass before interactions. |
| Local signed-in Vault suites | 66 passed: base, launch, character/world preservation, sign-out and sharing. Synthetic identities and disposable local databases only. |

Total: 1,272 passing case executions in complete accepted Chrome reports.
All accepted reports have zero runtime/server errors, with screenshots, overflow
and scoped axe checks where the suite supports them. The strict missing-page
hydration report separately records 24 intended HTTP 404 console errors and no
other console messages, hydration warnings or exceptions. These are covered by
the checklist's explicit expected-404 exemption; the raw report is not called green.
The touchscreen-laptop control separately fails its capability assertion:
Chrome reports touch=5, fine=false, coarse=true. A physical touch-plus-fine-pointer
device remains an owner freeze check; no application patch is inferred from that.

Incomplete aggregate long-walk, touch, touch-popover, QA-30 and QA-32 groups are
excluded and replaced by complete smaller filters. Empty Cathay-raht/Suthay filters
are excluded and replaced with matching canonical-name filters. An initial local
Vault phone case focused a not-yet-enabled control; the runner now waits for it,
and the complete 16-case character suite passes on rerun. QA-35 checks every
Specialization footer and QA-37 explicitly asserts target level 55.

Evidence: `A:/Cache/qa33-39/full-browser/`, `acceptance-summary.json`,
`unit-final.log`, `pipeline-final.log`, `build-full.log` and
`synthetic-cleanup.json`. The six local Vault databases contain zero remaining
saves, settings, tiers or profiles after removing only the known synthetic users.
COORDINATION and UI_TRANSFORMATION are identical across repositories; pipeline
changes are a docs-only handoff. Freshly fetched site main remains `39a82db`;
the merge-tree preview is conflict-free. Test servers are closed after verification.
Prepared on branches only: no merge, push, migration, production write or deploy.

## 64. QA-33–39 main integration — 2 October 2026

The owner authorized merging and pushing the prepared work. Freshly fetched site
main was still `39a82db`; pipeline master was still `316f384`. Non-fast-forward
merges integrate site `fix/qa-33-39` (`b0cab55`) and pipeline's docs-only
`handoff/qa-33-39` (`01cd353`) without conflicts. The merged application files
match the fully verified branch; pipeline source is unchanged.

Merged-checkout unit verification: 1,221 site tests and 685 pipeline synthetic
tests passed, with no failures. Evidence: `A:/Cache/qa33-39/unit-merged.log` and
`pipeline-merged.log`. The unchanged application retains §63's successful
24-page Cloudflare build and 1,272 passing complete Chrome case executions,
including the separately recorded expected-404 exemption and the physical
touchscreen-laptop check. No incomplete report is accepted.

The checklist marks all seven items merged with this commit. COORDINATION and
UI_TRANSFORMATION remain byte-identical in both repositories. No migration,
dataset rebuild, production write or deployment; production's existing release
and rollback records are unchanged.

## 65. Beginner clarity and copy batch — 2 October 2026

Branch `polish/beginner-clarity-batch`, from freshly fetched main `d3e33ea`.
The owner requested one branch, seven ordered item commits with relevant tests
only between items, then full merge preparation. The owner subsequently added FLOW-04, FLOW-03 and
F-12 after Copy, deferring the full suites until those are complete.
No data rebuild, schema, migration or production changes.

### Beginner clarity

| Finding | What the player now sees |
|---|---|
| U01 / U02 / F09 | Start with Builder; choose installed content; Vanilla is the unsure/new-player choice; ARCE is All Races and Classes Enabled. |
| U03 | The unsupported `.ess` notice explains manual entry, with a Builder button beside save-opening flows. |
| U05 | Configure help puts loaded race attributes for the selected sex, skill bonuses and birthsign bonuses/powers before lore. Missing facts get a generic explanation, not invented numbers. |
| U06 / U08 | Sheet numbers explain included bonuses and vitals; a game-entry checklist carries the chosen race, class, specialization, favored attributes, skills and birthsign. It says the site does not edit the game or save. |
| U10–U13 | Home names the Gear Advisor path; its guide distinguishes one wearable kit from alternatives, plan transfer from in-game acquisition, purchase/find/theft, and absent/capped evidence. |
| U14 | Import differences explain site fallbacks, extra mods, selected world and possible changed results, while the original save file is untouched. |
| U16 / U17 / U19 | Current save position differs from a named stop; legs/objectives/spells are defined; No Route offers world, stop, options and movement checks, including enabling walking when it is off. |
| U21 / U22 | Alchemy defines tools, quality, magnitude and duration, and explains recovery from no shared effect, zero chance and zero-strength output. Apparatus does not change brew chance. |
| U24 / U25 / U27 | Leveling explains the ten class-skill increases, Miscellaneous skills, +5 attribute points, step order, Endurance and the practical skill-cap difference between views. |

163 relevant unit tests passed, including six new cases for frozen catalog facts,
sex-specific help, no-bonus/missing/nonnumeric records, actual game-entry choices,
manual navigation and save differences. The 60 new Chrome guidance cases pass
across all worlds, both themes and 1366/375 px. Initial Home wording differed in
capitalization from the retained first-step check; its existing wording is kept.
One initial Builder axe audit sampled still-loading disabled gear controls; the
runner now waits for both gear tables and the complete 12-case rerun passes.
Screenshots of phone Home and No Route recovery reviewed. Evidence:
`A:/Cache/clarity-batch/beginner-unit-final.log`, `beginner-home`,
`beginner-builder-final`, `beginner-travel`, `beginner-alchemy`, `beginner-leveler`.
The retained 12 identity and 30 phone/desktop popover cases also passed:
102 complete browser cases accepted, zero runtime/server errors.


### F04 / F11 — separate premade collections

By Race now names its separate race-themed collection and reports shown/total
counts, including ARCE entries only in TR + ARCE. By Playstyle retains its own
41 builds; switching to By Race changes the first-visit hint to “Pick a race”.
No builds, selection behavior or ordering changed.

36 relevant unit tests passed, including three world-specific collection cases.
12 new Chrome collection cases passed across all worlds, both themes and
1366/375 px, including an empty search and switching back to By Playstyle.
The retained QA-12 explanation cases (12) and QA-29 phone grouping cases (18)
also passed: 42 complete cases, zero runtime/server errors. Evidence:
`A:/Cache/clarity-batch/collections-unit.log`, `collections`,
`collections-explanations` and `collections-phone`.


### CALC-4 note — pairs and world changes

The finder explains its two-ingredient limit, adding a third/fourth ingredient
in the calculator, and deliberate recipe clearing on a world switch. It also
states the narrower typed-stat behavior: values remain while the page is open,
until Reset to character sheet. No recipe or persistence logic changed.

30 relevant Alchemy/stat/claim unit tests passed. 12 new Chrome cases passed
across all worlds, both themes and 1366/375 px: choose Restore Health, use a pair,
type Alchemy 60, switch worlds without reloading, check empty effect/ingredient
choices and retained 60, then reset to the sheet. Scoped axe/overflow checks pass,
with zero runtime/server errors; phone screenshot reviewed. Evidence:
`A:/Cache/clarity-batch/calc4-unit.log` and `calc4/`.


### Gear note — open helmets for beast races

Both Early game and Optimized endgame kit notes name the closed-helmet/boot
exclusion and explicitly keep compatible open helmets, with Helm of Oreyn
Bearclaw as the example. Body-part eligibility, scoring and picks are unchanged.
The staged BestInSlot metadata marks that named helmet wearable in every world.

64 relevant gear unit tests passed. 20 retained QA-10 Chrome cases passed across
both themes and 1366/375 px: Argonian in Vanilla/TR, Khajiit, ARCE Cathay-raht and
High Elf as a non-beast control. They check both notes (absent for the control),
both weapon setups, all runner-ups and equipped transfers. Zero runtime/server
errors. Evidence: `A:/Cache/clarity-batch/gear-unit.log`, `gear-argonian`,
`gear-khajiit`, `gear-arce` and `gear-control`.


### F-11 — required username for profile icons

Account help explicitly requires a username to save the profile, including its
icon. Profile validation and account/preference behavior are unchanged.

22 relevant account/profile/preference unit tests passed, with empty, invalid
and valid username cases. Initial component stubs had incorrect default exports
and unstable mock profile identity; those test fixtures are corrected. Four
signed-in local Worker Chrome cases passed in both themes at 1366/375 px: choose
an icon with an empty username, confirm native required-field blocking and an
unchanged API profile, enter a valid username, save and read back icon 4. The
initial browser assertion expected null instead of the API's empty string;
the final cases compare the whole profile before/after the blocked save.
Scoped axe/overflow checks pass; zero runtime/server errors; phone screenshot
reviewed. Only `user_qa_clarity` was used, with its local saves, settings, profile
and tier removed after every case. Evidence:
`A:/Cache/clarity-batch/profile-unit-final.log` and `profile-browser-final/`.


### F-17 — unavailable versions and rename limit

Disabled Mod version selection now says “Not available yet”, with a note that
tools currently consume the published dataset. Vault rename accepts 120
characters, matching the unchanged API and database limit.

55 relevant settings/Vault/API unit tests passed, including 100/101/120-character
rename cases with revision preservation. The initial invocation omitted the
repository's `--experimental-sqlite` flag; its corrected rerun passes. Four local
signed-in Chrome cases pass in both themes at 1366/375 px: unavailable selection,
native typing limited to 120, successful stored rename, explicit API rejection
at 121 and the stored name unchanged after rejection. Scoped axe/overflow checks
pass; zero runtime/server errors; phone screenshot reviewed. The same disposable
`user_qa_clarity` records are removed after every case. Evidence:
`A:/Cache/clarity-batch/f17-unit-final.log` and `f17-browser/`.


### Copy — U07 / U09 / U15 / U18 / U29

Preset help explains switching to Custom while keeping current choices. Clear
search restores the selected premade collection and focuses its input without
loading a character. Save help defines content files as game/expansion/mod files
and explains copying an OpenMW save to a phone-accessible folder. Travel shows
remaining saved gold or the shortfall only when both balance and fare are known;
fare calculation and affordability warnings are unchanged. Home's descriptions
use plainer words, retaining the OpenMW 0.51 calculation-source claim.

95 relevant unit tests passed, including four balance boundaries, invalid/unknown
money, collection clearing in three worlds and full/compact content-file notices.
48 new Chrome cases passed across all worlds, both themes and 1366/375 px:
preset-to-custom choice preservation, clear-search focus, Home wording, Vault
content-file/phone help and saved-gold captions compared with the route's displayed
fare. The initial Travel test looked for Vault-only content help; that check now
runs on Vault. Its first fare parser also lost a regex escape; the final smaller
world groups use explicit numeric matching. Only complete passing reports are
accepted; zero runtime/server errors; scoped axe/overflow checks and phone Travel
screenshot reviewed. Evidence: `A:/Cache/clarity-batch/copy-unit.log`, `copy-builder`,
`copy-home`, `copy-vault-final` and `copy-travel-{vanilla,tr,tr_arce}`.


### FLOW-04 — Propylon re-check and chamber-link preservation

No published profile directly connects Rotheran to Andasreth. Ordinary Andasreth
Index (`index_andra`, `warp_andra|1`) works from Berandas/Hlormaren; Rotheran's
ordinary branches lead to Indoranyon/Valenvaryon. The Master Index diverts through
Caldera and Folms Mirel to Andasreth. Carrying one ordinary index does not imply
an arbitrary direct Propylon journey, so the report's direct-link condition is
not met and no direct edge is invented.

A separate wrong-endpoint failure was reproduced: on first load with a saved
index, valid chamber links could be replaced with fallback towns before carried
items were restored. `TravelWorkstation`'s selected-stop validation now waits for
ready catalogs and recognizes published interior cells even while their teleport
is unavailable. Such a link remains selected with No Route rather than becoming
a different trip. Its label uses the published room name. Teleport eligibility,
connections and route scoring are unchanged.

88 relevant Travel tests passed. Before the fix, the controlled save-late and
index-absent chamber tests failed; catalog-late is also retained. Twelve staged
cases cover missing/wrong indices, direct neighboring chambers and Master
Index diversion across all worlds. Twelve Chrome cases pass across all worlds,
both themes and 1366/375 px: loaded ordinary index gives one Berandas → Andasreth
leg; loaded Master Index gives two Rotheran → Caldera → Andasreth legs. Zero
runtime/server errors; scoped axe/overflow checks pass. The initial aggregate
browser report timed out after reproducing the endpoint reset; it is excluded.
Evidence: `A:/Cache/clarity-batch/flow04-before.log`, `flow04-unit-final.log` and
`flow04-{vanilla,tr,tr_arce}-final/`.


### FLOW-03 — enforce existing faction exclusions

The Journal warned about a rival but its Join action unconditionally appended a
membership. `toggleMembership` and `updateMembership` now enforce the existing
`getMutualExclusionConflict` rules for new joins. The button is disabled with an
associated explanation naming the current faction. Leaving remains available;
compatible guilds coexist; an expelled membership still counts; ordinary
unjoined mentions do not. Existing conflicting imported memberships are retained
and remain editable/removable, rather than silently rewriting the save.

This applies the existing Hlaalu/Redoran/Telvanni and vampire-clan groups; it does
not infer additional TR quest or membership rules from faction names alone.
53 relevant faction/import tests passed, including each Great House against both
rivals, direct rank-update bypasses, case-insensitive keys, blank keys, malformed
mentions, leaving, unrelated guilds and conflicting imported saves. Twelve Chrome
cases pass across all worlds, both themes and 1366/375 px: Hlaalu blocks Redoran
and Telvanni; leaving allows Redoran; Mages Guild remains compatible; Hlaalu then
shows Redoran as its conflict. Scoped axe/overflow checks pass; zero runtime/server
errors; phone screenshot reviewed. Evidence:
`A:/Cache/clarity-batch/flow03-unit.log` and `flow03-{vanilla,tr,tr_arce}/`.


### F-12 — recorded Vault locations; preset class labels deferred

The API and cloud-save codec provide `cell`, but CloudVaultCard read only
`cell_name` and substituted Vvardenfell. Cards now use the recorded API location,
retain the legacy alias and say Not recorded for missing or malformed locations.
Recorded class names already render correctly. Preset OpenMW saves can contain
only a class ID (`mage`) and no name: that remaining catalog-resolution work
moves after launch under section 4's explicit condition, rather than inventing
a name or loading more data in this bounded fix.

52 relevant Vault/codec/API tests passed. All four new tests failed before the
fix; they cover three actual codec/API location records and API/legacy precedence,
empty, null, whitespace and malformed values. Four signed-in local Worker Chrome
cases pass in both themes at 1366/375 px: recorded Old Ebonheart and a saved custom
class name display, and a build with no location says Not recorded. The API
metadata is retained; scoped axe/overflow checks pass; zero runtime/server errors;
phone screenshot reviewed. Only `user_qa_clarity` was used and its disposable
records were removed after every case. Evidence:
`A:/Cache/clarity-batch/f12-before.log`, `f12-unit.log` and `f12-browser/`.


### Full preparation after all ten items

Ordered item commits: Beginner clarity `c1f6b25`, F04/F11 `69647b1`, CALC-4 note
`f66816b`, Gear note `833aedb`, F-11 `622b09e`, F-17 `213fa59`, Copy `692e8bb`,
FLOW-04 `3dfafb9`, FLOW-03 `b26b6b7` and F-12 `d1bbad9`. The completed application
was checked at `d1bbad9` with staged bundle `a29adea046e6086c2c7ee654`; the final
preparation changes only documentation, runner readiness/captures and tests.
Repository build configuration and published data are unchanged.

| Check | Result |
|---|---|
| Site `npm test -- --test-concurrency=4` | 1,270 passed; zero failed, skipped or TODO. Repeated after the final runner edits. |
| Cache-isolated pipeline synthetic tests | 685 passed; no uncaught warnings. Pipeline source is unchanged. |
| `npm run build:cloudflare` | Passed; 24 static pages. |
| General browser matrix and tools | 203 passed across all worlds, including every route, calculators, Builder, Travel, Journal, Simulator and settings. |
| QA regressions | 598 passed: 442 retained cases plus 156 new public batch cases. Both themes and 1366/375 px; retained phone checks also cover 390 px. |
| Launch polish | 68 passed. |
| First-navigation hydration | 432 passed across all 15 real routes, both themes and widths, fresh/stored-world/save/build-link/challenge-link states. Home and Builder retain ten fresh repetitions per width/theme. |
| Real mobile touch | 31 passed, including all 20 saved-Travel repetitions, plus 30 touch-popover regressions. Device capability assertions pass before interactions. |
| Signed-in local Worker/Vault | 78 passed: base, launch, character/world preservation, sign-out, sharing and twelve new F-11/F-17/F-12 cases. Synthetic identities and disposable databases only. |

Total: 1,440 passing case executions in complete accepted Chrome reports, all
with zero runtime/server errors. Reports retain commit/bundle metadata, screenshots,
loaded fonts, overflow and scoped axe checks where supported. The final F-12 phone
capture centers the changed card and visibly shows Old Ebonheart, the recorded
class name and Not recorded for a missing location.

The first full unit pass found a stale Home-description assertion. Its required
feature coverage now follows the plainer copy, retaining all nine tools, description
bounds and the OpenMW 0.51 source claim. The browser planner maps the new case
groups and lists the additional `test:vault -- --clarity` mode.

One initial local character-preservation report had three modal focus failures:
opening the dialog refreshes its prefetched list, so the runner's separate ready
and focus reads could span a loading replacement. The runner now checks and
focuses the same enabled node and verifies it survives paint. The complete
sixteen-case rerun passes; the failed report is excluded. No application patch
was needed for that runner race; every other full group completed within its bound.

The strict missing-page report separately records 24 intended HTTP 404 console
errors with no other errors, hydration warnings or exceptions, under the checklist's
explicit exemption. Its raw report is not called green. The CDP touchscreen-laptop
control separately fails its capability assertion (touch=5, fine=false, coarse=true);
a physical touch-plus-fine-pointer check remains for the owner's freeze acceptance.
Neither report is included in the 1,440 passing cases. F-12's ID-only preset class
labels remain explicitly after launch, as recorded above.

Evidence: `A:/Cache/clarity-batch/full-browser/`, `acceptance-summary.json`,
`unit-final.log`, `pipeline-full.log`, `build-full.log` and `synthetic-cleanup.json`.
All thirteen disposable local databases contain zero saves, settings, profiles
or tiers after removing only the known synthetic users. Test servers are closed
after verification; cache evidence is retained and temporary helper scripts removed.
COORDINATION and UI_TRANSFORMATION are byte-identical across repositories;
pipeline changes are a docs-only `handoff/beginner-clarity-batch` branch.
Freshly fetched site main remains `d3e33ea` and pipeline master `d4867b3`;
the site merge-tree preview is conflict-free. Prepared branches only: no merge,
push, production write, data rebuild, migration or deployment.

## 66. Beginner clarity batch main integration — 2 October 2026

The owner authorized merging and pushing the prepared batch. Freshly fetched
site main remains `d3e33ea` and pipeline master `d4867b3`. Non-fast-forward merges
integrate site `polish/beginner-clarity-batch` (`133b7ef`) and pipeline's docs-only
`handoff/beginner-clarity-batch` (`a601a8a`) without conflicts. The checklist marks
the ten bounded items merged; F-12's ID-only preset labels remain after launch.

The merged application, data, configuration and runners match the fully verified
branch; integration changes only completion/coordination records. Merged-checkout
unit verification: 1,270 site tests and 685 pipeline tests passed, with zero
failures. Evidence is recorded in `A:/Cache/clarity-batch/unit-merged.log` and
`pipeline-merged.log`. The unchanged application retains §65's successful
24-page Cloudflare build and 1,440 accepted Chrome case executions, with the
expected-404 report and physical touchscreen-laptop check recorded separately.
No failed or incomplete report is accepted.

COORDINATION and UI_TRANSFORMATION remain byte-identical across repositories.
Only the task's verified dev server was closed. Disposable local data is cleared;
cache evidence remains. No production write, dataset rebuild, migration or
deployment; production and rollback records are unchanged.

## 67. Recovery record before deploying `672c0d3` — 2 October 2026

The owner authorized deploying **`672c0d353414f078e499e199c44ca54c739b68be`**
and selected **`73df6e58-912e-48db-9786-5866ce793efd`** as the code rollback target.
This recovery record was written before publishing the release.

| Recovery fact | Checked value |
| --- | --- |
| Selected rollback Worker | `73df6e58-912e-48db-9786-5866ce793efd`, tagged `250b1b5` |
| Rollback code | `250b1b5425dbc514bbd2f97dbec8c7841f3edd22`; deployed 2026-10-02 04:47:09 UTC and still at 100% before this release |
| Release source | Clean `main` and `origin/main` at `672c0d353414f078e499e199c44ca54c739b68be` after fetch |
| Bundle retained | `a29adea046e6086c2c7ee654` |
| Extraction snapshot | `1613a1123ed9f5102fa3b266df33a4820d0128e9a9bdf680b8b7a1b40296fd1f` |
| Production D1 | UUID `141a1409-3956-4267-a078-02483bbb2bf6`, existing `DB` binding |
| Fresh D1 bookmark | `00000074-00000000-000050f8-6b7a252ad77140777ca900210cc70b77`, captured 2026-10-02 23:42:41 UTC (20:42:41 in São Paulo) |
| Migration state | 0001–0007 applied; Wrangler confirms no pending migrations |
| Release validation | 1,270 site tests passed, zero failures/skips/TODOs; production Cloudflare build generated 24 static pages |

The bookmark and migration names were obtained through read-only Cloudflare API
requests. No database export, restore, migration or account change was made.
The pre-release build ran at the exact requested source commit with the existing
staged catalogs, production Clerk live key and unchanged repository configuration.
Any subsequent recovery/release-record commits change documentation only; deploy
the already-built assets tagged `672c0d3`, without rebuilding from a documentation commit.

A code regression can be rolled back by switching the Worker to the selected
version. Its assets/code are restored while D1 writes, migrations and Clerk
accounts remain. The fresh bookmark is a separate database-incident recovery
point, not an instruction to restore the database during a code rollback.
Historical recovery records in §§57–58 remain unchanged.

Evidence: `A:/Cache/release-672c0d3/`: `recovery.json`, `pending-migrations.log`,
`build-source.txt`, `preflight-hashes.json`, `build.log` and `unit-preflight.log`.

## 68. `672c0d3` deployed to production — 2 October 2026

Owner-authorized release **`672c0d353414f078e499e199c44ca54c739b68be`** is live
as Worker **`56a07cb7-4daf-4e8c-8348-9da01b18cbdc`**, tagged `672c0d3`, at
**100% traffic** since **2026-10-02 23:46:37 UTC** (20:46:37 in São Paulo).
This publishes QA-31/32, QA-33–39 and the ten bounded beginner-clarity and
contained follow-up items recorded in §§60–66.

The selected rollback target **`73df6e58-912e-48db-9786-5866ce793efd` / `250b1b5`**
and fresh D1 bookmark **`00000074-00000000-000050f8-6b7a252ad77140777ca900210cc70b77`**
were recorded and pushed before deployment in recovery-record commit `febbc16`
(§67). No migration or database restore was performed. A code rollback switches
only the Worker version; database writes, schema and Clerk accounts remain.

The production build ran on clean main at exactly `672c0d3`, before the recovery
documentation commit. Only that documentation differed when the existing build
was deployed. Wrangler 4.134.0 used `--keep-vars` and the explicit `672c0d3` tag;
66 changed assets uploaded, 1,685 already present. Deployment history and version
annotations confirm the full requested commit and 100% allocation. Runtime
inspection confirms the existing D1 UUID, production Clerk live key, secret
bindings, compatibility date/flags, custom domains and API-only Worker routing.
Repository configuration and bundle pointer hashes remain unchanged.

| Check | Result |
| --- | --- |
| Release-source `npm test` | 1,270 passed; zero failed, skipped or TODO |
| Cloudflare production build | 24 static pages generated |
| Wrangler deployment dry run | Passed with existing configuration and bindings |
| Pipeline tests | 685 passed cleanly before the documentation-only release handoff |
| Live HTTP audit | 24/24 passed: fifteen public pages, expected 404, four signed-out APIs, www redirect with query, bundle pointer, manifest and JavaScript asset |
| Security and anonymous APIs | Live page headers retained; GET account/settings/saves/entitlements each returns 401, no account data and no Set-Cookie |
| Deployed data/assets | Bundle `a29adea046e6086c2c7ee654` retained; live manifest and sampled JavaScript bytes match the staged release |
| First-navigation hydration | 80/80 passed: ten fresh Home and Builder loads per 1366/375 px and theme combination; no console errors, hydration warnings or uncaught exceptions |
| Live beginner clarity and follow-ups | 156/156 passed across all three worlds, both themes and 1366/375 px; no runtime or server errors |
| Initial live QA-30–39 regression group | 117/118 passed; one QA-33/TR + ARCE/375/Morrowind case stopped with Premades selected and no Gear Advisor node; zero runtime/server errors. Retain this report as a finding, not full acceptance |
| QA-33 repeats | 12/12 passed in a separate complete three-world/theme/width matrix; the exact failed case passed twice separately |
| Complete passing live reports | 250 case executions: 156 clarity, 80 first-navigation checks, 12 QA-33 matrix cases and two exact-case repeats; the initial failing group is excluded |

All production browser checks are signed out, use isolated disposable Chrome
profiles and `--production-read-only`, which blocks API writes. Synthetic saves
and journal edits remain in browser storage; no production account/save was
created or changed. Signed-in behavior retains the passing 78 local Worker/Vault
cases from §65. Pre-merge acceptance recorded 1,440 passing complete Chrome
case executions, including mobile touch emulation; the new live finding below
is recorded separately. This release does not claim
to replace the freeze-day physical touchscreen-laptop or real sign-in checks.
F-12's preset labels when only a class ID is recorded remain deferred in section 6.

The first standalone HTTP probe used an overly narrow unauthorized-response
allowlist and rejected the existing public `message` field. The corrected probe
accepted that field and verified all four responses contain only error metadata;
no application change was made. The complete repeat is the accepted 24-check audit.

### Follow-up found during live verification: shared link matches the random starter

The failing QA-33 capture shows Premades selected. Its runner setup navigates to
a shared Spear Scout build, then immediately accesses `#gear-advisor` without
explicitly opening Sheet (`scripts/qa-33-39-browser-cases.cjs`, `setup` and QA-33).
Two exact-case repeats and a complete twelve-case matrix passed without changes.
No browser exception, hydration warning, server error or wrong weapon calculation
was observed; the recorded failure is the runner accessing a missing panel.

A separate deterministic, in-memory hydration diagnostic confirmed an underlying
first-visit edge case: forcing the random draw to the linked Argonian Spear Scout
loads the correct linked character but retains Premades. Drawing a different
starter opens the Custom Class Builder. `CharacterProvider` derives `isStarter`
from `sameCharacter(build, randomPick.current)` (`character-context.jsx`, line 131),
and `CharacterBuilderRoot` selects Premades when that flag is true. Explicitly
loading an identical character is therefore still classified as the random start.
The live random draw was not instrumented, so its precise causal match remains
an inference; the collision itself is reproduced by the controlled diagnostic.

This is a tab-selection follow-up, not a failed two-handed default: the character
is retained and the Sheet control remains available. No implementation or runner
fix is included in this deployment. Proposed follow-up: track explicit character
selection separately from value equality, cover the matching-starter link in a
hydration test, and have the gear runner explicitly select its intended section.
Evidence: initial failure HTML/PNG, all three rerun reports, and
`starter-collision-diagnostic.log` (the existing nine first-visit tests plus one
temporary diagnostic passed; the controlled collision and noncollision are logged).

Nineteen newly live checklist items were confirmed as ancestors of `672c0d3`
before marking them live. Shared coordination was copied identically to the
pipeline and pushed as `631aa2e`; UI_TRANSFORMATION is unchanged and identical.
Release documentation commits do not change the deployed application.

Evidence: `A:/Cache/release-672c0d3/`: recovery metadata and retained bundle,
`build.log`, `unit-preflight.log`, `dry-run.log`, `deploy.log`, `rollback-version.json`,
`release-version.json`, `deployments-before.json`, `deployments-after.json`,
`live-http.json`, `pipeline-release.log`, and the complete live Chrome reports
under `live-home/`, `live-builder/`, `live-clarity/` and `live-qa31-39/`, plus
`live-qa33-repeat1/`, `live-qa33-repeat2/`, `live-qa33-repeat-matrix/`,
`live-summary.json`, `starter-collision-diagnostic.log` and `unit-handoff.log`.

## 69. Signed-out live retest of `672c0d3` — 3 October 2026

A live-URL QA agent retested the release in §68 (`672c0d3` / Worker `56a07cb7`), signed
out, in all three worlds, at 1366 and 375 px, in both themes, with the supplied
Pe.omwsave for save checks.

| ID | Agent's verdict | Triage |
| --- | --- | --- |
| QA-31 | Pass | "Delete character?" confirmation; Cancel keeps it; focus starts on Cancel and returns to the panel; 12 combinations |
| QA-32 | Pass | "Ald'ruhn", "Ald-ruhn" and "Aldruhn" all find Ald-ruhn in every world; Sadrith Mora and Vos found |
| QA-33 | Pass | Spear and bow builds start Two-handed, sword-and-shield One-handed + shield; switching works |
| QA-34 | Pass | Restore Health pairs (55 Vanilla; 2,850 TR / TR + ARCE) stay visible above "Show more" |
| QA-35, QA-37, QA-38 | Pass | Whole labels at 375 px; no "-0 HP"; "Rank 1", "10 ranks" |
| QA-36 | Fail | Vanilla readable; TR / TR + ARCE "≈78 cells" annotation overlaps region labels at 375 px (QA-42) |
| QA-39 | Fail | **Triaged as copy, not stale data:** the Gear Advisor header's archetype is detected from the current skills, so an edited Spearman can still read "Melee Tank / Warrior". Wording follow-up in QA-45 |
| QA-26 | Fail | **Partly:** the kit re-ranks in every world, but Vanilla picked Sunder (blunt) after Spear → Long Blade; TR picked a long blade. Investigate as QA-40 |
| FLOW-03 | Pass | Join disabled for a rival House, with the reason |
| FLOW-04 | Partial | Chamber links keep "Andasreth › Propylon Chamber" in every world (4 legs, 43 gold). The save showed 0 of 39 carried items ticked (FLOW-04 save check) |
| F-12 | Partial | Cloud cards need an account; covered by the signed-in suite (§65) |
| QA-01, QA-09, QA-16 | Pass | 75 / 120 points; all popovers on screen; Ebonheart → Mournhold by Dialogue Teleport |
| First visit | Pass, except Travel terms | Home, `.ess` guidance, race and birthsign order, sheet explanation, game-entry checklist, By Race, beast note and Alchemy finder notes all read correctly. Travel terms and two Alchemy terms unclear (QA-45) |
| Layout | Partial | Fine except Travel map at 375 px (QA-42), Faction Journal sticky bar (QA-43), Enchanting Remove labels (QA-44) |
| Console | Partial | No application errors after load; first-load console history unavailable to the agent |

Also: Level Simulator "Total HP Gained" can show "+131.99999999999997" (QA-41, confirmed in
code). Not taken up: the `.ess` notice's missing space (the source has a space between the
sentences), the Imperial lore sentence (probably the game's own description, shown as
published; check the catalog text before editing it), and
observations the agent itself could not reproduce. Triage: checklist section 5 item 19
(QA-40, QA-41, FLOW-04 save check) and section 4 (QA-42 to QA-45).

## 70. QA-40, QA-41 and FLOW-04 save verification — 3 October 2026

Work is on `fix/qa-40-41-flow-04`, from freshly fetched main `f5ca4af`.
The owner requested these three items in order, relevant suites between items,
a commit after each item, then a branch push. Production stays at `672c0d3`;
no deployment, migration, schema or catalog rebuild is included. The owner later
authorized changing QA-40's scoring instead of keeping the initial explanation.

### QA-40 — score a usable primary weapon

Reproduced the exact Nord Warrior Spearman edit (Major skill 1: Spear → Long Blade).
`defaultWeaponSetup` correctly changes to One-handed + shield. The staged model
weights Major/Minor/Miscellaneous weapon damage at 8/5/1, capped at damage 60.
Sunder's score 22.2 is consistent with that policy: damage contributes 1;
Strength 20 and Endurance 20 contribute 6.4 each, Attack 30 contributes 6,
Luck 20 contributes 2.4. Its bonuses total 21.2. TR/ARCE's Neb-Crescen wins at
23.73: 7.73 from Major Long Blade damage and 16 from bonuses.

The initial explanation-only commit `9ca583c` retained that ranking; the owner
rejected it and authorized scoring changes. A second cause is the candidate pool:
Vanilla's BestInSlot contains no Long Blade, because it publishes only weapons
with constant effects. The runtime now supplements weapons with the existing
GearRows power shortlists and their acquisition evidence, resolving damage from
Weapons. It excludes missing records, incomplete evidence and bound summons;
constant-effect candidates keep their original sources and drawback rules.

The primary-weapon policy keeps the published 8/5/1 damage weights. Bonus points
are multiplied by the weapon's tier weight divided by the Major weight, and
their combined contribution is capped at the skill-weighted damage contribution.
Bonuses thus cannot turn a weak buff weapon into the strongest primary merely
by stacking unrelated benefits. They still improve good weapons, and a strong
off-skill weapon can beat a genuinely weak class weapon. This is an authored
ranking policy, not an engine damage/DPS calculation. Temporary enchantments
settle score ties using the existing build-worth function; they never become
permanent attribute bonuses.

For the reported edit, Vanilla now selects Goldbrand at **6.67**, Major Long
Blade, from the published Museum of Artifacts source (theft is stated). TR and
TR + ARCE select Neb-Crescen at **15.47**, Major Long Blade. Weapons are rescored
even for unchanged premades, while their published armor/clothing/jewelry remain.
The view and Equip late-game action share the same candidates and wait for both
catalog features. Missing model retains the existing fallback. Known formidable
and beast restrictions remain; GearRows does not publish actor levels, so its
supplementary sources retain their published eligibility and never invent one.
This is limited to the published shortlists, not every WEAP definition. No new
GearRows, BestInSlot or real-data extraction is required for this fix.

The superseded explanation passed 70 tests and 12 Chrome cases. Revised scoring:
**113 relevant tests passed**, including three staged winner/score/equip checks
and synthetic skill tiers, bonus saturation, weak class weapons, zero/invalid
damage, malformed candidates, missing models and no input mutation. Twelve new
Chrome ranking cases pass across all worlds, 1366/375 px and both themes, with
runner-ups, overflow and scoped axe audits. Existing QA-26 whole-kit, hand setup
and transfer regressions also pass **12/12** across the same matrix: 48 character
configurations, 96 hand setups and 12 equip transfers. No runtime/server errors.
The Vanilla phone screenshot was reviewed. Licence and site-claim checks pass.
The initial browser setup used a short skill label and then waited before opening
the lazy gear catalogs; those harness attempts are excluded. The accepted setup
selects the full displayed skill label, opens the intended section and loads gear.

Evidence: `A:/Cache/qa40-41-flow04/qa40-model-before.jsonl`,
`qa40-scoring-unit.log`, `qa40-scoring-browser/` and `qa40-qa26-browser/`.

### QA-41 — display Health gains without arithmetic noise

Cause: ProgressionSheet printed its unrounded subtraction, and LevelItineraryCard
printed the raw per-step gain. Both now use QA-27's existing `formatHealth`: at
most one decimal, no unnecessary `.0`, and an unavailable placeholder. A zero
starting Health is retained with `??`, instead of being replaced by the current
Health. Negative total differences remain clamped at zero. Stored Health, curves
and gains are not rounded or changed.

Validation: **122 relevant tests passed**, including 14 new rendered-component
cases: the reported `131.99999999999997` displays `+132`, half points survive,
binary fractions are tidy, zero/missing baselines and completed itineraries work,
nonfinite step values give `—`, and inputs retain their original precision.
**12/12 Chrome cases passed** across all three worlds, both themes and 1366/375
px. A synthetic saved character with Endurance 33 shows `+3.8 HP Gain` and, after
advancing, `+3.8 Total HP Gained`. No overflow, runtime/server errors or scoped
axe blockers. Phone screenshot reviewed. Evidence: `qa41-unit.log` and
`qa41-browser/` under `A:/Cache/qa40-41-flow04`.

### FLOW-04 — actual carried-item verification; no Travel fix

Parsed the owner-provided `Pe.omwsave` (Ba'Ta, TR + ARCE), 25,333,080 bytes,
format 37, using the site's parser. SHA-256:
`bd63759565d68ace72d832736a7d58062d3e5dcccda9abb04efb111dc8a0fae5`.
Its player inventory has **69 records, all with positive counts**, no parser
warnings, and **zero matches among the 39** non-quest teleport requirements.
No Propylon index or supported teleporting item is carried. The save's installed
`master_index.esp` does not grant an index. Four Divine Intervention and four
Almsivi Intervention scrolls belong to the separate consumable controls.
“Items you carry (0 of 39)” is therefore correct, including after Use save defaults.
The original file's hash is unchanged. No Travel application code or data changed.

Validation: **42 relevant tests passed**, including seven new original-file,
reduced-inventory, staged-world and edge checks. The reduced fixture commits only
positive-count item IDs, not the full save, identity or journal. An opt-in test
parses the original and checks its hash, contents and scroll quantities; fixture
checks run without the personal file. **8/8 final Chrome cases pass**: original
file imports and fixture controls × desktop/375 px × both themes. Each checks
zero initially, Use save defaults, a keyboard-edited positive control, then reset
to zero. Original imports use Vault's local file input, signed out; no cloud save.
No overflow, runtime/server errors or scoped axe blockers. Phone screenshot reviewed.

The first coordinate-based variants did not reliably open the native item
disclosure in some Morrowind-theme runs, leaving the checkbox hidden. Those runs
are retained as diagnostics and excluded from acceptance. Final inventory cases
explicitly open the disclosure and use real Space-key events for the positive
control. They do **not** establish mouse/touch disclosure acceptance; existing
Travel interaction and freeze touch checks remain required. Evidence under
`A:/Cache/qa40-41-flow04`: `flow04-unit.log`, `flow04-inventory/`; initial
coordinate diagnostics: `flow04-browser/`, `flow04-accepted/`, `flow04-final/`.

### Final branch verification and handoff

The final site suite passes **1,308 tests, zero failures, skips or TODOs**, with
the original-save opt-in enabled. The earlier full run passed 1,307; the final
run also includes the browser-planner regression added for the three new groups.
The pipeline suite passes **685 tests**. `npm run build:cloudflare` passes with
**24/24 static pages**, using the unchanged repository configuration.

Accepted Chrome coverage totals **104 cases**, all passing with zero reported
runtime or server errors: QA-40 ranking 12, QA-26 whole-kit/hand/equip 12, QA-41
Health gains 12, FLOW-04 inventory/reset 8, QA-10 beast equipment 28, QA-27 Health
chart formatting 12, and saved-Travel touch repetitions 20. The world-aware gear
and Health cases cover Vanilla/TR/TR + ARCE, desktop/375 px and both themes.
The touch runner verifies mobile capabilities and uses CDP touch events. FLOW-04
inventory setup is explicitly not pointer/touch disclosure acceptance. The two
final regression launches before the server restart only reached connection
refusal; no application cases ran in them. Their restarted runs pass.

Reports and logs remain under `A:/Cache/qa40-41-flow04`: `site-final-test.log`,
`pipeline-full-test.log`, `cloudflare-build.log`, the item reports above,
`gear-beast-final/`, `health-format-regression/` and `travel-touch-final/`.
The original save's SHA-256 is still unchanged. No personal save is committed.
The planner now selects each new group's cases for its relevant application area.
COORDINATION is copied identically to the pipeline's docs-only
`handoff/qa-40-41-flow-04`; UI_TRANSFORMATION remains identical and unchanged.
Fresh fetch still has site main `f5ca4af` and pipeline master `631aa2e`.
Only these two branches are prepared for the authorized push; no merge or release.

## 71. QA-42–45 phone layout and wording — 3 October 2026 (UTC)

Continues on `fix/qa-40-41-flow-04`, after the pushed QA-40/41 and FLOW-04 batch.
The owner requested these four items, a branch push and merge preparation.
Relevant checks run before each item commit; full checks follow the four fixes.
No deployment, migration, catalog/schema change or real-data rebuild is included.

### QA-42 — compressed-map annotations

Reproduced on TR at 375 px in Ashfall: the bounding box of `≈78 cells` intersects
`FELSAAD COAST`. `TransitMap` places stop/region labels with collision checks,
then adds gap annotations without reserving space. Compressed distances now
appear in a wrapping legend below the map, including the gap direction. Dashed
break lines, compression geometry, world positions and routing are unchanged.

Validation: **31 relevant tests passed**, including three new gap regressions:
vertical route labels, multiple gaps on both axes, and empty/ordinary networks.
The two nonempty regression tests failed before the fix. **18/18 Chrome cases
passed**, all three worlds × 1366/375/390 px × both themes, with no annotation
collisions, page overflow, runtime/server errors or axe blockers. TR's Morrowind
phone screenshot was reviewed; THIRSK remains readable above the map network.
The first post-fix runner incorrectly expected the staged 78-cell gap to run
north–south; it actually runs east–west. That harness-only mismatch is retained
in `qa42-browser/` and excluded. Accepted report: `qa42-final/`.
Evidence under `A:/Cache/qa42-45`: `qa42-before-unit.log`, `qa42-before/`,
`qa42-unit.log`, `qa42-final/`. Tests: `test/travel-map-break-labels.test.js`;
Chrome group `QA-42/`, selected by the Travel browser planner.

### QA-43 — room for whole faction rows

Reproduced the clipping at 375 px, Morrowind: the roster's scroll viewport is
78 px high, while Ashlanders' row is 84 px. The Viewing bar is actually below
the roster, rather than overlapping its measured box; the row cannot fit fully
before that boundary. The mobile roster now has a 320 px container, does not
shrink, and contains its own scrolling list. Search and category controls retain
their size; the workspace and dossier can shrink to their available height.
Desktop columns, active selection, memberships and promotion rules are preserved.

The empty-search audit also reproduced an invalid empty `listbox`; the empty
roster now uses `status`, while populated rosters retain selectable options.
**44 relevant tests pass**, including four new accessibility cases for empty
catalog/search/memberships and a populated frozen-input selection. **18/18 final
Chrome cases pass**, all worlds, both themes, 1366/375/390 px: whole-row space,
contained scrolling, readable/clickable Agility · Endurance, selection and empty
search announcements, no page overflow, runtime/server errors or axe blockers.
TR's Morrowind phone screenshot was reviewed. The initial accessibility failure
and the 78/84 px measurement are retained in `qa43-before/` and `qa43-before2/`.
Layout-only `qa43-final/` passed before the empty-state change; accepted combined
report is `qa43-accepted/`. Evidence: `qa43-final-unit.log`,
`test/faction-roster-empty.test.js`, Chrome group `QA-43/` in the Faction planner.
