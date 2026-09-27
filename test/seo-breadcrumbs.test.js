"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..");

test("seo-breadcrumbs.mjs exports valid BREADCRUMB_MAP and getBreadcrumbJsonLd", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);
  assert.equal(typeof mod.getBreadcrumbJsonLd, "function");
  assert.ok(mod.BREADCRUMB_MAP && typeof mod.BREADCRUMB_MAP === "object");

  const expectedViews = [
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
    "privacy",
    "terms",
  ];

  for (const view of expectedViews) {
    assert.ok(mod.BREADCRUMB_MAP[view], `BREADCRUMB_MAP must have entry for '${view}'`);
    const breadcrumb = mod.getBreadcrumbJsonLd(view);
    assert.ok(breadcrumb, `getBreadcrumbJsonLd('${view}') must return an object`);
    assert.equal(breadcrumb["@context"], "https://schema.org");
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.ok(Array.isArray(breadcrumb.itemListElement));
    assert.equal(breadcrumb.itemListElement.length, 3);

    // Position 1: Home
    assert.deepEqual(breadcrumb.itemListElement[0], {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://siltstrider.tools",
    });

    // Position 2: Group
    assert.equal(breadcrumb.itemListElement[1]["@type"], "ListItem");
    assert.equal(breadcrumb.itemListElement[1].position, 2);
    assert.ok(breadcrumb.itemListElement[1].name.length > 0);
    assert.equal(breadcrumb.itemListElement[1].item, "https://siltstrider.tools");

    // Position 3: Leaf item
    assert.equal(breadcrumb.itemListElement[2]["@type"], "ListItem");
    assert.equal(breadcrumb.itemListElement[2].position, 3);
    assert.ok(breadcrumb.itemListElement[2].name.length > 0);
    assert.equal(breadcrumb.itemListElement[2].item, `https://siltstrider.tools${mod.BREADCRUMB_MAP[view].path}`);
  }

  // Edge cases: null, undefined, unknown view
  assert.equal(mod.getBreadcrumbJsonLd(null), null);
  assert.equal(mod.getBreadcrumbJsonLd(undefined), null);
  assert.equal(mod.getBreadcrumbJsonLd("nonexistent_view"), null);
});

test("seo-breadcrumbs.mjs exports valid ABOUT_FAQ_JSON_LD", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "seo-breadcrumbs.mjs")).href);
  const faq = mod.ABOUT_FAQ_JSON_LD;

  assert.ok(faq && typeof faq === "object");
  assert.equal(faq["@context"], "https://schema.org");
  assert.equal(faq["@type"], "FAQPage");
  assert.ok(Array.isArray(faq.mainEntity));
  assert.ok(faq.mainEntity.length >= 4);

  for (const q of faq.mainEntity) {
    assert.equal(q["@type"], "Question");
    assert.ok(q.name && q.name.length > 10, "Question name must be descriptive");
    assert.equal(q.acceptedAnswer["@type"], "Answer");
    assert.ok(q.acceptedAnswer.text && q.acceptedAnswer.text.length > 20, "Answer text must be substantive");
  }
});

test("app/manifest.js exports valid force-static Web App Manifest", async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, "app", "manifest.js")).href);
  assert.equal(mod.dynamic, "force-static");
  assert.equal(typeof mod.default, "function");

  const manifest = mod.default();
  assert.ok(manifest && typeof manifest === "object");
  assert.equal(manifest.name, "Silt Strider Tools — Morrowind Build Planner & Progression Toolbox");
  assert.equal(manifest.short_name, "Silt Strider Tools");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);
});

test("all sub-pages import breadcrumbs, inject JSON-LD, and harmonize openGraph title", () => {
  const subPages = [
    { dir: "builder", view: "builder", titleKeyword: "Builder" },
    { dir: "leveler", view: "leveler", titleKeyword: "Level" },
    { dir: "factions", view: "factions", titleKeyword: "Faction" },
    { dir: "challenge", view: "challenge", titleKeyword: "Challenge" },
    { dir: "vault", view: "vault", titleKeyword: "Vault" },
    { dir: "alchemy", view: "alchemy", titleKeyword: "Alchemy" },
    { dir: "travel", view: "travel", titleKeyword: "Travel" },
    { dir: "enchanting", view: "enchanting", titleKeyword: "Enchanting" },
    { dir: "spellmaking", view: "spellmaking", titleKeyword: "Spellmaking" },
    { dir: "about", view: "about", titleKeyword: "About" },
    { dir: "changelog", view: "changelog", titleKeyword: "Changelog" },
    { dir: "privacy", view: "privacy", titleKeyword: "Privacy" },
    { dir: "terms", view: "terms", titleKeyword: "Terms" },
  ];

  for (const page of subPages) {
    const filePath = path.join(ROOT, "app", page.dir, "page.jsx");
    assert.ok(fs.existsSync(filePath), `Page file must exist: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf8");

    // Must import getBreadcrumbJsonLd
    assert.match(content, /getBreadcrumbJsonLd/, `${page.dir}/page.jsx must import getBreadcrumbJsonLd`);

    // Must be force-static
    assert.match(content, /export const dynamic = ['"]force-static['"]/, `${page.dir}/page.jsx must be force-static`);

    // Must render application/ld+json
    assert.match(content, /type="application\/ld\+json"/, `${page.dir}/page.jsx must render application/ld+json`);

    // Must harmonize openGraph title to "| Silt Strider Tools"
    assert.match(content, /title:\s*['"][^'"]*\|\s*Silt Strider Tools['"]/, `${page.dir}/page.jsx must harmonize openGraph title to Silt Strider Tools`);

    // Special check for about page: must also inject ABOUT_FAQ_JSON_LD
    if (page.view === "about") {
      assert.match(content, /ABOUT_FAQ_JSON_LD/, "about/page.jsx must import and inject ABOUT_FAQ_JSON_LD");
    }
  }
});
