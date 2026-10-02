/** Player labels from catalog facts. Never infer size, quests or curses from IDs. */
const amount = value => Number.isFinite(value) ? String(Number(value.toPrecision(6))) : null;
const origins = { 'morrowind.esm': 'Morrowind', 'tribunal.esm': 'Tribunal', 'bloodmoon.esm': 'Bloodmoon',
  'tamriel_data.esm': 'Tamriel Data', 'tr_mainland.esm': 'Tamriel Rebuilt' };
const origin = record => {
  const plugin = record.provenance?.originPlugin;
  return typeof plugin === 'string' && plugin.trim() ? origins[plugin.toLowerCase()] || plugin.replace(/\.(esm|esp)$/i, '').replaceAll('_', ' ') : null;
};
const targetName = id => String(id).replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
const effectName = effect => {
  if (typeof effect?.name !== 'string' || !effect.name) return null;
  const target = effect.attribute ?? effect.skill;
  return target == null ? effect.name : effect.name.replace(/Attribute|Skill/, targetName(target));
};

export function ingredientLabels(records, { effectLabel = effectName } = {}) {
  const groups = new Map(), labels = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object') continue;
    const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Unknown ingredient';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(record);
  }
  for (const [name, group] of groups) {
    const facts = group.map(record => ({ record, weight: amount(record.weight), value: amount(record.value), origin: origin(record),
      scripted: typeof record.script === 'string' && Boolean(record.script.trim()),
      effects: (Array.isArray(record.effects) ? [...record.effects] : []).sort((a,b) => a.slot-b.slot).map(effectLabel).filter(Boolean).join(', ') }));
    const differs = key => new Set(facts.map(f => f[key])).size > 1;
    for (const fact of facts) {
      const qualifiers = [];
      if (group.length > 1) {
        if (differs('weight') && fact.weight !== null) qualifiers.push(`${fact.weight} weight`);
        if (differs('value') && !differs('weight') && fact.value !== null) qualifiers.push(`${fact.value} gold value`);
        if (differs('effects') && fact.effects) qualifiers.push(fact.effects);
        if (differs('origin') && fact.origin) qualifiers.push(fact.origin);
        if (differs('scripted') && fact.scripted) qualifiers.push('scripted variant');
      }
      // If these facts still match, the labels deliberately match too. Selection,
      // calculation and source lookup retain each separate canonical record key.
      labels.set(fact.record.key, qualifiers.length ? `${name} (${qualifiers.join('; ')})` : name);
    }
  }
  return labels;
}
