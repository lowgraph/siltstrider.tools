const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");

const repoRoot = path.join(__dirname, "..");
const globalsCss = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf8");
const morrowindCss = fs.readFileSync(path.join(repoRoot, "app", "theme-morrowind.css"), "utf8");
const ashfallCss = fs.readFileSync(path.join(repoRoot, "app", "theme-ashfall.css"), "utf8");
const layoutJsx = fs.readFileSync(path.join(repoRoot, "app", "layout.jsx"), "utf8");

// Relative luminance and WCAG contrast calculation
function relativeLuminance(hex) {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map(c => c + c).join("");
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

test("every selector in app/theme-morrowind.css starts with :root[data-theme=\"morrowind\"]", () => {
  const root = postcss.parse(morrowindCss);
  let ruleCount = 0;
  root.walkRules(rule => {
    ruleCount++;
    const selectors = rule.selectors || rule.selector.split(",").map(s => s.trim());
    for (const sel of selectors) {
      assert.ok(
        sel.startsWith(':root[data-theme="morrowind"]') || sel.startsWith(':root:not([data-theme="morrowind"])'),
        `Selector "${sel}" must start with :root[data-theme="morrowind"] (or explicit inverted scope)`
      );
    }
  });
  assert.ok(ruleCount > 10, `Expected multiple rules in theme-morrowind.css, found ${ruleCount}`);
});

test("theme-morrowind.css uses no color literal outside the approved palette allowlist", () => {
  // Approved palette from docs/MORROWIND_GAME_THEME.md
  const allowlist = new Set([
    "#000000", "#000",
    "#0e0d0b", "#0a0908", "#100e0b", "#16130f", "#1d1914", "#9f7f45",
    "#f3eddd", "#caa560", "#dfc99f", "#b3a887", "#a49a7c", "#9c9174",
    "#948a6e", "#8a8066", "#6e6450", "#5a5242", "#4a4336",
    "#bea47b", "#a98f62", "#8b7b5a", "#857048", "#7d6c4c", "#76663f",
    "#706044", "#6b5c40", "#5a4c33", "#4f442f", "#2b251a", "#6e562b",
    "#707ecf", "#8f9bda", "#afb8e4", "#9fa9df", "#6070ca",
    "#c83c1e", "#35459f", "#96321e", "#9b2d16", "#2f0e07", "#28347b", "#0c1025", "#00722e", "#00240e"
  ]);

  const hexMatches = morrowindCss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  for (const hex of hexMatches) {
    const lower = hex.toLowerCase();
    assert.ok(
      allowlist.has(lower),
      `Color literal "${hex}" in theme-morrowind.css is not in the approved game palette allowlist`
    );
  }

  // Check rgba: only black with alpha allowed e.g. rgba(0, 0, 0, ...)
  const rgbaMatches = morrowindCss.match(/rgba?\s*\([^)]+\)/gi) || [];
  for (const rgba of rgbaMatches) {
    const nums = rgba.match(/\d+(\.\d+)?/g);
    if (nums && nums.length >= 3) {
      const r = Number(nums[0]), g = Number(nums[1]), b = Number(nums[2]);
      assert.ok(
        r === 0 && g === 0 && b === 0,
        `Only black rgb/rgba fills are permitted in theme-morrowind.css, found: ${rgba}`
      );
    }
  }
});

