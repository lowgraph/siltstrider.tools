# Next.js migration checkpoint

The working app now has a Next.js App Router entrypoint. Run `npm run dev` and
open http://localhost:8765/. Run `npm run build` for the production build check.
See [MIGRATION.md](MIGRATION.md) for the compatibility boundary and next steps.
The original `index.html` remains the regression reference; `npm run dev:legacy`
starts its former preview. Stop either server before starting the other.

The notes below describe the original implementation and its auth behavior.

# Silt Strider

Morrowind Build Planner & Challenge Run Generator — a single self-contained
`index.html` (no build step; optional account controls load Clerk at runtime).

## Running it

Just open [index.html](index.html) in a browser.

### Local authentication preview

Use Node 22.11 or later and run `npm run dev`, then open
`http://localhost:8765/`. The preview loads ignored `.env.local` through Node;
only `CLERK_PUBLISHABLE_KEY` is inserted into the page. It serves only the HTML
page, never environment files or repository contents. Without a configured
public key, the standalone tools and local saves continue to work offline.

Clerk application `app_3JT2Lq5GbWQWzABTMGaOqEygOnp` is linked through the Git
remote. The CLI could not detect this static HTML project, so the integration
uses the official vanilla JavaScript SDK instead of scaffolding a framework.
Run `clerk doctor` to verify the local link. Google, Discord, and email/password
with email verification are enabled in the development instance.

The header exposes Sign in, Sign up, and Clerk's signed-in user menu. Account
names and credentials are handled by Clerk. Authentication never uploads local
saves or changes canonical character state. The small `siltStriderAuth` adapter
provides `ready()` and `getToken()` for later API integration; browser state is
not server authorization. A future API must verify tokens and enforce ownership.
Clerk's router callbacks handle same-document permalink returns without a hard
navigation. This lets Clerk finish activating the session immediately; its default
unload signal would otherwise leave the account controls stale on hash URLs.
Other paths, query changes, and external redirects use Clerk's normal navigation.

Production authentication is not configured. Development keys are restricted
to localhost in this integration. Deployment must supply a production public
key and configure the Clerk production instance and social providers. Never
embed `CLERK_SECRET_KEY` in HTML or commit environment files. Cloud storage,
backend authorization, and D1 are not implemented by this authentication setup.

Manual verification: open the preview, choose Sign up, complete a test signup,
confirm that a profile icon replaces the signed-out buttons, and sign out using
that menu. Repeat sign-in using the enabled providers. Automated tests mock the
SDK; they do not replace these real provider-flow checks.

## Testing

The app ships with its own internal self-tests (`runOptimizerTests()`,
`regressionRankingsDiffer()`) that check the build-optimizer logic. A small
jsdom harness in [test/site.test.js](test/site.test.js) loads `index.html`
into a real DOM (via Node's `node:test` runner) and runs those self-tests,
plus a couple of basic smoke checks, so regressions can be caught headlessly:

```bash
npm install
npm test
```
