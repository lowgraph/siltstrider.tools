"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..");

test("seo-breadcrumbs.mjs exports valid TOOL_SCHEMAS and getToolJsonLd", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);
  assert.equal(typeof mod.getToolJsonLd, "function");
  assert.ok(mod.TOOL_SCHEMAS && typeof mod.TOOL_SCHEMAS === "object");

  const expectedTools = [
    "builder",
    "leveler",
    "factions",
    "challenge",
    "vault",
    "alchemy",
    "travel",
    "enchanting",
    "spellmaking",
    "about",
    "changelog",
  ];

  for (const view of expectedTools) {
    const schema = mod.getToolJsonLd(view);
    assert.ok(schema, `getToolJsonLd('${view}') must return a WebApplication schema object`);
    assert.equal(schema["@context"], "https://schema.org");
    assert.equal(schema["@type"], "WebApplication");
    assert.ok(schema.name && schema.name.length > 5, `Tool ${view} must have a descriptive name`);
    assert.ok(schema.url.startsWith("https://siltstrider.tools/"), `Tool ${view} url must be canonical`);
    assert.ok(schema.description && schema.description.length > 20, `Tool ${view} must have substantive description`);
    assert.equal(schema.applicationCategory, "GameApplication");
    assert.ok(Array.isArray(schema.featureList) && schema.featureList.length >= 3, `Tool ${view} must list at least 3 features`);
    assert.equal(schema.offers["@type"], "Offer");
    assert.equal(schema.offers.price, "0");
  }
});

test("seo-breadcrumbs.mjs exports valid TOOL_FAQS and getToolFaqJsonLd for key calculators", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);
  assert.equal(typeof mod.getToolFaqJsonLd, "function");
  assert.ok(mod.TOOL_FAQS && typeof mod.TOOL_FAQS === "object");

  const faqTools = ["leveler", "alchemy", "enchanting", "travel"];

  for (const view of faqTools) {
    const faq = mod.getToolFaqJsonLd(view);
    assert.ok(faq, `getToolFaqJsonLd('${view}') must return an FAQPage schema object`);
    assert.equal(faq["@context"], "https://schema.org");
    assert.equal(faq["@type"], "FAQPage");
    assert.ok(Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 1);

    for (const q of faq.mainEntity) {
      assert.equal(q["@type"], "Question");
      assert.ok(q.name && q.name.length > 10, "Question must have descriptive title");
      assert.equal(q.acceptedAnswer["@type"], "Answer");
      assert.ok(q.acceptedAnswer.text && q.acceptedAnswer.text.length > 30, "Answer must be substantive");
    }
  }
});

