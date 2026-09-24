export default function RaceMagic({ spells = [] }) {
  if (!spells.length) return null;
  return <div className="space-y-2" aria-label="Race powers and abilities">
    {spells.map(spell => <div key={spell.key || spell.name}>
      <strong className="text-fg-2">{spell.name}</strong>
      <span className="text-fg-8"> — {spell.type === 'power' ? 'Power · once per day' : spell.type === 'ability' ? 'Passive ability' : `Spell · ${spell.cost ?? 0} magicka`}</span>
      <ul className="text-fg-5">
        {(spell.effects || []).map((effect, index) => <li key={index}>
          {effect.name || `Effect ${effect.effectId}`}
          {effect.attribute ? ` (${effect.attribute})` : effect.skill ? ` (${effect.skill})` : ''}
          {effect.magnitude && (effect.magnitude.min !== 0 || effect.magnitude.max !== 0) ? ` ${effect.magnitude.min === effect.magnitude.max ? effect.magnitude.min : `${effect.magnitude.min}–${effect.magnitude.max}`}` : ''}
          {spell.type !== 'ability' && effect.durationSeconds > 0 ? ` for ${effect.durationSeconds}s` : ''}
          {effect.range ? ` on ${effect.range}` : ''}
          {effect.areaFeet > 0 ? ` · ${effect.areaFeet} ft area` : ''}
        </li>)}
      </ul>
    </div>)}
  </div>;
}
