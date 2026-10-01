/**
 * CALC-4: where to get an ingredient, in player words, from the pipeline's IngredientSources
 * catalog (contracts/ingredient-source-types.ts in the pipeline) and Places for cell names.
 * Every source there is dependable: shops, plants that grow back, creatures, and places it
 * lies or is put; theft, what only NPCs carry and random loot are never listed.
 */

const positive = n => Number.isFinite(n) && n > 0;
const count = n => (positive(n) ? n : 0).toLocaleString("en-US");
const percent = chance => chance < 0.01 ? "under 1%" : `${Math.round(chance * 100)}%`;
const entries = value => Array.isArray(value) ? value.filter(item => item && typeof item === "object") : [];
const draws = value => entries(value).filter(item => positive(item.chance) && item.chance <= 1 && positive(item.quantity));
const tallies = value => entries(value).filter(Array.isArray);

/** "a", "a or b", "a, b or c". */
function join(items, word) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${word} ${items.at(-1)}`;
}

/** A region key as the game spells it: "azura's coast region" -> "Azura's Coast Region". */
export function regionLabel(key) {
  if (!key || key === "wilderness") return "the wilderness";
  return String(key).split(" ")
    .map((word) => word.split("-").map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part)).join("-"))
    .join(" ");
}

/** A cell's name from Places, its region for unnamed wilderness, else the bare key. */
export function placeName(places, cellKey) {
  const place = places?.get?.(cellKey);
  if (place?.name) return place.name;
  if (place?.region) return regionLabel(place.region);
  return String(cellKey || "").replace(/^(interior|exterior):/, "");
}

/** Give actual locations for each draw, without joining different draws' evidence. */
function where(source, places) {
  const names = field => tallies(source[field]).filter(item => typeof item[0] === "string" && positive(item[1]));
  const near = names("near").slice(0, 3).map(([town]) => town);
  const region = names("regions")[0]?.[0];
  const cells = names("cells").slice(0, 2).map(([key]) => placeName(places, key));
  return [near.length ? `around ${join(near, "and")}` : null,
    region ? `in ${regionLabel(region)}` : null,
    cells.length ? `at ${join(cells, "or")}` : null].filter(Boolean).join("; ");
}

function drawNotes(source, unit) {
  return [source.chance < 1 ? `${percent(source.chance)} of ${unit}` : null,
    source.quantity > 1 ? `${count(source.quantity)} at a time` : null,
    positive(source.fromLevel) ? `from player level ${source.fromLevel}` : null].filter(Boolean);
}

/** Combine named variants only when their draw and level are the same. */
function groupDraws(items) {
  const groups = new Map();
  for (const item of items) {
    const key = JSON.stringify([item.name, item.chance, item.quantity, item.fromLevel, item.level]);
    if (!groups.has(key)) { groups.set(key, { ...item }); continue; }
    const group = groups.get(key);
    for (const field of ["count", "placed", "spawnPoints"]) group[field] = (group[field] || 0) + (item[field] || 0);
    for (const field of ["near", "regions", "cells"]) {
      const totals = new Map();
      for (const [name, n] of [...tallies(group[field]), ...tallies(item[field])]) {
        if (typeof name === "string" && positive(n)) totals.set(name, (totals.get(name) || 0) + n);
      }
      group[field] = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }
  }
  return [...groups.values()];
}

function buy(record, places) {
  const shops = entries(record.shops).filter(shop => typeof shop.seller === "string" && typeof shop.cellKey === "string" && positive(shop.quantity));
  if (!shops.length) return null;
  const top = shops.slice(0, 3).map((shop) =>
    `${shop.name || shop.seller} (${placeName(places, shop.cellKey)}; ${count(shop.quantity)} in stock; ${shop.restocks ? "restocks" : "one stock only"})`);
  const total = positive(record.shopCount) ? Math.max(record.shopCount, shops.length) : shops.length;
  return `Buy from ${join(top, "or")}${total > top.length ? `; ${count(total)} shops in all` : ""}.`;
}

function harvest(record, places) {
  const plants = groupDraws(draws(record.plants).filter(plant => plant.name && plant.regrows === true && positive(plant.count)));
  if (!plants.length) return null;
  // The catalog groups matching names AND draws. Different chances must stay separate.
  const top = plants.slice(0, 3).map(plant => {
    const notes = [`${count(plant.count)} plants`, ...drawNotes(plant, "harvests"), "grows back"];
    const location = where(plant, places);
    return `${plant.name} (${notes.join("; ")})${location ? `; ${location}` : ""}`;
  });
  return `Harvest: ${top.join(". Also: ")}${plants.length > top.length ? "; more plant varieties are listed in this world" : ""}.`;
}

function creatures(record, places) {
  const records = draws(record.creatures).filter(creature => creature.name && (positive(creature.placed) || positive(creature.spawnPoints)));
  const kinds = groupDraws(records);
  if (!kinds.length) return null;
  const top = kinds.slice(0, 3).map((creature) => {
    const notes = [Number.isFinite(creature.level) ? `creature level ${creature.level}` : null,
      ...drawNotes(creature, "kills")].filter(Boolean);
    const location = where(creature, places);
    return `${creature.name}${notes.length ? ` (${notes.join("; ")})` : ""}${location ? `; ${location}` : ""}`;
  });
  // More than shown: names past the third, or kinds the catalog cut (creatureCount).
  const more = kinds.length > top.length || record.creatureCount > records.length;
  return `Dropped by ${top.join(". Also: ")}${more ? "; more creature varieties are listed in this world" : ""}.`;
}

function finds(record, places) {
  const groups = draws(record.finds).filter(find => (find.loose || find.name) && positive(find.count));
  if (!groups.length) return null;
  const parts = groups.slice(0, 3).map((find) => {
    const notes = [...drawNotes(find, "searches"), find.refills ? "refills" : null,
      positive(find.locked) ? `${count(find.locked)} locked` : null].filter(Boolean);
    const location = where(find, places);
    const holder = find.loose ? `lying loose (${count(find.count)} pickup${find.count === 1 ? "" : "s"})` : `${find.name} ×${count(find.count)}`;
    return `${holder}${notes.length ? ` (${notes.join("; ")})` : ""}${location ? `; ${location}` : ""}`;
  });
  return `Find: ${parts.join(". Also: ")}${groups.length > parts.length ? "; more finds are listed in this world" : ""}.`;
}

export const NO_SOURCE = "No dependable source is listed for this ingredient in this world.";

/** One line per kind of source, most practical first; one line saying so when there is none. */
export function sourceLines(record, places) {
  if (!record) return [{ kind: "none", text: NO_SOURCE }];
  const lines = [
    ["buy", buy(record, places)], ["harvest", harvest(record, places)],
    ["creatures", creatures(record, places)], ["finds", finds(record, places)],
  ].filter(([, text]) => text).map(([kind, text]) => ({ kind, text }));
  if (!lines.length) lines.push({ kind: "none", text: NO_SOURCE });
  if (Array.isArray(record.truncated) && record.truncated.length) lines.push({ kind: "incomplete", text: "This source list is incomplete; other sources may exist." });
  return lines;
}

/** The lazily loaded game data, as the finder needs it. */
export function sourceIndex(state) {
  if (!state || state.status === "idle") return { status: "idle" };
  if (state.status === "error") return { status: "error", retry: state.retry };
  if (state.status !== "ready") return { status: "loading" };
  const records = state.data?.catalogs?.IngredientSources;
  // A release built before the catalog existed: the feature marks it optional.
  if (records === undefined) return { status: "missing" };
  if (!Array.isArray(records)) return { status: "error" };
  if (records.some(record => !record || typeof record.key !== "string")) return { status: "error" };
  return {
    status: "ready",
    byKey: new Map(records.map((record) => [record.key, record])),
    places: new Map(entries(state.data.catalogs.Places).filter(place => typeof place.key === "string").map(place => [place.key, place])),
  };
}
