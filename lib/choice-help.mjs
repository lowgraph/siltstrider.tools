/** Put the loaded catalog's mechanical bonuses before its lore; change no stats. */
export function choiceHelp(kind, record, gender = 'Male') {
  const parts = [];
  const numbers = values => Object.entries(values || {}).filter(([, n]) => Number.isFinite(n));
  if (kind === 'race') {
    const attributes = numbers(record?.[gender === 'Female' ? 'F' : 'M']);
    if (attributes.length) parts.push('Starting attributes: ' + attributes.map(([name, n]) => `${name} ${n}`).join(', ') + '.');
    const skills = numbers(record?.skills).filter(([, n]) => n !== 0);
    parts.push(skills.length ? 'Skill bonuses: ' + skills.map(([name, n]) => `${name} ${n > 0 ? '+' : ''}${n}`).join(', ') + '.' : 'Race sets starting attributes, skill bonuses and innate abilities.');
    if (record?.abilities) parts.push('Innate abilities and powers: ' + record.abilities + '.');
  } else {
    const attributes = numbers(record?.attrs).filter(([, n]) => n !== 0);
    if (attributes.length) parts.push('Attribute bonuses: ' + attributes.map(([name, n]) => `${name} ${n > 0 ? '+' : ''}${n}`).join(', ') + '.');
    if (Number.isFinite(record?.mag) && record.mag !== 0) parts.push(`Extra Magicka: ${record.mag * 100}% of Intelligence.`);
    if (record?.abil) parts.push('Abilities and powers: ' + record.abil + '.');
    if (!parts.length) parts.push('Birthsigns add permanent abilities or spells and powers.');
  }
  parts.push('See the Sheet for the resulting numbers and spell details.');
  if (record?.tip) parts.push('Lore: ' + record.tip);
  return parts.join(' ');
}
