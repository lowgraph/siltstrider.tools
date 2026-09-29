# Release branch and deployment

`main` is the canonical development and release branch for `lowgraph/siltstrider.tools`.
The older `master` branch is retained as history; do not deploy it or use it for new work.

Cloudflare Worker `plain-disk-78e6` serves `siltstrider.tools`. As checked on
23 September 2026, there are no Workers Builds triggers: Git pushes do not deploy.
Deployment is a deliberate local release, using the separately staged game bundle.

Before releasing, capture the recovery record and follow the
[launch operations checklist](LAUNCH_OPERATIONS.md). It covers error logs, database
exports, and schema-compatible rollback. Final browser checks should target a frozen
equipment optimizer revision; Discord sign-in is a separate production check.

## Routing and the www redirect

`wrangler.jsonc` sends only `/api/*` through the Worker (`"run_worker_first": ["/api/*"]`).
Pages, scripts, images and game data are served straight from the asset store and do not
invoke the Worker, so they do not count against the Workers request allowance; before
29 September every request did, about 18 for a first visit to `/builder`.

Because asset requests bypass the Worker, it no longer redirects `www` for pages. A
Cloudflare **redirect rule** on the `siltstrider.tools` zone does, and must exist before a
release with this routing: Rules → Redirect Rules → Create rule, *Hostname equals*
`www.siltstrider.tools`, dynamic target `concat("https://siltstrider.tools", http.request.uri.path)`,
status 301, preserve query string. Redirect rules run before the Worker. The Worker's own
`www` redirect stays as the fallback for `/api/*`. Without the rule, `www` pages still load
but sign-in and the API, which accept only `https://siltstrider.tools`, fail there.

## Release procedure (PowerShell)

Start from a clean `main` checkout synchronized with `origin/main`. Inspect the staged
bundle's `public/game-data/current.json`; generated game data is not in Git.

```powershell
git fetch origin
git status -sb
git log -1 --oneline
$env:TEMP='A:\Cache'
$env:TMP='A:\Cache'
npm test
# Stop if tests fail.
npm run build:cloudflare
# Stop if the build fails.
$releaseCommit = git rev-parse HEAD
$releaseTag = git rev-parse --short HEAD
node node_modules/wrangler/bin/wrangler.js deploy --keep-vars --tag $releaseTag --message "main $releaseCommit"
```

`--keep-vars` preserves dashboard-managed variables. The checked-in configuration
supplies the existing D1 binding and custom domain; secrets remain managed separately.
The production build accepts `SILT_PRODUCTION_CLERK_PUBLISHABLE_KEY` when authentication
is configured. Do not substitute a development key into production.

After deployment, check the home response, static assets, the bundle pointer, and
Workers deployment history. Check that `https://www.siltstrider.tools/builder` answers
301 to `https://siltstrider.tools/builder` and that `/api/account` answers 401 without a
session. Record the commit, bundle ID, and Worker version ID in
the release handoff. Browser/account behavior needs its own verification.

Do not enable branch-triggered builds until the build environment has a deliberate
way to obtain and validate the excluded game bundle. An automatic source-only build
could publish a site without its catalogs.
