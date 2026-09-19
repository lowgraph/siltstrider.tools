"use client";
import CharacterOverviewCard from "./character-overview-card";
import MajorObjectivePlaque from "./major-objective-plaque";
import RestrictionsTablet from "./restrictions-tablet";
import MinorObjectivesChecklist from "./minor-objectives-checklist";

export default function RunSummarySheet({
  run,
  locks,
  onToggleLock,
  onRollAspect,
  onSendToOptimizer,
  onCopySummary,
  onCopyPermalink,
  copiedSummary,
  copiedPermalink
}) {
  return (
    <div className="run-summary-sheet border border-[#4a3a22] bg-[#17120a] p-5 text-[#f3e6c8] space-y-5 shadow-2xl relative">
      {/* Title & Sheet Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3a2e1d] pb-3 gap-2">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#9b8b6a] font-serif">
            Character Dossier
          </span>
          <h2 className="text-xl font-serif font-bold text-[#f3e6c8]">
            Run Summary Sheet
          </h2>
        </div>

        {run?.seed && (
          <div className="sm:text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#8e7e65] block font-serif">
              Seed Active
            </span>
            <span className="text-xs font-mono font-bold text-[#d4b06a] break-all">
              {run.seed}
            </span>
          </div>
        )}
      </div>

      {/* 1. Character Identity & Vitals */}
      <CharacterOverviewCard
        race={run?.race}
        gender={run?.gender}
        className={run?.cls}
        sign={run?.sign}
        spec={run?.spec}
        fav1={run?.fav1}
        fav2={run?.fav2}
        vitals={run?.vitals}
        locks={locks}
        onToggleLock={onToggleLock}
        onRollAspect={onRollAspect}
      />

      {/* 2. Major Objective Plaque */}
      <MajorObjectivePlaque
        major={run?.major}
        isLocked={locks.major}
        onToggleLock={() => onToggleLock("major")}
        onRollMajor={() => onRollAspect("major")}
      />

      {/* 3. Active Restrictions Tablet */}
      <RestrictionsTablet
        restrictions={run?.rests || []}
        restNote={run?.restNote || ""}
        isLocked={locks.rest}
        onToggleLock={() => onToggleLock("rest")}
        onRollRestrictions={() => onRollAspect("rest")}
      />

      {/* 4. Minor Objectives Checklist */}
      <MinorObjectivesChecklist
        objectives={run?.minors || []}
        isLocked={locks.obj}
        onToggleLock={() => onToggleLock("obj")}
        onRollObjectives={() => onRollAspect("obj")}
      />

      {/* 5. Bottom Action Bar */}
      <div className="pt-3 border-t border-[#3a2e1d] space-y-3">
        <button
          type="button"
          className="w-full mw-btn py-3 px-4 font-serif text-sm font-bold tracking-wide uppercase text-[#f8ecce] shadow-md flex items-center justify-center gap-2 border border-[#d4b06a]"
          onClick={onSendToOptimizer}
          id="react-btn-to-optimizer"
          title="Transfer this rolled character into the Build Optimizer"
        >
          <span className="text-base">⚔️</span>
          <span>Send to Build Optimizer</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold text-[#c2b291] flex items-center justify-center gap-1.5"
            onClick={onCopySummary}
            title="Copy run summary in markdown format"
          >
            <span>{copiedSummary ? "✓ Copied!" : "📋 Copy Summary"}</span>
          </button>

          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold text-[#c2b291] flex items-center justify-center gap-1.5"
            onClick={onCopyPermalink}
            title="Copy shareable URL link for this run"
          >
            <span>{copiedPermalink ? "✓ Copied!" : "🔗 Copy Permalink"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