test("Morrowind text, link and select tokens meet at least 4.5:1 on #000000 and #16130F", () => {
  // Extract tokens from globals.css @theme static
  const tokenBlock = globalsCss.slice(
    globalsCss.indexOf("@theme static {"),
    globalsCss.indexOf("}", globalsCss.indexOf("@theme static {"))
  );

  const textTokens = [
    "--color-fg-1", "--color-fg-2", "--color-fg-3", "--color-fg-4",
    "--color-fg-5", "--color-fg-6", "--color-fg-7", "--color-fg-8",
    "--color-fg-9", "--color-fg-10", "--color-fg-11", "--color-fg-12",
    "--color-fg-13", "--color-fg-14", "--color-fg-15",
    "--color-accent", "--color-accent-1", "--color-accent-2", "--color-accent-3", "--color-accent-4",
    "--color-link", "--color-link-hover", "--color-link-active", "--color-select"
  ];

  const surfaces = ["#000000", "#16130f"];

  for (const token of textTokens) {
    const regex = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,6});`);
    const match = tokenBlock.match(regex);
    assert.ok(match, `Token ${token} not found in @theme static block`);
    const hex = match[1];

    for (const surface of surfaces) {
      const ratio = contrastRatio(hex, surface);
      assert.ok(
        ratio >= 4.5,
        `Token ${token} (${hex}) on surface ${surface} has contrast ${ratio.toFixed(2)}:1, which is below 4.5:1`
      );
    }
  }
});

test("the three --mw-* variables point at files that exist in public/textures/", () => {
  const vars = ["--mw-border", "--mw-bevel", "--mw-groove"];
  for (const v of vars) {
    const match = globalsCss.match(new RegExp(`${v}:\\s*url\\(["']?([^"')]+)["']?\\);`));
    assert.ok(match, `Variable ${v} definition not found in globals.css`);
    const relUrl = match[1];
    // relUrl is like "/textures/mw-window.svg"
    const filePath = path.join(repoRoot, "public", relUrl.replace(/^\//, ""));
    assert.ok(
      fs.existsSync(filePath),
      `Texture file for ${v} does not exist at ${filePath}`
    );
  }
});

test("adversarial QA: banned text colors are never assigned to color properties in theme-morrowind.css", () => {
  // Spec: Banned as text: #6070CA, #35459F, #C83C1E, #96321E
  const bannedTextColors = ["#6070ca", "#35459f", "#c83c1e", "#96321e"];
  const root = postcss.parse(morrowindCss);

  root.walkDecls(decl => {
    if (decl.prop === "color") {
      const val = decl.value.toLowerCase();
      for (const banned of bannedTextColors) {
        assert.ok(
          !val.includes(banned),
          `Banned color ${banned} was used as text color in property ${decl.prop}: ${decl.value}`
        );
      }
    }
  });
});

test("stylesheet load order in app/layout.jsx preserves CSS cascade integrity", () => {
  const gIdx = layoutJsx.indexOf("globals.css");
  const mIdx = layoutJsx.indexOf("theme-morrowind.css");
  const aIdx = layoutJsx.indexOf("theme-ashfall.css");

  assert.ok(gIdx !== -1, "globals.css imported in layout.jsx");
  assert.ok(mIdx !== -1, "theme-morrowind.css imported in layout.jsx");
  assert.ok(aIdx !== -1, "theme-ashfall.css imported in layout.jsx");
  assert.ok(gIdx < mIdx, "globals.css must load before theme-morrowind.css");
  assert.ok(mIdx < aIdx, "theme-morrowind.css must load before theme-ashfall.css so Ashfall can override if needed");
});

// Elements added only for the Morrowind layout must not render in Modern UI at all: an empty
// divider still takes a flex or grid gap, which moved Modern UI's Home card (QA, 1 October).
test("elements that exist only for the Morrowind layout are display: none outside Morrowind UI", () => {
  const hidden = new Set();
  postcss.parse(morrowindCss).walkRules(rule => {
    const none = rule.nodes.some(d => d.type === "decl" && d.prop === "display" && /^none\b/.test(d.value));
    if (!none) return;
    for (const sel of rule.selectors) {
      const m = sel.match(/^:root:not\(\[data-theme="morrowind"\]\)\s+\.([a-z0-9-]+)$/);
      if (m) hidden.add(m[1]);
    }
  });
  const morrowindOnly = ["attr-full", "home-character-title-bar", "home-character-stats-grid", "home-vital-bar-num", "home-hr", "home-chip--caption"];
  for (const cls of morrowindOnly) assert.ok(hidden.has(cls), `.${cls} must be hidden outside Morrowind UI`);
  // Every Morrowind-only class used in the Home components must be in that list.
  const homeJsx = ["home-hero.jsx", "home-tools.jsx"].map(f => fs.readFileSync(path.join(repoRoot, "components", "home-hub", f), "utf8")).join("\n");
  for (const cls of morrowindOnly) assert.ok(homeJsx.includes(cls), `.${cls} is listed but no longer used; update the list`);
});

// The game-style copies on the Home card (title bar, stats grid, numbers on the bars) are
// aria-hidden, so the originals must stay in the accessibility tree: hide them visually, never
// with display: none or visibility: hidden.
test("Morrowind UI never removes the character card's name, summary or vital values from screen readers", () => {
  const originals = [".home-character-name", ".home-character-line", ".home-vital-value"];
  postcss.parse(morrowindCss).walkRules(rule => {
    const touches = rule.selectors.filter(sel => sel.startsWith(':root[data-theme="morrowind"]') && originals.some(o => sel.endsWith(o)));
    if (!touches.length) return;
    for (const d of rule.nodes.filter(n => n.type === "decl")) {
      assert.ok(!(d.prop === "display" && /^none\b/.test(d.value)), `${touches.join(", ")} must not be display: none`);
      assert.ok(!(d.prop === "visibility" && /hidden/.test(d.value)), `${touches.join(", ")} must not be visibility: hidden`);
    }
  });
  const hero = fs.readFileSync(path.join(repoRoot, "components", "home-hub", "home-hero.jsx"), "utf8");
  for (const cls of ["home-character-title-bar", "home-character-stats-grid"]) {
    assert.match(hero, new RegExp(`className="${cls}[^"]*" aria-hidden="true"`), `.${cls} duplicates visible text and must stay aria-hidden`);
  }
});
