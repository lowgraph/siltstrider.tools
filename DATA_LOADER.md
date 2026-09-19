# On-demand game-data loader

`lib/bundle-loader.mjs` reads app bundle schema 1.0.0. It does not fetch anything
at construction. `loadCatalog(profile, name)` fetches one category;
`loadFeature(profile, feature)` fetches the categories in `FEATURE_CATALOGS`.
Character basics deliberately exclude spells and equipment. `inventory` is the
explicit full inventory picker group, not an initial page dependency. These are
data groups, not declarations that the calculators' engine rules are complete.

## Local setup

Run `npm run data:stage` to validate and copy the completed bundle from
`A:/Cache/OpenMWFoundation/app-bundle` into ignored `public/game-data`. For another source:

```powershell
npm run data:stage -- A:\Cache\OpenMWFoundation\app-bundle
```

This reads completed JSON files only. It runs no extraction and opens no databases.
All payloads and reconstructed deltas are verified before the current pointer is
switched. A timestamp-only rebuild preserves the existing immutable manifest;
all other manifest differences are rejected. Only files named by the manifest are copied. Existing releases remain.
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
hidden tools. The character builder and challenge generator now consume the character adapter below.

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

The loader does not fetch world SQLite, book prose, journal or travel SQL databases.
`GearRows` is loaded only when the user clicks Optimize Gear. The staged
release `05c8e35f088e181ca115d94c` supplies 424 rows per profile (TR+ARCE inherits TR).
`loadFeature` returns verified envelope fields in `metadata` alongside `catalogs`;
inherited metadata retains its source profile, while the feature retains the
selected profile. No extra payload request is needed for metadata.

The existing optimizer's Early game section uses `makeBuildProfile` for the same
race, attribute, specialization and skill priorities as the endgame optimizer.
It loads GearRows, Armor and Clothing on demand. Primary armor and one major-skill
alternative set are grouped separately. Bracers and gauntlets share one slot;
clothing gloves and shoes are omitted when either displayed armor set occupies
those slots. A recommended shield restricts weapons to one-handed choices; if
only a two-handed primary is available the shield is removed. Unarmored and
unarmed builds retain their corresponding empty equipment slots.

Beast compatibility uses catalog bodyParts: OpenMW rejects head (0) and foot
(15/16) parts. Hair-only helmets remain eligible; a compatible published alternative
can replace an incompatible primary. Missing compatibility data is never guessed.
Only the published primary/alternative candidates can be selected; a lower-ranked
compatible item may exist outside those rows. Source: OpenMW Armor::canBeEquipped
and components/esm3/loadarmo.hpp.

The interface keeps Slot / Item / Where, 'or' rows, the shared Optimize Gear action,
and three independent policy toggles. Broken equipment requires repair before use;
condition-scaled values are not merchant quotes. A ring row establishes one copy,
not a guaranteed pair. Late-game and constant-effect ranking remain in the existing
optimizer. These changes never reevaluate acquisition policy or run extraction.

## Checks

`node --test test/bundle-loader.test.js` uses in-memory synthetic manifests and
responses. The full regression suite remains `npm test`. No test rebuilds real
game data. No production deployment is performed by the loader or staging script.

## Character integration

The character-catalogs adapter supplies playable races/classes, birthsigns, skills
and attributes to existing calculations. It also loads Spells to resolve racial
and birthsign abilities, starting spells, and the existing magicka and birthsign
attribute bonuses. Canonical keys and source records are retained. Distinct
Khajiit variants keep their established display labels.

The transitional classic runtime requires character data at initialization,
including on the home view. It loads the selected profile's character group plus
Spells before enabling controls; equipment and other feature groups remain lazy.
Profile switches wait for verified data, retain the previous profile on failure,
and offer retry. Late obsolete transitions cannot replace a newer selection.

Existing v1 saves and links keep their display-name format. Canonical IDs are
accepted by the compatibility adapter, but this does not migrate the save schema.
Authored premade builds, challenge rules and calculation formulas remain separate.
Legacy tables remain compatibility fixtures/fallbacks for standalone HTML tests.

The character-catalogs tests check calculation parity, changed source facts,
identity mapping, profile failures, and asynchronous restores using synthetic
records. Full extractions are never run by these tests.
