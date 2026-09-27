"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..");

test("app/robots.js exports a valid robots config with canonical sitemap", async () => {
  const robotsModule = await import(pathToFileURL(path.join(ROOT, "app", "robots.js")).href);
  assert.equal(typeof robotsModule.default, "function", "robots.js must export a default function");
  
  const robotsConfig = robotsModule.default();
  assert.ok(robotsConfig && typeof robotsConfig === "object", "robots output must be an object");
  
  // Verify rules
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert.equal(rules.userAgent, "*", "user-agent must cover all crawlers");
  assert.equal(rules.allow, "/", "root path must be allowed");
  
  // Sitemap link
  assert.equal(robotsConfig.sitemap, "https://siltstrider.tools/sitemap.xml");
  const sitemapUrl = new URL(robotsConfig.sitemap);
  assert.equal(sitemapUrl.protocol, "https:");
  assert.equal(sitemapUrl.hostname, "siltstrider.tools");
  assert.equal(sitemapUrl.pathname, "/sitemap.xml");
});

test("app/sitemap.js exports valid canonical routes with schema-compliant properties", async () => {
  const sitemapModule = await import(pathToFileURL(path.join(ROOT, "app", "sitemap.js")).href);
  assert.equal(typeof sitemapModule.default, "function", "sitemap.js must export a default function");
  
  const sitemapEntries = sitemapModule.default();
  assert.ok(Array.isArray(sitemapEntries), "sitemap must return an array");
  assert.ok(sitemapEntries.length >= 3, "sitemap must contain at least root, privacy, and terms");
  
  const validFreqs = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
  const urls = sitemapEntries.map(e => e.url);
  assert.ok(urls.includes("https://siltstrider.tools/"), "homepage must be in sitemap");
  assert.ok(urls.includes("https://siltstrider.tools/privacy"), "privacy page must be in sitemap");
  assert.ok(urls.includes("https://siltstrider.tools/terms"), "terms page must be in sitemap");
  
  for (const entry of sitemapEntries) {
    assert.ok(entry.url, "entry must have a url");
    const parsed = new URL(entry.url);
    assert.equal(parsed.protocol, "https:", "url must use https");
    assert.equal(parsed.hostname, "siltstrider.tools", "url must target siltstrider.tools");
    
    assert.ok(entry.lastModified instanceof Date, "lastModified must be a Date object");
    assert.ok(!isNaN(entry.lastModified.getTime()), "lastModified date must be valid");
    
    assert.ok(validFreqs.has(entry.changeFrequency), `changeFrequency '${entry.changeFrequency}' must be valid`);
    assert.ok(typeof entry.priority === "number", "priority must be a number");
    assert.ok(entry.priority >= 0.0 && entry.priority <= 1.0, `priority ${entry.priority} must be between 0.0 and 1.0`);
  }
});

