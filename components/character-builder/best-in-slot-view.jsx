"use client";
import { useState, Fragment } from "react";
import { resolveBestInSlotPicks, weaponScoreDetails } from "../../lib/best-in-slot.mjs";
import { enchantmentNote, sourceLabel } from "../../lib/gear-rows.mjs";

function formatQuestGrant(grant) {
  if (typeof grant !== "string") return String(grant);
  try {
    if (grant.startsWith("[") && grant.endsWith("]")) {
      const parsed = JSON.parse(grant);
      if (Array.isArray(parsed) && parsed[0]) {
        return parsed[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  } catch {}
  return grant.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSource(source) {
  if (!source) return "Unknown source";
  if (source.questGrants && source.questGrants.length > 0) {
    const names = source.questGrants.map(formatQuestGrant).filter(Boolean);
    const unique = [...new Set(names)];
    return `Quest: ${unique.slice(0, 2).join(", ")}${unique.length > 2 ? ` +${unique.length - 2} more` : ""}`;
  }
  if (source.kind === "placed") {
    const lvl = source.easiestLevel != null ? ` (Actor lvl ${source.easiestLevel})` : "";
    const locs = source.routes > 1 ? ` · ${source.routes} places` : "";
    return `Placed in world${lvl}${locs}`;
  }
  if (source.kind === "unconfirmed") {
    return "Bound item or special spawn";
  }
  return "Placed in world";
}

function WeaponScoreExplanation({ entry, build, model }) {
  const detail = weaponScoreDetails(entry.item, build, model, entry.pick?.score);
  if (!detail) return null;
  return (
    <p className="weapon-score-explanation text-xs text-fg-8 leading-relaxed">
      {detail.skill} — {detail.tier} skill. Damage score {detail.damageScore}; bonus score {detail.bonusScore}.
    </p>
  );
}

function itemSource(item) {
  return item.acquisitionPick
    ? [...Object.values(sourceLabel(item.acquisitionPick)), item.acquisitionPick.theftRequired ? 'Theft required' : ''].filter(Boolean).join(' · ')
    : formatSource(item.source);
}

function BisPickRow({ slotLabel, topPick, alternatives = [], weaponBuild, model }) {
  const [showAlts, setShowAlts] = useState(false);
  const item = topPick.item || {};
  const pick = topPick.pick || {};

  const stats = [];
  if (item.armorRating != null) {
    stats.push(`AR ${item.armorRating} (${item.armorClass || "Armor"})`);
  }
  if (item.damage != null) {
    const wLabel = (item.weaponSkill || "weapon").replace(/_/g, " ");
    stats.push(`Dmg ${item.damage} (${wLabel})`);
  }

  const effectsSummary = item.acquisitionPick ? enchantmentNote(item.acquisitionPick) : (item.effects || [])
    .map((e) => {
      const target = e.skill || e.attribute;
      const tStr = target ? ` (${target.replace(/_/g, " ")})` : "";
      return `${e.name}${tStr} ${e.magnitude}`;
    })
    .join(", ");

  return (
    <>
      <tr className="border-b border-line-12 hover:bg-surface-9 transition-colors">
        <td className="py-2.5 px-3 font-semibold text-accent align-top whitespace-nowrap">
          {slotLabel}
        </td>

        <td className="py-2.5 px-3 align-top space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-fg-2 text-base">{item.name || pick.item}</span>
            {pick.score != null && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-surface-17 border border-line-7 text-accent font-mono">
                Score: {pick.score}
              </span>
            )}
            {stats.length > 0 && (
              <span className="text-xs text-fg-11 font-mono">[{stats.join(" · ")}]</span>
            )}
          </div>

          {weaponBuild && <WeaponScoreExplanation entry={topPick} build={weaponBuild} model={model} />}

          {/* Constant effects description */}
          {effectsSummary && (
            <p className="text-xs text-fg-6 leading-relaxed">{effectsSummary}</p>
          )}

          {/* Ranking rationale chips */}
          {pick.reasons && pick.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pick.reasons.map(([lbl, val], idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded bg-surface-5 border border-line-9 text-fg-7"
                >
                  <span className="text-fg-10">{lbl}</span>
                  <span className="text-accent font-mono">+{val}</span>
                </span>
              ))}
            </div>
          )}

          {/* Drawback warnings */}
          {pick.warnings && pick.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {pick.warnings.map((w, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-danger-surface-2 border border-danger-line-2 text-danger-2"
                >
                  <span>⚠</span>
                  <span>{w}</span>
                </span>
              ))}
            </div>
          )}

          {/* Alternatives toggle */}
          {alternatives.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                className="text-xs text-fg-10 hover:text-accent underline cursor-pointer bg-transparent border-0 p-0"
                onClick={() => setShowAlts(!showAlts)}
              >
                {showAlts ? "Hide runner-up picks ▲" : `View ${alternatives.length} runner-up pick${alternatives.length > 1 ? "s" : ""} ▼`}
              </button>
            </div>
          )}
        </td>

        <td data-label="Acquisition & Location" className="py-2.5 px-3 align-top text-xs text-fg-8">
          <span className="font-serif">{itemSource(item)}</span>
          {item.source?.easiestLevel > 30 && (
            <div className="mt-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-danger-surface-3 border border-danger-line-2 text-danger-2">
                Formidable Level {item.source.easiestLevel}
              </span>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded alternative picks */}
      {showAlts &&
        alternatives.map((alt, aIdx) => {
          const aItem = alt.item || {};
          const aPick = alt.pick || {};
          return (
            <tr
              key={aIdx}
              className="bg-surface-3 text-xs text-fg-10 border-b border-line-12"
            >
              <td className="py-1.5 px-3 italic pl-6 text-fg-14">Runner-up #{aIdx + 2}</td>
              <td className="py-1.5 px-3 space-y-0.5">
                <span className="font-semibold text-fg-6">{aItem.name || aPick.item}</span>
                {aPick.score != null && (
                  <span className="ml-2 font-mono text-fg-10">Score: {aPick.score}</span>
                )}
                {weaponBuild && <WeaponScoreExplanation entry={alt} build={weaponBuild} model={model} />}
              </td>
              <td data-label="Acquisition & Location" className="py-1.5 px-3">{itemSource(aItem)}</td>
            </tr>
          );
        })}
    </>
  );
}

