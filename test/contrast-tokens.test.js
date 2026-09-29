// Test WCAG AA contrast requirements for fg tokens across both themes and panels.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
const ASHFALL_CSS = fs.readFileSync(path.join(ROOT, "app/theme-ashfall.css"), "utf8");

function parseTokens(css) {
  const fg = {};
  const surface = {};
  for (const m of css.matchAll(/--color-(fg-\d+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    fg[m[1]] = m[2];
  }
  for (const m of css.matchAll(/--color-(surface-\d+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    surface[m[1]] = m[2];
  }
  return { fg, surface };
}

function relLum(hexStr) {
  const clean = hexStr.replace("#", "");
  const rgb = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = relLum(hex1);
  const l2 = relLum(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const mwTokens = parseTokens(GLOBALS_CSS);
const ashTokens = parseTokens(ASHFALL_CSS);

test("fg-13, fg-14, and fg-15 pass WCAG AA contrast (>= 4.5:1) against primary surface-3 in both themes", () => {
  for (const [themeName, tokens] of [["Morrowind", mwTokens], ["Ashfall", ashTokens]]) {
    const s3 = tokens.surface["surface-3"];
    assert.ok(s3, `missing surface-3 in ${themeName}`);

    for (const token of ["fg-13", "fg-14", "fg-15"]) {
      const color = tokens.fg[token];
      assert.ok(color, `missing ${token} in ${themeName}`);
      const cr = contrastRatio(color, s3);
      assert.ok(
        cr >= 4.5,
        `${themeName} ${token} (${color}) vs surface-3 (${s3}) has contrast ${cr.toFixed(2)}:1, expected >= 4.5:1`
      );
    }
  }
});

test("fg-13 and fg-14 pass WCAG AA contrast (>= 4.5:1) against every panel surface they sit on", () => {
  // Panels: Faction Journal (surface-2,3,6,8,12), Equipped Loadouts (surface-4,5,6,7,12),
  // Premade Catalog (surface-1,2,3), Challenge (surface-1,2,3,7), Travel labels (surface-1,2,3,4,7).
  const panelSurfaces = ["surface-1", "surface-2", "surface-3", "surface-4", "surface-5", "surface-6", "surface-7", "surface-8", "surface-12"];

  for (const [themeName, tokens] of [["Morrowind", mwTokens], ["Ashfall", ashTokens]]) {
    for (const token of ["fg-13", "fg-14"]) {
      const fgHex = tokens.fg[token];
      for (const surfaceName of panelSurfaces) {
        const sHex = tokens.surface[surfaceName];
        if (!sHex) continue;
        const cr = contrastRatio(fgHex, sHex);
        assert.ok(
          cr >= 4.5,
          `${themeName} ${token} (${fgHex}) vs ${surfaceName} (${sHex}) has contrast ${cr.toFixed(2)}:1, expected >= 4.5:1`
        );
      }
    }
  }
});

test("fg-15 passes WCAG AA contrast (>= 4.5:1) against all surfaces it sits on", () => {
  // fg-15 sits exclusively on surface-1 (map/modal inputs), surface-2 (challenge presets), and surface-3 (roster/objective plaques)
  const fg15Surfaces = ["surface-1", "surface-2", "surface-3"];

  for (const [themeName, tokens] of [["Morrowind", mwTokens], ["Ashfall", ashTokens]]) {
    const fgHex = tokens.fg["fg-15"];
    for (const surfaceName of fg15Surfaces) {
      const sHex = tokens.surface[surfaceName];
      assert.ok(sHex, `missing ${surfaceName} in ${themeName}`);
      const cr = contrastRatio(fgHex, sHex);
      assert.ok(
        cr >= 4.5,
        `${themeName} fg-15 (${fgHex}) vs ${surfaceName} (${sHex}) has contrast ${cr.toFixed(2)}:1, expected >= 4.5:1`
      );
    }
  }
});

test("adversarial edge case: relative luminance across fg ramp decreases monotonically with no inverted steps", () => {
  for (const [themeName, tokens] of [["Morrowind", mwTokens], ["Ashfall", ashTokens]]) {
    const ramp = ["fg-10", "fg-11", "fg-12", "fg-13", "fg-14", "fg-15", "fg-16"];
    for (let i = 0; i < ramp.length - 1; i++) {
      const curr = ramp[i];
      const next = ramp[i + 1];
      const lCurr = relLum(tokens.fg[curr]);
      const lNext = relLum(tokens.fg[next]);
      assert.ok(
        lCurr > lNext,
        `${themeName} ramp inversion: ${curr} (L=${lCurr.toFixed(4)}) must have higher luminance than ${next} (L=${lNext.toFixed(4)})`
      );
    }
  }
});