test("app/layout.jsx defines complete OpenGraph, Twitter, and JSON-LD metadata", () => {
  const layout = fs.readFileSync(path.join(ROOT, "app", "layout.jsx"), "utf8");
  
  // MetadataBase
  assert.match(layout, /metadataBase:\s*new URL\(['"]https:\/\/siltstrider\.tools['"]\)/, "metadataBase must be https://siltstrider.tools");
  
  // Title template
  assert.match(layout, /title:\s*\{[^}]*default:\s*['"]Silt Strider — Morrowind Build Planner & Progression Toolbox['"]/, "default title must match");
  assert.match(layout, /template:\s*['"]%s \| Silt Strider['"]/, "title template must match");
  
  // Canonical alternate
  assert.match(layout, /canonical:\s*['"]https:\/\/siltstrider\.tools['"]/, "canonical link must be defined");
  
  // OpenGraph image dimensions and URL
  assert.match(layout, /url:\s*['"]\/og-image\.png['"]/, "og image must reference /og-image.png");
  assert.match(layout, /width:\s*1200/, "og image width must be 1200");
  assert.match(layout, /height:\s*630/, "og image height must be 630");
  assert.match(layout, /locale:\s*['"]en_US['"]/, "og locale must be en_US");
  assert.match(layout, /type:\s*['"]website['"]/, "og type must be website");
  
  // Twitter Card
  assert.match(layout, /card:\s*['"]summary_large_image['"]/, "twitter card must be summary_large_image");
  
  // JSON-LD structured data
  assert.match(layout, /type="application\/ld\+json"/, "head must include application/ld+json script");
  assert.match(layout, /@context['"]?:\s*['"]https:\/\/schema\.org['"]/, "JSON-LD context must be schema.org");
  assert.match(layout, /@type['"]?:\s*['"]WebApplication['"]/, "JSON-LD type must be WebApplication");
  assert.match(layout, /applicationCategory['"]?:\s*['"]GameApplication['"]/, "JSON-LD category must be GameApplication");
});

test("semantic heading hierarchy: header has no h1 and hero has exactly h1", () => {
  const header = fs.readFileSync(path.join(ROOT, "components", "site-header.jsx"), "utf8");
  assert.doesNotMatch(header, /<div className="brand">\s*<h1>/, "header brand must not be an h1");
  assert.match(header, /<div className="brand-title">\s*<a href="#home"/, "header must use .brand-title container");
  
  const hero = fs.readFileSync(path.join(ROOT, "components", "home-hub", "home-hero.jsx"), "utf8");
  assert.match(hero, /<h1 className="home-title" id="home-title">Plan the perfect <span>Morrowind<\/span> run\.<\/h1>/, "hero must use h1 for page title");
  assert.doesNotMatch(hero, /<h2 className="home-title"/, "hero must not downgrade home-title to h2");
  
  // Hero lead copy
  assert.match(hero, /data-driven companion for The Elder Scrolls III/, "hero lead copy must include keyword phrasing");
  assert.match(hero, /×5 multipliers/, "hero lead copy must mention multipliers");
  assert.match(hero, /Tamriel Rebuilt/, "hero lead copy must mention Tamriel Rebuilt");
});

test("HOME_TOOLS descriptions are enriched, complete, and contain no undefined properties", async () => {
  const homeData = await import(pathToFileURL(path.join(ROOT, "lib", "home-data.mjs")).href);
  const tools = homeData.HOME_TOOLS;
  
  assert.equal(tools.length, 9, "all 9 tools must be present");
  const expectedViews = ["builder", "leveler", "alchemy", "travel", "enchanting", "spellmaking", "factions", "challenge", "vault"];
  assert.deepEqual(tools.map(t => t.view), expectedViews, "expected all views in canonical order");
  
  for (const tool of tools) {
    assert.ok(tool.title && typeof tool.title === "string", `${tool.view} must have a valid title`);
    assert.ok(tool.description && typeof tool.description === "string", `${tool.view} must have a valid description`);
    assert.ok(!tool.description.includes("undefined"), `${tool.view} description must not contain undefined`);
    assert.ok(!tool.description.includes("null"), `${tool.view} description must not contain null`);
    
    // Check word count bounds (between 12 and 45 words)
    const words = tool.description.trim().split(/\s+/).length;
    assert.ok(words >= 12 && words <= 45, `${tool.view} description word count (${words}) must be between 12 and 45 words`);
  }
  
  // Specific keyword verifications
  const builder = tools.find(t => t.view === "builder");
  assert.match(builder.description, /early-game gear and late-game equipment/);
  
  const leveler = tools.find(t => t.view === "leveler");
  assert.match(leveler.description, /Efficient leveling progression/);
  assert.match(leveler.description, /×5 attribute multipliers/);
  
  const alchemy = tools.find(t => t.view === "alchemy");
  assert.match(alchemy.description, /mortar, alembic, calcinator, retort/);
  
  const travel = tools.find(t => t.view === "travel");
  assert.match(travel.description, /river strider and Guild Guide/);
  
  const enchanting = tools.find(t => t.view === "enchanting");
  assert.match(enchanting.description, /constant effect enchantment costs/);
  
  const spellmaking = tools.find(t => t.view === "spellmaking");
  assert.match(spellmaking.description, /six schools of magic/);
  
  const factions = tools.find(t => t.view === "factions");
  assert.match(factions.description, /Great House memberships/);
  
  const vault = tools.find(t => t.view === "vault");
  assert.match(vault.description, /\.omwsave files/);
});

test("static export compatibility: robots.js and sitemap.js export dynamic = 'force-static'", async () => {
  const robotsModule = await import(pathToFileURL(path.join(ROOT, "app", "robots.js")).href);
  assert.equal(robotsModule.dynamic, "force-static", "robots.js must export dynamic = 'force-static' for static export builds");

  const sitemapModule = await import(pathToFileURL(path.join(ROOT, "app", "sitemap.js")).href);
  assert.equal(sitemapModule.dynamic, "force-static", "sitemap.js must export dynamic = 'force-static' for static export builds");
});

test("og-image.png exists, is valid PNG, and matches 1200x630 specification", () => {
  const ogPath = path.join(ROOT, "public", "og-image.png");
  assert.ok(fs.existsSync(ogPath), "public/og-image.png must exist");

  const buf = fs.readFileSync(ogPath);
  assert.ok(buf.length > 10000, "og-image.png must be non-empty");

  // PNG magic bytes
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50); // P
  assert.equal(buf[2], 0x4e); // N
  assert.equal(buf[3], 0x47); // G
  assert.equal(buf[4], 0x0d);
  assert.equal(buf[5], 0x0a);
  assert.equal(buf[6], 0x1a);
  assert.equal(buf[7], 0x0a);

  // IHDR width and height (big-endian uint32 at offset 16 and 20)
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.equal(width, 1200, "og-image width must be 1200");
  assert.equal(height, 630, "og-image height must be 630");
});

test("legal pages do not redundantly append site title to metadata title", () => {
  const privacySrc = fs.readFileSync(path.join(ROOT, "app", "privacy", "page.jsx"), "utf8");
  assert.match(privacySrc, /title:\s*['"]Privacy Policy['"]/, "privacy page title must be 'Privacy Policy'");
  assert.doesNotMatch(privacySrc, /title:\s*['"]Privacy Policy \| Silt Strider['"]/, "privacy page title must not duplicate brand name");

  const termsSrc = fs.readFileSync(path.join(ROOT, "app", "terms", "page.jsx"), "utf8");
  assert.match(termsSrc, /title:\s*['"]Terms of Service['"]/, "terms page title must be 'Terms of Service'");
  assert.doesNotMatch(termsSrc, /title:\s*['"]Terms of Service \| Silt Strider['"]/, "terms page title must not duplicate brand name");
});

