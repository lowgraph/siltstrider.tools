"use client";

// Open and closed padlock, drawn in the text colour.
const Padlock = ({ closed }) => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="1.5" />
    <path d={closed ? "M8 11V7a4 4 0 0 1 8 0v4" : "M8 11V7a4 4 0 0 1 7.5-1.9"} />
  </svg>
);

/**
 * CHL-2: the one way to keep a rolled item, next to it. A toggle button: its name stays
 * "Lock <what>" and aria-pressed says whether it is on; a closed padlock and the accent
 * colour show it. Nothing to keep yet (not rolled): disabled.
 */
export default function LockToggle({ locked = false, what, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(locked)}
      disabled={disabled}
      onClick={onToggle}
      title={locked ? `Locked: rolling does not change the ${what}` : `Lock so rolling does not change the ${what}`}
      className={`lock-toggle inline-flex items-center gap-1 min-h-6 whitespace-nowrap px-2 py-0.5 text-xs border rounded-none font-serif disabled:cursor-not-allowed ${
        locked ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
      }`}
    >
      <Padlock closed={Boolean(locked)} />
      <span>Lock<span className="sr-only"> {what}</span></span>
    </button>
  );
}
