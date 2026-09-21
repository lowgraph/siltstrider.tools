"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateHealthGrowthCurve } from "../../lib/level-math.mjs";
import { niceTicks, levelTicks } from "../../lib/chart-scale.mjs";

const TEXT = 11; // px: the chart sizes itself to its column, so text keeps this size
const PAD = { top: 14, right: 46, bottom: 24, left: 38 };
const halo = { paintOrder: "stroke", stroke: "var(--color-surface-1)", strokeWidth: 3, strokeLinejoin: "round" };

export default function HealthGrowthChart({ character, targetLevel, catalogs, options = {} }) {
  const curveData = useMemo(() => {
    try {
      return calculateHealthGrowthCurve(character, targetLevel, catalogs, options);
    } catch (e) {
      return null;
    }
  }, [character, targetLevel, catalogs, options]);

  const wrap = useRef(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [curveData]);

  if (!curveData || curveData.levels.length < 2) {
    return null;
  }

  const { levels, optimalHealth, delayedHealth, enduranceMaxLevel } = curveData;
  const startLevel = levels[0];
  const endLevel = levels[levels.length - 1];
  const finalOptimal = optimalHealth[optimalHealth.length - 1];
  const finalDelayed = delayedHealth[delayedHealth.length - 1];
  const finalDiff = Math.max(0, finalOptimal - finalDelayed);

  const height = width < 480 ? 200 : 240;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const yTicks = niceTicks(Math.max(...optimalHealth, ...delayedHealth));
  const yMax = yTicks[yTicks.length - 1];
  const xTicks = levelTicks(startLevel, endLevel, width < 480 ? 5 : 8);

  const getX = (lvl) => PAD.left + ((lvl - startLevel) / (endLevel - startLevel || 1)) * plotW;
  const getY = (hp) => PAD.top + plotH - (hp / yMax) * plotH;

  const pathOf = (values) => levels.map((lvl, i) => `${i === 0 ? "M" : "L"} ${getX(lvl).toFixed(1)} ${getY(values[i]).toFixed(1)}`).join(" ");
  const optimalPath = pathOf(optimalHealth);
  const delayedPath = pathOf(delayedHealth);
  const areaPath = `${optimalPath} ${levels
    .slice()
    .reverse()
    .map((lvl, i) => `L ${getX(lvl).toFixed(1)} ${getY(delayedHealth[levels.length - 1 - i]).toFixed(1)}`)
    .join(" ")} Z`;

  // End labels: keep them at least one line apart when the curves end close together.
  let yOpt = getY(finalOptimal) + TEXT / 3;
  let yDel = getY(finalDelayed) + TEXT / 3;
  if (yDel - yOpt < TEXT + 2) {
    const mid = (yOpt + yDel) / 2;
    yOpt = mid - (TEXT + 2) / 2;
    yDel = mid + (TEXT + 2) / 2;
  }

  const showMarker = enduranceMaxLevel != null && enduranceMaxLevel > startLevel && enduranceMaxLevel < endLevel;
  const markerX = showMarker ? getX(enduranceMaxLevel) : 0;
  const markerLeft = markerX + 4 + 130 > width - PAD.right;

  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * width;
    const lvl = Math.round(startLevel + ((x - PAD.left) / plotW) * (endLevel - startLevel));
    const i = levels.indexOf(Math.min(endLevel, Math.max(startLevel, lvl)));
    setHover(i >= 0 ? i : null);
  };
  const h = hover != null && hover < levels.length ? hover : null;
  const hx = h != null ? getX(levels[h]) : 0;
  const readout = h != null ? `Lv ${levels[h]}: ${optimalHealth[h]} vs ${delayedHealth[h]} HP (+${Math.max(0, optimalHealth[h] - delayedHealth[h])})` : "";
  const readoutW = readout.length * TEXT * 0.62 + 12;
  const readoutX = Math.min(Math.max(hx - readoutW / 2, PAD.left), width - PAD.right - readoutW);

  return (
    <div className="health-growth-chart-wrap space-y-3 bg-surface-2 p-4 border border-line-11 mw-groove-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-12 pb-2">
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold flex items-center gap-2">
          <span>Health Growth Projection</span>
          <span className="text-[10px] font-mono text-fg-11 normal-case">
            (Level {startLevel} → {endLevel})
          </span>
        </h4>
        <div className="text-xs font-mono font-bold text-accent flex items-center gap-1">
          <span>+{finalDiff} HP Advantage</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div ref={wrap} className="w-full overflow-hidden bg-surface-1 border border-line-12">
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label={`Health by level, ${startLevel} to ${endLevel}: ${finalOptimal} with Endurance rushed, ${finalDelayed} with Endurance delayed, a difference of ${finalDiff}.`}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setHover(null)}
          style={{ touchAction: "pan-y" }}
        >
          <defs>
            <linearGradient id="hpAdvantageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--color-accent)" }} stopOpacity="0.25" />
              <stop offset="100%" style={{ stopColor: "var(--color-accent)" }} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Health gridlines */}
          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line
                x1={PAD.left}
                y1={getY(v)}
                x2={width - PAD.right}
                y2={getY(v)}
                style={{ stroke: v === 0 ? "var(--color-line-9)" : "var(--color-line-12)" }}
                strokeDasharray={v === 0 ? undefined : "2,3"}
              />
              <text x={PAD.left - 6} y={getY(v) + TEXT / 3} textAnchor="end" fontSize={TEXT} fontFamily="monospace" style={{ fill: "var(--color-fg-11)" }}>
                {v}
              </text>
            </g>
          ))}

          {/* Level ticks */}
          {xTicks.map((lvl) => (
            <g key={`x${lvl}`}>
              <line x1={getX(lvl)} y1={PAD.top + plotH} x2={getX(lvl)} y2={PAD.top + plotH + 4} style={{ stroke: "var(--color-line-9)" }} />
              <text x={getX(lvl)} y={height - 8} textAnchor="middle" fontSize={TEXT} fontFamily="monospace" style={{ fill: "var(--color-fg-11)" }}>
                {lvl === startLevel ? `Lv ${lvl}` : lvl}
              </text>
            </g>
          ))}

          {/* Where the rushed path reaches Endurance 100 */}
          {showMarker && (
            <g>
              <line x1={markerX} y1={PAD.top} x2={markerX} y2={PAD.top + plotH} strokeDasharray="3,3" style={{ stroke: "var(--color-line-7)" }} />
              <text
                x={markerLeft ? markerX - 4 : markerX + 4}
                y={PAD.top + TEXT}
                fontSize={TEXT}
                textAnchor={markerLeft ? "end" : "start"}
                className="font-serif"
                style={{ fill: "var(--color-fg-9)", ...halo }}
              >
                Endurance 100 at Lv {enduranceMaxLevel}
              </text>
            </g>
          )}

          {/* Area between paths */}
          <path d={areaPath} fill="url(#hpAdvantageGrad)" />

          {/* Delayed Path (Muted Brass) */}
          <path d={delayedPath} fill="none" style={{ stroke: "var(--color-line-1)" }} strokeWidth="2" strokeDasharray="4,3" opacity="0.85" />

          {/* Optimal Path (Gold) */}
          <path d={optimalPath} fill="none" style={{ stroke: "var(--color-accent)" }} strokeWidth="2.5" strokeLinejoin="round" />

          {/* Endpoint markers and values */}
          <circle cx={getX(endLevel)} cy={getY(finalOptimal)} r="4" style={{ fill: "var(--color-accent)", stroke: "var(--color-surface-1)" }} strokeWidth="1.5" />
          <circle cx={getX(endLevel)} cy={getY(finalDelayed)} r="4" style={{ fill: "var(--color-line-1)", stroke: "var(--color-surface-1)" }} strokeWidth="1.5" />
          <text x={getX(endLevel) + 8} y={yOpt} fontSize={TEXT} fontFamily="monospace" fontWeight="700" style={{ fill: "var(--color-accent)" }}>
            {finalOptimal}
          </text>
          <text x={getX(endLevel) + 8} y={yDel} fontSize={TEXT} fontFamily="monospace" style={{ fill: "var(--color-fg-11)" }}>
            {finalDelayed}
          </text>

          {/* Hover / tap readout */}
          {h != null && (
            <g pointerEvents="none">
              <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + plotH} style={{ stroke: "var(--color-fg-13)" }} />
              <circle cx={hx} cy={getY(optimalHealth[h])} r="3.5" style={{ fill: "var(--color-accent)" }} />
              <circle cx={hx} cy={getY(delayedHealth[h])} r="3" style={{ fill: "var(--color-line-1)" }} />
              <rect x={readoutX} y={PAD.top + plotH - TEXT - 14} width={readoutW} height={TEXT + 10} style={{ fill: "var(--color-surface-4)", stroke: "var(--color-line-7)" }} />
              <text x={readoutX + 6} y={PAD.top + plotH - 10} fontSize={TEXT} fontFamily="monospace" style={{ fill: "var(--color-fg-2)" }}>
                {readout}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Values for screen readers */}
      <table className="sr-only">
        <caption>Health by level</caption>
        <thead>
          <tr><th scope="col">Level</th><th scope="col">Endurance rushed</th><th scope="col">Endurance delayed</th></tr>
        </thead>
        <tbody>
          {xTicks.map((lvl) => {
            const i = levels.indexOf(lvl);
            return i < 0 ? null : (
              <tr key={lvl}><th scope="row">{lvl}</th><td>{optimalHealth[i]}</td><td>{delayedHealth[i]}</td></tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5" title="Endurance raised first, with 5x multipliers, until it reaches 100">
            <span className="w-3 h-1 bg-accent inline-block rounded-none"></span>
            <span className="text-fg-2 font-serif font-semibold">
              Rushed Endurance: <strong className="font-mono text-accent">{finalOptimal} HP</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Endurance left flat until level 20, then raised by 2 a level">
            <span className="w-3 h-1 bg-surface-24 inline-block border-t border-dashed border-line-1"></span>
            <span className="text-fg-11 font-serif font-semibold">
              Delayed Endurance: <strong className="font-mono text-fg-11">{finalDelayed} HP</strong>
            </span>
          </div>
        </div>
        <div className="text-[11px] text-fg-11 font-sans">
          Permanent HP lost if Endurance is delayed: <strong className="font-mono text-fg-2">-{finalDiff} HP</strong>
        </div>
      </div>
      <div className="text-[11px] text-fg-13 font-sans">
        Delayed means Endurance stays flat until level 20, then rises by 2 a level. Health gained at a level-up never updates later.
      </div>
    </div>
  );
}
