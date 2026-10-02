import { getPremadeBuildPool, premadeToBuild, sameCharacter } from "./premade-data.mjs";

const premades = new Map(getPremadeBuildPool({arce:true}).map(premade => [premade.name, premade]));

/** Accept only a known premade source; player-entered names carry no source marker. */
export function premadeSourceName(value) {
  return typeof value === "string" && premades.has(value) ? value : null;
}

/** A matching name alone does not make an edited or custom build a premade. */
export function isUnchangedPremade(build) {
  const premade = premades.get(build?.name);
  return Boolean(premade && sameCharacter(build, premadeToBuild(premade)));
}

/** Home and tools share a title; an edited premade is identified as its source. */
export function characterName(build = {}) {
  const named = typeof build?.name === "string" && build.name.trim();
  const source = premadeSourceName(build?.premadeSource);
  if (source && named === source && !isUnchangedPremade(build)) {
    return `Based on ${source}`;
  }
  return named ? build.name.trim() : `${build?.race || "Dark Elf"} ${build?.className || "Custom"}`;
}
