# Silt Strider

Morrowind Build Planner & Challenge Run Generator — a single self-contained
`index.html` (no build step, no dependencies at runtime).

## Running it

Just open [index.html](index.html) in a browser.

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
