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
| Live commit | `ef67b3e` (CALC-4 ingredient finder and sources, Travel city transfers and swimming fallback, retaining main's Vault fixes; release verification in §26) |
| Live Worker version | `3879ce7b-c397-4698-83c4-e9d185d9ed5c`, tagged `ef67b3e`; deployed at 100% on 2026-10-01 05:22 UTC |
| Security headers | `public/_headers` retained; nosniff and `X-Frame-Options: DENY` verified live after the 05:22 release; existing CSP, referrer policy, permissions policy and host-only HSTS unchanged |
| Licences | site `AGPL-3.0-or-later`, pipeline `GPL-3.0-or-later`; GitHub detects both |
| Worker routing | only `/api/*` runs the Worker; `www` pages redirect through the zone rule "www to root" |
| Game bundle | `a29adea046e6086c2c7ee654`, snapshot `1613a1123ed9…`; corrected IngredientSources, existing extraction snapshot |
| D1 database | binding `DB` / configured `siltstrider-db`, UUID `141a1409-3956-4267-a078-02483bbb2bf6` (dashboard name contains "dev"; it is production) |
| D1 migrations | 0001–0007 applied; none pending at the 05:22 release; no migration ran |
| D1 Time Travel bookmark | `0000005d-00000000-000050f7-7e6a447a113fd39c04e571109bfaee6c`, captured before the 2026-10-01 05:22 UTC release; private migration backup and preservation checks in §15 |
| Pipeline repo | `master` / `origin/master` at `7e04885`; correction `41da92c` included and shared release records synchronized |

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

For the current release, §26 records code rollback target `d523b9ba` / `216cd90`:
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
