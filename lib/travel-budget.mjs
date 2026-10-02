/** Display-only balance: unknown fares or saved gold cannot imply affordability. */
export function routeGoldBalance(route, gold) {
  const fare = route?.totals?.gold;
  if (!route?.isValid || route.totals?.goldKnown !== true || !Number.isFinite(fare)
    || fare < 0 || !Number.isFinite(gold) || gold < 0) return null;
  return { fare, remaining: gold - fare };
}
