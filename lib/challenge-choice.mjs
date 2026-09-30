/**
 * CHL-2: choosing a race, class or birthsign in the run's settings instead of rolling it.
 * A choice is locked, so the next roll keeps it; choosing "Roll it" (an empty value) only
 * unlocks the slot and leaves the run as it is until the next roll. A chosen class brings
 * its specialization, favoured attributes and skills, as picking it in the game does.
 */
export const CHOOSABLE_SLOTS = Object.freeze(["race", "cls", "sign"]);

export function chooseCharacterSlot({ run = {}, locks = {} } = {}, slot, value, catalogs = null) {
  if (!CHOOSABLE_SLOTS.includes(slot)) return { run, locks };
  const chosen = typeof value === "string" ? value.trim() : "";
  const nextLocks = { ...locks, [slot]: Boolean(chosen) };
  if (!chosen) return { run, locks: nextLocks };
  const next = { ...run, [slot]: chosen, seedExact: false };
  const cls = slot === "cls" ? catalogs?.classes?.[chosen] : null;
  if (cls) {
    next.spec = cls.spec;
    next.fav1 = cls.fav?.[0];
    next.fav2 = cls.fav?.[1];
    next.maj = [...(cls.maj || [])];
    next.min = [...(cls.min || [])];
  }
  return { run: next, locks: nextLocks };
}