test("All 11 tool routes provide semantic sr-only h1, twitter cards, and deep json-ld", async () => {
  const { VIEW_HEADINGS } = await import("../lib/view-headings.mjs");
  const toolPages = [
    { dir: "builder", view: "builder", h1Keyword: "Character Builder" },
    { dir: "leveler", view: "leveler", h1Keyword: "Level Simulator" },
    { dir: "alchemy", view: "alchemy", h1Keyword: "Alchemy Calculator" },
    { dir: "travel", view: "travel", h1Keyword: "Travel Map" },
    { dir: "spellmaking", view: "spellmaking", h1Keyword: "Spellmaking" },
    { dir: "enchanting", view: "enchanting", h1Keyword: "Enchanting" },
    { dir: "factions", view: "factions", h1Keyword: "Faction Journal" },
    { dir: "challenge", view: "challenge", h1Keyword: "Challenge Run" },
    { dir: "vault", view: "vault", h1Keyword: "Vault" },
    { dir: "about", view: "about", h1Keyword: "About Silt Strider" },
    { dir: "changelog", view: "changelog", h1Keyword: "Changelog" },
  ];

  for (const page of toolPages) {
    const filePath = path.join(ROOT, "app", page.dir, "page.jsx");
    assert.ok(fs.existsSync(filePath), `Page file must exist: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf8");

    // 1. Its sr-only h1 comes from the shell, inside <main>, for this view (lib/view-headings.mjs)
    assert.match(content, new RegExp(`initialView="${page.view}"`), `${page.dir}/page.jsx must open its own view`);
    assert.doesNotMatch(content, /<h1\b/, `${page.dir}/page.jsx must not render an h1 outside <main>`);
    assert.match(VIEW_HEADINGS[page.view] || "", new RegExp(page.h1Keyword), `the ${page.view} heading must contain '${page.h1Keyword}'`);

    // 2. Must define twitter card metadata
    assert.match(content, /twitter:\s*\{/, `${page.dir}/page.jsx must define twitter metadata`);
    assert.match(content, /card:\s*['"]summary_large_image['"]/, `${page.dir}/page.jsx must use summary_large_image card`);
    assert.match(content, /\/og-image\.png/, `${page.dir}/page.jsx twitter card must reference /og-image.png`);

    // 3. Must import getToolJsonLd
    assert.match(content, /getToolJsonLd/, `${page.dir}/page.jsx must import getToolJsonLd`);
  }
});

test("Legal pages define twitter cards and preserve existing h1", () => {
  for (const dir of ["privacy", "terms"]) {
    const filePath = path.join(ROOT, "app", dir, "page.jsx");
    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /twitter:\s*\{/, `${dir}/page.jsx must define twitter metadata`);
    assert.match(content, /card:\s*['"]summary_large_image['"]/, `${dir}/page.jsx must use summary_large_image card`);
  }
});

test("Alchemy page renders crawlable apparatus guide and engine formulas for SSR thin-content mitigation", () => {
  const pagePath = path.join(ROOT, "app", "alchemy", "page.jsx");
  const content = fs.readFileSync(pagePath, "utf8");

  // Must render sr-only guide
  assert.match(content, /<section className="sr-only"[^>]*aria-label="Morrowind Alchemy Mechanics &amp; Brewing Guide"/, "must contain crawlable sr-only guide");
  assert.match(content, /Mortar and Pestle/, "must explain Mortar and Pestle");
  assert.match(content, /Alembic/, "must explain Alembic");
  assert.match(content, /Calcinator/, "must explain Calcinator");
  assert.match(content, /Retort/, "must explain Retort");
  assert.match(content, /⌊Alchemy Skill \+ 0\.1 × Intelligence \+ 0\.1 × Luck⌋%/, "must state exact brew probability formula");
  assert.match(content, /OpenMW 0\.51\.0/, "must cite OpenMW 0.51.0 engine mechanics");
});

test("Adversarial QA: getToolJsonLd and getToolFaqJsonLd handle malformed and boundary inputs", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);

  // Malformed inputs to getToolJsonLd
  assert.equal(mod.getToolJsonLd(null), null);
  assert.equal(mod.getToolJsonLd(undefined), null);
  assert.equal(mod.getToolJsonLd(""), null);
  assert.equal(mod.getToolJsonLd("unknown_tool_xyz"), null);
  assert.equal(mod.getToolJsonLd(12345), null);
  assert.equal(mod.getToolJsonLd({}), null);

  // Malformed inputs to getToolFaqJsonLd
  assert.equal(mod.getToolFaqJsonLd(null), null);
  assert.equal(mod.getToolFaqJsonLd(undefined), null);
  assert.equal(mod.getToolFaqJsonLd("nonexistent"), null);
  assert.equal(mod.getToolFaqJsonLd(999), null);
  assert.equal(mod.getToolFaqJsonLd({}), null);
});

test("structured data never promises that nothing leaves the browser", async () => {
  // Search engines show FAQ answers and feature lists verbatim. Opening a save is local,
  // but Cloud Vault stores parsed character data and sign-in goes through Clerk, so an
  // absolute promise would contradict the About page and the Privacy Policy.
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);
  const everything = JSON.stringify([
    mod.ABOUT_FAQ_JSON_LD,
    ...Object.keys(mod.TOOL_SCHEMAS).map(view => mod.getToolJsonLd(view)),
    ...Object.keys(mod.TOOL_FAQS).map(view => mod.getToolFaqJsonLd(view)),
  ]);
  for (const promise of [/zero[- ]tracking/i, /zero server transmission/i, /ever transmitted/i,
    /no (save )?data or personal information/i, /never (sent|transmitted)/i]) {
    assert.doesNotMatch(everything, promise);
  }
  const safety = mod.ABOUT_FAQ_JSON_LD.mainEntity.find(q => /\.omwsave/.test(q.name));
  assert.ok(safety, "the About FAQ still answers whether opening a save is safe");
  assert.match(safety.acceptedAnswer.text, /in your browser/);
  assert.match(safety.acceptedAnswer.text, /Cloud Vault .* sends the parsed character data/);
  assert.match(mod.getToolJsonLd("vault").description, /Optional cloud/);
});
