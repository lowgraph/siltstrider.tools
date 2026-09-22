"use client";
import { useState, useRef, useMemo } from "react";
import { useCloudVault } from "./use-cloud-vault";
import CloudVaultCard from "./cloud-vault-card";
import OpenSavePanel from "./open-save-panel";
import { useActiveCharacter } from "../character-context";
import { useShell } from "../shell-context";

export default function CloudVaultWorkstation({ activeBuild: propBuild, onApplyBuild: propSetBuild } = {}) {
  let shell = null;
  try { shell = useShell(); } catch {}
  let charCtx = null;
  try { charCtx = useActiveCharacter(); } catch {}
  const build = propBuild !== undefined ? propBuild : charCtx?.build;
  const setBuild = propSetBuild || charCtx?.setBuild;
  const vault = useCloudVault({ activeBuild: build, onApplyBuild: setBuild, onApplySave: charCtx?.loadSave });

  const [activeTab, setActiveTab] = useState("all"); // "all" | "openmw" | "builds" | "challenges" | "local"
  const [saveName, setSaveName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const localSaves = vault.localSaves || [];
  const cloudSaves = vault.saves || [];

  // Filter saves based on active tab
  const filteredCloudSaves = useMemo(() => {
    if (activeTab === "openmw") {
      return cloudSaves.filter((s) => s.save_type === "openmw_save");
    }
    if (activeTab === "builds") {
      return cloudSaves.filter((s) => s.save_type === "character_build");
    }
    if (activeTab === "challenges") {
      return cloudSaves.filter((s) => s.save_type === "challenge_run");
    }
    return cloudSaves;
  }, [cloudSaves, activeTab]);

  const countOpenMw = useMemo(() => cloudSaves.filter((s) => s.save_type === "openmw_save").length, [cloudSaves]);
  const countBuilds = useMemo(() => cloudSaves.filter((s) => s.save_type === "character_build").length, [cloudSaves]);
  const countChallenges = useMemo(() => cloudSaves.filter((s) => s.save_type === "challenge_run").length, [cloudSaves]);

  const isAtQuota = vault.entitlements.currentSaves >= vault.entitlements.maxSaves;

  const handleSaveActive = async (e) => {
    e.preventDefault();
    const name = saveName.trim() || build?.name || build?.className || "Custom Build";
    const res = await vault.saveActiveBuild(name);
    if (res.success) {
      setSaveName("");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await vault.uploadSaveFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await vault.uploadSaveFile(file);
    }
  };

  return (
    <div className="cloud-vault-root text-fg-2">
      {/* Header & Quick Launch Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-11 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-accent tracking-wide">
            Cloud Character Vault
          </h2>
          <p className="text-xs text-fg-14 font-serif mt-1">
            Cloud character storage, OpenMW save ingestion (.omwsave), revision history, and cross-device sync.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold"
            onClick={() => {
              window.siltShell?.navigate("builder");
            }}
          >
            ← Character Builder
          </button>
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold text-accent"
            onClick={() => {
              window.siltShell?.navigate("leveler");
            }}
          >
            Level Simulator →
          </button>
        </div>
      </div>

      {/* Status / Error Alerts */}
      {vault.statusMessage && (
        <div className="bg-surface-10 border border-line-4 px-4 py-2 text-xs font-serif text-accent mb-4 flex items-center justify-between">
          <span>{vault.statusMessage}</span>
        </div>
      )}
      {vault.errorMessage && (
        <div className="bg-danger-surface-2 border border-danger-line-2 px-4 py-2 text-xs font-serif text-danger-5 mb-4 flex items-center justify-between">
          <span>{vault.errorMessage}</span>
        </div>
      )}

      {/* Open a save locally: needs no account, so it sits above the sign-in split */}
      <div className="mb-4">
        <OpenSavePanel vault={vault} />
      </div>

      {/* Sign-In CTA (if signed out) */}
      {!vault.signedIn ? (
        <div className="bg-surface-2 border border-line-7 p-5 space-y-3 mw-groove-panel text-center sm:text-left mb-6">
          <div className="sm:flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-accent">
                Connect Your Account for Cloud Sync
              </h4>
              <p className="text-xs text-fg-5 font-serif">
                Sign in with Google, Discord, or Email to unlock 5 free cloud save slots, upload OpenMW .omwsave files, and sync character builds across devices.
              </p>
            </div>
            <div className="mt-3 sm:mt-0 flex gap-2 justify-center">
              <button
                type="button"
                className="mw-btn px-4 py-2 font-serif text-xs font-bold text-fg-2 hover:text-accent"
                onClick={vault.openSignIn}
              >
                Sign In
              </button>
              <button
                type="button"
                className="mw-btn px-4 py-2 font-serif text-xs font-bold text-accent"
                onClick={vault.openSignUp}
              >
                Register Free
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Account Quota Badge & Warning */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-2 p-3 border border-line-11 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-serif text-fg-5">
                Account Quota:
              </span>
              <span className={`px-2.5 py-1 text-xs font-serif font-bold uppercase tracking-wider border ${
                isAtQuota
                  ? "bg-danger-surface-2 border-danger-line-1 text-danger-5"
                  : "bg-surface-6 border-line-7 text-accent"
              }`}>
                {vault.entitlements.currentSaves} / {vault.entitlements.maxSaves} Saves Used
              </span>
              <span className="text-xs font-mono text-fg-14">
                ({vault.entitlements.tier === "paid" || vault.entitlements.tier === "supporter" ? "Supporter Tier: 25" : "Free Tier: 5"})
              </span>
            </div>

            {isAtQuota && (
              <span className="text-xs font-serif text-warning-3">
                Capacity reached. Delete or overwrite a save to store new builds.
              </span>
            )}
          </div>

          {/* Action Toolbar: Save Active Build & Import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Save Current Build */}
            <div className="bg-surface-2 border border-line-11 p-4 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-12 pb-1">
                Save Active Build to Cloud
              </h4>
              <form onSubmit={handleSaveActive} className="space-y-2">
                <input
                  type="text"
                  className="w-full bg-surface-1 border border-line-9 p-2 text-xs text-fg-2 placeholder-fg-15 font-serif focus:outline-none focus:border-accent"
                  placeholder={`Name (e.g. ${build?.name || build?.className || "Dunmer Assassin"})`}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onInput={(e) => setSaveName(e.target.value)}
                  maxLength={100}
                  disabled={vault.actionBusy || isAtQuota}
                />
                <button
                  type="submit"
                  className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-fg-2 hover:text-accent"
                  onClick={handleSaveActive}
                  disabled={vault.actionBusy || isAtQuota}
                >
                  {vault.actionBusy ? "Saving…" : "Save Active Build to Cloud"}
                </button>
              </form>
            </div>

            {/* Import .omwsave / JSON */}
            <div
              className={`bg-surface-2 border p-4 space-y-3 flex flex-col justify-between transition-colors ${
                dragOver
                  ? "border-accent bg-surface-6"
                  : "border-line-11"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div>
                <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-12 pb-1">
                  Import Save (.omwsave or .json)
                </h4>
                <p className="text-[11px] text-fg-14 font-serif mt-1">
                  Drag and drop your OpenMW save file or character JSON here.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".omwsave,.json"
                  onChange={handleFileChange}
                  disabled={vault.actionBusy || isAtQuota}
                />
                <button
                  type="button"
                  className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-fg-2 hover:text-accent"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={vault.actionBusy || isAtQuota}
                >
                  Browse File…
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-line-11 pb-2 overflow-x-auto mb-6">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-serif font-bold transition-all mw-btn whitespace-nowrap ${
            activeTab === "all" ? "active text-accent" : "text-fg-14"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Cloud Saves ({cloudSaves.length})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-serif font-bold transition-all mw-btn whitespace-nowrap ${
            activeTab === "openmw" ? "active text-accent" : "text-fg-14"
          }`}
          onClick={() => setActiveTab("openmw")}
        >
          OpenMW Saves ({countOpenMw})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-serif font-bold transition-all mw-btn whitespace-nowrap ${
            activeTab === "builds" ? "active text-accent" : "text-fg-14"
          }`}
          onClick={() => setActiveTab("builds")}
        >
          Character Builds ({countBuilds})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-serif font-bold transition-all mw-btn whitespace-nowrap ${
            activeTab === "challenges" ? "active text-accent" : "text-fg-14"
          }`}
          onClick={() => setActiveTab("challenges")}
        >
          Challenges ({countChallenges})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-serif font-bold transition-all mw-btn whitespace-nowrap ${
            activeTab === "local" ? "active text-accent" : "text-fg-14"
          }`}
          onClick={() => setActiveTab("local")}
        >
          Local Browser Saves ({localSaves.length})
        </button>
      </div>

      {/* Character Dossier Card Grid / Content */}
      {activeTab === "local" ? (
        // Local Browser Characters List
        localSaves.length === 0 ? (
          <div className="p-8 text-center border border-line-11 bg-surface-2 text-fg-14 font-serif text-xs">
            No local characters found in browser storage.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localSaves.map((rec, idx) => {
              const char = rec.character || rec;
              return (
                <div
                  key={rec.id || idx}
                  className="bg-surface-3 border border-line-9 p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-serif font-bold text-sm text-fg-2">
                        {rec.name || char.name || "Local Character"}
                      </h5>
                      <span className="text-[10px] font-mono text-fg-14">
                        Level {char.level || 1}
                      </span>
                    </div>
                    <p className="text-xs text-fg-14 font-serif mt-0.5">
                      {char.race || "Dark Elf"} · {char.className || "Custom"} · {char.sign || "The Lady"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-line-12">
                    <button
                      type="button"
                      className="flex-1 mw-btn py-1 px-2 text-xs font-serif font-bold text-accent"
                      onClick={() => {
                        if (typeof setBuild === "function") {
                          setBuild(char);
                        } else if (typeof window !== "undefined" && window.siltShell?.navigate) {
                          window.siltShell.navigate("builder");
                        }
                      }}
                    >
                      Load Build →
                    </button>
                    {vault.signedIn && (
                      <button
                        type="button"
                        className="mw-btn py-1 px-2 text-xs font-serif font-bold text-fg-5"
                        onClick={() => vault.importLocalSave(rec)}
                        disabled={vault.actionBusy || isAtQuota}
                        title="Upload to Cloud Vault"
                      >
                        Sync to Cloud
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Cloud Saves Grid
        filteredCloudSaves.length === 0 ? (
          <div className="p-8 text-center border border-line-11 bg-surface-2 text-fg-14 font-serif text-xs space-y-2">
            <p>
              {vault.signedIn
                ? "No cloud saves found in this category."
                : "Sign in to see and manage your cloud saves."}
            </p>
            {vault.signedIn && !isAtQuota && (
              <p className="text-fg-5">
                Save your active build above or import an OpenMW .omwsave file.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCloudSaves.map((save) => (
              <CloudVaultCard
                key={save.id}
                save={save}
                onLoad={vault.loadSaveIntoSession}
                onDuplicate={vault.duplicateSave}
                onDelete={vault.deleteSave}
                onRename={vault.renameSave}
                onShare={vault.shareBuildLink}
                onExport={vault.exportSaveJson}
                isBusy={vault.actionBusy}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
