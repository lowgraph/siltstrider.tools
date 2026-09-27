# Three agents work on this project

Read [COORDINATION.md](COORDINATION.md) before starting, and [docs/AGENT_PATH_MIGRATION.md](docs/AGENT_PATH_MIGRATION.md)
for canonical repository paths and restructuring notes. Read [docs/DATA_LOADER.md](docs/DATA_LOADER.md)
for the data consumption contract, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture,
and [UI_TRANSFORMATION.md](UI_TRANSFORMATION.md) for the frontend transformation roadmap.

1. **Codex (Site Agent):** Owns this web application repository (`lowgraph/siltstrider.tools`). Implements
   Next.js 16 App Router, React 19 components, Tailwind styling, Clerk auth, and Cloudflare
   D1 migrations. Executes the UI transformation specified in [UI_TRANSFORMATION.md](UI_TRANSFORMATION.md).
2. **Claude (Data Agent):** Owns the sibling data pipeline repository (`lowgraph/openmw-decompiler`)
   and publishes content-addressed bundles under `public/game-data/`. Do not edit that repository
   or open raw SQLite databases here.
3. **Antigravity (UI Transformation Lead):** Directs the UI/UX architecture,
   component design, and CRPG authenticity across the project.

# Operational Guardrails & Quality Protocols

### 1. Shell & Environment Invariants (CRITICAL)
- **PowerShell Only:** Never emit bash chained operators (`&&`). Always use PowerShell command separators (`;`) or execute statements sequentially.
- **Temp Isolation:** All temp fixtures, staging databases, artifacts, and test caches must strictly reside in the configured local cache directory (e.g., `A:\Cache`). Always prefix pipeline test invocations with:
  `$env:TEMP='A:\Cache'; $env:TMP='A:\Cache'; python -B -m unittest discover -s . -p "test_*.py"`
- **Scratch & Secret Isolation:** Never stage scratch files (e.g., `<scratchDir>/capture-*.js`), `Char Creation.png`, or `Hey.html`. Always clean up temporary runner scripts after visual evaluation.
- **No Real-Data Rebuilds Without Instruction:** The user runs full game-data extraction commands locally in VS Code. Build code and provide commands; do not rebuild real-data catalogues unless explicitly asked. Verify changes with synthetic fixtures instead.
- **Provenance:** Preserve separate vanilla, tr, and tr_arce profiles and source provenance.

### 2. Cross-Repo Boundary Enforcement
- **Strict Boundary:** The Pipeline agent must NEVER directly modify files inside this web application repository.
- **Contract Sync:** Changes to game parsing outputs or schemas pass exclusively via exported JSON bundles to `public/game-data/` and synchronized updates to `COORDINATION.md` and `UI_TRANSFORMATION.md`.
- **No Stale Extraction Hooks:** The legacy prebuild extraction hook (`npm run extract:legacy`) was retired in Phase 13. Never attempt to run it. `index.html` remains at root as an active regression fixture.

### 3. Verification & Adversarial QA Protocols
- **Pipeline Tests:** Must pass cleanly with zero uncaught warnings. Summarize output; do not flood context with raw passing test logs.
- **Site Tests & CDP Screenshots:** Run `npm test` in this repository. For UI modifications, execute headless visual capture via Chrome CDP on port 8765 (`node <scratchDir>/capture-*.js`) to confirm layout integrity before ticket completion.
- **Adversarial Edge Cases:** Do not approve schema/logic changes on baseline tests alone. Before marking a logic task complete, write at least 3 automated tests targeting edge conditions (malformed record tags, missing SQLite indices, null/undefined properties, or boundary values).

### 4. Two-Failure Revert & Escalation Policy
- If an automated test fails twice consecutively during a fix attempt:
  1. Immediately abort code edits.
  2. Revert only the task's own specific changes (e.g. via targeted patch/hunk reversal or `git checkout -p`). Whole-file restore (`git restore <file>` / `git checkout -- <file>`) is permitted ONLY when that file contains no other concurrent modifications from other agents or tasks. Never perform blanket rollbacks (`git restore .` / `git checkout .`).
  3. Emit a concise root-cause analysis showing the failing stack trace and the exact breaking invariant.
  4. Stop and request a `/boost` escalation run. Do not accumulate speculative patches.

### 5. Handoff & Synchronization
- Keep `COORDINATION.md` and `UI_TRANSFORMATION.md` identical across both repositories.
- When completing a batch or milestone, update `COORDINATION.md` with:
  - Exported dataset schema changes.
  - Invariants assumed by the downstream Next.js / legacy JS runtime.
  - Exactly which script/command the next agent must run first.

# Technology Stack

This project has a fixed technology stack. Don't introduce a library, framework, or service that overlaps with anything below, even if it would normally be a reasonable default for the task at hand.

| Layer | Required | Do not add |
|---|---|---|
| Framework | React + Next.js (App Router) | Vite/CRA, Remix, Astro, SvelteKit, or other meta-frameworks |
| Styling | Tailwind CSS | styled-components, Emotion, Sass/Less, CSS Modules |
| UI components | shadcn/ui, extended with custom components | MUI, Chakra UI, Ant Design, Mantine, or other full component libraries |
| Authentication | Clerk | NextAuth/Auth.js, Firebase Auth, Supabase Auth, custom session/JWT auth |
| Database | Cloudflare D1 | Postgres, MySQL, MongoDB, Supabase, PlanetScale, or any other database |
| File / object storage | Cloudflare R2 | AWS S3, Google Cloud Storage, Azure Blob, Cloudinary, Firebase Storage |

## Adding new dependencies

- Utility libraries that don't compete with the table above (validation, date handling, binary parsing, etc.) are fine to add as needed.
- If a task genuinely seems to require something that overlaps with a row above, stop and ask before installing it instead of substituting it in silently.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
