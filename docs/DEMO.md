# Five-minute demo

Use the [live application](https://siltstrider.tools/) or `npm run dev` with a validated
bundle staged locally. Rehearse on the exact revision you will show. An account and a
save file are optional; do not make either a prerequisite for the main walkthrough.

| Time | Action | What it demonstrates |
| --- | --- | --- |
| 0:00–1:00 | Open Build Optimizer, choose a race and premade build, inspect attributes and skills. | A common character model drives the tools. |
| 1:00–2:00 | Open gear recommendations and vary an early-game policy toggle. | Recommendations combine extracted evidence with explicit policy. |
| 2:00–3:00 | Open Alchemy, choose two ingredients sharing an effect, then vary apparatus. | Profile catalogs feed a calculation; effect identity includes its target. |
| 3:00–4:00 | Generate a challenge, copy its link, and open it in a second tab. | A reproducible run survives serialization and navigation. |
| 4:00–5:00 | Show the architecture diagram and one alchemy regression test. | Explain the boundary, a real failure, and the evidence for the correction. |

Optional: open your own `.omwsave` and inspect the imported character. Use a save you
are comfortable displaying. Explain which values came from the save and which tools
are modeling a planned build. Do not imply import is a full game simulation.

## Before sharing the portfolio

- [ ] Run `npm test` and `npm run build` for the intended source revision.
- [ ] Validate and stage the intended bundle; record its bundle ID with the revision.
- [ ] Confirm the live deployment contains that revision before describing it as released.
- [ ] Rehearse the walkthrough on desktop and a narrow viewport.
- [ ] Check loading, failure/retry, and Vanilla/TR/TR+ARCE transitions.
- [ ] Verify login and cloud saves separately if they will be demonstrated.
- [ ] Capture real screenshots of the verified release and add them to the README.
- [ ] Check repository/documentation links from GitHub's rendered README.

These are presentation checks, not recorded passes. The latest local alchemy changes
have passing automated tests and a production build; browser visual verification and
deployment have not been completed in this work session.

## Explain the tradeoffs

Be ready to explain why the browser consumes a bundle instead of SQLite, why policy
is separate from evidence, how a missing effect rule is handled, and what the tests
cannot establish. Describe AI assistance plainly and point to your requirements,
acceptance decisions, and defect analysis rather than claiming unaided implementation.
