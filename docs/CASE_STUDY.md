# Engineering case study: Silt Strider

[Live application](https://siltstrider.tools/) · [Repository overview](../README.md)

## Problem

Morrowind character planning spans equipment, magic, progression, travel, and quest
access. Adding large mods expands the choices and changes the data behind them.
A collection of unrelated tables makes it hard to answer a contextual question:
which item fits this build and is obtainable under these constraints?

The project turns installed game data into a common input for a suite of planning
tools. The useful engineering challenge is preserving meaning through that chain:
binary records, plugin overrides, normalized relationships, policy decisions,
published catalogs, and interactive calculations.

## My role and AI assistance

I directed the product requirements, approved the supported content, defined early-game
constraints, evaluated the interface, and decided what to accept and release.
For example, early recommendations use a spending ceiling of 500 per item and a danger
reference based on the Mentor's Ring encounter; theft is a separate user choice.
These are product policies, not facts inferred from game files.

Coding agents implemented substantial portions of the system. Responsibilities were
split across data engineering, application development, and UI architecture.
The contribution demonstrated here is directing and evaluating that work through
explicit contracts and tests, including finding places where passing tests did not
establish correctness. It is not a claim of manually authoring every module.

## Decision: normalize relationships before expanding paths

An early locations export expanded more than a million location paths while processing
only a fraction of its references and reached gigabytes of output. Storing every path
was the wrong representation for the questions the application needed to answer.

The pipeline moved to normalized world relationships and bounded acquisition queries.
It can reuse inventory/list edges and report truncation or unknown results instead of
materializing every route. This trades an oversized flat export for more explicit query
logic and uncertainty handling.

The counts above are observations from development, not a controlled benchmark.
See the [pipeline acquisition design](https://github.com/lowgraph/openmw-decompiler/blob/master/ACQUISITION_INDEX.md).

## Decision: one release contract between repositories

The site accepts immutable JSON bundles described by a manifest. A loader pins one
release for a page session and checks identity, hashes, counts, keys, and profile
relationships before accepting data. ARCE can inherit TR catalogs and supply deltas.

This allows independent work on extraction and UI while making incompatibilities
visible at their shared boundary. The cost is a deliberate publication/staging step;
rebuilding data does not automatically update an open page or deployed site.

Evidence: [loader](../lib/bundle-loader.mjs), [staging](../scripts/stage-game-data.mjs),
[contract tests](../test/bundle-contract.test.js).

## Decision: separate evidence from recommendation policy

An item's existence, ownership, and placement are source observations. Whether it is
suitable for an early character is a judgment using spending, danger, theft, and other
constraints. Keeping those layers separate makes a policy change explainable without
pretending that the extracted facts changed.

That separation also limits claims: a published recommendation is a result under a
particular policy and snapshot, not proof that every conceivable route was simulated.

Evidence: [pipeline policy](https://github.com/lowgraph/openmw-decompiler/blob/master/POLICY.md)
and [site consumption contract](../DATA_LOADER.md).

## Case study: alchemy integration

A review found that a successful catalog load did not imply a correct calculation.
The adapter returned effect IDs and names while the React calculator expected cost and
harmful-effect flags directly on ingredient effects. It defaulted missing cost to 1.
Changing the source cost tenfold produced the same potion, and Fire Damage was treated
as beneficial. Meanwhile, the older integration test still exercised an archived runtime.

The correction joins the existing engine-derived EffectRules catalog by effect ID,
passes profile GameSettings into the calculator, and uses OpenMW's apparatus and potion
formulas. Missing rules block a result. Profile changes clear selections, and matching
includes the attribute/skill target so Fortify Strength does not match Fortify Intelligence.

New tests cover exact outputs, changed costs/settings, missing metadata, duplicate
ingredients, zero-rounded effects, target matching, and the native React loading/error
and profile lifecycle. The lesson is concrete: validate the adapter and the current UI
as a chain, not merely each module or its predecessor in isolation.

Evidence: [adapter](../lib/alchemy-catalogs.mjs), [math](../lib/alchemy-math.mjs),
[regressions](../test/alchemy-live.test.js),
[OpenMW 0.51.0 source](https://github.com/OpenMW/openmw/blob/openmw-0.51.0/apps/openmw/mwmechanics/alchemy.cpp).

## Evolution and remaining work

The UI evolved from a single HTML file to native React views and shared contexts.
Archiving the transition code retained useful regression fixtures, but the alchemy
review showed why those fixtures cannot substitute for current-component tests.

The application also includes client-side OpenMW save parsing and authenticated cloud
save routes. Deployment configuration, real account flows, and visual verification
need separate checks; a green unit suite does not establish those outcomes.

Next portfolio milestones are a verified demo release, screenshots from that exact
release, and measurements gathered with a documented method. Until then, this case
study makes no claims about user adoption, load-time improvements, or production uptime.
