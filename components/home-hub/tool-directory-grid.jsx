"use client";
import ToolLauncherCard from "./tool-launcher-card";

export const TOOLS = [
  {
    id: "builder",
    title: "Build Optimizer",
    subtitle: "Character Planner & Gear Advisor",
    description:
      "Complete 27-skill character studio. Configure race, class, birthsign, and starting powers. Optimize early and endgame equipment kits checked against game data.",
    tags: ["27 Skills", "Gear Advisor", "Tamriel Rebuilt", "ARCE"],
    actionLabel: "Launch Build Optimizer →",
  },
  {
    id: "leveler",
    title: "Level Simulator",
    subtitle: "Progression & Health Optimizer",
    description:
      "Simulate progression to theoretical level cap. Solve level-by-level Miscellaneous skill training for guaranteed 5x multipliers and visualize non-retroactive Health growth curves.",
    tags: ["5x Multipliers", "Health Projection", "Trainer Costs", "Bitter Cup"],
    actionLabel: "Launch Level Simulator →",
    badge: "POPULAR",
  },
  {
    id: "vault",
    title: "Cloud Character Vault",
    subtitle: "Dossier Storage & Save Ingestion",
    description:
      "Cross-device character cloud storage, OpenMW binary save file (.omwsave) ingestion, ultra-compact SLT1 binary codec, and tiered quotas (5 Free / 25 Paid).",
    tags: ["OpenMW Ingestion", "Cloud Sync", "SLT1 Codec", "D1 Edge Storage"],
    actionLabel: "Open Character Vault →",
    badge: "NEW",
  },
  {
    id: "challenge",
    title: "Challenge Runs",
    subtitle: "Randomized Playthrough Generator",
    description:
      "Roll hand-curated restrictions, difficulty vows, and major objectives with card locking, deterministic seed codes, and 1-click Build Optimizer export.",
    tags: ["Hand-Curated", "Seed Engine", "Difficulty Bands", "Card Locking"],
    actionLabel: "Generate Challenge Run →",
  },
  {
    id: "enchanting",
    title: "Enchanting Calculator",
    subtitle: "Item Capacity & Barter Rates",
    description:
      "Calculate item enchant capacity, soul sizes from Petty to Grand, Constant Effect 400-soul thresholds, success rate %, and ranked barter fees across 36 enchanters.",
    tags: ["OpenMW Formulas", "Constant Effect", "Vendor Barter", "Soul Gems"],
    actionLabel: "Open Enchanting →",
  },
  {
    id: "spellmaking",
    title: "Spellmaking Calculator",
    subtitle: "Magicka Costs & Spellmakers",
    description:
      "Formulate custom spells with multi-effect stacks, school filters, exact OpenMW magicka cost math, casting reliability odds, and ranked pricing for 38 spellmakers.",
    tags: ["Magicka Cost", "Cast Reliability %", "School Filters", "Ranked Vendors"],
    actionLabel: "Open Spellmaking →",
  },
  {
    id: "alchemy",
    title: "Alchemy Calculator",
    subtitle: "Apparatus & Potion Brewing",
    description:
      "Simulate 4-ingredient brewing with named apparatus tiers, live shared-effect matching, recipe clearing controls, and OpenMW duration, magnitude, and gold calculations.",
    tags: ["4 Crucible Slots", "Shared Effects", "Apparatus Scaling", "Quick Clear"],
    actionLabel: "Open Alchemy →",
  },
  {
    id: "travel",
    title: "Travel Optimizer",
    subtitle: "Shortest-Hop Transit Router",
    description:
      "Find the fastest transit routes across Vvardenfell and the TR Mainland using Silt Striders, Boats, Guild Guides, and River Striders. Zero walking, zero propylons.",
    tags: ["Shortest Path (BFS)", "Multi-Modal", "TR Mainland", "Turn-by-Turn"],
    actionLabel: "Find Travel Route →",
  },
];

export default function ToolDirectoryGrid({ onNavigate }) {
  return (
    <section className="mb-8" aria-label="Tools Directory">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#d4b06a] tracking-wide">
          CRPG Tools Directory
        </h2>
        <p className="text-xs text-[#a09070] font-serif">
          Select any planning module to begin your journey across Vvardenfell and the Mainland.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {TOOLS.map((tool) => (
          <ToolLauncherCard
            key={tool.id}
            id={tool.id}
            title={tool.title}
            subtitle={tool.subtitle}
            description={tool.description}
            tags={tool.tags}
            actionLabel={tool.actionLabel}
            badge={tool.badge}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}
