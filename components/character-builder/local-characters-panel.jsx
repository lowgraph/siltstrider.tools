"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_BUILD, useActiveCharacter } from "../character-context";
import {
  loadLocalCharacters,
  saveLocalCharacter,
  deleteLocalCharacter,
  sanitizeBuild,
} from "../../lib/character-vault.mjs";

// This browser's storage, or null where it is blocked: reading window.localStorage itself
// throws when a browser refuses site data.
function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage || null;
  } catch {
    return null;
  }
}

// A saved entry's name to show: a string, or a fallback (stored data can be anything).
const text = (value) => (typeof value === "string" && value.trim() ? value : "");

export default function LocalCharactersPanel({ build: propBuild, onApplyBuild } = {}) {
  const activeChar = useActiveCharacter();
  const build = propBuild || activeChar?.build;
  const applyBuild = onApplyBuild || activeChar?.loadBuild || activeChar?.setBuild;

  const [savedCharacters, setSavedCharacters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const refreshList = useCallback(() => {
    const storage = browserStorage();
    if (!storage) return;
    try {
      setSavedCharacters(loadLocalCharacters(storage));
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
    const storage = browserStorage();
    if (!storage) {
      setError("This browser is not letting the site keep characters (private window or blocked site data).");
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
        storage
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

  // A stored character is checked like a shared link's: unreadable ones are refused, and a
  // loaded .omwsave is set aside so every tool uses the character just loaded.
  const handleLoad = async (record) => {
    const char = record.character || record;
    const clean = sanitizeBuild(char);
    if (!clean) {
      setError("This saved character cannot be read.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (typeof applyBuild === "function") {
      const current = activeChar?.build || DEFAULT_BUILD;
      try {
        await applyBuild({
          ...DEFAULT_BUILD,
          world: current.world,
          arce: current.arce,
          ...clean,
          ...(Array.isArray(char.loadouts) ? { loadouts: char.loadouts } : {}),
        });
        if (activeChar?.activeSave && typeof activeChar.clearSave === "function") activeChar.clearSave();
        setFeedback(`Loaded "${text(record.name) || clean.name || "character"}"!`);
        setTimeout(() => setFeedback(null), 2500);
      } catch (err) {
        setError(err.message || "This saved character could not be loaded.");
      }
    }
  };

  const handleDelete = (id, name) => {
    const storage = browserStorage();
    if (!storage) return;
    try {
      deleteLocalCharacter(id, storage);
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
            {savedCharacters.map((rec, index) => {
              const char = (rec.character && typeof rec.character === "object") ? rec.character : rec;
              const displayName = text(rec.name) || text(char.name) || "Custom Character";
              const summary = `${text(char.race) || "Dark Elf"} · ${text(char.className) || "Custom"} · ${text(char.sign) || "The Lady"}`;
              return (
                <div
                  key={typeof rec.id === "string" ? rec.id : `saved-${index}`}
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
