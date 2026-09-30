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
| Live commit | `1e84b1a` (site `main`, pushed) |
| Live Worker version | `24bd4ac1-e287-4c14-88d8-80bee20b42f9`, deployed 2026-09-30 16:04 UTC, tagged `1e84b1a` |
| Security headers | `public/_headers`: nosniff, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, referrer policy, permissions policy, host-only HSTS; verified live after the 16:49 release (they took a minute or two to appear) |
| Licences | site `AGPL-3.0-or-later`, pipeline `GPL-3.0-or-later`; GitHub detects both |
| Worker routing | only `/api/*` runs the Worker; `www` pages redirect through the zone rule "www to root" |
| Game bundle | `3da0320236da77ec085d105d`, snapshot `1613a1123ed9…` |
| D1 database | binding `DB` / configured `siltstrider-db`, UUID `141a1409-3956-4267-a078-02483bbb2bf6` (dashboard name contains "dev"; it is production) |
| D1 migrations | 0001–0006 applied; `wrangler d1 migrations list siltstrider-db --remote` reports none pending |
| D1 Time Travel bookmark | `0000003e-00000002-000050f5-376b3c432b1be8aa90f68a30d28ab5d1`, captured 10:57 UTC with the backup |
| Pipeline repo | `master` at `26f0bd5`, pushed |

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
| `24bd4ac1-e287-4c14-88d8-80bee20b42f9` | 09-30 16:04 | `1e84b1a` | tagged; no fading on a beast race's Boots slot (axe found it live on `4c464aa3` when the random start drew a Khajiit) or on a ticked Challenge objective; current |

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
| Site | `A:\Claude\morrowind-tools` | `$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'; npm test` | **730 pass, 0 fail, 0 todo, 0 skipped** at `1e84b1a` |
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
not repeated. Deployment remains a separate owner ask: ship Travel as its own
release, retaining the previous production version so rollback removes Travel
without rolling back the earlier launch improvements.

## 9. Account settings verification — 30 September 2026

ACC-1 and ACC-2 are prepared on `feature/account-settings-preparation`, based on
the normal merge of origin/main `2c113b8` into the branch at `7a9f0bd`. The owner
has not approved merging the settings branch or deploying it.

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
