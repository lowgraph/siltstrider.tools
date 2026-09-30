import { approximateRealTime, formatRealDuration } from './travel-real-time.mjs';

const known = (route, field) => route?.totals?.[`${field}Known`] === true
  && Number.isFinite(route.totals[field]) && route.totals[field] >= 0;
const legsKnown = route => Number.isSafeInteger(route?.hops) && route.hops >= 0;
const goldText = value => String(Math.round(value * 100) / 100);

/** Compare routes calculated with the same graph, prices and resource budgets. */
export function cheapestTradeoff(cheapest, fewest) {
  if (!cheapest?.isValid || !fewest?.isValid || cheapest.hops === 0) return null;
  const parts = [];
  if (known(cheapest, 'gold') && known(fewest, 'gold')) {
    const saving = fewest.totals.gold - cheapest.totals.gold;
    parts.push(saving > 0 ? `saves ${goldText(saving)} gold`
      : saving < 0 ? `costs ${goldText(-saving)} gold more` : 'same fare');
  } else parts.push('fare comparison unavailable (some fares are unknown)');
  const a = approximateRealTime(cheapest), b = approximateRealTime(fewest);
  if (a?.known && b?.known) {
    const seconds = Math.round(a.seconds) - Math.round(b.seconds);
    parts.push(seconds > 0 ? `adds ~${formatRealDuration(seconds)} of movement`
      : seconds < 0 ? `avoids ~${formatRealDuration(-seconds)} of movement` : 'same outdoor movement time');
  } else parts.push('movement time comparison unavailable');
  if (a && b) {
    const difference = a.transitions - b.transitions;
    if (difference) parts.push(`${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} transport/spell transition${Math.abs(difference) === 1 ? '' : 's'}`);
    if (a.indoors || b.indoors) parts.push('time indoors not counted');
  }
  if (legsKnown(cheapest) && legsKnown(fewest)) {
    const difference = cheapest.hops - fewest.hops;
    if (difference) parts.push(`${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} ${Math.abs(difference) === 1 ? 'leg' : 'legs'}`);
  }
  return `Estimated comparison with Fewest legs: ${parts.join(', ')}.`;
}
