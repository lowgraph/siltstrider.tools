"use client";
import { useChallengeRun } from "../challenge-run-context";

const same = (a = [], b = []) => a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Shown in the Build Optimizer while it holds a character sent from a challenge run:
 * sends the build, with any changes made here, back into that run. The objectives and
 * restrictions stay as they were.
 */
export default function ChallengeHandoff({ build, sheet, onNavigate }) {
  const { run, setRun } = useChallengeRun();
  if (!run?.sentToBuilder) return null;

  const sendBack = () => {
    setRun((prev) => {
      const identity = {
        race: build.race,
        gender: build.gender,
        cls: build.className || "Custom",
        sign: build.sign,
        spec: build.spec,
        fav1: build.fav1,
        fav2: build.fav2,
        maj: [...(build.maj || [])],
        min: [...(build.min || [])]
      };
      const unchanged = ["race", "gender", "cls", "sign", "spec", "fav1", "fav2"].every((k) => prev[k] === identity[k]) &&
        same(prev.maj, identity.maj) && same(prev.min, identity.min);
      const vitals = sheet && Number.isFinite(sheet.health)
        ? { health: sheet.health, magicka: sheet.magicka, fatigue: sheet.fatigue }
        : prev.vitals;
      // An edited character is no longer what the seed rolls.
      return { ...prev, ...identity, vitals, seedExact: unchanged ? prev.seedExact : false };
    });
    onNavigate("challenge");
  };

  return (
    <div className="challenge-handoff flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-2 border border-line-11 text-xs font-serif text-fg-5">
      <span>
        This character came from your challenge run
        {run.race ? ` (${[run.race, run.cls].filter(Boolean).join(" ")})` : ""}. Changes made here can go back with it.
      </span>
      <button type="button" className="mw-btn px-3 py-1.5 text-xs font-bold text-accent" onClick={sendBack}>
        Send build back to the challenge run
      </button>
    </div>
  );
}
