"use client";

export default function CharacterOverviewCard({
  race,
  gender,
  className,
  sign,
  spec,
  fav1,
  fav2,
  vitals,
  locks,
  onToggleLock,
  onRollAspect
}) {
  const isRolled = Boolean(race && className && sign);

  return (
    <div className="character-overview-card border border-line-9 bg-surface-3 p-4 text-fg-2">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-line-11 gap-2.5">
        <div>
          <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
            Character Identity
          </span>
          <h3 className="text-lg font-serif font-bold text-fg-2 leading-tight mt-0.5">
            {isRolled ? (
              <>
                {race} {gender} <span className="text-fg-11">·</span> {className} <span className="text-fg-11">·</span> {sign}
              </>
            ) : (
              <span className="text-fg-15 italic">Not rolled yet</span>
            )}
          </h3>
        </div>

        {/* Individual slot lock controls */}
        <div className="flex items-center gap-2">
          {/* Race Lock */}
          <button
            type="button"
            className={`px-2 py-1 text-xs border rounded-none font-serif ${
              locks.race ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
            }`}
            onClick={() => onToggleLock("race")}
            title={locks.race ? "Unlock Race" : "Lock Race"}
          >
            {locks.race ? "Race: Locked" : "Race: Lock"}
          </button>

          {/* Class Lock */}
          <button
            type="button"
            className={`px-2 py-1 text-xs border rounded-none font-serif ${
              locks.cls ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
            }`}
            onClick={() => onToggleLock("cls")}
            title={locks.cls ? "Unlock Class" : "Lock Class"}
          >
            {locks.cls ? "Class: Locked" : "Class: Lock"}
          </button>

          {/* Sign Lock */}
          <button
            type="button"
            className={`px-2 py-1 text-xs border rounded-none font-serif ${
              locks.sign ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
            }`}
            onClick={() => onToggleLock("sign")}
            title={locks.sign ? "Unlock Sign" : "Lock Sign"}
          >
            {locks.sign ? "Sign: Locked" : "Sign: Lock"}
          </button>
        </div>
      </div>

      {/* Vitals & Specs strip */}
      {isRolled && vitals ? (
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Health Bar */}
          <div className="vitals-group">
            <div className="flex justify-between text-xs font-serif mb-1">
              <span className="text-danger-4 font-bold">Health</span>
              <span className="font-bold">{vitals.health}</span>
            </div>
            <div
              className="h-3 w-full border border-danger-line-3 overflow-hidden"
              style={{
                background: "var(--gradient-health)"
              }}
            />
          </div>

          {/* Magicka Bar */}
          <div className="vitals-group">
            <div className="flex justify-between text-xs font-serif mb-1">
              <span className="text-info font-bold">Magicka</span>
              <span className="font-bold">{vitals.magicka}</span>
            </div>
            <div
              className="h-3 w-full border border-info-line-2 overflow-hidden"
              style={{
                background: "var(--gradient-magicka)"
              }}
            />
          </div>

          {/* Fatigue Bar */}
          <div className="vitals-group">
            <div className="flex justify-between text-xs font-serif mb-1">
              <span className="text-success-2 font-bold">Fatigue</span>
              <span className="font-bold">{vitals.fatigue}</span>
            </div>
            <div
              className="h-3 w-full border border-success-line-6 overflow-hidden"
              style={{
                background: "var(--gradient-fatigue)"
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Specialization & Favored Attributes note if custom */}
      {isRolled && spec && fav1 && fav2 && (
        <div className="mt-3 pt-2 border-t border-line-12 text-xs text-fg-9 flex items-center justify-between">
          <span>
            Specialization: <strong className="text-accent">{spec}</strong>
          </span>
          <span>
            Favored: <strong className="text-accent">{fav1}</strong> &amp; <strong className="text-accent">{fav2}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
