"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchTravelOptions } from "../../../lib/travel-search.mjs";

/** One editable search, one ranked list, and a separate committed route endpoint. */
export default function TravelLocationPicker({ id, label, value, valueLabel, options, onChange, disabled = false, scopeKey = null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);
  const listId = `${id}-results`;
  const statusId = `${id}-status`;
  const results = useMemo(() => searchTravelOptions(options, query, { limit: 40 }), [options, query]);
  const active = activeIndex >= 0 && activeIndex < results.options.length ? activeIndex : -1;
  const expanded = open && !disabled;
  // Movement/fare recalculation can recreate the same list while a player types.
  // Only a changed location list or world supersedes that draft.
  const optionKeys = useMemo(() => options.map(option => option.id).join('\u0000'), [options]);

  const close = () => { setOpen(false); setQuery(""); setActiveIndex(-1); };
  const startSearch = () => {
    if (disabled || open) return;
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
  };

  // Swaps, shared links, save imports and changed world/options supersede a draft.
  useEffect(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, [value, valueLabel, optionKeys, scopeKey, disabled]);

  useEffect(() => {
    if (expanded && active >= 0) {
      listRef.current?.children[active]?.scrollIntoView?.({ block: "nearest" });
    }
  }, [expanded, active]);

  const choose = (option) => {
    if (!option || disabled) return;
    onChange(option.id);
    close();
  };

  const onKeyDown = (event) => {
    if (event.nativeEvent.isComposing || disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      startSearch();
      const size = results.options.length;
      if (!size) { setActiveIndex(-1); return; }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(!expanded || active < 0 ? (direction > 0 ? 0 : size - 1) : (active + direction + size) % size);
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      if (active >= 0) choose(results.options[active]);
    } else if (event.key === "Escape" && expanded) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  };

  return (
    <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
      <label htmlFor={id} className="block text-xs uppercase font-serif font-bold text-fg-7">{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-describedby={expanded ? statusId : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        disabled={disabled}
        value={expanded ? query : valueLabel || ""}
        placeholder="Search towns, stops and places…"
        onFocus={startSearch}
        onClick={startSearch}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }}
        onKeyDown={onKeyDown}
        onBlur={close}
        className="w-full min-h-11 p-2 text-sm font-serif bg-surface-1 border border-line-9 text-fg-2 focus:border-accent"
      />
      {expanded && (
        <>
          <p id={statusId} role="status" className="text-xs text-fg-9 font-serif">
            {results.total === 0 ? "No matching places. Try another name." :
              results.total > results.options.length ? `Showing ${results.options.length} of ${results.total} places. Type more to narrow the list.` :
                `${results.total} ${results.total === 1 ? "place" : "places"} found. Use arrow keys to choose, then Enter.`}
          </p>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={`${label} results`}
            className="max-h-64 overflow-y-auto mw-scrollbar border border-line-11 m-0 p-0 list-none"
          >
            {results.options.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`min-h-11 px-2 py-2 text-sm font-serif cursor-pointer border-b border-line-11 last:border-b-0 ${
                  index === active ? "bg-surface-17 text-accent outline outline-1 outline-accent -outline-offset-1" : "bg-transparent text-fg-2 hover:bg-surface-9"
                }`}
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <span className="min-w-0 break-words">{option.label}</span>
                  <span className="text-xs text-fg-9">{option.badge}</span>
                </span>
                {option.detail && <span className="block text-xs text-fg-9">{option.detail}</span>}
                {option.id === value && <span className="sr-only"> (current location)</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
