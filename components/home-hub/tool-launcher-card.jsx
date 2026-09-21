"use client";

export default function ToolLauncherCard({
  id,
  title,
  subtitle,
  description,
  tags = [],
  actionLabel = "Launch Tool →",
  badge = null,
  onNavigate,
}) {
  const handleLaunch = () => {
    if (onNavigate) {
      onNavigate(id);
    } else if (typeof window !== "undefined" && window.siltShell?.navigate) {
      window.siltShell.navigate(id);
    }
  };

  return (
    <article
      className="mw-master-window p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:border-accent group"
      style={{
        background: "var(--color-surface-7)",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45), inset 0 0 12px rgba(0, 0, 0, 0.75)",
      }}
    >
      <div>
        {/* Header with Title & Optional Badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-accent tracking-wide group-hover:text-accent-1 transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-fg-11 font-serif uppercase tracking-wider mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {badge && (
            <span className="text-[10px] uppercase font-serif font-bold tracking-widest px-2 py-0.5 bg-surface-19 border border-line-1 text-accent rounded-sm shrink-0">
              {badge}
            </span>
          )}
        </div>

        {/* Etched Divider */}
        <div className="w-full h-0.5 bg-surface-17 border-b border-line-9 my-2.5" />

        {/* Tool Description */}
        <p className="text-xs sm:text-sm text-fg-2 leading-relaxed mb-4 font-serif">
          {description}
        </p>
      </div>

      <div>
        {/* Feature Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Tool features">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 bg-surface-14 border border-line-7 text-fg-6 rounded-sm font-serif"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleLaunch}
          className="mw-btn w-full py-2 px-3 text-xs sm:text-sm font-serif font-bold text-accent hover:text-fg-1 text-center tracking-wide flex items-center justify-center gap-2"
        >
          <span>{actionLabel}</span>
        </button>
      </div>
    </article>
  );
}
