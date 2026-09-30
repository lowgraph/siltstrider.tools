/** Real movement time is measured before timescale; transport hours are clock jumps. */
export function approximateRealTime(route) {
  if (!route?.isValid || !Array.isArray(route.steps)) return null;
  let seconds = 0, transitions = 0, indoors = 0, known = true;
  for (const step of route.steps) {
    if (!step || typeof step !== 'object') { known = false; continue; }
    if (step.indoors) { indoors++; continue; }
    if (step.walk) {
      if (Number.isFinite(step.movementSeconds) && step.movementSeconds >= 0) seconds += step.movementSeconds;
      else known = false;
    } else transitions++;
  }
  return { seconds: Number.isFinite(seconds) ? seconds : null, known: known && Number.isFinite(seconds), transitions, indoors };
}

export function formatRealDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds === 0) return '0 sec';
  const rounded = Math.max(1, Math.round(seconds));
  const h = Math.floor(rounded / 3600), m = Math.floor(rounded % 3600 / 60), s = rounded % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : '', s ? `${s} sec` : ''].filter(Boolean).join(' ');
}

export function realTimeText(route) {
  const estimate = approximateRealTime(route);
  if (!estimate) return null;
  const movement = estimate.known ? estimate.seconds > 0 ? `~${formatRealDuration(estimate.seconds)} movement` : 'no outdoor movement'
    : 'movement time unavailable';
  const transitions = estimate.transitions ? ` + ${estimate.transitions} transport/spell transition${estimate.transitions === 1 ? '' : 's'}` : '';
  return `Real Time Approximation: ${movement}${transitions}${estimate.indoors ? ' + uncounted indoor movement' : ''}.`;
}
