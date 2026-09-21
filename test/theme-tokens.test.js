// Guards the theme-token contract: components take every color from app/theme.css,
// so a theme can restyle the site by overriding CSS custom properties.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const THEME = fs.readFileSync(path.join(ROOT, "app/theme.css"), "utf8");

function componentFiles(dir = path.join(ROOT, "components")) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? componentFiles(path.join(dir, e.name)) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(dir, e.name)] : []
  );
}

function sources() {
  return componentFiles().map((file) => ({ file: path.relative(ROOT, file), text: fs.readFileSync(file, "utf8") }));
}

const definedTokens = new Set([...THEME.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const definedGradients = new Set([...THEME.matchAll(/--gradient-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));

// Tailwind color utilities that resolve to a theme token: text-fg-3, hover:bg-surface-5/40, ...
const TOKEN_CLASS = /(?<![\w-])(?:[a-z-]+:)*!?(?:text|bg|border|ring|accent|placeholder|outline|fill|stroke|divide|from|via|to|decoration|caret)-((?:fg|surface|line)-\d+|accent(?:-\d+)?|(?:danger|success|warning|info|teal)(?:-(?:surface|line))?(?:-\d+)?|health|magicka|fatigue)(?:\/\d+)?(?![\w-])/g;

test("theme.css defines the token ramps and vitals", () => {
  assert.ok(definedTokens.size >= 60, `expected a full token set, found ${definedTokens.size}`);
  for (const name of ["fg-1", "surface-1", "line-1", "accent", "danger", "health", "magicka", "fatigue"]) {
    assert.ok(definedTokens.has(name) || [...definedTokens].some((t) => t.startsWith(name + "-")), `missing token family ${name}`);
  }
  for (const g of ["health", "magicka", "fatigue"]) assert.ok(definedGradients.has(g), `missing --gradient-${g}`);
  assert.match(THEME, /@theme\s+static\s*\{/, "tokens must stay emitted even when only legacy CSS reads them");
});

test("components use no hard-coded color classes", () => {
  const offenders = [];
  for (const { file, text } of sources()) {
    for (const m of text.matchAll(/(?<![\w-])(?:[a-z-]+:)*!?-?[a-z]+(?:-[a-z]+)*-\[[^\]\s"'`]*?(#[0-9a-fA-F]{3,8}\b|rgba?\()[^\]\s"'`]*\]/g)) {
      offenders.push(`${file}: ${m[0]}`);
    }
  }
  assert.deepEqual(offenders, [], "use a token class (text-fg-3, bg-surface-5, border-line-9, text-accent ...) instead of an arbitrary color");
});

test("inline styles and SVG attributes use tokens, not color literals", () => {
  const offenders = [];
  for (const { file, text } of sources()) {
    for (const [i, line] of text.split(/\r?\n/).entries()) {
      // Neutral black shadows and text outlines are theme-independent and stay literal.
      const cleaned = line.replace(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,[^)]*\)/g, "").replace(/#000\b/g, "");
      if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(/.test(cleaned)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    }
  }
  assert.deepEqual(offenders, [], "use var(--color-...) or var(--gradient-...) instead of a color literal");
});

test("every token a component references is defined", () => {
  const unknown = new Set();
  for (const { file, text } of sources()) {
    for (const m of text.matchAll(TOKEN_CLASS)) if (!definedTokens.has(m[1])) unknown.add(`${file}: ${m[0]}`);
    for (const m of text.matchAll(/var\(--color-([a-z0-9-]+)\)/g)) if (!definedTokens.has(m[1])) unknown.add(`${file}: var(--color-${m[1]})`);
    for (const m of text.matchAll(/var\(--gradient-([a-z0-9-]+)\)/g)) if (!definedGradients.has(m[1])) unknown.add(`${file}: var(--gradient-${m[1]})`);
  }
  for (const css of ["app/globals.css", "app/legacy-compat.css"]) {
    const text = fs.readFileSync(path.join(ROOT, css), "utf8");
    for (const m of text.matchAll(/var\(--color-([a-z0-9-]+)\)/g)) if (!definedTokens.has(m[1])) unknown.add(`${css}: var(--color-${m[1]})`);
  }
  assert.deepEqual([...unknown], []);
});

test("the token-class matcher rejects malformed and unknown names", () => {
  const names = (s) => [...s.matchAll(TOKEN_CLASS)].map((m) => m[1]);
  assert.deepEqual(names("text-fg-3 hover:bg-surface-12/40 border-danger-line-2 bg-health"), ["fg-3", "surface-12", "danger-line-2", "health"]);
  assert.deepEqual(names("text-fgx-3 bg-surfaces-1 text-accentuate text-[#fff]"), [], "look-alike names are not token classes");
  assert.ok(!definedTokens.has("fg-999"), "an out-of-range ramp step is not a token");
  assert.ok(!definedTokens.has(""), "empty token names are never defined");
});
