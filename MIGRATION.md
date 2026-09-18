# Next.js migration: compatibility checkpoint

The root page now runs on standard Next.js App Router with React and Tailwind.
The verified DOM application remains inside `components/legacy-workbench.jsx`.
It is a migration boundary, not a completed rewrite into React components.

Run `npm run dev` and open http://localhost:8765/.
`npm run dev:legacy` still runs the original single-file preview on that port;
stop one server before starting the other. Using the same origin preserves local
storage and Clerk localhost settings. Existing hash links keep their format.
The production checkpoint is deployed as a static export on Cloudflare (see below).

## Files

- `index.html`: untouched reference implementation and existing regression fixture.
- `scripts/extract-legacy.cjs`: deterministic extraction of that reference.
- `public/legacy/legacy-data.js`: extracted large literal declarations, including
  game tables and authored data. Temporary compatibility format, not the new bundle.
- `public/legacy/legacy-runtime.js`: existing application logic, unchanged except
  those declarations are removed. Still a classic script with global handlers.
- `public/legacy/legacy.css` and `public/legacy/assets`: external styles/assets.
  Original font licence comments remain in the CSS.
- `migration/generated/body.json`: markup without script/style/data blocks.
- `app/`: Next.js root route, layout and Tailwind entrypoint.

`predev` and `prebuild` regenerate extracted files. Do not edit generated outputs.
Only the validated Clerk publishable key is passed to the browser. `.env.local`
and repository files are outside `public`. No new credentials are provisioned.

## Next checkpoints

1. Replace one complete DOM tool at a time with React state and components;
   port its behavior tests before retiring its old DOM handlers.
2. Connect the content-addressed app bundle through a tested adapter. Keep
   authored challenges/premade builds separate. Preserve old saved display-name
   references with a compatibility mapping to canonical keys.
3. Move authentication to React Clerk when replacing the legacy header.
4. Verify saves, share links and calculator parity in the browser, then configure
   Next.js production hosting independently of the current Worker deployment.

The old tables remain external compatibility files until adapters are verified.
Removing them now would break the verified calculation routines.

## Publish this checkpoint

`npm run build:cloudflare` exports the Next.js frontend to `.next-export/`.
`npm run deploy:cloudflare` builds and publishes it with an authenticated Wrangler
session to the existing `plain-disk-78e6` Worker at https://siltstrider.tools.
Only exported browser assets are uploaded; the development D1 test route is not
part of this deployment. This stage uses Next.js static export, so server-side
Next.js features will require a separate hosting change when introduced.

The release build intentionally ignores the localhost Clerk key. Set
`SILT_PRODUCTION_CLERK_PUBLISHABLE_KEY` to a configured Clerk live public key
before building when production sign-in is ready; otherwise it remains disabled.
Never put a Clerk secret key into this variable. Local preview still uses
`CLERK_PUBLISHABLE_KEY` from the ignored `.env.local`.

`scripts/cloudflare-assets.cjs` also supports connector-managed direct uploads:
`manifest` emits file hashes and sizes; `upload` reads a short-lived upload session
from stdin and emits its completion token. Treat that output as confidential.
It does not deploy a version itself or store credentials.

## React shell checkpoint

`components/site-header.jsx` owns the brand, primary navigation and profile
controls. `ShellProvider` exposes `useShell()` with `profile`, `world`, `arce`,
`view`, `ready`, `navigate()` and `setProfile()` to new React tools.
The extracted header contains a portal slot; legacy calculators keep their own
DOM, and the Clerk account area and profile warning remain legacy-owned.

`migration/shell-bridge.js` publishes immutable snapshots after legacy profile,
navigation and restore operations, batching nested changes. Legacy functions
remain the source of calculator behavior during this transition. The React
header uses separate IDs so legacy code never mutates its controls.
The original HTML reference remains unchanged. Generated resource URLs use
a revision covering the transformed markup, runtime, data and CSS.

Validation: 82 fixture tests, static production build, and local browser profile
and navigation checks. This checkpoint has not been published.

## Game-data loader

The on-demand loader and React hook are ready. See [DATA_LOADER.md](DATA_LOADER.md)
for feature groups, local staging, caching, and integration. This adds the data
access layer. Character catalogs now feed the builder and challenge generator through
the character adapter and bridge; other tools still use their legacy tables.
Character data and linked spells load before initialization, with profile switching
and saved restores waiting for the matching profile. Existing save/link formats
and calculation formulas remain compatible.
