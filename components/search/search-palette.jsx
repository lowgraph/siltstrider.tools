"use client";
import { useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SEARCH_GROUPS, entryDetails, searchEntries } from "../../lib/site-search.mjs";
import { SEARCH_PARTS, createSearchIndex, indexEntries } from "../../lib/site-search-index.mjs";
import { setSearchIntent } from "../../lib/search-intent.mjs";
import { getGameDataLoader } from "../use-game-data";

const WORLD_LABEL = { vanilla: "Morrowind", tr: "Tamriel Rebuilt", tr_arce: "Tamriel Rebuilt + ARCE" };
const FILTERS = [{ id: "all", label: "All" }, ...SEARCH_GROUPS];
const EXAMPLES = ["Glass Dagger", "Balmora", "Fortify Strength", "Mages Guild"];
const PART_LABEL = { travel: "places", factions: "factions", ingredients: "ingredients", spells: "spells", items: "items" };

// Results that lead into a tool. Items and spells have no page; Enter copies their console command.
const OPENS = {
  page: entry => ({ view: entry.ref.view }),
  stop: entry => ({ view: "travel", intent: { view: "travel", kind: "destination", value: entry.ref.stop } }),
  ingredient: entry => ({ view: "alchemy", intent: { view: "alchemy", kind: "ingredient", value: entry.ref.record.key } }),
  faction: entry => ({ view: "factions", intent: { view: "factions", kind: "faction", value: entry.ref.record.key } })
};
const HINT = { page: "Open", stop: "Plan a trip", ingredient: "Add to Alchemy", faction: "Open journal" };

const ICONS = {
  page: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  stop: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  faction: <path d="M6 3h12v12l-6 5-6-5z M6 8h12" />,
  ingredient: <><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19 13 11" /></>,
  spell: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  weapon: <><path d="M19 4l-9.5 9.5" /><path d="M19 4h-3.5 M19 4v3.5" /><path d="M7 12l5 5 M8.5 15.5 5 19 M4 18l2 2" /></>,
  armor: <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z" />,
  clothing: <><circle cx="12" cy="14" r="6" /><path d="M9.5 5.5 12 8l2.5-2.5L12 3z" /></>,
  potion: <path d="M10 3h4 M10.5 3v5L5.5 17a2.5 2.5 0 0 0 2.2 4h8.6a2.5 2.5 0 0 0 2.2-4l-5-9V3 M7.5 14h9" />,
  book: <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
};

function KindIcon({ kind }) {
  return (
    <span className="search-option-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[kind] || ICONS.page}
      </svg>
    </span>
  );
}

