# Local browser regression tests

QA-42–45 follow-ups: `--suite qa --filter 'QA-42/'` checks the map's compressed
gap legend across all worlds, both themes and 1366/375/390 px. Gap annotations
must not overlap region or settlement labels, and their explanation stays below
the map. Reports and screenshots belong in `A:/Cache/qa42-45`.

`--suite qa --filter 'QA-43/'` uses the same matrix for Faction Journal. It
requires room for a whole Ashlanders row, contains roster scrolling above the
Viewing bar, checks the attribute line by hit-testing, and audits both populated
and empty searches while preserving the selected dossier.

`--suite qa --filter 'QA-44/'` checks two/three Enchanting effect cards across
the same matrix. Remove labels stay on one line, within their buttons/cards and
apart from the picker. Removing the second effect preserves the first; the last
effect remains. Row-specific accessible labels identify each removal control.

`--suite qa --filter 'QA-45/'` visits Travel, Alchemy, Factions and Builder for
each world/theme/width combination. It checks the spell and Propylon definitions,
identical Cheapest explanations, pair-order definitions, friendly world labels,
rival restriction without a conflicting eligibility badge, and closest-archetype
wording. Screenshots and axe audits cover all four views.
The gear audit scrolls into view to activate lazy catalogs, then waits for the
ranked tables, enabled controls and settled opacity. The header alone is not
readiness. Split the four new matrices by world for 120-second bounded runs,
for example `--filter 'QA-45/tr_arce/'` (six cases).

Start `npm run dev` on port 8765. With Node 22 or newer, an installed Chrome and
an existing axe-core script, run from the site repository in PowerShell:

```powershell
$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'
node scripts/test-browser.cjs --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\travel-branch-browser'
```

Alternatively, set `BROWSER_AXE_PATH` to the installed `axe.min.js` and run
`npm run test:browser`. No browser or audit dependency is downloaded. The runner
accepts `--chrome`, `--url` (localhost only), `--suite all|matrix|travel|tools|settings|polish`,
and `--filter` to run only case names containing a given string. Additional reproduction suites are `qa`, `hydration` and `touch`. `--fail-fast`
stops after the first failed case; `--trace-network` saves request lifecycle
events beside the report. Timeout messages retain the pending request URLs or
CDP expression, and the report includes the font states used for navigation.
Keep output under the configured cache, outside the checkout.

## Targeted runs (until the freeze)

For a fix or polish item, run `npm test` plus only the browser groups the change
touches. Print them with:

```powershell
npm run test:browser:plan                    # this branch against origin/main, plus uncommitted
npm run test:browser:plan -- --base main
npm run test:browser:plan -- --files 'lib/enchant-math.mjs,app/globals.css'
```

`scripts/browser-plan.mjs` maps changed paths to the existing `--suite`/`--filter`
groups (Alchemy, Enchanting, Spellmaking, Travel, Level Simulator, Gear Advisor,
Builder, Faction Journal, Challenge Runs, About, search, Home, and Vault/account,
which also lists `npm run test:vault`). It only prints commands. Shared foundations
(global or theme CSS, the layout, the shell, the data loader, `package.json`, build
scripts) and any app file it cannot place give the full set. Docs, tests and the
changelog view need no browser run; other unmapped paths are listed for a manual
check. Also run the cases added for the fix itself (`--filter <its ID>`).

Freeze acceptance and any release candidate still run every suite (all, qa,
launch, hydration, touch and the signed-in Vault). When a new area or case file is
added, add its filter to `AREAS` in the script; `test/browser-plan.test.js` fails if
a planned filter no longer names an existing case.

QA reproduction (1 October): `--suite hydration` enables `Runtime.consoleAPICalled`,
`Runtime.exceptionThrown` and `Log.entryAdded` before the first `Page.navigate`.
It checks 16 routes, including a 404, six storage/link scenarios, 1366/375 px and
both themes. Fresh Home and Builder are repeated ten times: 456 cases. The loaded
save is the synthetic `qa-traveller.json` packed into `silt-active-save`; Home and
Builder must visibly restore its name. Console errors, hydration warnings and
uncaught exceptions fail. The intentional 404's resource error currently fails
this strict rule. Retain that raw report separately under the checklist's expected
HTTP 404 exemption; any other console error, hydration warning or exception fails.

