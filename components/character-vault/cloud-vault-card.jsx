"use client";
import { useState, useEffect, useRef } from "react";
import ConfirmationDialog from '../confirmation-dialog';
import {getGameDataLoader} from '../use-game-data';
import {loadVaultIdentityLabels} from '../../lib/vault-identity.mjs';

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
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const cardRef = useRef(null);
  const [shareCopied, setShareCopied] = useState(false);

  const isOmwSave = save.save_type === "openmw_save";
  const isBuild = save.save_type === "character_build";
  const isChallenge = save.save_type === "challenge_run";
  const identityKey = JSON.stringify([save.save_type, save.race, save.birthsign]);
  const [resolvedIdentity, setResolvedIdentity] = useState(null);
  const identity = resolvedIdentity?.key === identityKey ? resolvedIdentity : save;
  useEffect(() => {
    if (!isOmwSave) return;
    let current = true;
    loadVaultIdentityLabels(getGameDataLoader(), {race: save.race, birthsign: save.birthsign})
      .then(labels => { if (current) setResolvedIdentity({...labels, key: identityKey}); })
      .catch(() => { /* Offline or missing catalogs: preserve the original IDs. */ });
    return () => { current = false; };
  }, [identityKey, isOmwSave, save.race, save.birthsign]);

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

  const handleDelete = async () => {
    const scope = cardRef.current?.closest('[role="dialog"]') || cardRef.current?.closest('main');
    const cards = scope ? [...scope.querySelectorAll('.vault-card')] : [];
    const index = cards.indexOf(cardRef.current);
    const neighbor = cards[index + 1] || cards[index - 1];
    const neighborId = neighbor?.dataset.vaultSaveId;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await onDelete(save.id, save.revision);
      if (!result?.success) {
        setDeleteError(result?.error || 'The save could not be deleted. Try again.');
        return;
      }
      setConfirmDelete(false);
      // Refresh removes this card and its opener. Focus a remaining save, or
      // the save-name field when this was the last one, after busy controls enable.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const nextCard = scope?.isConnected && [...scope.querySelectorAll('.vault-card')].find(card => card.dataset.vaultSaveId === neighborId);
        const next = nextCard?.querySelector('[data-vault-delete]:not([disabled])');
        const fallback = scope?.isConnected && (scope.querySelector('input[placeholder^="Name (e.g."]:not([disabled])') || scope.querySelector('button:not([disabled])'));
        (next || fallback)?.focus();
      }));
    } catch (error) { setDeleteError(error.message || 'The save could not be deleted. Try again.'); }
    finally { setDeleting(false); }
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
      ref={cardRef}
      data-vault-save-id={save.id}
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
                className="bg-surface-1 border border-line-7 px-2 py-1 text-sm text-fg-2 font-serif w-full max-w-[260px] min-w-0 focus:outline-none focus:border-accent"
                aria-label="New name for this save"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onInput={(e) => setNameVal(e.target.value)}
                maxLength={100}
                disabled={isBusy}
              />
              <button
                type="submit"
                className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-accent whitespace-nowrap shrink-0"
                onClick={handleSaveRename}
                disabled={isBusy || !nameVal.trim()}
              >
                Save
              </button>
              <button
                type="button"
                className="mw-btn px-2.5 py-1 text-xs font-serif text-fg-9 whitespace-nowrap shrink-0"
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
                className="text-xs text-fg-14 hover:text-accent underline font-serif ml-1 bg-transparent border-0"
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
            {identity.race || "Unknown race"}
            {identity.birthsign ? ` · ${identity.birthsign}` : ""}
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
            <button
              type="button"
              data-vault-delete
              className="text-xs text-fg-12 hover:text-danger-7 underline font-serif bg-transparent border-0"
              onClick={() => { setDeleteError(null); setConfirmDelete(true); }}
              disabled={isBusy}
            >
              Delete
            </button>
        </div>
      </div>
      <ConfirmationDialog open={confirmDelete} title="Delete save?" description={`Delete “${save.name || 'Unnamed Character'}” from your cloud Vault? This cannot be undone.`}
        onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} busy={deleting} error={deleteError} />
    </div>
  );
}
