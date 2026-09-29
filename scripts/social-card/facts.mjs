/**
 * What the social card says about its sample character, computed with the same
 * data and maths the tools use (the builder's sheet, the Level Simulator's first
 * suggested level-up). Nothing on the card is typed by hand.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { webcrypto } from "node:crypto";
import { createBundleLoader } from "../../lib/bundle-loader.mjs";
import { adaptCharacterCatalogs } from "../../lib/character-catalogs.mjs";
import { computeSheet } from "../../lib/character-math.mjs";
import { WORLD_PROFILES, nextLevelUp } from "../../lib/home-data.mjs";

export const SAMPLE = Object.freeze({
  name: "Nerevarine", gender: "Male", race: "Dark Elf", className: "Spellsword", sign: "The Lady", world: "tr"
});

/**
 * The character catalogs of one profile of the staged bundle (public/game-data),
 * loaded as the site loads them: the same loader, hash checks and inheritance.
 */
export async function loadCharacterCatalogs(root, profile) {
  const gameData = path.join(root, "public", "game-data");
  const baseUrl = "http://game-data.local/";
  const loader = createBundleLoader({
    baseUrl, crypto: webcrypto, cacheStorage: null,
    fetcher: async url => {
      const file = path.join(gameData, ...decodeURIComponent(new URL(url).pathname).split("/").filter(Boolean));
      try {
        return new Response(await fs.readFile(file), { status: 200 });
      } catch {
        return new Response("missing", { status: 404 });
      }
    }
  });
  const [bundle, spells] = await Promise.all([loader.loadFeature(profile, "character"), loader.loadCatalog(profile, "Spells")]);
  return adaptCharacterCatalogs(bundle, spells);
}

const value = entry => (entry && typeof entry === "object" ? Number(entry.v ?? entry.value ?? 0) : Number(entry) || 0);

export function cardFacts(catalogs, sample = SAMPLE) {
  const cls = catalogs?.classes?.[sample.className];
  if (!cls) throw new Error(`Unknown class for the social card: ${sample.className}`);
  const build = {
    race: sample.race, gender: sample.gender, sign: sample.sign, className: sample.className,
    spec: cls.spec, fav1: cls.fav[0], fav2: cls.fav[1], maj: cls.maj, min: cls.min
  };
  const sheet = computeSheet(build, catalogs);
  if (!sheet) throw new Error(`The social card's sample does not resolve: ${sample.race}, ${sample.sign}`);
  const next = nextLevelUp(build, catalogs);
  if (!next || next.bonuses.length === 0) throw new Error("The Level Simulator suggested no level-up for the sample");
  const world = WORLD_PROFILES.find(profile => profile.id === sample.world);
  return {
    name: sample.name,
    initial: sample.name.charAt(0).toUpperCase(),
    level: Math.max(1, Math.floor(Number(sheet.level) || 1)),
    gender: sample.gender, race: sample.race, className: sample.className, sign: sample.sign,
    line: `${sample.gender} ${sample.race} · ${sample.className} · ${sample.sign}`,
    world: world ? world.title : sample.world,
    health: value(sheet.health),
    magicka: value(sheet.magicka),
    fatigue: value(sheet.fatigue),
    nextLevel: next.nextLevel,
    bonuses: next.bonuses,
    healthFrom: next.healthFrom,
    healthTo: next.healthTo
  };
}

const escapeHtml = text => String(text)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replaces each {{key}} with an escaped value, or {{{key}}} with raw markup. */
export function fillCard(template, values) {
  const filled = template
    .replace(/\{\{\{(\w+)\}\}\}/g, (match, key) => (key in values ? String(values[key]) : match))
    .replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? escapeHtml(values[key]) : match));
  const left = filled.match(/\{\{\{?\w+\}?\}\}/);
  if (left) throw new Error(`Social card placeholder without a value: ${left[0]}`);
  return filled;
}

/** The template's values for a set of facts. */
export function cardValues(facts) {
  return {
    ...facts,
    bonusChips: facts.bonuses
      .map(b => `<span class="chip">${escapeHtml(b.attribute)} <b>×${escapeHtml(b.multiplier)}</b></span>`)
      .join("")
  };
}
