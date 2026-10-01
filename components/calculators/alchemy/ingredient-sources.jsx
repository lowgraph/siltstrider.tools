"use client";
import { useId, useState } from "react";
import { sourceLines } from "../../../lib/ingredient-sources.mjs";

/** Sources belong to the selected ingredient; changing it remounts this disclosure. */
export default function IngredientSources({ ingredient, sources, onWantSources }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return <div className="alchemy-ingredient-sources">
    <button type="button" className="mw-btn text-xs px-3 py-2" aria-expanded={open}
      aria-controls={panelId} aria-label={`Where to get ${ingredient.n}`}
      onClick={() => { if (!open) onWantSources(); setOpen(!open); }}>Where to get it</button>
    <div id={panelId} hidden={!open} className="pt-2 space-y-2 break-words">
      {open && <SourceDetails ingredients={[ingredient]} sources={sources} />}
    </div>
  </div>;
}

/** Shared content for a selected ingredient or an effect-finder pair. */
export function SourceDetails({ ingredients, sources }) {
  if (sources.status === "ready") return <>
    {ingredients.map(ingredient => <div key={ingredient.id} className="space-y-1">
      <p className="text-xs font-serif font-bold text-fg-2 m-0">{ingredient.n}</p>
      <ul className="list-disc pl-5 m-0 space-y-1 text-xs text-fg-7">
        {sourceLines(sources.byKey.get(ingredient.id), sources.places).map(line => <li key={line.kind}>{line.text}</li>)}
      </ul>
    </div>)}
    <p className="text-xs text-fg-9 m-0">Sources exclude theft, NPC inventories, random loot and quest rewards. Chances are for player level 1 unless stated.</p>
  </>;
  if (sources.status === "missing") return <p className="text-xs text-fg-7 m-0">Where to get ingredients comes with the next game data update.</p>;
  if (sources.status === "error") return <p role="alert" className="text-xs text-fg-7 m-0">Could not load where to get it.{" "}
    <button type="button" className="mw-btn text-xs px-3 py-2" onClick={sources.retry}>Retry</button></p>;
  return <p role="status" className="text-xs text-fg-7 m-0">Loading ingredient sources&hellip;</p>;
}
