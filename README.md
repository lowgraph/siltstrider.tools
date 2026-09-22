Silt Strider Tools

A data-driven companion application for The Elder Scrolls III: Morrowind and Tamriel Rebuilt.

Silt Strider turns complex game data into interactive planning and decision tools for character builds, equipment, magic, progression, and challenge runs.

Live application: "siltstrider.tools" (https://siltstrider.tools/)
Data pipeline: "lowgraph/openmw-decompiler" (https://github.com/lowgraph/openmw-decompiler)

---

Overview

Silt Strider began as a standalone browser tool and has grown into a larger data-driven application with a dedicated extraction pipeline, versioned data contracts, persistent character state, authentication groundwork, and an incremental migration to Next.js and React.

The application supports multiple game-data profiles, including:

- Vanilla Morrowind
- Tamriel Rebuilt
- Tamriel Rebuilt + ARCE

Its tools share structured character and game data rather than operating as unrelated calculators.

The larger system is split across two repositories:

OpenMW / Morrowind / mod data
             │
             ▼
   openmw-decompiler
 extraction + normalization
 policy + derived datasets
 bundle generation
             │
             │ versioned, validated bundle
             ▼
     siltstrider.tools
 character tools + calculators
 recommendations + persistence
             │
             ▼
          Player

The browser application never reads the extraction databases directly. Its only data interface is the published application bundle.

---

What the application does

Silt Strider combines several related tools around a shared character model.

Current areas include:

- character and build planning
- premade and custom builds
- challenge-run generation
- equipment and gear recommendations
- alchemy calculations
- enchanting calculations
- spellmaking calculations
- cross-tool character-stat synchronization
- shareable character and challenge links
- browser-local saved characters
- multiple game-data profiles

The goal is not simply to reproduce game tables. The application uses normalized data and game rules to answer practical player questions such as:

- What does this build look like at creation?
- Which equipment fits this character and play style?
- What can realistically be acquired under a given set of constraints?
- How do character stats affect enchanting, spellmaking, or alchemy?
- How can a build or challenge setup be shared and restored reliably?

---

Architecture

Application

The current application uses:

- Next.js 16
- React 19
- Tailwind CSS 4
- Node.js test runner
- jsdom
- Clerk for authentication integration
- Cloudflare deployment infrastructure

The project is undergoing an incremental migration from its original DOM-driven browser application to a React/Next.js architecture.

That migration is deliberately evolutionary rather than a full rewrite. Existing behavior is preserved through regression tests while state, UI, and data access are progressively moved behind clearer boundaries.

Data layer

Game data is built separately in:

"github.com/lowgraph/openmw-decompiler" (https://github.com/lowgraph/openmw-decompiler)

The application consumes immutable releases under:

public/game-data/<bundleId>/

Each release is described by a manifest and selected through "current.json".

The application does not read the pipeline's SQLite databases.

---

Versioned data contract

"lib/bundle-loader.mjs" is the boundary between the data pipeline and the application.

A loader pins one manifest for its lifetime so a page session cannot accidentally combine data from different releases.

Before data is accepted, the loader validates:

- bundle and snapshot identity
- schema version
- profile structure
- catalog availability
- asset paths
- byte counts
- SHA-256 hashes
- payload identity
- record counts
- duplicate record keys
- inheritance and delta relationships

Tamriel Rebuilt + ARCE can inherit unchanged catalogs from the Tamriel Rebuilt profile and receive only record-level deltas for changed data.

This keeps releases smaller while preserving deterministic reconstruction of the complete profile.

Compatibility philosophy

The producer/consumer contract intentionally distinguishes additive and breaking changes.

Examples:

Accepted
────────
extra record fields
extra payload metadata
extra manifest metadata
new catalogs emitted consistently

Rejected
────────
unsupported schema versions
missing declared catalogs
record-count drift
invalid profile inheritance
tampered payloads
invalid deltas

These behaviors are pinned by "test/bundle-contract.test.js".

See:

- "DATA_LOADER.md" (DATA_LOADER.md)
- "COORDINATION.md" (COORDINATION.md)

---

Character state and persistence

The project separates several different kinds of state instead of treating the DOM or storage as a single undifferentiated object.

The canonical character format is a versioned, JSON-safe representation containing the character inputs required to reconstruct the build.

Validation happens before mutation.

Saved values are checked against the appropriate game-data profile before being restored.

Browser-local saved characters add:

- stable generated IDs
- explicit schema versions
- created/updated timestamps
- validated loading
- stale-edit detection
- malformed-data handling
- storage failure handling
- cross-tab coordination through Web Locks

Concurrent tabs do not blindly overwrite one another.

A stale modification is rejected rather than silently replacing a newer revision.

See "STATE.md" (STATE.md) for the full persistence and serialization design.

---

Cross-tool behavior

Character data can seed calculator inputs, but synchronization is designed not to override explicit user intent.

For example:

1. a character's Enchant skill can initialize the enchanting calculator;
2. the user can manually change that calculator value to model future progression;
3. later passive character updates preserve the manual value;
4. an explicit force-sync restores the character baseline.

This distinction between automatic synchronization and deliberate user overrides is tested in "test/cross-tool.test.js".

---

Testing

The project contains dedicated regression coverage for areas including:

- bundle loading
- producer/consumer contracts
- character calculations
- character catalogs
- character UI
- canonical state
- local saves
- cross-tab persistence
- authentication
- cross-tool synchronization
- gear data
- alchemy data
- migrations
- skill selection
- broader application behavior

Run the suite with:

npm install
npm test

Check the production build with:

npm run build

The test suite is particularly focused on failure modes and compatibility behavior rather than only happy-path rendering.

---

Development

Install dependencies:

npm install

Run the Next.js development server:

npm run dev

Then open:

http://localhost:8765/

Build for production:

npm run build

The original browser application remains available as a regression reference:

npm run dev:legacy

Staging game data

A completed bundle produced by the data repository can be validated and staged with:

npm run data:stage -- <path-to-app-bundle>

Staging validates the entire release before switching "current.json".

The previous release therefore remains selected if validation fails.

---

Authentication and backend status

Clerk integration provides the authentication boundary and token adapter used by the application.

Authentication is deliberately separate from application authorization.

A browser session or user ID supplied by a client is not treated as proof that a user owns a stored record.

Development work under "cloudflare/" explores D1-backed persistence with queries scoped to the authenticated Clerk user and optimistic revision checks.

Cloud persistence remains a separate architectural layer from browser-local saves and should not be inferred from authentication alone.

See "cloudflare/README.md" (cloudflare/README.md).

---

Human-directed, AI-assisted development

Silt Strider is built using specialized AI coding agents with explicit ownership boundaries.

Current responsibilities are divided between:

- Codex — application implementation
- Claude — data extraction and pipeline implementation
- Antigravity — UI/UX architecture and transformation specifications

The development model is intentionally more structured than using one general-purpose coding agent across the entire codebase.

Subsystems communicate through explicit contracts, and cross-cutting changes are validated through regression tests and staging checks.

The human role centers on:

- product requirements
- problem decomposition
- system boundaries
- acceptance criteria
- research and policy decisions
- integration decisions
- validation of generated implementations
- release decisions

See "COORDINATION.md" (COORDINATION.md) and "AGENTS.md" (AGENTS.md).

---

Repository boundaries

This repository owns the application.

It does not own raw game extraction or the source databases used to derive the published data.

siltstrider.tools
├── UI and application behavior
├── React / Next.js integration
├── state and persistence
├── authentication integration
├── browser data loader
├── bundle contract tests
└── deployment

openmw-decompiler
├── plugin extraction
├── normalized SQLite models
├── catalog generation
├── acquisition analysis
├── policy evaluation
├── derived recommendations
├── provenance and validation
└── application bundle production

The bundle is the contract between them.

---

Project status

Silt Strider is under active development.

The codebase currently combines a mature legacy runtime with an ongoing Next.js/React migration. That transitional architecture is intentional: existing calculations and application behavior remain covered by regression tests while functionality is progressively moved behind modern components and clearer state boundaries.

For the extraction, analytics, and bundle-generation side of the project, see:

"lowgraph/openmw-decompiler" (https://github.com/lowgraph/openmw-decompiler)
