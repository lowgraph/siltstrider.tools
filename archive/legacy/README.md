# Silt Strider Legacy Archive

This directory contains archived components, migration bridges, and scripts from the pre-decoupling architecture of Silt Strider.

## Background
During the initial phases of the Next.js 16 / React 19 migration, the application operated via a hybrid DOM-slicing harness:
- `index.html` was parsed by `extract-legacy.cjs` to extract markup, scripts, and styles into temporary compatibility assets in `public/legacy/`.
- `components/legacy-workbench.jsx` rendered the extracted markup inside a DOM wrapper and mounted React workstations via React portals (`createPortal`).
- `migration/shell-bridge.js` and `migration/character-bridge.js` synchronized event state between classic scripts and React context.
- `scripts/dev-server.cjs` served the raw single-file `index.html` preview on port 8765.

## Modern Replacement
As of **Phase 12 (Modern App Shell & Architecture Decoupling)**:
- All 12 application tools mount declaratively as native React components in `components/app-shell.jsx`.
- URL permalinks and hash state are managed by the pure ESM `lib/permalink-codec.mjs`.
- Challenge generation is handled by the pure ESM `lib/challenge-engine.mjs`.
- Pelagiad typography and Morrowind 9-slice textures are hosted as first-class static assets in `public/fonts/` and `public/textures/`.
- Base CRPG rules and layout tokens are bundled natively via `app/legacy-compat.css` and `app/globals.css`.

These archived files are retained for historical provenance and regression verification.
