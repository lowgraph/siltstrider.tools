# Local browser regression tests

Start `npm run dev` on port 8765. With Node 22 or newer, an installed Chrome and
an existing axe-core script, run from the site repository in PowerShell:

```powershell
$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'
node scripts/test-browser.cjs --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\travel-branch-browser'
```

Alternatively, set `BROWSER_AXE_PATH` to the installed `axe.min.js` and run
`npm run test:browser`. No browser or audit dependency is downloaded. The runner
accepts `--chrome`, `--url` (localhost only), `--suite all|matrix|travel|tools|settings|polish`,
and `--filter` to run only case names containing a given string. `--fail-fast`
stops after the first failed case; `--trace-network` saves request lifecycle
events beside the report. Timeout messages retain the pending request URLs or
CDP expression, and the report includes the font states used for navigation.
Keep output under the configured cache, outside the checkout.
The `polish` suite checks calculator navigation at 375, 900, 1024, 1366, 1440 and
1920 px in both themes, including row fit beside the world switch. At 375/1366 px
it checks the default journey, Least real time, obtainable apparatus in quality
order, custom soul sizes and the Constant Effect threshold. The Travel network
case also rejects a No Route/error flash while data is pending.

The full suite checks 16 pages/tool views in Vanilla, TR and TR + ARCE at 1366 and
375 pixels, in both themes: one page heading, horizontal overflow, WCAG 2/2.1 AA
critical/serious axe findings and screenshots. Equipped Loadouts is a Builder tab.
Interaction checks cover calculator custom inputs and empty states, ingredients
and effects, invalid/repeatable challenge seeds, Markdown export, build/challenge
share links, challenge-to-builder navigation and equipment dialog focus/Escape,
in both themes. Faction Journal checks search,
rank selection and empty matches; Level Simulator checks modes, target level and
priority reordering in all profiles, widths and themes.

Travel checks cover keyboard search/cancellation/selection, swap, objectives,
share restoration, result reading order, forced-colors focus, real-time trade-offs,
network loading/failure/retry, synthetic save import, persisted option edits,
three-profile isolation and resetting to save defaults.
Each save edit is checked before navigation, followed by a check that all four
choices reached local storage. A failure there distinguishes an unapplied or
unstored edit from the later save/profile restoration assertion.
Synthetic JSON fixtures,
failure HTML, screenshots, axe findings and `report.json` remain in the cache.
The report records the starting Git commit, bundle pointer, timestamps and failures.
Uncaught browser exceptions and unexpected local server errors fail the run.
Navigation waits for the arriving document's load event and font completion.
Interaction cases store the theme before navigating, so the site applies it
before paint without starting a font load in the departing document. Font
errors and fonts that remain loading fail the check.

This is a local signed-out Chrome suite. It does not replace a production build,
real OpenMW corpus checks, other browser engines, manual screen-reader review or
the owner-run production sign-in, Cloud Vault and payment acceptance checks in
[LAUNCH_OPERATIONS.md](LAUNCH_OPERATIONS.md).

The `settings` suite uses synthetic Clerk identities and API responses injected
only into the local browser. It checks settings reload persistence, world scopes,
revision-conflict recovery and sign-out/account isolation at both widths in both
themes, with axe audits and screenshots of the controls. It never signs into a
real account or sends preferences to a remote service. The real Worker route is
tested separately with locally signed session tokens and SQLite migrations.

If the default port is occupied, start this checkout's server on an unused port
without stopping another session, and pass the matching `--url`. ACC-2 verification
used `http://127.0.0.1:8790`.

To repeat just the saved-Travel case at 1366 and 375 px, use `--suite tools` and
`--filter 'Travel imported save/persistence/profiles'` with the local server URL.
Run twice with separate `--out` directories; each invocation checks both widths,
including applied edits, stored choices, restoration, profile isolation and reset.

## Signed-in Cloud Vault

Two local setups cover what the signed-out suite cannot. Both use `scripts/local-stack.cjs`:
this checkout's pages and Worker with a local database, served by `wrangler dev --local`
from `wrangler.local.jsonc` (no routes, no account, a placeholder database) and a build in
`.next-export-local` or `.next-export-vault`, never `.next-export`, which deploys upload.

**Automated, no Clerk** (`scripts/test-vault.cjs`). Each run makes an RSA key, gives the
local Worker its public half as `CLERK_JWT_KEY` (Clerk's own offline verifier, with a
placeholder instance and secret), signs session tokens for made-up users, and installs a
stand-in for Clerk's browser object before the site's scripts. It builds, starts its own
Worker on port 8788 with a fresh database, and checks: the signed-out Vault; the API
(owners only; expired, foreign and malformed tokens refused); save, rename, reload, load
and delete through the page; one token renewal after a 401; a save whose stored hash was
damaged (refused with a reference, logged, nothing loaded); the free quota and a supporter's
25 slots; and axe (WCAG 2.2 AA and best practice) on the signed-in Vault with a rename open,
the Vault window and the account page, in both themes at 1366 and 375 px, plus the Vault
window's account line at each width. About 30 seconds:

```powershell
$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'
node scripts/test-vault.cjs --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\vault-browser'
```

`--no-build` reuses the last build, `--filter` runs matching cases, `--port` moves the Worker.

**Real Clerk, signed in once by the owner.** The Clerk development instance's keys in
`.env.local` (`pk_test_`/`sk_test_`; the script refuses live keys) go to Wrangler with
`--env-file`, so no copy is written. Build, then start (or the `site-1-local-stack` preview):

```powershell
node scripts/local-stack.cjs build; node scripts/local-stack.cjs start --port 8787
```

Open http://localhost:8787/vault and sign up with an address like `you+clerk_test@example.com`
(the development instance requires a 15-character password; the email code is `424242`).
The local database lives in `A:/Cache/silt-local-stack/clerk`; `node scripts/local-stack.cjs sql
"<SQL>"` runs SQL on it, e.g. to damage a save's hash. Rebuild with the site stopped: Windows
will not replace a folder Wrangler is serving.

Neither setup tests the production keys, Google or Discord sign-in, or the live database;
those stay in the owner's production checks.
