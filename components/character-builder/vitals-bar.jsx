"use client";

const gradients = {
  health: "var(--gradient-health)",
  magicka: "var(--gradient-magicka)",
  fatigue: "var(--gradient-fatigue)"
};

export default function VitalsBar({ label, kind = "health", value = 0, max = 0 }) {
  const displayMax = max || value;
  const gradient = gradients[kind] || gradients.health;

  return (
    <div className="cb-vital flex items-center justify-between gap-3 my-2 font-mono text-sm">
      <span className="vital-label font-serif font-bold text-accent tracking-wider w-20 text-left text-sm">
        {label}
      </span>
      <div
        className={`vital-bar vital-${kind} relative flex-1 h-[28px] sm:h-[30px] flex items-center justify-center overflow-hidden rounded-[1px]`}
        style={{
          border: "2px solid transparent",
          borderImage: "var(--mw-groove) 2 repeat",
          background: "var(--color-surface-2)"
        }}
      >
        <div
          className="absolute inset-0 h-full transition-all duration-300"
          style={{
            background: gradient,
            width: displayMax > 0 ? `${Math.min(100, (value / displayMax) * 100)}%` : "100%"
          }}
        />
        <span
          className="relative z-10 text-white font-bold text-xs sm:text-sm tracking-wider"
          style={{
            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000"
          }}
        >
          {value}/{displayMax}
        </span>
      </div>
    </div>
  );
}
