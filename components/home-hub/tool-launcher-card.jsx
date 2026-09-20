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
      className="mw-master-window p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:border-[#d4b06a] group"
      style={{
        background: "var(--surface, #181510)",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45), inset 0 0 12px rgba(0, 0, 0, 0.75)",
      }}
    >
      <div>
        {/* Header with Title & Optional Badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#d4b06a] tracking-wide group-hover:text-[#ffd700] transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[#a09070] font-serif uppercase tracking-wider mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {badge && (
            <span className="text-[10px] uppercase font-serif font-bold tracking-widest px-2 py-0.5 bg-[#2f2214] border border-[#8c7853] text-[#d4b06a] rounded-sm shrink-0">
              {badge}
            </span>
          )}
        </div>

        {/* Etched Divider */}
        <div className="w-full h-0.5 bg-[#2a2215] border-b border-[#3d311e] my-2.5" />

        {/* Tool Description */}
        <p className="text-xs sm:text-sm text-[#f3e6c8] leading-relaxed mb-4 font-serif">
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
                className="text-[11px] px-2 py-0.5 bg-[#231c12] border border-[#4a3b25] text-[#c9b88e] rounded-sm font-serif"
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
          className="mw-btn w-full py-2 px-3 text-xs sm:text-sm font-serif font-bold text-[#d4b06a] hover:text-[#fff] text-center tracking-wide flex items-center justify-center gap-2"
        >
          <span>{actionLabel}</span>
        </button>
      </div>
    </article>
  );
}
