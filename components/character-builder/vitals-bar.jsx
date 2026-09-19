"use client";

const gradients = {
  health: "linear-gradient(180deg, #a03017 0%, #9e2f17 20%, #671f0f 50%, #45130a 75%, #2f0e07 100%)",
  magicka: "linear-gradient(180deg, #2a387f 0%, #29367d 20%, #1b2352 50%, #121636 75%, #0c1025 100%)",
  fatigue: "linear-gradient(180deg, #007a2f 0%, #00772f 20%, #004d1f 50%, #003014 75%, #00240e 100%)"
};

export default function VitalsBar({ label, kind = "health", value = 0, max = 0 }) {
  const displayMax = max || value;
  const gradient = gradients[kind] || gradients.health;

  return (
    <div className="cb-vital flex items-center justify-between gap-3 my-2 font-mono text-sm">
      <span className="vital-label font-serif font-bold text-[#d4b06a] tracking-wider w-20 text-left text-sm">
        {label}
      </span>
      <div
        className={`vital-bar vital-${kind} relative flex-1 h-[28px] sm:h-[30px] flex items-center justify-center overflow-hidden rounded-[1px]`}
        style={{
          border: "2px solid transparent",
          borderImage: "var(--mw-groove) 2 repeat",
          background: "#100d08"
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