`--suite touch --touch` sets CDP touch emulation to five points, mobile 375×812 at
DPR 3, a mobile user agent, coarse pointer and no hover. It asserts the actual
capabilities, uses `Input.dispatchTouchEvent` for taps, checks search/navigation,
five Configure popovers, both Alchemy pickers and twenty saved-Travel repetitions.
The final laptop control records whether Chrome actually provides touch plus a
fine pointer. Chrome on this host retains coarse pointer when touch is enabled;
that control needs physical-device acceptance rather than fabricated capabilities.

`--suite qa` retains failing expectation checks and screenshots for open findings.
`--suite qa --filter 'QA-31/'` checks the Builder's local saved-character deletion
in all three worlds, both themes and 1366/375 px. Opening, Cancel and Escape keep
storage intact; confirmation removes only the selected character, then focuses
the next character or Save this character. Screenshots and axe checks cover the
named confirmation. Add `--touch --filter 'QA-31/vanilla/375/'` for real tap events.
`--suite qa --filter 'QA-32/'` checks header search in all three worlds, both
themes and 1366/375 px: Ald'ruhn/Ald-ruhn/Aldruhn, curly apostrophes, spaced
spellings, Sadrith Mora (including joined words) and Vos. Each query first clears
the previous result; labels/highlights stay canonical, and selecting Ald'ruhn
opens Travel with Ald-ruhn as its destination. Desktop also exercises Ctrl K.
Add `--touch --filter 'QA-32/vanilla/375/'` for real tap navigation.
`--suite qa --filter 'QA-26/'` checks the reported Argonian Marsh mage premade,
then edits race and skills through Configure and tests a custom namesake. Across
three worlds, both themes and 1366/375 px, it checks both weapon preferences,
published unchanged picks, all dynamically ranked slots, runner-ups, shared titles
and equipping the edited kit. Split by profile/width for bounded runs, for example
`--filter 'QA-26/endgame/vanilla/375/'` (two theme cases).
Use `--filter QA-08`, for example, for a single item. Its popover measurements also
reserve the phone tab bar; Gear checks use text Range boxes to detect broken words.
`--suite qa --filter 'QA-10/'` now enforces 28 kit/transfer cases at 1366/375 px
in both themes: Vanilla Argonian/Khajiit/High Elf, TR Argonian, and TR + ARCE
Cathay-raht/Naga/Suthay. Each case checks both weapon preferences, opens every
actual "View … runner-up picks" control and equips the late-game recommendations.
Beasts must have no forbidden primary/runner-up/equipped item; non-beast controls
retain catalog footwear without a beast restriction in the inspector. Three
screenshots per case capture both recommendation modes and the equipped kit.
The layout TODO wrapper can be run against a fresh report:

```powershell
$env:QA_BROWSER_REPORT='A:\Cache\qa-reproduce-20261001\qa-live-final\report.json'
node --test test/qa-layout.browser.cjs
$env:QA_UNMARK_TODOS='1'
node --test test/qa-layout.browser.cjs
Remove-Item Env:QA_UNMARK_TODOS
Remove-Item Env:QA_BROWSER_REPORT
```

The ordinary reproduction tests use `{ todo: '<QA-id> not fixed yet' }` through a
shared helper; `QA_UNMARK_TODOS=1` removes only those marks. Unit tests need the
staged bundle. The explicit layout wrapper needs the measured browser report and
is deliberately outside the server-free `npm test` glob.

Production confirmation requires `--production-read-only --url https://siltstrider.tools`
and accepts only `qa`, `hydration` or `touch`. It uses a fresh Chrome profile,
never signs in, and blocks API methods other than GET/HEAD/OPTIONS. Storage and
synthetic saves remain in that isolated profile. Production API QA-19 uses GET only;
the PUT check belongs to `scripts/local-stack.cjs` with its local database.
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
The tools suite also checks `Alchemy effect finder` across all three profiles,
both themes and 1366/375 px: effect search, multiple desired effects, filling a
pair while clearing the other slots, focus on the potion output, empty matches,
profile isolation, no overflow and axe accessibility.
The `Alchemy` filter includes 12 selected-ingredient cases across the same matrix:
"Where to get it" appears in every filled slot without an effect-finder recipe,
selection alone triggers no source download, keyboard activation opens the panel,
replacement closes old content, clearing removes it, and world changes reset it.
Two additional cases hold/fail the IngredientSources request and verify neutral
loading and Retry at 1366/375 px. Open source panels receive axe audits and screenshots.
Run all 26 Alchemy cases with `--suite tools --filter Alchemy` against this checkout's
local server. Optional-catalog absence, malformed records and inherited TR/ARCE
source provenance also have synthetic unit tests.
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

