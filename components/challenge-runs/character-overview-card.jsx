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
    <div className="character-overview-card border border-[#3a2e1d] bg-[#14100a] p-4 text-[#f3e6c8]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#2a2215] gap-2.5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Character Identity
          </span>
          <h3 className="text-lg font-serif font-bold text-[#f3e6c8] leading-tight mt-0.5">
            {isRolled ? (
              <>
                {race} {gender} <span className="text-[#9b8b6a]">·</span> {className} <span className="text-[#9b8b6a]">·</span> {sign}
              </>
            ) : (
              <span className="text-[#7a6b52] italic">Not rolled yet</span>
            )}
          </h3>
        </div>

        {/* Individual slot lock controls */}
        <div className="flex items-center gap-2">
          {/* Race Lock */}
          <button
            type="button"
            className={`px-2 py-1 text-xs border rounded-none font-serif ${
              locks.race ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65]"
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
              locks.cls ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65]"
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
              locks.sign ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65]"
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
              <span className="text-[#e29381] font-bold">Health</span>
              <span className="font-bold">{vitals.health}</span>
            </div>
            <div
              className="h-3 w-full border border-[#4a1d15] overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #a03017 0%, #9e2f17 20%, #671f0f 50%, #45130a 75%, #2f0e07 100%)"
              }}
            />
          </div>

          {/* Magicka Bar */}
          <div className="vitals-group">
            <div className="flex justify-between text-xs font-serif mb-1">
              <span className="text-[#96a7eb] font-bold">Magicka</span>
              <span className="font-bold">{vitals.magicka}</span>
            </div>
            <div
              className="h-3 w-full border border-[#1b2352] overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #2a387f 0%, #29367d 20%, #1b2352 50%, #121636 75%, #0c1025 100%)"
              }}
            />
          </div>

          {/* Fatigue Bar */}
          <div className="vitals-group">
            <div className="flex justify-between text-xs font-serif mb-1">
              <span className="text-[#88d99c] font-bold">Fatigue</span>
              <span className="font-bold">{vitals.fatigue}</span>
            </div>
            <div
              className="h-3 w-full border border-[#004d1f] overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #007a2f 0%, #00772f 20%, #004d1f 50%, #003014 75%, #00240e 100%)"
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Specialization & Favored Attributes note if custom */}
      {isRolled && spec && fav1 && fav2 && (
        <div className="mt-3 pt-2 border-t border-[#231d12] text-xs text-[#a99c83] flex items-center justify-between">
          <span>
            Specialization: <strong className="text-[#d4b06a]">{spec}</strong>
          </span>
          <span>
            Favored: <strong className="text-[#d4b06a]">{fav1}</strong> &amp; <strong className="text-[#d4b06a]">{fav2}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
