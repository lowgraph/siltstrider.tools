# Travel branch merge preparation — 30 September 2026

Implementation commit: `dce0622` on `launch/trv-2-unified-place-search`.
Main inspected: `0bc1a7f28f55316184df7ada5519f65e29b5e024`.
The owner requested commit and preparation, **without merging yet**. Neither
branch has been merged, rebased or pushed in this step; nothing was deployed.

## Scope for the eventual merge

TRV-2 unifies endpoint search; TRV-4/5 put the journey before folded options;
TRV-6 preserves save/profile choices and budgets Intervention scrolls and Magicka;
TRV-7 adds real movement estimates and Cheapest comparisons; TRV-8 consolidates
network status. The branch also has regression tests, player changelogs and the
Chrome browser runner. No published bundle/schema, extraction or migration changes.

## Prepared conflict resolutions

A non-mutating `git merge-tree` preview found six conflicted files. Resolutions
are prepared under `A:/Cache/trv-merge-preparation/resolved/`:

| File | Resolution |
| --- | --- |
| `CHANGELOG.md` | Retain both September 30 entries: Travel and main's newcomer/contrast changes. |
| `components/views/changelog-view.jsx` | Put both sets of player notes in the same day's list. |
| `components/equipment-studio/equipment-slot-card.jsx` | Keep main's unfaded restriction card, `danger-7` warning and `fg-14` labels/icons. |
| `components/level-simulator/level-step-editor.jsx` | Keep main's `fg-9` preset descriptions, as its acceptance tests require. |
| `docs/LAUNCH_CHECKLIST.md` | Keep main's owner-directed priorities, completed Builder work and production acceptance; add the Travel completion records and latest owner workflow. |
| `docs/LAUNCH_VERIFICATION.md` | Keep main's current release/production history and append the local Travel verification. |

Main's unfaded Travel labels, new local saves, premade-first Builder, calculator
profile-switch policy and objective labels are retained by the automatic preview.
The browser runner explicitly enters the custom Builder before testing equipment,
so it works with the premade-first default too.

## Verification and handoff

The Travel branch passed **757 tests**, the normal `npm run build:cloudflare`,
and **107 Chrome cases / 192 theme audits** with zero reported WCAG violations.
Original browser evidence: `A:/Cache/travel-branch-browser-release-ready/`.

The resolved combined preview passed **787 tests**. Its normal production build
also passed with `turbopack.root` widened **only in the disposable preview** to
allow the shared dependency junction. Repository configuration is unchanged.
The attempted webpack fallback cannot bundle the existing `node:crypto`/`node:zlib`
imports; the successful check uses the project's normal Turbopack compiler.
Preview logs and the final browser report are under
`A:/Cache/trv-merge-preparation/`.
The combined preview also passed **107 Chrome cases / 192 theme audits**, with
zero reported WCAG violations, uncaught exceptions or unexpected server errors.
`preparation.json` records the exact source tips and resolved source tree;
`resolution.patch` contains the six conflict resolutions against the automatic
preview tree, and `integration.patch` describes the complete result relative to main.

First command before the eventual merge: `git fetch origin`, then check both tips
against `A:/Cache/trv-merge-preparation/preparation.json`. Prepared files are for
those exact source tips; re-evaluate conflicts if either changes. After the owner
authorizes the merge, retain both sides' records as described above, run tests and
the production build on the resulting checkout, and commit only after they pass.
The browser command is documented in [BROWSER_TESTS.md](BROWSER_TESTS.md).

Push, merge and deployment remain separate owner steps. The prepared source
snapshot and resolution patch in the cache do not update Git branch history.