The `travel` suite includes `Travel city transfer` cases for vanilla, TR and
TR+ARCE, in both themes at 1366/375 px. They check Balmora's strider-to-guild walk,
merged city-name search (including Vivec's cantons), specific hall/provider
search, typing without replanning, reverse door
instructions, exact-stop link restoration, and no free transfer when walking is
disabled. To isolate them, add `--filter 'Travel city transfer'`; each case saves a
screenshot and axe audit. They also check a city-to-city journey through an
intermediate city: arrival and departure stops must have a timed walk between
them. The chosen intermediate city depends on route objectives and fares; do not
require Balmora when Vivec is the better route. Unspecified city boundaries can
choose a suitable platform, without adding a free intermediate connection.

The Travel suite also checks automatic long-journey fallback on all three
profiles, both themes and 1366/375 px. Seyda Neen → Balmora must retain its
one-leg Silt Strider route with Fewest legs. Balmora → Ald Redaynia must route
only after restricted routing fails and show separate walking/swimming times.
There is no added switch or warning. Reloading a shared route preserves the
result; disabling the existing walking control prevents the fallback and
reenabling it restores the route. Each case captures the dossier and checks
accessibility and page overflow. City-transfer cases also verify physical stops
on transport journeys and their intermediate timed walks.

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

`--signout-preservation` checks QA-24 at 1366/375 px in both themes: an edited
Female Cathay-raht / The Tower survives the full sign-out navigation to Home,
including its TR + ARCE profile, and a loaded synthetic save remains loaded.
The return marker is consumed once; a later ordinary refresh starts afresh.
The real local pages and Worker run with a synthetic Clerk sign-out redirect.
This does not replace the owner's real development/production Clerk acceptance.

```powershell
node scripts/test-vault.cjs --signout-preservation --port 8797 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\signout-preservation'
```

`--qa-reproduction` runs the signed-in QA-21 / imported-save QA-22 regressions.
It uses a synthetic “QA – Vault Reproduction” identity, creates two “QA – ”
records in a fresh local database, and deletes both in `finally`. It verifies
the selected theme through account settings before testing each width. Known
behavior assertions are enforced on `launch/character-preservation`; QA-22 also
opens each copied link and checks the recipient character and populated sheet:

```powershell
node scripts/test-vault.cjs --qa-reproduction --port 8796 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa-vault'
```

The corresponding hydrated/hook expectations are in
`test/qa-account-reproduction.test.js`. `--suite qa --filter QA-22`
in the ordinary Chrome runner checks that a challenge's link retains its rolled
world after a visitor changes world, then opens the recipient link. Synthetic authentication does not verify
Clerk's real email-code or redirect behavior; use an owner-prepared throwaway
session for that final check.

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


`--character-preservation` checks QA-21 and QA-23 on the real local pages and
Worker with synthetic Clerk authentication, at 1366/375 px in both themes. It
loads a TR + ARCE build through the standalone and modal Vault from Vanilla,
restores an unsaved ARCE build
through the sign-in hand-off, checks that hydration and header changes do not
write a Preferred world, and tests explicit account choices and returning to
browser preferences. The suite creates only "QA – " records and deletes them.
QA-24 remains covered separately by `--signout-preservation`.

```powershell
node scripts/test-vault.cjs --character-preservation --port 8797 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\character-preservation'
```

The QA-21/22/23 reproduction tests are now enforced, including hydrated sign-in,
version 1 compatibility, rejected Vault loads and share links. QA-25 now enforces
explicit journey-origin precedence through save restoration.
QA-22 edge cases and saved run profiles are in `test/save-share-link.test.js`.

QA-01/02's `--suite qa --filter '/enchanting/'` checks both findings in all three
worlds at 1366/375 px and both themes (24 cases). The Constant case checks
75 capacity points, 50,050 base gold and 54% at Enchant 300 / Intelligence 40 /
Luck 40; the Common Ring Target case checks 1 capacity point, 1,912 base gold,
70% at 50/40/40, and no over-capacity warning. Each saves a screenshot.
`test/enchanting-costs.test.js` covers area, order, one/three effects, precise
chance inputs, fatigue, float/truncation boundaries and profile GMST values.
The original QA-01/02 reproduction tests are enforced rather than TODO.

QA-03/04's `--suite qa --filter '/level-health/'` checks fractional gains and
the chart's starting Health/Endurance in Vanilla, TR and TR + ARCE, at 1366/375
px and both themes. It checks the complete one-step forecast before/after a
Bitter Cup that changes only Personality/Willpower, and loaded saves at 35,
45 and 67.5 Health. Each case saves a screenshot; the Endurance 100 label must
fit inside the chart. The nine original QA-03/04 TODO cases are now enforced;
`test/level-health-preservation.test.js` adds normalization, zero/fractional
Health, level-boundary, repeated Cup and non-retroactive base checks.

QA-05's `--suite qa --filter 'QA-05/'` follows a fresh premade through Builder
edits to Female Breton / The Tower, Home and Level Simulator. It checks source
titles and identity details in Vanilla/TR/TR + ARCE at 1366/375 px in both
themes, including an ARCE premade, first-navigation hydration messages and
heading overflow. Each case captures all three headings. The two original
QA-05 TODO cases are enforced; `test/qa-hydrated-title.test.js` uses hydrateRoot
with all three actual components, and `test/character-identity.test.js` covers
custom names, unknown markers, edited choices, links/snapshots and ARCE labels.

QA-08's `--suite qa --filter 'QA-08'` checks the Early and Late gear tables in
Vanilla/TR/TR + ARCE at 375, 390 and 1366 px in both themes (36 cases). It opens
every runner-up control, checks whole words and text/viewport bounds in every
cell, requires stacked phone rows and desktop columns, and confirms native
tables remain in Chrome's accessibility tree. It captures Early/Late tables and
expanded runner-up rows. The six browser-report assertions are enforced; QA-09's
separate popover TODOs remain.

```powershell
node scripts/test-browser.cjs --suite qa --filter 'QA-08' --url http://127.0.0.1:8765 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa08-browser'
$env:QA_BROWSER_REPORT='A:\Cache\qa08-browser\report.json'
node --test --test-name-pattern='QA-08' test/qa-layout.browser.cjs
```

QA-09's `--suite qa --filter 'QA-09'` checks all five Configure explanations at
375/390/1366 px in both themes (30 cases). Each checks normal placement, a button
near the bottom in a 360 px-high viewport, resize to 420 px and page scrolling,
keyboard opening/Escape with focus restoration, and outside dismissal. Every
box must stay inside the visual viewport and clear the visible header/tab bar.
Repeat with `--touch` for actual CDP touch events; touch emulation uses five touch
points and a coarse pointer. Both runs capture normal and bottom-edge placement.
The five original browser-report tests are now enforced; eight actual Configure
component tests cover long text, small/offset viewports, resize, scroll, content
changes, dismissal and hydration without needing a staged bundle.

```powershell
node scripts/test-browser.cjs --suite qa --filter 'QA-09' --url http://127.0.0.1:8765 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa09-browser'
node scripts/test-browser.cjs --suite qa --filter 'QA-09' --touch --url http://127.0.0.1:8765 --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa09-touch'
$env:QA_BROWSER_REPORT='A:\Cache\qa09-browser\report.json'
node --test --test-name-pattern='QA-09' test/qa-layout.browser.cjs
$env:QA_BROWSER_REPORT='A:\Cache\qa09-touch\report.json'
node --test --test-name-pattern='QA-09' test/qa-layout.browser.cjs
```

QA-16's `--suite qa --filter 'QA-16'` checks Ebonheart → Mournhold in all three
worlds, with walking on/off, at 1366/375 px in both themes (24 cases). It requires
the Asciene Rane dialogue route and captures every itinerary. Three original
catalog cases are enforced; `test/teleport-stop-aliases.test.js` covers missing
metadata/Places, authoritative names, case, exact room IDs, no free transfers,
malformed frozen records and quest/held-item gates.

QA-07's `--suite qa --filter 'QA-07'` checks all three spelling variants,
selecting a result, an impossible query with no stale dossier, and Escape
restoration. QA-25's `--filter 'QA-25'` restores a synthetic save in each profile
and requires the explicit Balmora → Ald-ruhn origin/destination and `plan=time`.
Each filter covers three worlds × 1366/375 px × both themes (12 cases), with
screenshots. Use the same URL/axe/out arguments as the QA-16 runner above.

QA-06's `--suite qa --filter 'QA-06'` inspects all four apparatus selectors in
three worlds, at 1366/375 px in both themes (12 cases / 48 lists) and captures
screenshots. Every list must omit Secret Master's tools. Five synthetic adapter
edge cases cover mod-prefixed keys, renamed tools, spaced/curly-apostrophe names,
ordinary Master tools, ordering and frozen catalog provenance.

QA-05's `--suite qa --filter 'QA-05/'` starts from a real random premade,
waits for first-visit initialization, changes race/birthsign to different choices
and selects Female. Builder, Home and Level Simulator must all show the same
current identity and "Based on" source title. Twelve cases cover three worlds,
1366/375 px and both themes, with three screenshots per case. Do not globally
replace Math.random in Chrome: that can interfere with React's event handling.
The case hides only `nextjs-portal`, whose dev toolbar overlaps the phone Home
tab; production has no toolbar. Deterministic JSDOM hydrateRoot tests remain.

QA-12's `--suite qa --filter 'QA-12/'` checks expanded premade cards in both
By Playstyle and By Race, including ARCE's additional race builds, across three
worlds × 1366/375 px × both themes (12 cases / 24 groups). Each card needs Plays
like, Trade-off, full Major/Minor labels and explained specialization; the page
must fit the viewport. Nine component/copy cases enforce unchanged build loading,
collapse/expand, all profiles/modes and missing/unknown/frozen inputs. Screenshots
capture both groups. Use the existing runner URL/axe/out arguments; this item's
acceptance run is bounded to 60 seconds overall.

QA-11's `--suite qa --filter 'QA-11/'` checks the visible faction count, hidden
deprecated rows and relation names against the staged Factions catalog in all
three worlds, 1366/375 px and both themes (12 cases). TR/TR + ARCE explicitly
check Cyrodiil Fighters Guild, Imperial Archaeological Society and East Navy;
Vanilla checks Mages Guild. Screenshots scroll each expected relation label into
view (28 captures). The live badge uses uppercase CSS: read its textContent and
wait for the expected count. Synthetic tests also cover malformed/frozen records,
unknown IDs, unchanged relation values and retained saved memberships. Use the
existing runner URL/axe/out arguments; bound the matrix to 60 seconds overall.

QA-15's `--suite qa --filter 'QA-15/'` checks About in 1366/375 px and both themes
(four cases), with a Colophon screenshot per case. Require LowGraph attribution,
AGPL-3.0-or-later for the code, explicit game/mod-data and branding exclusions,
AI-assistance disclosure and the repository link with noopener/noreferrer. The
page must fit the viewport. `test/qa-copy-reproduction.test.js` enforces the copy
and retained font credit; `test/license.test.js` includes the actual About view
in its licence-file guard. Existing README/LICENSE wording stays untouched. Use
the existing URL/axe/out arguments and a 60-second overall runner limit.

## Twelve-item launch polish regression

`--suite launch` runs the public launch fixes. Run separate filters for FLOW-01,
UI-03, UI-04, SS-08, SS-09, SS-10 and SUS-02. Split UI-05 and ingredient-labels
by `vanilla/`, `tr/` and `tr_arce/`, for example:

```powershell
npm test -- --test-concurrency=4
node scripts/test-browser.cjs --suite launch --filter 'FLOW-01' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\launch-flow-01'
node scripts/test-browser.cjs --suite launch --filter 'UI-05/tr/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\launch-tr-counts'
node scripts/test-browser.cjs --suite launch --filter 'ingredient-labels/tr_arce/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\launch-arce-ingredients'
```

Use a 120-second outer process bound for each group and a separate output folder.
Discard incomplete groups from the acceptance aggregate; diagnose their logs and
rerun smaller filters. `Tool inputs/sharing/navigation/<profile>/` needs one world
per group because it visits several tools, restores links and uses the equipment
dialog. Other relevant `tools` filters are `Alchemy effect finder`, `Alchemy
ingredient sources`, `Alchemy sources loading/failure/retry`, and `Faction and
Level interactions`, and `Travel imported save/persistence/profiles`. Run `travel`
filters `Travel keyboard/search/layout` and `Travel network loading/failure/retry`,
and `qa` filters `QA-01/` and `QA-02/` to retain
the corrected enchanting calculations. Hydration can be bounded by route, using
`--suite hydration --filter 'QA-17/<route>/'`; split Home and Builder further by
scenario if their ten-repeat fresh-start groups exceed the bound.

Every launch group covers 1366/375 px and both themes. SS-08/09 include 390 px;
SS-09 measures words in both itinerary modes, including Acrobatics. UI-05 covers
manual and synthetic-save routing scopes and save-dependent guild options.
Ingredient cases cover autocomplete, selected slots, reverse pairs and use/focus,
the canonical IDs behind source requests, and ingredient search/command previews.
Screenshots, scoped axe results, overflow, runtime errors, fonts, commit and bundle
metadata are saved with the report. SS-08 separately checks active identity after
an empty search; QA-43 now renders that empty roster as a status instead of an
invalid empty listbox, with populated and empty states both covered by axe.

Use the built Worker and fresh local D1 via `scripts/local-stack.cjs` for F-7,
F-10 and F-13. The dedicated launch group sets the synthetic account theme and
asserts the actual document theme, because account preferences override storage:

```powershell
npm run test:vault -- --launch --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\launch-vault'
npm run test:vault -- --no-build --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\launch-vault-existing'
```

Bound each signed-in group to 150 seconds after building (use `--no-build` only
with a current `.next-export-vault`). Launch cases cover named confirmation and
initial focus, Tab/Shift+Tab, Enter/Escape, cancellation, real revision conflicts,
success and restored focus, exact reset defaults, and whole Vault labels at
1366/375/390 px in both themes. Users are synthetic, records start with `QA – `,
and the runners clean up records and settings in their disposable database.
The ordinary Vault suite also removes its synthetic tier overrides. No real
Clerk session or remote API write is part of these suites.

### QA-27–30: Health display and phone labels

`scripts/qa-polish-browser-cases.cjs` runs with `--suite qa`. Use a separate
output folder and a 120-second outer process bound for each world group:

```powershell
npm test -- --test-concurrency=4
node scripts/test-browser.cjs --suite qa --filter 'QA-27/vanilla/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa27-vanilla'
node scripts/test-browser.cjs --suite qa --filter 'QA-28/tr/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa28-tr'
node scripts/test-browser.cjs --suite qa --filter 'QA-29/tr_arce/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa29-arce'
node scripts/test-browser.cjs --suite qa --filter 'QA-30/tr/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\qa30-tr'
```

Repeat each item for `vanilla/`, `tr/` and `tr_arce/`. QA-27/28 have four
cases per world (both themes, 1366/375 px); QA-29/30 have six (also 390 px).
QA-27 checks formatted legend, SVG, accessible text and hovered endpoint values,
including containment of the narrow readout. QA-28 checks targets 14/15/16 and
milestone-label containment using keyboard range changes. QA-29 measures whole
words and visible label bounds in both grouping modes and checks Enter/Space
expansion with retained focus. QA-30 selects every catalog apparatus by canonical
ID, measures its complete selected label with the loaded font and available
control width, and checks Home/End/Escape keyboard interaction. Identical readable
labels can represent different apparatus records; selection must retain each ID.

Retain the existing `QA-03-04/level-health/build/`,
`QA-04/level-health/bitter-cup/`, `QA-04/level-health/save/`, `QA-12/`, `QA-06/`
and `QA-26/` groups, plus the bounded launch and local Vault groups above.
Split edited-kit checks using `QA-26/endgame/vanilla/`, `QA-26/endgame/tr/`
and `QA-26/endgame/tr_arce/`; the full twelve-case group can exceed the bound.
For hydration, check Home and Builder by scenario and Level Simulator, Alchemy
and Changelog by route. Reports retain bundle/commit metadata, screenshots,
loaded fonts, overflow and scoped axe results. Exclude incomplete groups and
rerun smaller filters rather than accepting partial output.

The Vault runner waits for enabled shell controls after document load before
dispatching modal events. Theme setup uses the synthetic identity installed for
the next navigation, rather than the user on the departing page. An isolated
`--launch --filter 'F-7/morrowind/375/dialog'` therefore tests the same account
theme as the complete group. On a timed-out wait, the report records the current
URL, theme, user, shell readiness and Vault/card state, with HTML and a screenshot
captured before the case's cleanup navigation.
The character-preservation modal case also focuses and checks the same enabled
node through two animation frames. Opening refreshes a prefetched list; separate
readiness and focus calls can span its loading replacement.

## QA-33–39 ordered polish

New cases run through `--suite qa --filter QA-33/` (substitute the item ID).
Use the installed axe path and separate cache outputs as above, with a 120-second
outer bound. QA-33 covers all worlds, both themes and 1366/375 px: Spear Scout
starts two-handed, excludes Keening/Darksun Shield and permits manual overrides.
QA-34 measures the list/footer gap before and after pagination and selects the
last pair. QA-35 checks whole words in Home, loadout actions and every expanded
Specialization footer. QA-36 measures map sizing, header separation, region
containment and readable text at 375/390/1366 px. QA-37 explicitly reaches target
55 with an Endurance-100 synthetic save and rejects `-0 HP`. QA-38 checks Twin
Lamps' exact singular caption. QA-39 checks unchanged, edited and custom builds,
while retained QA-26 cases still compare the complete expected kit. There are
76 new cases. The planner includes them in their corresponding tool groups.

For a full preparation pass, run `all`, `qa`, `launch`, `hydration`, `touch --touch`
and every local Vault mode above. Split long groups by world, route or specific
case filter so each completes within its bound. Full QA-30 can exceed the bound;
use `QA-30/vanilla/`, `QA-30/tr/` and `QA-30/tr_arce/`. For hydration, keep Home
and Builder's ten fresh repetitions per width/theme; check all other routes too.
The strict hydration report includes the intended missing-page HTTP 404 console
error: record it separately under the checklist's explicit exemption, only after
confirming there are no other console errors, hydration warnings or exceptions.
CDP touch plus a fine pointer still needs a physical touchscreen-laptop check;
never accept a coarse-pointer control as equivalent.

## Beginner clarity and contained follow-ups

`--suite qa` includes 156 new cases in `scripts/clarity-browser-cases.cjs`.
Use separate world filters and cache output folders with the same 120-second
outer bound. All cases cover Vanilla, TR and TR + ARCE, both themes and
1366/375 px. The groups are:

- `Clarity-Beginner/<route>/<profile>/`: Home, Builder, Travel, Alchemy and
  Level Simulator; mechanics before lore, manual game-entry help, save/manual
  recovery, route definitions and leveling instructions (60 cases).
- `Clarity-F04-F11/<profile>/`: separate By race/playstyle collections, real
  visible counts and race-picking guidance (12 cases).
- `Clarity-CALC4/<profile>/`: two-ingredient finder limits, recipe reset on world
  changes and preservation/reset of typed calculator stats (12 cases).
- `Clarity-Copy/<route>/<profile>/`: Builder, Home, Travel and Vault; preset
  customization, search clearing/focus, content-file/phone help and saved gold
  remaining/shortfall against the displayed fare (48 cases).
- `Clarity-FLOW04/<profile>/`: a saved ordinary Andasreth index gives the real
  Berandas connection, and a saved Master Index goes through Caldera (12 cases).
- `Clarity-FLOW03/<profile>/`: rival Great House joins are blocked with an
  explanation; leaving and compatible guild membership remain available (12 cases).

For example:

```powershell
node scripts/test-browser.cjs --suite qa --filter 'Clarity-FLOW04/tr/' --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\clarity-flow04-tr'
npm run test:vault -- --clarity --axe-path 'A:\Cache\audit-tools\node_modules\axe-core\axe.min.js' --out 'A:\Cache\clarity-vault'
```

The local Worker `--clarity` mode has twelve additional signed-in cases, four
each for F-11 (required username before saving an icon), F-17 (unavailable
version selection and 120-character rename boundary), and F-12 (recorded location
and class name; missing location is not invented). Each uses only the synthetic
`user_qa_clarity` and removes its saves, settings, profile and tier after the case.
Names start with `QA – `. Filter with `--filter Clarity-F12/` (or F11/F17) for a
focused run. Use `--no-build` only when the current `.next-export-vault` matches
the implementation; build separately before applying a bounded browser run.

Keep the existing QA-10 gear eligibility cases, including compatible open helmets,
and QA-09 mouse/touch popovers. Full preparation still runs all suites and every
local Vault mode; these additions do not replace existing regression coverage.

`--suite qa --filter 'QA-40/'` edits Nord Warrior Spearman's first Major skill
from Spear to Long Blade in all three worlds, both themes and 1366/375 px (12 cases).
It selects Configure and Sheet explicitly and opens the lazy gear catalogs before
checking the kit. Vanilla selects Goldbrand (6.67, Major Long Blade); TR/ARCE
selects Neb-Crescen (15.47, Major Long Blade). Its revised weapon score weights
constant bonuses by weapon skill and caps their combined contribution at the
skill-weighted damage score. Non-constant weapons come only from published
GearRows power shortlists with acquisition evidence, using Weapons for damage;
temporary enchantments settle ties and never become permanent bonuses. Primary
and runner-up rows explain their skill fit; source text preserves theft flags.
Use `test/qa40-weapon-explanation.test.js` for the staged model and synthetic edge
cases; missing data is skipped only when the bundle pointer is absent.

`--suite qa --filter 'QA-41/'` loads a synthetic save with Endurance 33, checks
the first itinerary's `+3.8 HP Gain`, advances a step and checks `+3.8 Total HP
Gained` in the sheet. All three worlds, both themes, 1366/375 px: 12 cases.
The arithmetic remains fractional; `test/qa41-health-gain-display.test.js` pins
the reported 131.99999999999997 total, fractional/zero baselines, unavailable
values and unchanged inputs using the actual rendered components.

`--suite qa --filter 'FLOW-04/save-check/'` checks the reduced 69-item inventory
fixture against the 39 TR + ARCE teleport items at 1366/375 px, both themes.
It starts with zero selected items, checks Use save defaults, uses Space to edit
one checkbox and resets it to zero. It waits for the route result and two scroll
frames before clicking the outer disclosure, then requires it to stay open and
the checkbox to own focus before Space. Disclosure opening is test setup, not
pointer/touch acceptance. Set `QA_FLOW04_SAVE_PATH` to a local `Pe.omwsave` path
to add four original-file imports through Vault's local Open Save File input;
the file is not uploaded or changed. The original-file unit check is likewise
opt-in; the reduced fixture/staged checks always run. See §70 for the tested
file's hash and the coordinate-click attempts excluded from the final results.

`--suite qa --filter 'QA-46/'` restores synthetic saves in all three worlds on
Home, Builder and Vault at 1366/375 px in both themes (36 cases). Opening,
Cancel and Escape preserve localStorage and restore focus; confirmation alone
clears the loaded copy and focuses the file opener or Builder's main content.
Use `--touch` for tap events. The test never uploads a file or signs in.

`--suite qa --filter 'QA-47/'` checks Enchanting, Spellmaking and Faction Journal
status names in all three worlds, both themes, and 1366/375 px (12 cases, three
tools per case), including overflow, axe and screenshots.

`--suite qa --filter 'QA-43-remainder/' --touch` checks the unfiltered Blades row
on first load, full-row/badge visibility and hit testing, selection, the last
scrollable row and empty search in all worlds, both themes and 1366/375/390 px
(18 cases). Keep the older `QA-43/` filtered-row checks as well.

`--suite qa --filter 'QA-51/' --touch` checks the Home fractional Health forecast,
an imported ring and equipped late-game recommendations in all worlds, both
themes and 1366/375 px (12 cases). Display has at most one decimal and the stored
save is unchanged. Axe covers the equipped kit; click, Enter and Space open the
slot chooser, Escape closes it, and keyboard Unequip does not open the chooser.
