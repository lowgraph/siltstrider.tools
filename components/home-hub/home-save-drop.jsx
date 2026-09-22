"use client";
import { useEffect, useRef, useState } from "react";
import { readSaveFile } from "../../lib/omwsave-import.mjs";
import { worldLabel } from "../../lib/home-data.mjs";

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V4" /><path d="m7 9 5-5 5 5" /><path d="M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
  </svg>
);

/**
 * The home page's first step: drop an OpenMW save and every tool picks up that
 * character. The file is read in the browser and never uploaded. `activeSave`,
 * `onLoad` (the character context's loadSave) and `onClear` come from the page.
 */
export default function HomeSaveDrop({ activeSave, onLoad, onClear, onNavigate, ready }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const enabled = ready && typeof onLoad === "function";

  const open = async (file) => {
    if (!file || !enabled) return;
    setError(null);
    setBusy(file.name);
    try {
      await onLoad(await readSaveFile(file));
    } catch (err) {
      setError(err?.message || "That save could not be read.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };

  // A file dropped anywhere on the page opens too, rather than the browser leaving the
  // site to show it.
  const latest = useRef(open);
  latest.current = open;
  useEffect(() => {
    const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes("Files");
    const hold = (event) => { if (hasFiles(event)) event.preventDefault(); };
    const take = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setOver(false);
      latest.current(event.dataTransfer.files?.[0]);
    };
    window.addEventListener("dragover", hold);
    window.addEventListener("drop", take);
    return () => {
      window.removeEventListener("dragover", hold);
      window.removeEventListener("drop", take);
    };
  }, []);

  const drag = (event) => {
    if (!enabled || ![...(event.dataTransfer?.types || [])].includes("Files")) return;
    event.dataTransfer.dropEffect = "copy";
    setOver(true);
  };
  const leave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOver(false);
  };

  const picker = (
    <input
      ref={input}
      type="file"
      hidden
      accept=".omwsave,.json,.ess"
      aria-label="Open an OpenMW save"
      onChange={(event) => open(event.target.files?.[0])}
    />
  );

  if (activeSave && !busy) {
    const identity = activeSave.save?.identity || {};
    const issues = (activeSave.unresolved?.length || 0) + (activeSave.unworn?.length || 0);
    return (
      <div className="home-save home-save--loaded" role="status">
        <div className="home-save-head">
          <span className="home-kicker">Save loaded</span>
          <span className="home-chip">{worldLabel(activeSave.profile)}</span>
        </div>
        <div className="home-save-title">
          {identity.name || "Your character"}, level {identity.level ?? 1}{activeSave.className ? ` ${activeSave.className}` : ""}
        </div>
        <div className="home-save-note">
          Every tool now works with this character.
          {issues > 0 && ` ${issues} thing${issues === 1 ? "" : "s"} from the save's mods could not be matched; the Build Optimizer lists them.`}
        </div>
        <div className="home-save-actions">
          <button type="button" className="mw-btn home-cta home-cta--primary" onClick={() => onNavigate("builder")}>Open the character</button>
          <button type="button" className="mw-btn home-cta" onClick={() => onNavigate("leveler")}>Plan level-ups</button>
          <button type="button" className="mw-btn home-cta" onClick={() => onNavigate("factions")}>Factions and quests</button>
        </div>
        <div className="home-save-more">
          <button type="button" className="home-link" onClick={() => input.current?.click()}>Open another save</button>
          <button type="button" className="home-link" onClick={onClear}>Clear the save</button>
        </div>
        {error && <div className="home-save-error" role="alert">{error}</div>}
        {picker}
      </div>
    );
  }

  return (
    <div
      className="home-save"
      data-over={over ? "true" : undefined}
      data-busy={busy ? "true" : undefined}
      onDragEnter={drag}
      onDragOver={drag}
      onDragLeave={leave}
    >
      <span className="home-save-icon"><UploadIcon /></span>
      <div className="home-save-body">
        <div className="home-save-title">{busy ? `Reading ${busy}…` : "Drop your OpenMW save here"}</div>
        <div className="home-save-note">
          Your character, gear, level and quests fill every tool. It is read in your browser: nothing is uploaded and
          no account is needed.
        </div>
        <div className="home-save-row">
          <button type="button" className="mw-btn home-cta home-cta--primary" disabled={!enabled || Boolean(busy)} onClick={() => input.current?.click()}>
            Choose a save file
          </button>
          <span className="home-save-hint">
            <kbd>.omwsave</kbd> files are in <span>Documents › My Games › OpenMW › saves</span> on Windows
          </span>
        </div>
        {error && <div className="home-save-error" role="alert">{error}</div>}
      </div>
      {picker}
    </div>
  );
}
