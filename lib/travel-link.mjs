/**
 * Shareable travel routes: the planner's choices in the address bar, beside the
 * world parameters the shell owns. Only the parameters named here are read or
 * written; everything else in the query is left alone.
 */
const KEYS = ["from", "to", "plan", "walk", "long", "quest"];

/** What a query string says about the route, keeping only values that make sense. */
export function readRouteLink(search = "", objectives = {}) {
  const params = new URLSearchParams(search || "");
  const text = name => {
    const value = params.get(name);
    return typeof value === "string" && value.trim() && value.length <= 300 ? value.trim() : null;
  };
  const plan = text("plan");
  return {
    from: text("from"),
    to: text("to"),
    plan: plan && Object.prototype.hasOwnProperty.call(objectives, plan) ? plan : null,
    walk: params.get("walk") === "0" ? false : null,
    quest: params.get("quest") === "1" ? true : null
  };
}

/**
 * The query string with the route written in. Defaults are left out, so a plain
 * route stays a short link: walking on, quest teleports off, fewest legs.
 */
export function writeRouteLink(search = "", { from, to, plan, walk = true, quest = false } = {}) {
  const params = new URLSearchParams(search || "");
  for (const key of KEYS) params.delete(key);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (plan && plan !== "hops") params.set("plan", plan);
  if (walk === false) params.set("walk", "0");
  if (quest === true) params.set("quest", "1");
  const out = params.toString();
  return out ? "?" + out : "";
}
