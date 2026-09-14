"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const SITE_PATH = path.join(__dirname, "..", "index.html");

// Loads the single-file app into a real DOM and runs its inline scripts,
// the same way a browser would. This lets us call the app's own global
// functions (including its built-in self-tests) from Node.
async function loadSite() {
  const dom = await JSDOM.fromFile(SITE_PATH, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://example.com/",
  });
  // Inline <script> tags run synchronously as the document is parsed, but
  // give any load-event handlers a turn before we start poking at it.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return dom;
}

test("page loads and exposes the optimizer self-tests", async () => {
  const dom = await loadSite();
  const { window } = dom;
  assert.equal(typeof window.runOptimizerTests, "function");
  assert.equal(typeof window.regressionRankingsDiffer, "function");
  assert.equal(typeof window.makeBuildProfile, "function");
});

test("runOptimizerTests() self-check passes", async () => {
  const dom = await loadSite();
  const result = dom.window.runOptimizerTests();
  const failing = Object.keys(result).filter((k) => k !== "all" && !result[k]);
  assert.deepEqual(failing, [], `failing sub-checks: ${failing.join(", ")}`);
  assert.equal(result.all, true);
});

test("regressionRankingsDiffer() reports rankings differ across builds", async () => {
  const dom = await loadSite();
  assert.equal(dom.window.regressionRankingsDiffer(), true);
});

test("core views are present in the DOM", async () => {
  const dom = await loadSite();
  const { document } = dom.window;
  assert.equal(document.querySelector("title").textContent.includes("Silt Strider"), true);
  assert.equal(typeof dom.window.showView, "function");
});
