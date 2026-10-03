// Label layout in SVG pixels. Stop coordinates and route geometry are untouched.
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

/** Keep words together unless a single token is wider than the entire map. */
export function wrapMapLabel(text, maxWidth, measure) {
  if (!(maxWidth > 0)) return [String(text)];
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const joined = line ? `${line} ${word}` : word;
    if (measure(joined) <= maxWidth) { line = joined; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of word) {
      if (line && measure(line + char) > maxWidth) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

/** Try positions near each dot, then reserve a callout row below a crowded map. */
export function placeMapLabels(records, dots, width, height) {
  const pad = 4, gap = 4;
  const boxes = dots.map(([x, y]) => ({ x: x - 7, y: y - 7, w: 14, h: 14 }));
  const stops = [];
  let usedHeight = height;
  for (const record of records) {
    const { point: [px, py], w, h } = record;
    const xs = [px + 9, px - w - 9, px - w / 2, pad].map(x => clamp(x, pad, width - w - pad));
    const candidates = [];
    for (let offset = 0; offset <= height + h; offset += h + gap) {
      for (const y of [py - h / 2 - offset, py - h / 2 + offset]) {
        if (y < pad || y + h > height - pad) continue;
        for (const x of xs) candidates.push({ x, y, w, h });
      }
    }
    const free = candidates.find(b => !boxes.some(o => overlaps(b, o)));
    const box = free || { x: pad, y: usedHeight + gap, w, h };
    usedHeight = Math.max(usedHeight, box.y + h + pad);
    boxes.push({ x: box.x - gap / 2, y: box.y - gap / 2, w: w + gap, h: h + gap });
    const target = [clamp(px, box.x, box.x + w), clamp(py, box.y, box.y + h)];
    stops.push({ ...record, box, x: box.x + 2, y: box.y + 15,
      leader: Math.hypot(target[0] - px, target[1] - py) > 12 ? target : null });
  }
  return { stops, boxes, height: usedHeight };
}
