"use client";
import { BUILDS } from "../../lib/premade-data.mjs";
import { HOME_TOOLS } from "../../lib/home-data.mjs";

const ICONS = {
  builder: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  leveler: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  challenge: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" /></>,
  travel: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  vault: <path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1 0 10H7z" />,
  alchemy: <path d="M10 3h4 M10.5 3v5L5.5 17a2.5 2.5 0 0 0 2.2 4h8.6a2.5 2.5 0 0 0 2.2-4l-5-9V3 M7.5 14h9" />,
  enchanting: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  spellmaking: <><path d="M5 19 16 8" /><path d="M14 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></>,
  factions: <path d="M6 3h12v12l-6 5-6-5z M6 8h12" />
};

const Icon = ({ view }) => (
  <span className="home-tool-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[view]}</svg>
  </span>
);

const PREMADE_GROUPS = [...new Set(BUILDS.map(b => b.cat))];
// One build from each of the first three groups, as examples.
const PREMADE_EXAMPLES = PREMADE_GROUPS.slice(0, 3).map(group => BUILDS.find(b => b.cat === group));

function HealthSpark({ health }) {
  const w = 280, h = 84, pad = 4;
  const top = Math.max(...health.optimal, ...health.delayed, 1);
  const first = health.levels[0], last = health.levels[health.levels.length - 1];
  const x = lvl => pad + ((lvl - first) / Math.max(1, last - first)) * (w - pad * 2);
  const y = hp => h - pad - (hp / top) * (h - pad * 2);
  const line = series => series.map((hp, i) => `${i ? "L" : "M"}${x(health.levels[i]).toFixed(1)} ${y(hp).toFixed(1)}`).join(" ");
  return (
    <svg className="home-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={line(health.delayed)} style={{ fill: "none", stroke: "var(--color-fg-12)", strokeWidth: 2, strokeDasharray: "4 4" }} vectorEffect="non-scaling-stroke" />
      <path d={line(health.optimal)} style={{ fill: "none", stroke: "var(--color-accent)", strokeWidth: 2.5 }} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Preview({ view, character, health, route, restrictions }) {
  switch (view) {
    case "builder":
      return (
        <div className="home-preview">
          <div className="home-preview-head"><span className="home-num">{BUILDS.length}</span> premade builds to start from</div>
          <ul className="home-tags">
            {PREMADE_GROUPS.slice(0, 8).map(group => <li key={group}>{group}</li>)}
            {PREMADE_GROUPS.length > 8 && <li>+{PREMADE_GROUPS.length - 8} more</li>}
          </ul>
          <ul className="home-premades">
            {PREMADE_EXAMPLES.map(b => <li key={b.name}><span>{b.name}</span><span>{b.race} · {b.sign}</span></li>)}
          </ul>
        </div>
      );
    case "leveler":
      return health ? (
        <div className="home-preview">
          <div className="home-preview-head">
            <span className="home-big">+{health.gain}</span> Health by level {health.level} for {character.name} when Endurance goes first
          </div>
          <HealthSpark health={health} />
          <div className="home-legend">
            <span><i className="home-key home-key--accent" />Endurance first</span>
            <span><i className="home-key home-key--dashed" />Endurance late</span>
          </div>
        </div>
      ) : null;
    case "challenge":
      return restrictions.length ? (
        <div className="home-preview">
          <div className="home-preview-head">Rules you might draw</div>
          <ul className="home-rules">{restrictions.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
      ) : null;
    case "travel":
      return route ? (
        <div className="home-preview">
          <div className="home-preview-head"><span className="home-num">{route.hops}</span> hops from {route.from} to {route.to}</div>
          <ol className="home-route">
            {(route.path.length > 5 ? [...route.path.slice(0, 2), null, ...route.path.slice(-2)] : route.path).map((stop, i) => (
              <li key={i} className={stop ? undefined : "home-route-gap"}>{stop || `${route.path.length - 4} more`}</li>
            ))}
          </ol>
        </div>
      ) : null;
    case "vault":
      return (
        <div className="home-preview">
          <div className="home-drop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4" /><path d="m7 9 5-5 5 5" /><path d="M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" /></svg>
            Import an .omwsave file
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function HomeTools({ character, health, route, restrictions, onNavigate }) {
  return (
    <section className="home-section" aria-labelledby="home-tools-title">
      <div className="home-section-head">
        <span className="home-kicker">The toolbox</span>
        <h2 className="home-h2" id="home-tools-title">Nine tools. One character.</h2>
        <div className="home-sub">
          Your character follows you between tools, so gear, level-ups and potions are worked out for the build you are
          actually playing.
        </div>
      </div>
      <div className="home-tools">
        {HOME_TOOLS.map(tool => (
          <a
            key={tool.view}
            href={"#" + tool.view}
            className={`home-tool home-tool--${tool.view}`}
            onClick={e => { e.preventDefault(); onNavigate(tool.view); }}
          >
            <span className="home-tool-top">
              <Icon view={tool.view} />
              {tool.badge && <span className="home-chip">{tool.badge}</span>}
            </span>
            <span className="home-tool-title">{tool.title}</span>
            <span className="home-tool-desc">{tool.description}</span>
            <Preview view={tool.view} character={character} health={health} route={route} restrictions={restrictions} />
            <span className="home-tool-open">Open {tool.title} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
