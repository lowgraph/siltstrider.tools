"use client";
import { useMemo, useRef, useState } from "react";
import { alchemyEffectOptions, findAlchemyPairs } from "../../../lib/reverse-alchemy.mjs";
import { formatEffectLabel } from "../../../lib/alchemy-math.mjs";
import { rankOptions } from "../../../lib/option-search.mjs";
import { SourceDetails } from "./ingredient-sources";

/** `sources` is the lazily loaded IngredientSources (lib/ingredient-sources.mjs sourceIndex);
 *  `onWantSources` asks for it the first time a pair's "Where to get them" opens. */
export default function ReverseAlchemy({ ingredients, onUsePair, sources = { status: "idle" }, onWantSources }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [limit, setLimit] = useState(12);
  const search = useRef(null);
  const options = useMemo(() => alchemyEffectOptions(ingredients), [ingredients]);
  const choices = useMemo(() => selected.map(key => options.find(option => option.id === key)).filter(Boolean), [selected, options]);
  const matches = query.trim() && choices.length < 4 ? rankOptions(options.filter(option => !selected.includes(option.id)), query) : [];
  const result = useMemo(() => findAlchemyPairs(ingredients, choices.map(choice => choice.id), limit), [ingredients, choices, limit]);
  const changeEffects = keys => { setSelected(keys); setLimit(12); search.current?.focus(); };

  return <section aria-labelledby="reverse-alchemy-heading" className="reverse-alchemy bg-surface-5 border border-line-11 p-3 space-y-3">
    <h3 id="reverse-alchemy-heading" className="text-sm font-serif font-bold text-accent m-0">Find ingredients by effect</h3>
    <p id="reverse-alchemy-help" className="text-xs text-fg-7 m-0">Choose up to four effects. Find ingredient pairs that make all of them, then use a pair in the calculator.</p>
    <label htmlFor="reverse-alchemy-search" className="block text-xs font-serif text-fg-7">Search potion effects</label>
    <input ref={search} id="reverse-alchemy-search" type="search" autoComplete="off" value={query}
      onChange={event => setQuery(event.target.value)} aria-describedby="reverse-alchemy-help" aria-controls="reverse-alchemy-effects"
      className="w-full mw-input p-2 text-sm bg-surface-1 border border-line-9 text-fg-2" placeholder="Restore Health, Water Walking…" />
    <ul id="reverse-alchemy-effects" aria-label="Matching potion effects" className="list-none m-0 p-0 flex flex-wrap gap-2">
      {matches.slice(0, 24).map(effect => <li key={effect.id}><button type="button" className="mw-btn text-xs px-3 py-2"
        onClick={() => { changeEffects([...selected, effect.id]); setQuery(""); }}>{effect.n}</button></li>)}
    </ul>
    {query.trim() && !matches.length && <p role="status" className="text-xs text-fg-9">{choices.length >= 4 ? "Remove an effect to choose another." : "No matching effect available on two different ingredients."}</p>}
    {matches.length > 24 && <p className="text-xs text-fg-9">Showing 24 effects. Keep typing to narrow the search.</p>}
    {!!choices.length && <>
      <ul aria-label="Desired potion effects" className="list-none m-0 p-0 flex flex-wrap gap-2">
        {choices.map(effect => <li key={effect.id}><button type="button" className="mw-btn text-xs px-3 py-2" aria-label={`Remove ${effect.n}`}
          onClick={() => changeEffects(selected.filter(key => key !== effect.id))}>{effect.n} ×</button></li>)}
      </ul>
      <p role="status" className="text-xs text-fg-7">{result.total ? `${result.total} ingredient pair${result.total === 1 ? "" : "s"}. Showing ${result.pairs.length}.` : "No ingredient pair makes all the chosen effects. Remove an effect to broaden the search."}</p>
      {!!result.total && <>
        <p className="text-xs text-fg-9">Pairs with fewer additional effects come first, then lower ingredient value. &ldquo;Where to get them&rdquo; lists the shops, plants, creatures and places for each ingredient in this world. Using a pair replaces all four ingredient slots.</p>
        <ul aria-label="Ingredient pairs" tabIndex={0} className="list-none m-0 p-0 space-y-2 max-h-80 overflow-y-auto">
          {result.pairs.map(pair => <li key={pair.id} className="reverse-alchemy-pair border border-line-9 bg-surface-1 p-3 space-y-2">
            <p className="text-sm font-serif text-fg-2 m-0 break-words">{pair.ingredients.map(ingredient => ingredient.n).join(" + ")}</p>
            <p className="text-xs text-fg-7 m-0">{pair.extras.length ? `Also makes: ${pair.extras.map(item => formatEffectLabel(item.effect) + (item.effect.harmful || item.effect.bad ? " (harmful)" : "")).join(", ")}.` : "No additional shared effects."}</p>
            <PairSources pair={pair} sources={sources} onWantSources={onWantSources} />
            <button type="button" className="mw-btn text-xs px-3 py-2" aria-label={`Use ${pair.ingredients.map(ingredient => ingredient.n).join(" and ")}`}
              onClick={() => onUsePair(pair.ingredients)}>Use this pair</button>
          </li>)}
        </ul>
        {result.pairs.length < result.total && <button type="button" className="mw-btn text-xs px-3 py-2" onClick={() => setLimit(limit + 12)}>Show more pairs</button>}
      </>}
    </>}
  </section>;
}

/** Where to get a pair's two ingredients, folded until asked for: opening it is what loads
 *  the catalog (about 170 KB in Tamriel Rebuilt). */
function PairSources({ pair, sources, onWantSources }) {
  const names = pair.ingredients.map(ingredient => ingredient.n).join(" and ");
  return <details className="reverse-alchemy-sources" onToggle={event => { if (event.currentTarget.open) onWantSources?.(); }}>
    <summary className="text-xs font-serif text-accent cursor-pointer min-h-6 py-1">Where to get them<span className="sr-only">: {names}</span></summary>
    <div className="pt-2 space-y-2 break-words"><SourceDetails ingredients={pair.ingredients} sources={sources} /></div>
  </details>;
}