export function BestInSlotView({
  featureData,
  build,
  gearRows = [],
  beast = false,
  weaponSetup = null,
  allowFormidableSources = false
}) {
  const resolved = resolveBestInSlotPicks(featureData, build, {
    gearRows,
    allowFormidableSources,
    weaponSetup,
    beast
  });

  if (!resolved || !resolved.groups || resolved.groups.length === 0) {
    return (
      <details open className="best-in-slot-recommendations mt-6">
        <summary className="font-serif text-lg font-bold text-fg-2 cursor-pointer">
          Optimized endgame kit
        </summary>
        <p className="mt-3 text-sm text-fg-10 italic">
          No gear recommendations available for this build configuration.
        </p>
      </details>
    );
  }

  return (
    <details open className="best-in-slot-recommendations mt-6">
      <summary className="font-serif text-lg font-bold text-fg-2 cursor-pointer">
        Optimized endgame kit
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-sm text-fg-8 leading-relaxed">
          Endgame equipment ranked for this character&apos;s current attributes and skills.
          Drawbacks that ruin a character disqualify an item; acceptable drawbacks display warnings
          and recommended mitigations.
        </p>

        {beast && (
          <p className="beast-equipping-note text-xs text-accent-3 italic">
            Equipping note: Closed helmets and boots are excluded for beast races. Compatible open helmets,
            such as Helm of Oreyn Bearclaw, remain eligible; the item’s body parts determine whether it fits.
          </p>
        )}

        {allowFormidableSources && (
          <p className="text-xs text-accent-2 italic">
            Endgame gear early is enabled: includes formidable high-level targets (such as King Helseth&apos;s Royal Signet Ring).
          </p>
        )}

        {resolved.groups.map((group) => (
          <div key={group.label} className="mt-4 space-y-2">
            <h4 className="font-serif text-base font-bold text-accent border-b border-line-11 pb-1">
              {group.label}
            </h4>

            {group.label === 'Optimized Weapons' && (
              <p className="weapon-score-help text-xs text-fg-8 leading-relaxed">
                Weapons are ranked for your skill choices, damage and constant bonuses.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="gear-table w-full text-left border-collapse border border-line-12 bg-surface-3" aria-label={`Endgame equipment: ${group.label}`}>
                <thead>
                  <tr className="bg-surface-6 border-b border-line-11 text-xs font-serif text-accent">
                    <th scope="col" className="py-2 px-3 w-36">Slot</th>
                    <th scope="col" className="py-2 px-3">Recommended Item</th>
                    <th scope="col" className="py-2 px-3 w-64">Acquisition &amp; Location</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => {
                    const topPick = row.picks[0];
                    if (!topPick) return null;
                    const alternatives = row.picks.slice(1);
                    return (
                      <BisPickRow
                        key={row.slotKey}
                        slotLabel={row.slotLabel}
                        topPick={topPick}
                        alternatives={alternatives}
                        weaponBuild={row.slotKey === 'weapon' ? build : null}
                        model={featureData.metadata?.BestInSlot?.model}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
