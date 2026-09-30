/**
 * BLD-3: a newcomer's first Builder opens on the premade catalog, since choosing from
 * examples is easier than composing a class. A newcomer is a browser that has not
 * opened the Builder before and keeps no character of its own: no saved characters and
 * no loaded save. Where storage is blocked nothing can be told, so the Builder opens as
 * it always has.
 */
import { loadLocalCharacters } from "./character-vault.mjs";
import { ACTIVE_SAVE_KEY } from "./active-save-store.mjs";

export const BUILDER_VISITED_KEY = "siltstrider-builder-visited";

// Reading localStorage itself throws where a browser refuses site data.
const defaultStorage = () => {
  try { return typeof window === "undefined" ? null : window.localStorage || null; } catch { return null; }
};

/** Whether this browser is new to the Builder. Never throws. */
export function isNewcomer(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    if (storage.getItem(BUILDER_VISITED_KEY)) return false;
    if (storage.getItem(ACTIVE_SAVE_KEY)) return false;
    return loadLocalCharacters(storage).length === 0;
  } catch {
    return false;
  }
}

/** Remember that the Builder has been opened here. Never throws. */
export function markBuilderVisited(storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(BUILDER_VISITED_KEY, "1");
  } catch {}
}
