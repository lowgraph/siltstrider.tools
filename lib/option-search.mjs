/**
 * Matching for a searchable list (CALC-3's ingredient boxes). A name that starts with the
 * typed text comes first, then one with a word that starts with it, then any other that
 * contains it; within each, the list's own order. Nothing typed: every option, in order.
 */
export function rankOptions(options = [], query = "", label = (option) => option?.n) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [...options];
  const hits = [];
  options.forEach((option, index) => {
    const name = String(label(option) ?? "").toLowerCase();
    const at = name.indexOf(q);
    if (at < 0) return;
    const rank = at === 0 ? 0 : /[\s'(\-]/.test(name[at - 1]) ? 1 : 2;
    hits.push({ option, rank, index });
  });
  return hits.sort((a, b) => a.rank - b.rank || a.index - b.index).map((hit) => hit.option);
}

/** The next highlighted option for an arrow key: wraps around; -1 when there is none. */
export function stepIndex(current, delta, length) {
  if (!length) return -1;
  if (current < 0 || current >= length) return delta > 0 ? 0 : length - 1;
  return (current + delta + length) % length;
}
