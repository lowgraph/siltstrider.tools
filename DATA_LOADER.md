# On-demand game-data loader

`lib/bundle-loader.mjs` reads app bundle schema 1.0.0. It does not fetch anything
at construction. `loadCatalog(profile, name)` fetches one category;
`loadFeature(profile, feature)` fetches the categories in `FEATURE_CATALOGS`.
Character basics deliberately exclude spells and equipment. `inventory` is the
explicit full inventory picker group, not an initial page dependency. These are
data groups, not declarations that the calculators' engine rules are complete.

## Local setup

Run `npm run data:stage` to validate and copy the completed bundle from
`A:/Cache/OpenMWBundlePreview` into ignored `public/game-data`. For another source:

```powershell
npm run data:stage -- A:\Cache\OpenMWFoundation\app-bundle
```

This reads completed JSON files only. It runs no extraction and opens no databases.
All payloads and reconstructed deltas are verified before the current pointer is
switched. Only files named by the manifest are copied. Existing releases remain.
Run staging before building a release when you intend to include the local bundle.
For R2/CDN hosting, set `NEXT_PUBLIC_GAME_DATA_URL` to that public bundle root at
build time instead. Cross-origin hosting must permit GET requests from the site.
The root must contain `current.json`, the referenced manifest, and its payloads.

## React usage

Inside an active tool under `ShellProvider`:

```jsx
const {status,data,error,retry}=useGameData('character', {enabled:isActive});
// status: idle | loading | ready | error
// data.catalogs.Races, Classes, Birthsigns, Skills, Attributes
```

Import `useGameData` from `components/use-game-data.jsx`. The hook follows the
shared profile. It immediately hides previous-profile data when the profile
changes, and ignores late responses for an obsolete request. Retry reattempts
failed requests; valid cached categories are retained. Keep the hook disabled for
hidden tools. The existing legacy calculators have not been rewired to this data.

Outside React, create a loader and call `loadCatalog` or `loadFeature` directly.
Returned records are deeply frozen and retain provenance. Copy before editing.

## Consistency and caching

A loader pins one manifest for its lifetime, preventing mixed releases. A new page
session checks the pointer again. Simultaneous requests share promises. Inherited
ARCE categories share TR records; changed categories apply removals/upserts by
canonical key (or `id` for derived attributes). Vanilla remains independent.

SHA-256, byte counts, envelope identities and record counts are checked. Verified
payloads are cached through Cache Storage at their immutable bundle URLs. A bad
cached response is evicted and fetched again. Cache denial/quota failures fall
back to in-memory caching. Failed requests can retry. HTTPS or localhost is
required for Web Crypto. Old release entries remain browser-managed; no cache
cleanup runs against a release another open tab may be using. Metadata currently
requires connectivity on a new page session; this is not a full offline mode.

The loader does not fetch locations, world SQLite, book prose, journal or travel
SQL databases. Gear rows use a separate contract and need their own adapter.

## Checks

`node --test test/bundle-loader.test.js` uses in-memory synthetic manifests and
responses. The full regression suite remains `npm test`. No test rebuilds real
game data. No production deployment is performed by the loader or staging script.
