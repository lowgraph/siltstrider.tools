"use client";
import { useState } from "react";

export default function CloudVaultCard({
  save,
  onLoad,
  onRename,
  onDelete,
  onExport,
  onDuplicate,
  onShare,
  isBusy,
}) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(save.name || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isOmwSave = save.save_type === "openmw_save";
  const isBuild = save.save_type === "character_build";
  const isChallenge = save.save_type === "challenge_run";

  const typeLabel = isOmwSave
    ? "OpenMW Save"
    : isBuild
    ? "Character Build"
    : isChallenge
    ? "Challenge Run"
    : "Custom";

  const handleSaveRename = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (nameVal.trim() && nameVal.trim() !== save.name) {
      onRename(save.id, nameVal.trim(), save.revision);
    }
    setEditing(false);
  };

  const handleCancelRename = () => {
    setNameVal(save.name || "");
    setEditing(false);
  };

  const formattedDate = save.updated_at
    ? new Date(save.updated_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  return (
    <div
      className="vault-card p-4 space-y-3 bg-surface-2 border border-line-9 hover:border-line-4 transition-colors relative"
      style={{
        boxShadow: "inset 0 0 8px 1px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line-11 pb-2">
        <div className="flex-1 min-w-[200px]">
          {editing ? (
            <form onSubmit={handleSaveRename} className="flex items-center gap-2">
              <input
                type="text"
                className="bg-surface-1 border border-line-7 px-2 py-1 text-sm text-fg-2 font-serif w-full max-w-[260px] focus:outline-none focus:border-accent"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onInput={(e) => setNameVal(e.target.value)}
                maxLength={100}
                disabled={isBusy}
              />
              <button
                type="submit"
                className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-accent"
                onClick={handleSaveRename}
                disabled={isBusy || !nameVal.trim()}
              >
                Save
              </button>
              <button
                type="button"
                className="mw-btn px-2.5 py-1 text-xs font-serif text-fg-9"
                onClick={handleCancelRename}
                disabled={isBusy}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-base font-bold text-fg-2 tracking-wide">
                {save.name || "Unnamed Character"}
              </h4>
              <button
                type="button"
                className="text-xs text-fg-14 hover:text-accent underline font-serif ml-1"
                onClick={() => setEditing(true)}
                title="Rename this save"
                disabled={isBusy}
              >
                Rename
              </button>
            </div>
          )}
          <p className="text-xs text-fg-14 font-mono mt-0.5">
            Revision {save.revision ?? 1} · {formattedDate}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-serif uppercase tracking-wider px-2 py-0.5 bg-surface-8 border border-line-8 text-accent">
            {typeLabel}
          </span>
          <span className="text-[11px] font-serif uppercase tracking-wider px-2 py-0.5 bg-success-surface-1 border border-success-line-5 text-success-4">
            Cloud Synced
          </span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-serif">
        <div className="bg-surface-1 p-2 border border-line-12">
          <span className="text-fg-14 block text-[10px] uppercase tracking-wider">Level &amp; Class</span>
          <span className="text-fg-2 font-bold">
            Lvl {save.level || 1} {save.class_name || "Adventurer"}
          </span>
        </div>

        <div className="bg-surface-1 p-2 border border-line-12">
          <span className="text-fg-14 block text-[10px] uppercase tracking-wider">Race &amp; Sign</span>
          <span className="text-fg-2 font-bold">
            {save.race || "Dark Elf"}
            {save.birthsign ? ` · ${save.birthsign}` : ""}
          </span>
        </div>

        <div className="bg-surface-1 p-2 border border-line-12">
          <span className="text-fg-14 block text-[10px] uppercase tracking-wider">Location / Cell</span>
          <span className="text-fg-2 font-bold truncate block" title={save.cell_name || "Vvardenfell"}>
            {save.cell_name || "Vvardenfell"}
          </span>
        </div>

        <div className="bg-surface-1 p-2 border border-line-12">
          <span className="text-fg-14 block text-[10px] uppercase tracking-wider">Gold &amp; Progress</span>
          <span className="text-accent font-bold">
            {(save.gold || 0).toLocaleString("en-US")} gp
            {save.quest_count ? ` · ${save.quest_count} quests` : ""}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line-12">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="mw-btn px-3 py-1.5 text-xs font-serif font-bold text-fg-2 hover:text-accent shadow-sm"
            onClick={() => onLoad(save.id)}
            disabled={isBusy}
            title="Load this build into Character Builder"
          >
            Load Build →
          </button>
          {onDuplicate && (
            <button
              type="button"
              className="mw-btn px-2.5 py-1.5 text-xs font-serif text-fg-5 hover:text-fg-2"
              onClick={() => onDuplicate(save.id)}
              disabled={isBusy}
              title="Duplicate this build as an independent save"
            >
              Duplicate
            </button>
          )}
          {onShare && (
            <button
              type="button"
              className="mw-btn px-2.5 py-1.5 text-xs font-serif text-fg-5 hover:text-fg-2"
              onClick={async () => {
                const res = await onShare(save);
                if (res?.success) {
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }
              }}
              disabled={isBusy}
              title="Copy shareable permalink to clipboard"
            >
              {shareCopied ? "Link Copied!" : "Share Link"}
            </button>
          )}
          <button
            type="button"
            className="mw-btn px-2.5 py-1.5 text-xs font-serif text-fg-5 hover:text-fg-2"
            onClick={() => onExport(save.id, save.name)}
            disabled={isBusy}
            title="Download full save data as structured JSON"
          >
            Export JSON
          </button>
        </div>

        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-warning-3 font-serif font-semibold">Delete save?</span>
              <button
                type="button"
                className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-danger-7 border-danger-line-2 hover:bg-danger-surface-3"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(save.id, save.revision);
                }}
                disabled={isBusy}
              >
                Confirm
              </button>
              <button
                type="button"
                className="mw-btn px-2 py-1 text-xs font-serif text-fg-9"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-fg-12 hover:text-danger-7 underline font-serif"
              onClick={() => setConfirmDelete(true)}
              disabled={isBusy}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
