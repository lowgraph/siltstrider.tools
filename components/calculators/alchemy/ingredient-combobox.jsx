"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { rankOptions, stepIndex } from "../../../lib/option-search.mjs";

/**
 * CALC-3: one searchable box per crucible slot, where there were a dropdown and a separate
 * "Search..." field. It shows the slot's ingredient; typing lists the matches (ARIA
 * combobox with a list popup): arrow keys move, Enter or a click chooses, Escape or leaving
 * the box puts the slot's ingredient back. `options` are the ingredients this slot may
 * take (the workstation leaves out those in other slots, and applies "share effects with
 * Slot 1").
 */
export default function IngredientCombobox({ slot, value = null, options = [], onSelect }) {
  const base = useId();
  const listId = `${base}-list`;
  const optionId = (i) => `${base}-option-${i}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null); // null: the box shows the slot's ingredient
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => rankOptions(options, query ?? ""), [options, query]);
  // The list can shrink under the highlight (another slot takes an ingredient).
  const current = active < matches.length ? active : -1;

  // Keep the highlighted option in view as the arrow keys move through a long list.
  useEffect(() => {
    if (!open || current < 0) return;
    const el = typeof document === "undefined" ? null : document.getElementById(optionId(current));
    el?.scrollIntoView?.({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current]);

  const close = () => { setOpen(false); setQuery(null); setActive(-1); };
  const choose = (ingredient) => { onSelect?.(ingredient); close(); };
  const openAt = () => {
    const at = value ? matches.findIndex((m) => m.id === value.id) : -1;
    setOpen(true);
    setActive(at >= 0 ? at : matches.length ? 0 : -1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openAt();
      setActive(stepIndex(current, event.key === "ArrowDown" ? 1 : -1, matches.length));
    } else if (event.key === "Enter") {
      if (!open) return;
      const pick = current >= 0 ? matches[current] : matches.length === 1 ? matches[0] : null;
      if (pick) { event.preventDefault(); choose(pick); }
    } else if (event.key === "Escape") {
      if (open || query !== null) { event.preventDefault(); close(); }
    } else if (event.key === "Tab") {
      close();
    }
  };

  const label = `Crucible ${slot + 1} ingredient`;
  const shown = query ?? (value?.n || "");
  const count = matches.length;
  return (
    <div className="ingredient-combobox relative">
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && current >= 0 ? optionId(current) : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search ingredients…"
        className="w-full bg-surface-1 border border-line-9 px-2 py-1.5 text-xs text-fg-2 placeholder-fg-15 font-serif"
        value={shown}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(event.target.value.trim() ? 0 : -1);
        }}
        onClick={() => { if (!open) openAt(); }}
        onKeyDown={onKeyDown}
        onBlur={close}
      />
      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 bg-surface-2 border border-line-9 shadow-lg"
          // A click on an option must not blur the box first, or the list closes under it.
          onMouseDown={(event) => event.preventDefault()}
        >
          <ul role="listbox" id={listId} aria-label={`Ingredients for crucible ${slot + 1}`} className="max-h-60 overflow-y-auto m-0 p-0 list-none">
            {matches.map((ingredient, i) => (
              <li
                key={ingredient.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === current}
                className={`px-2 py-1.5 text-xs font-serif cursor-pointer ${i === current ? "bg-surface-9 text-fg-1" : "text-fg-4"} ${value?.id === ingredient.id ? "font-bold" : ""}`}
                onClick={() => choose(ingredient)}
                onMouseMove={() => { if (current !== i) setActive(i); }}
              >
                {ingredient.n}
              </li>
            ))}
          </ul>
          {count === 0 && (
            <p className="m-0 px-2 py-1.5 text-xs font-serif text-fg-9">No ingredient matches &ldquo;{query}&rdquo;.</p>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{open ? `${count} ingredient${count === 1 ? "" : "s"}` : ""}</span>
    </div>
  );
}
