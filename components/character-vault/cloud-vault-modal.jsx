"use client";
import { useState, useRef, useMemo } from "react";
import { useCloudVault } from "./use-cloud-vault";
import CloudVaultCard from "./cloud-vault-card";

export default function CloudVaultModal({
  activeBuild,
  onApplyBuild,
  isOpen: propIsOpen,
  onClose: propOnClose,
}) {
  const vault = useCloudVault({ activeBuild, onApplyBuild });
  const isOpen = propIsOpen !== undefined ? propIsOpen : vault.isOpen;
  const onClose = propOnClose || vault.closeModal;

  const [activeTab, setActiveTab] = useState("all"); // "all" | "openmw" | "builds" | "challenges" | "local"
  const [saveName, setSaveName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Filter saves based on active tab
  const filteredCloudSaves = useMemo(() => {
    if (activeTab === "openmw") {
      return vault.saves.filter((s) => s.save_type === "openmw_save");
    }
    if (activeTab === "builds") {
      return vault.saves.filter((s) => s.save_type === "character_build");
    }
    if (activeTab === "challenges") {
      return vault.saves.filter((s) => s.save_type === "challenge_run");
    }
    return vault.saves;
  }, [vault.saves, activeTab]);

  const countOpenMw = useMemo(() => vault.saves.filter((s) => s.save_type === "openmw_save").length, [vault.saves]);
  const countBuilds = useMemo(() => vault.saves.filter((s) => s.save_type === "character_build").length, [vault.saves]);
  const countChallenges = useMemo(() => vault.saves.filter((s) => s.save_type === "challenge_run").length, [vault.saves]);

  const isAtQuota = vault.entitlements.currentSaves >= vault.entitlements.maxSaves;

  const handleSaveActive = async (e) => {
    e.preventDefault();
    const name = saveName.trim() || activeBuild?.name || activeBuild?.className || "Custom Build";
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-vault-title"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col text-[#f3e6c8] overflow-hidden"
        style={{
          border: "6px solid transparent",
          borderImage: "var(--mw-border) 6 repeat",
          background: "var(--surface, #181510)",
          boxShadow: "inset 0 0 16px 3px rgba(0, 0, 0, 0.9), 0 16px 40px rgba(0, 0, 0, 0.7)",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2a2215] bg-[#14100a]">
          <div>
            <h3 id="cloud-vault-title" className="text-xl font-serif font-bold text-[#d4b06a] tracking-wide">
              Cloud Character Vault
            </h3>
            <p className="text-xs text-[#8c7853] font-serif mt-0.5">
              Secure character persistence, OpenMW save sync, and multi-device build storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {vault.signedIn ? (
              <div className="text-right hidden sm:block">
                <span className="text-xs text-[#c4b998] font-serif block">
                  {vault.user?.name || "Authenticated User"}
                </span>
                <span className="text-[11px] font-mono text-[#d4b06a]">
                  {vault.entitlements.tier === "paid" || vault.entitlements.tier === "supporter"
                    ? "Supporter Tier"
                    : "Free Tier"}{" "}
                  · {vault.entitlements.currentSaves} / {vault.entitlements.maxSaves} Saves
                </span>
              </div>
            ) : null}

            <button
              type="button"
              className="mw-btn px-3 py-1.5 text-xs font-serif font-bold"
              onClick={onClose}
              aria-label="Close Cloud Vault"
            >
              Close ✕
            </button>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {vault.statusMessage && (
          <div className="bg-[#1f1a10] border-b border-[#5a482e] px-4 py-2 text-xs font-serif text-[#d4b06a] flex items-center justify-between">
            <span>{vault.statusMessage}</span>
          </div>
        )}
        {vault.errorMessage && (
          <div className="bg-[#261010] border-b border-[#702a2a] px-4 py-2 text-xs font-serif text-[#e58a8a] flex items-center justify-between">
            <span>{vault.errorMessage}</span>
          </div>
        )}

        {/* Body Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Sign-In CTA (if signed out) */}
          {!vault.signedIn ? (
            <div className="bg-[#120f0a] border border-[#4a3b26] p-5 space-y-3 mw-groove-panel text-center sm:text-left">
              <div className="sm:flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif text-base font-bold text-[#d4b06a]">
                    Connect Your Account for Cloud Sync
                  </h4>
                  <p className="text-xs text-[#c4b998] font-serif">
                    Sign in with Google, Discord, or Email to unlock 5 free cloud save slots, upload OpenMW .omwsave files, and sync character builds across devices.
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 flex gap-2 justify-center">
                  <button
                    type="button"
                    className="mw-btn px-4 py-2 font-serif text-xs font-bold text-[#f3e6c8] hover:text-[#d4b06a]"
                    onClick={vault.openSignIn}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="mw-btn px-4 py-2 font-serif text-xs font-bold text-[#d4b06a]"
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
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#110e08] p-3 border border-[#2a2215]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-serif text-[#c4b998]">
                    Account Quota:
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-serif font-bold uppercase tracking-wider border ${
                    isAtQuota
                      ? "bg-[#2b1616] border-[#8f3636] text-[#e58a8a]"
                      : "bg-[#1a140d] border-[#4a3b26] text-[#d4b06a]"
                  }`}>
                    {vault.entitlements.currentSaves} / {vault.entitlements.maxSaves} Saves Used
                  </span>
                </div>

                {isAtQuota && (
                  <span className="text-xs font-serif text-[#d4886a]">
                    Capacity reached. Delete or overwrite a save to store new builds.
                  </span>
                )}
              </div>

              {/* Action Toolbar: Save Active Build & Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Save Current Build */}
                <div className="bg-[#120f0a] border border-[#2a2215] p-4 space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#221c13] pb-1">
                    Save Active Build to Cloud
                  </h4>
                  <form onSubmit={handleSaveActive} className="space-y-2">
                    <input
                      type="text"
                      className="w-full bg-[#0a0805] border border-[#3a2e1d] p-2 text-xs text-[#f3e6c8] placeholder-[#7a6b52] font-serif focus:outline-none focus:border-[#d4b06a]"
                      placeholder={`Name (e.g. ${activeBuild?.name || activeBuild?.className || "Dunmer Assassin"})`}
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onInput={(e) => setSaveName(e.target.value)}
                      maxLength={100}
                      disabled={vault.actionBusy || isAtQuota}
                    />
                    <button
                      type="submit"
                      className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-[#f3e6c8] hover:text-[#d4b06a]"
                      onClick={handleSaveActive}
                      disabled={vault.actionBusy || isAtQuota}
                    >
                      {vault.actionBusy ? "Saving…" : "Save Active Build to Cloud"}
                    </button>
                  </form>
                </div>

                {/* Import .omwsave / JSON */}
                <div
                  className={`bg-[#120f0a] border p-4 space-y-3 flex flex-col justify-between transition-colors ${
                    dragOver
                      ? "border-[#d4b06a] bg-[#1c160e]"
                      : "border-[#2a2215]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#221c13] pb-1">
                      Import Save (.omwsave or .json)
                    </h4>
                    <p className="text-[11px] text-[#8c7853] font-serif mt-1">
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
                      className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-[#c4b998] hover:text-[#f3e6c8]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={vault.actionBusy || isAtQuota}
                    >
                      Browse Save File…
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#2a2215] pb-2">
            {[
              { id: "all", label: `All Cloud Saves (${vault.saves.length})` },
              { id: "openmw", label: `OpenMW Saves (${countOpenMw})` },
              { id: "builds", label: `Character Builds (${countBuilds})` },
              { id: "challenges", label: `Challenge Runs (${countChallenges})` },
              { id: "local", label: `Local Browser Saves (${vault.localSaves.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mw-btn px-3 py-1.5 text-xs font-serif ${
                  activeTab === tab.id ? "active ring-1 ring-[#d4b06a] text-[#d4b06a]" : "text-[#a69677]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Save Cards List */}
          {activeTab === "local" ? (
            /* Local Browser Saves Tab */
            <div className="space-y-3">
              {vault.localSaves.length === 0 ? (
                <div className="text-center py-8 text-[#8c7853] font-serif text-sm">
                  No local browser saves found.
                </div>
              ) : (
                vault.localSaves.map((rec, idx) => {
                  const char = rec.character || rec;
                  return (
                    <div
                      key={rec.id || idx}
                      className="p-3 bg-[#120f0a] border border-[#2a2215] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-serif text-sm font-bold text-[#f3e6c8]">
                            {rec.name || char.name || "Local Character"}
                          </h5>
                          <span className="text-[10px] font-serif uppercase px-1.5 py-0.5 bg-[#17140e] border border-[#382b1c] text-[#9b8b6a]">
                            Local Storage
                          </span>
                        </div>
                        <p className="text-xs text-[#8c7853] font-serif mt-0.5">
                          {char.race || "Dark Elf"} · {char.className || "Custom"} · {char.sign || "The Lady"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {vault.signedIn && (
                          <button
                            type="button"
                            className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-[#d4b06a]"
                            onClick={() => vault.importLocalSave(rec)}
                            disabled={vault.actionBusy || isAtQuota}
                            title="Upload this local character to Cloud Vault"
                          >
                            Sync to Cloud ↑
                          </button>
                        )}
                        <button
                          type="button"
                          className="mw-btn px-2.5 py-1 text-xs font-serif text-[#f3e6c8]"
                          onClick={() => {
                            if (typeof onApplyBuild === "function") {
                              onApplyBuild(char);
                            } else if (typeof window !== "undefined" && window.siltShell?.navigate) {
                              window.siltShell.navigate("builder");
                            }
                            onClose();
                          }}
                        >
                          Load Build →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Cloud Saves Tab */
            <div className="space-y-3">
              {vault.loading ? (
                <div className="text-center py-10 text-[#d4b06a] font-serif text-sm">
                  Loading cloud character vault…
                </div>
              ) : filteredCloudSaves.length === 0 ? (
                <div className="text-center py-10 text-[#8c7853] font-serif text-sm space-y-1">
                  <p>No cloud saves found in this category.</p>
                  <p className="text-xs text-[#6b5a3e]">
                    Save your active build above or drop an OpenMW .omwsave file to get started.
                  </p>
                </div>
              ) : (
                filteredCloudSaves.map((save) => (
                  <CloudVaultCard
                    key={save.id}
                    save={save}
                    onLoad={vault.loadSaveIntoSession}
                    onRename={vault.renameSave}
                    onDelete={vault.deleteSave}
                    onExport={vault.exportSaveJson}
                    onDuplicate={vault.duplicateSave}
                    onShare={vault.shareBuildLink}
                    isBusy={vault.actionBusy}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
