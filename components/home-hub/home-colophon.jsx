"use client";
import { HOME_TOOLS } from "../../lib/home-data.mjs";

const COLUMNS = [
  { title: "Planners", links: HOME_TOOLS.filter(t => t.group === "Planners") },
  { title: "Calculators", links: HOME_TOOLS.filter(t => t.group === "Calculators") },
  { title: "More", links: [...HOME_TOOLS.filter(t => t.group === "Extras"), { view: "about", title: "About & credits" }, { view: "changelog", title: "Changelog" }] }
];

export default function HomeColophon({ onNavigate }) {
  return (
    <section className="home-colophon" aria-label="Site links and credits">
      <div className="home-colophon-brand">
        <span className="home-colophon-name">Silt Strider</span>
        <div className="home-sub">A free, unofficial toolbox for The Elder Scrolls III: Morrowind.</div>
        <div className="home-support">
          <a href="https://ko-fi.com/tmarcalferreira" target="_blank" rel="noopener noreferrer">Support on Ko-fi</a>
          <a href="https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6" target="_blank" rel="noopener noreferrer">PayPal</a>
        </div>
      </div>
      {COLUMNS.map(column => (
        <nav className="home-colophon-column" key={column.title} aria-label={column.title}>
          <span className="home-kicker">{column.title}</span>
          {column.links.map(link => (
            <a key={link.view} href={"#" + link.view} onClick={e => { e.preventDefault(); onNavigate(link.view); }}>{link.title}</a>
          ))}
        </nav>
      ))}
      <div className="home-colophon-note">
        Game data read straight from Morrowind.esm, Tribunal.esm, Bloodmoon.esm, Tamriel_Data and TR_Mainland (26.08 Poison
        Song). Typeface: Pelagiad by Isak Larborn.
      </div>
    </section>
  );
}
