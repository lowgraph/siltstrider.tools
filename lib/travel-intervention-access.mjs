import { calcSpellCastChance } from './spell-math.mjs';

const kinds = ['divine', 'almsivi'];
const squash = id => typeof id === 'string' ? id.toLowerCase().replace(/[^a-z]/g, '') : '';
const value = (sheet, save, category, name) => {
  const field = category === 'skills' ? 'skills' : 'attributes';
  const records = Array.isArray(save?.build?.[field]) ? save.build[field] : [];
  const number = sheet?.[category === 'skills' ? 'skills' : 'attrs']?.[name]?.v
    ?? records.find(record => squash(record?.id) === squash(name))?.value;
  return Number.isFinite(number) ? number : null;
};

/** Conservative defaults; the visitor may include a low/unknown chance explicitly. */
export function interventionAccess(save, { spellRecords = [], sheet = null } = {}) {
  const known = new Set((Array.isArray(save?.stuff?.spells) ? save.stuff.spells : []).map(squash));
  const records = Array.isArray(spellRecords) ? spellRecords : [];
  const magicka = Number.isFinite(save?.vitals?.magicka?.current) ? Math.max(0, save.vitals.magicka.current) : null;
  const fatigue = save?.vitals?.fatigue;
  const hasFatigue = Number.isFinite(fatigue?.current) && Number.isFinite(fatigue?.max) && fatigue.max > 0;
  const ratio = hasFatigue ? Math.max(0, fatigue.current / fatigue.max) : 1;
  const skill = value(sheet, save, 'skills', 'Mysticism');
  const willpower = value(sheet, save, 'attrs', 'Willpower');
  const luck = value(sheet, save, 'attrs', 'Luck');
  return Object.fromEntries(kinds.map(kind => {
    const name = `${kind}intervention`;
    const scrolls = (Array.isArray(save?.stuff?.inventory) ? save.stuff.inventory : []).reduce((total, item) =>
      typeof item?.id === 'string' && /^sc[_\s-]/i.test(item.id) && squash(item.id).includes(name) && Number.isSafeInteger(item?.count) && item.count > 0
        ? Math.min(1e6, total + item.count) : total, 0);
    const spell = records.find(record => known.has(squash(record?.key || record?.id))
      && squash(record?.key || record?.id) === name && record?.type === 'spell');
    const knows = known.has(name);
    const cost = Number.isFinite(spell?.cost) && spell.cost >= 0 ? spell.cost : null;
    const chance = cost !== null && (spell.alwaysSucceeds || (skill !== null && willpower !== null && luck !== null))
      ? (spell.alwaysSucceeds ? 100 : calcSpellCastChance(cost, skill, willpower, luck, ratio)) : null;
    const short = cost !== null && magicka !== null && cost > magicka;
    const blocked = knows && (short || chance === 0);
    const source = knows && !blocked ? 'spell' : scrolls > 0 ? 'scroll' : knows ? 'spell' : null;
    const available = !save || source === 'scroll' || (knows && !blocked);
    const defaultEnabled = Boolean(save && source === 'spell' && !blocked && chance !== null && chance >= 75 && magicka !== null);
    let note = '';
    if (source === 'scroll') note = `${scrolls} scroll${scrolls === 1 ? '' : 's'} · ${scrolls} use${scrolls === 1 ? '' : 's'} per journey; not selected automatically`;
    else if (knows) note = short ? `Needs ${cost} Magicka; this save has ${magicka}. Left out.`
      : chance === 0 ? '0% estimated cast chance. Left out.'
      : chance === null ? 'Cast chance or spell cost unavailable; left off until chosen.'
      : `${chance}% estimated cast chance${!hasFatigue ? ' at full fatigue' : ''}${chance < 75 ? '; below 75%, left off until chosen' : ''}.${magicka === null ? ' Current Magicka unavailable; left off until chosen.' : ''}`;
    else if (save) note = 'No known spell or usable scroll in this save.';
    if (knows && source === 'spell' && scrolls > 0) note += ` Also carrying ${scrolls} single-use scroll${scrolls === 1 ? '' : 's'}.`;
    return [kind, { source, scrolls, cost, chance, magicka, available, defaultEnabled, note }];
  }));
}

/** Annotate every Intervention edge, including places/teleports added after stops. */
export function withInterventionResources(graph, access) {
  const resources = {};
  for (const kind of kinds) {
    const option = access?.[kind];
    if (option?.source === 'scroll') resources[`scroll:${kind}`] = option.scrolls;
    if (option?.magicka !== null && Number.isFinite(option?.magicka)) resources.magicka = option.magicka;
  }
  const out = Object.fromEntries(Object.entries(graph || {}).map(([from, edges]) => [from, (edges || []).flatMap(edge => {
    const option = access?.[edge.spell];
    if (!option) return [{ ...edge }];
    if (!option.available) return [];
    if (option.source === 'scroll') return [{ ...edge, resource: `scroll:${edge.spell}`, uses: 1, scroll: true }];
    return [{ ...edge,
      ...(option.chance !== null ? { castChance: option.chance } : {}),
      ...(option.source === 'spell' && option.cost > 0 && option.magicka !== null ? { resource: 'magicka', uses: option.cost } : {})
    }];
  })]));
  return { graph: out, resources };
}