function Highlight({ text, ranges }) {
  if (!ranges?.length) return text;
  const out = [];
  let at = 0;
  ranges.forEach(([start, end], i) => {
    if (start > at) out.push(text.slice(at, start));
    out.push(<mark key={i}>{text.slice(start, end)}</mark>);
    at = end;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

const indexes = new WeakMap();
function indexFor(loader) {
  if (!indexes.has(loader)) indexes.set(loader, createSearchIndex(loader));
  return indexes.get(loader);
}

// Loads (once per profile) while the palette is open and re-renders as parts arrive.
function useSearchIndex(loader, profile, enabled) {
  const state = useMemo(() => (enabled ? indexFor(loader).get(profile) : null), [loader, profile, enabled]);
  const [, bump] = useReducer(n => n + 1, 0);
  useEffect(() => {
    if (!state) return undefined;
    bump();
    return state.subscribe(bump);
  }, [state]);
  const version = state?.version;
  const entries = useMemo(() => indexEntries(state), [state, version]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    entries,
    ctx: state?.ctx || {},
    loading: state ? SEARCH_PARTS.filter(p => !state.parts[p] && !state.failed.includes(p)) : [],
    failed: state?.failed || []
  };
}

const listText = parts => parts.map(p => PART_LABEL[p]).join(", ").replace(/, ([^,]*)$/, " and $1");
const narrowScreen = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(max-width: 899px)").matches);

function SearchCard({ entry, ctx, copied, onCopy, onOpen, onBack }) {
  const details = entryDetails(entry, ctx);
  const opens = Boolean(OPENS[entry.kind]);
  return (
    <div className="search-card">
      <button type="button" className="search-back" onClick={onBack}>← Results</button>
      <div className="search-card-kicker">
        {details.kicker}
        {entry.count > 1 ? ` · ${entry.count} identical records` : ""}
      </div>
      <h2 className="search-card-title">{entry.title}</h2>
      {details.rows.length > 0 && (
        <dl className="search-card-rows">
          {details.rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      )}
      {details.effects.length > 0 && (
        <div className="search-card-section">
          <div className="search-card-label">{details.effectsTitle}</div>
          {entry.kind === "faction" ? (
            <ol className="search-card-ranks">{details.effects.map((rank, i) => <li key={i}>{rank}</li>)}</ol>
          ) : (
            <ul className="search-card-effects">{details.effects.map((line, i) => <li key={i}>{line}</li>)}</ul>
          )}
        </div>
      )}
      {details.notes.map(note => <div className="search-card-note" key={note}>{note}</div>)}
      {details.console && (
        <div className="search-console">
          <code>{details.console}</code>
          <button type="button" onClick={onCopy} aria-label={`Copy ${details.console}`}>
            {copied ? (copied.ok ? "Copied" : "Copy failed") : "Copy"}
          </button>
        </div>
      )}
      {opens && (
        <button type="button" className="mw-btn search-card-action" onClick={onOpen}>{details.action} →</button>
      )}
    </div>
  );
}

/**
 * The site-wide search dialog. Pages are searchable at once; game data loads
 * the first time it opens for a world profile and fills in group by group.
 */
export default function SearchPalette({ open, onClose, profile = "vanilla", navigate, loader }) {
  const source = loader || getGameDataLoader();
  const { entries, ctx, loading, failed } = useSearchIndex(source, profile, open);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeKey, setActiveKey] = useState(null);
  const [detail, setDetail] = useState(false);
  const [copied, setCopied] = useState(null);
  const deferredQuery = useDeferredValue(query);
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const groups = useMemo(
    () => searchEntries(entries, deferredQuery, { group: filter, perGroup: 4, limit: 50 }),
    [entries, deferredQuery, filter]
  );
  const options = useMemo(() => {
    const list = [];
    for (const g of groups) {
      for (const item of g.items) list.push({ type: "entry", key: item.entry.id, entry: item.entry, ranges: item.ranges });
      if (filter === "all" && g.total > g.items.length) list.push({ type: "more", key: "more:" + g.group, group: g.group, label: g.label, total: g.total });
    }
    return list;
  }, [groups, filter]);
  const activeIndex = Math.max(0, options.findIndex(o => o.key === activeKey));
  const current = options[activeIndex] || null;
  const currentEntry = current?.type === "entry" ? current.entry : null;

  // Fresh state on every open; lock the page behind the dialog and restore focus after.
  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setFilter("all");
    setActiveKey(null);
    setDetail(false);
    const returnTo = document.activeElement;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const inerted = [...document.body.children].filter(el => el !== overlayRef.current && !el.inert);
    inerted.forEach(el => { el.inert = true; });
    inputRef.current?.focus();
    return () => {
      root.style.overflow = overflow;
      inerted.forEach(el => { el.inert = false; });
      if (returnTo && typeof returnTo.focus === "function" && document.contains(returnTo)) returnTo.focus();
    };
  }, [open]);

  useEffect(() => {
    setActiveKey(null);
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [deferredQuery, filter]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`search-opt-${activeIndex}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!open || typeof document === "undefined") return null;

  const copy = async entry => {
    const text = entryDetails(entry, ctx).console;
    if (!text) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {}
    setCopied({ id: entry.id, ok });
  };

  const openEntry = entry => {
    const target = OPENS[entry.kind]?.(entry);
    if (!target) return false;
    if (target.intent) setSearchIntent(target.intent);
    onClose();
    navigate?.(target.view);
    return true;
  };

  const choose = option => {
    if (!option) return;
    if (option.type === "more") {
      setFilter(option.group);
      inputRef.current?.focus();
      return;
    }
    if (!openEntry(option.entry)) copy(option.entry);
  };

  const onOptionClick = option => {
    setActiveKey(option.key);
    if (option.type === "entry" && !OPENS[option.entry.kind]) {
      if (narrowScreen()) setDetail(true);
      return;
    }
    choose(option);
  };

  const onKeyDown = e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (detail) {
        setDetail(false);
        inputRef.current?.focus();
      } else onClose();
      return;
    }
    if (e.key === "Tab") {
      const all = [...dialogRef.current.querySelectorAll("input, button:not([disabled])")];
      const shown = all.filter(el => el.getClientRects().length > 0);
      const pool = shown.length ? shown : all;
      const first = pool[0];
      const last = pool[pool.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.target !== inputRef.current) return;
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && options.length) {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveKey(options[(activeIndex + step + options.length) % options.length].key);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      if (current.type === "entry" && !OPENS[current.entry.kind] && narrowScreen()) setDetail(true);
      else choose(current);
    }
  };

  const hintFor = option => {
    if (option.type === "more") return "Show all";
    return HINT[option.entry.kind] || "Copy command";
  };
  const enterLabel = current ? hintFor(current) : "Open";
  const typed = deferredQuery.trim().length > 0;
  let index = -1;

  return createPortal(
    <div
      className="search-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="search-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        data-detail={detail && currentEntry ? "true" : undefined}
        onKeyDown={onKeyDown}
      >
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={current ? `search-opt-${activeIndex}` : undefined}
            aria-label="Search items, spells, places and tools"
            placeholder="Search items, spells, places, tools…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            value={query}
            onChange={e => { setQuery(e.target.value); setDetail(false); }}
          />
          <button type="button" className="search-close" onClick={onClose} aria-label="Close search">
            <span className="search-close-key">Esc</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="search-chips" role="group" aria-label="Show results from">
          {FILTERS.map(f => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); inputRef.current?.focus(); }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="search-body">
          <div className="search-results" ref={resultsRef}>
            {!typed && filter === "all" && (
              <div className="search-examples">
                <span>Try</span>
                {EXAMPLES.map(example => (
                  <button key={example} type="button" onClick={() => { setQuery(example); inputRef.current?.focus(); }}>{example}</button>
                ))}
              </div>
            )}
            <div id="search-listbox" role="listbox" aria-label="Results">
              {groups.map(g => (
                <div key={g.group} role="group" aria-labelledby={`search-group-${g.group}`}>
                  <div className="search-group-label" id={`search-group-${g.group}`} role="presentation">
                    <span>{g.label}</span>
                    {typed && <span className="search-group-count">{g.total}</span>}
                  </div>
                  {g.items.map(item => {
                    index += 1;
                    const option = options[index];
                    const i = index;
                    return (
                      <div
                        key={option.key}
                        id={`search-opt-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        className="search-option"
                        onMouseMove={() => { if (activeKey !== option.key) setActiveKey(option.key); }}
                        onClick={() => onOptionClick(option)}
                      >
                        <KindIcon kind={item.entry.kind} />
                        <span className="search-option-text">
                          <span className="search-option-title"><Highlight text={item.entry.title} ranges={item.ranges} /></span>
                          <span className="search-option-sub">{item.entry.subtitle}</span>
                        </span>
                        <span className="search-option-hint" aria-hidden="true">{hintFor(option)} ↵</span>
                      </div>
                    );
                  })}
                  {filter === "all" && g.total > g.items.length && (() => {
                    index += 1;
                    const option = options[index];
                    const i = index;
                    return (
                      <div
                        id={`search-opt-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        className="search-more"
                        onMouseMove={() => { if (activeKey !== option.key) setActiveKey(option.key); }}
                        onClick={() => choose(option)}
                      >
                        Show all {g.total} {g.label.toLowerCase()}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
            {typed && options.length === 0 && (
              <div className="search-empty">No matches for “{deferredQuery.trim()}”.</div>
            )}
            {loading.length > 0 && (
              <div className="search-status" role="status">Loading {listText(loading)}…</div>
            )}
            {failed.length > 0 && (
              <div className="search-status">Couldn’t load {listText(failed)}. Close and reopen search to try again.</div>
            )}
          </div>

          <aside className="search-preview" aria-label="Details">
            {currentEntry ? (
              <SearchCard
                entry={currentEntry}
                ctx={ctx}
                copied={copied?.id === currentEntry.id ? copied : null}
                onCopy={() => copy(currentEntry)}
                onOpen={() => openEntry(currentEntry)}
                onBack={() => { setDetail(false); inputRef.current?.focus(); }}
              />
            ) : (
              <div className="search-card-note">Pick a result to see its details.</div>
            )}
          </aside>
        </div>

        <div className="search-footer" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> Move</span>
          <span><kbd>↵</kbd> {enterLabel}</span>
          <span><kbd>Esc</kbd> Close</span>
          <span className="search-world">{WORLD_LABEL[profile] || profile} data</span>
        </div>
        <div className="sr-only" role="status" aria-live="polite">
          {copied ? (copied.ok ? "Console command copied." : "Copy failed.") : ""}
        </div>
      </div>
    </div>,
    document.body
  );
}
