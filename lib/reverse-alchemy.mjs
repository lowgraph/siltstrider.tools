import { findSharedEffects, formatEffectLabel, getEffectKey } from './alchemy-math.mjs';

function catalog(ingredients) {
  const unique = new Map();
  for (const ingredient of Array.isArray(ingredients) ? ingredients : []) {
    if (!ingredient || typeof ingredient.id !== 'string' || !ingredient.id || typeof ingredient.n !== 'string' || !ingredient.n || unique.has(ingredient.id)) continue;
    const effects = Array.isArray(ingredient.effects) ? ingredient.effects.filter(effect => {
      if (!effect || typeof (effect.n ?? effect.name) !== 'string' || (effect.arg != null && typeof effect.arg !== 'string')) return false;
      const key = getEffectKey(effect);
      return typeof key === 'string' && key.length > 0 && formatEffectLabel(effect);
    }) : [];
    unique.set(ingredient.id, { ingredient, effects, keys: new Set(effects.map(effect => String(getEffectKey(effect)))) });
  }
  return [...unique.values()].sort((a, b) => a.ingredient.n.localeCompare(b.ingredient.n) || a.ingredient.id.localeCompare(b.ingredient.id));
}

/** Only effects present on two distinct ingredient records can make a pair. */
export function alchemyEffectOptions(ingredients) {
  const effects = new Map();
  for (const entry of catalog(ingredients)) for (const key of entry.keys) {
    const effect = entry.effects.find(effect => String(getEffectKey(effect)) === key);
    const previous = effects.get(key);
    effects.set(key, { id: key, n: formatEffectLabel(effect), count: (previous?.count || 0) + 1 });
  }
  return [...effects.values()].filter(effect => effect.count >= 2)
    .sort((a, b) => a.n.localeCompare(b.n) || a.id.localeCompare(b.id));
}

/** Each ingredient must carry every requested effect. Targets remain part of its key. */
export function findAlchemyPairs(ingredients, requested = [], limit = 12) {
  const keys = new Set(Array.isArray(requested) ? requested.filter(key => typeof key === 'string' && key) : []);
  if (!keys.size || keys.size > 4) return { pairs: [], total: 0 };
  const eligible = catalog(ingredients).filter(entry => [...keys].every(key => entry.keys.has(key)));
  const pairs = [];
  for (let i = 0; i < eligible.length; i++) for (let j = i + 1; j < eligible.length; j++) {
    const first = eligible[i], second = eligible[j];
    const shared = findSharedEffects([{ ...first.ingredient, effects: first.effects }, { ...second.ingredient, effects: second.effects }]);
    const extras = shared.filter(item => !keys.has(String(item.key)));
    const value = [first.ingredient.v, second.ingredient.v].every(value => Number.isFinite(value) && value >= 0)
      ? first.ingredient.v + second.ingredient.v : null;
    pairs.push({ id: JSON.stringify([first.ingredient.id, second.ingredient.id]), ingredients: [first.ingredient, second.ingredient], extras, value });
  }
  pairs.sort((a, b) => a.extras.length - b.extras.length || (a.value ?? Infinity) - (b.value ?? Infinity)
    || a.ingredients[0].n.localeCompare(b.ingredients[0].n) || a.ingredients[1].n.localeCompare(b.ingredients[1].n) || a.id.localeCompare(b.id));
  const count = Number.isInteger(limit) && limit > 0 ? limit : 12;
  return { pairs: pairs.slice(0, count), total: pairs.length };
}
