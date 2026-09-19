"use client";
import { useMemo } from "react";
import { calculateHealthGrowthCurve } from "../../lib/level-math.mjs";

export default function HealthGrowthChart({ character, targetLevel, catalogs, options = {} }) {
  const curveData = useMemo(() => {
    try {
      return calculateHealthGrowthCurve(character, targetLevel, catalogs, options);
    } catch (e) {
      return null;
    }
  }, [character, targetLevel, catalogs, options]);

  if (!curveData || curveData.levels.length < 2) {
    return null;
  }

  const { levels, optimalHealth, delayedHealth, difference, maxDifference } = curveData;
  const startLevel = levels[0];
  const endLevel = levels[levels.length - 1];
  const finalOptimal = optimalHealth[optimalHealth.length - 1];
  const finalDelayed = delayedHealth[delayedHealth.length - 1];
  const finalDiff = Math.max(0, finalOptimal - finalDelayed);

  // SVG dimensions
  const width = 500;
  const height = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minHp = Math.min(...delayedHealth, ...optimalHealth);
  const maxHp = Math.max(...delayedHealth, ...optimalHealth);
  const hpRange = Math.max(1, maxHp - minHp);

  const getX = (lvl) => padLeft + ((lvl - startLevel) / (endLevel - startLevel || 1)) * chartW;
  const getY = (hp) => padTop + chartH - ((hp - minHp) / hpRange) * chartH;

  // Build SVG paths
  const optimalPath = levels
    .map((lvl, i) => `${i === 0 ? "M" : "L"} ${getX(lvl).toFixed(1)} ${getY(optimalHealth[i]).toFixed(1)}`)
    .join(" ");

  const delayedPath = levels
    .map((lvl, i) => `${i === 0 ? "M" : "L"} ${getX(lvl).toFixed(1)} ${getY(delayedHealth[i]).toFixed(1)}`)
    .join(" ");

  // Area between curves for visual emphasis
  const areaPath = `${optimalPath} ${levels
    .slice()
    .reverse()
    .map((lvl, i) => {
      const idx = levels.length - 1 - i;
      return `L ${getX(lvl).toFixed(1)} ${getY(delayedHealth[idx]).toFixed(1)}`;
    })
    .join(" ")} Z`;

  return (
    <div className="health-growth-chart-wrap space-y-3 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#221c13] pb-2">
        <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold flex items-center gap-2">
          <span>Health Growth Projection</span>
          <span className="text-[10px] font-mono text-[#9e8b6b] normal-case">
            (Level {startLevel} → {endLevel})
          </span>
        </h4>
        <div className="text-xs font-mono font-bold text-[#d4b06a] flex items-center gap-1">
          <span>+{finalDiff} HP Advantage</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-hidden bg-[#0c0a06] border border-[#231b11] p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[220px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Health growth comparison between optimal and delayed Endurance leveling"
        >
          <defs>
            <linearGradient id="hpAdvantageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4b06a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d4b06a" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={width - padRight}
            y2={padTop}
            stroke="#261e14"
            strokeDasharray="2,2"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH / 2}
            x2={width - padRight}
            y2={padTop + chartH / 2}
            stroke="#261e14"
            strokeDasharray="2,2"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={width - padRight}
            y2={padTop + chartH}
            stroke="#3a2e1e"
          />

          {/* Y Axis Labels */}
          <text
            x={padLeft - 8}
            y={padTop + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9e8b6b"
            fontFamily="monospace"
          >
            {maxHp}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartH / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9e8b6b"
            fontFamily="monospace"
          >
            {Math.round((maxHp + minHp) / 2)}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartH + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9e8b6b"
            fontFamily="monospace"
          >
            {minHp}
          </text>

          {/* X Axis Labels */}
          <text
            x={padLeft}
            y={height - 8}
            textAnchor="start"
            fontSize="10"
            fill="#9e8b6b"
            fontFamily="monospace"
          >
            Lvl {startLevel}
          </text>
          <text
            x={width - padRight}
            y={height - 8}
            textAnchor="end"
            fontSize="10"
            fill="#9e8b6b"
            fontFamily="monospace"
          >
            Lvl {endLevel}
          </text>

          {/* Area between paths */}
          <path d={areaPath} fill="url(#hpAdvantageGrad)" />

          {/* Delayed Path (Muted Brass) */}
          <path
            d={delayedPath}
            fill="none"
            stroke="#8c7853"
            strokeWidth="2"
            strokeDasharray="4,3"
            opacity="0.85"
          />

          {/* Optimal Path (Gold) */}
          <path
            d={optimalPath}
            fill="none"
            stroke="#d4b06a"
            strokeWidth="2.5"
          />

          {/* Endpoint markers */}
          <circle
            cx={getX(endLevel)}
            cy={getY(finalOptimal)}
            r="4"
            fill="#d4b06a"
            stroke="#0c0a06"
            strokeWidth="1.5"
          />
          <circle
            cx={getX(endLevel)}
            cy={getY(finalDelayed)}
            r="4"
            fill="#8c7853"
            stroke="#0c0a06"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#d4b06a] inline-block rounded-none"></span>
            <span className="text-[#f3e6c8] font-serif font-semibold">
              Rushed Endurance: <strong className="font-mono text-[#d4b06a]">{finalOptimal} HP</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#8c7853] inline-block border-t border-dashed border-[#8c7853]"></span>
            <span className="text-[#9e8b6b] font-serif font-semibold">
              Delayed Endurance: <strong className="font-mono text-[#9e8b6b]">{finalDelayed} HP</strong>
            </span>
          </div>
        </div>
        <div className="text-[11px] text-[#9e8b6b] font-sans">
          Permanent HP lost if Endurance is delayed: <strong className="font-mono text-[#f3e6c8]">-{finalDiff} HP</strong>
        </div>
      </div>
    </div>
  );
}
