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
        lCurr >= lNext,
        `${themeName} ramp inversion: ${curr} (L=${lCurr.toFixed(4)}) must have greater or equal luminance than ${next} (L=${lNext.toFixed(4)})`
      );
    }
  }
});

// The Faction Journal's selected and eligible states sit on tinted surfaces the lists above
// leave out: the selected faction card (surface-18), the selected rank (surface-19), a held rank
// (surface-13) and met requirements (success-surface-2). fg-14 falls to 4.2-4.5:1 there, so the
// text on them uses fg-12. Measured in both themes with headless Chrome on 29 September.
function tintedTokens(css) {
  const tokens = {};
  for (const m of css.matchAll(/--color-((?:success-)?(?:fg|surface)-\d+)\s*:\s*(#[0-9a-fA-F]{6})/g)) if (!tokens[m[1]]) tokens[m[1]] = m[2];
  return tokens;
}
const TINTED = ["surface-13", "surface-18", "surface-19", "success-surface-2"];

test("fg-12 passes AA on the Faction Journal's tinted surfaces in both themes", () => {
  for (const [themeName, css] of [["Morrowind", GLOBALS_CSS], ["Ashfall", ASHFALL_CSS]]) {
    const tokens = tintedTokens(css);
    for (const surfaceName of TINTED) {
      assert.ok(tokens[surfaceName], `${themeName} defines ${surfaceName}`);
      const cr = contrastRatio(tokens["fg-12"], tokens[surfaceName]);
      assert.ok(cr >= 4.5, `${themeName} fg-12 vs ${surfaceName}: ${cr.toFixed(2)}:1`);
    }
  }
});

test("fg-14 does not reach AA on those surfaces, which is why the Journal avoids it there", () => {
  // If a later retune lifts fg-14 past 4.5:1 on every tinted surface, this can go.
  const worst = [["Morrowind", GLOBALS_CSS], ["Ashfall", ASHFALL_CSS]].map(([, css]) => {
    const tokens = tintedTokens(css);
    return Math.min(...TINTED.map((s) => contrastRatio(tokens["fg-14"], tokens[s])));
  });
  assert.ok(worst.some((cr) => cr < 4.5), `worst fg-14 ratios ${worst.map((c) => c.toFixed(2)).join(", ")}`);
});

test("the Faction Journal's text on selected and eligible cards uses fg-12, not fg-13 to fg-15", () => {
  const roster = fs.readFileSync(path.join(ROOT, "components/journal-factions/faction-roster.jsx"), "utf8");
  const detail = fs.readFileSync(path.join(ROOT, "components/journal-factions/faction-detail-view.jsx"), "utf8");
  const classOf = (src, marker) => {
    const at = src.indexOf(marker);
    assert.ok(at > 0, `found ${marker}`);
    return src.slice(src.lastIndexOf("className=", at), at);
  };
  for (const [src, marker] of [
    [roster, "owns {faction.ownedPlacements"],
    [roster, "{faction.favouredAttributes.map("],
    [detail, "Rank {r.index + 1}"],
    [detail, "Rep: {r.reputation}"],
    [detail, "Target Rank Qualification"],
  ]) {
    const cls = classOf(src, marker);
    assert.match(cls, /text-fg-12/, `${marker}: ${cls}`);
    assert.doesNotMatch(cls, /text-fg-1[345]\b/, marker);
  }
});
