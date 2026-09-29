"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveCharacter } from "../character-context";
import {
  loadLocalCharacters,
  saveLocalCharacter,
  deleteLocalCharacter,
} from "../../lib/character-vault.mjs";

export default function LocalCharactersPanel({ build: propBuild, onApplyBuild } = {}) {
  const activeChar = useActiveCharacter();
  const build = propBuild || activeChar?.build;
  const applyBuild = onApplyBuild || activeChar?.loadBuild || activeChar?.setBuild;

  const [savedCharacters, setSavedCharacters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const refreshList = useCallback(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      setSavedCharacters(loadLocalCharacters(window.localStorage));
    } catch {
      setSavedCharacters([]);
    }
  }, []);

  useEffect(() => {
    refreshList();
    const handleLocalChange = () => refreshList();
    window.addEventListener("silt-local-saves-changed", handleLocalChange);
    window.addEventListener("storage", handleLocalChange);
    return () => {
      window.removeEventListener("silt-local-saves-changed", handleLocalChange);
      window.removeEventListener("storage", handleLocalChange);
    };
  }, [refreshList]);

  const handleSave = () => {
    setError(null);
    if (!build) {
      setError("No character build to save.");
      return;
    }
    if (typeof window === "undefined" || !window.localStorage) {
      setError("Browser storage is unavailable.");
      return;
    }

    try {
      const charName = (
        build.name ||
        (build.race && build.className ? `${build.race} ${build.className}` : "") ||
        "Custom Character"
      ).trim();

      const saved = saveLocalCharacter(
        {
          name: charName,
          character: { ...build },
        },
        window.localStorage
      );

      refreshList();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("silt-local-saves-changed"));
      }
      setFeedback(`Saved "${saved.name}"!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save character.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleLoad = (record) => {
    const char = record.character || record;
    if (typeof applyBuild === "function") {
      applyBuild(char);
      setFeedback(`Loaded "${record.name || char.name || "character"}"!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleDelete = (id, name) => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      deleteLocalCharacter(id, window.localStorage);
      refreshList();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("silt-local-saves-changed"));
      }
      setFeedback(`Deleted "${name}".`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setError(err.message || "Failed to delete character.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="local-characters-container mt-7 space-y-3" id="saved-characters-panel">
      <div className="flex items-center justify-between border-b border-line-11 pb-2">
        <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
          Saved Characters
        </span>
        <button
          type="button"
          id="btn-open-cloud-vault"
          className="mw-btn px-3 py-1 text-xs font-serif font-bold text-accent"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("silt-open-vault"));
            }
          }}
          title="Open Cloud Vault"
        >
          Cloud Vault
        </button>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          id="btn-save-local-character"
          className="w-full mw-btn py-2.5 px-4 font-serif text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm text-accent hover:text-accent-hover"
          onClick={handleSave}
          title="Save this character to browser storage (no account needed)"
        >
          <span>{feedback ? feedback : "Save this character"}</span>
        </button>

        {error && (
          <p className="text-xs text-danger-2 font-serif m-0">{error}</p>
        )}

        <div className="text-[11px] text-fg-11 font-serif flex items-center justify-between">
          <span>Local browser storage (no account needed)</span>
          {savedCharacters.length > 0 && (
            <span className="text-fg-14 font-mono">{savedCharacters.length} saved</span>
          )}
        </div>

        {savedCharacters.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {savedCharacters.map((rec) => {
              const char = rec.character || rec;
              const displayName = rec.name || char.name || "Custom Character";
              const summary = `${char.race || "Dark Elf"} · ${char.className || "Custom"} · ${char.sign || "The Lady"}`;
              return (
                <div
                  key={rec.id}
                  className="p-2 bg-surface-2 border border-line-9 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-serif font-bold text-fg-2 truncate" title={displayName}>
                      {displayName}
                    </div>
                    <div className="text-[10px] text-fg-14 font-serif truncate" title={summary}>
                      {summary}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="mw-btn px-2 py-0.5 text-[11px] font-serif font-bold text-fg-2"
                      onClick={() => handleLoad(rec)}
                      title={`Load "${displayName}" into Character Builder`}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="mw-btn px-1.5 py-0.5 text-[11px] font-serif text-fg-14 hover:text-danger-3"
                      onClick={() => handleDelete(rec.id, displayName)}
                      title={`Delete "${displayName}" from browser storage`}
                      aria-label={`Delete ${displayName}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
