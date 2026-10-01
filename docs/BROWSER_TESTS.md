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
The tools suite also checks `Alchemy effect finder` across all three profiles,
both themes and 1366/375 px: effect search, multiple desired effects, filling a
pair while clearing the other slots, focus on the potion output, empty matches,
profile isolation, no overflow and axe accessibility.
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
