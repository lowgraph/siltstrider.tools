"use client";
import { useRef } from "react";
import SaveImportNotice from "./save-import-notice";

/**
 * Open a .omwsave in Silt Strider without an account. The file is parsed in the browser
 * and never uploaded; uploading to the Cloud Vault stays a separate, signed-in step.
 */
export default function OpenSavePanel({ vault }) {
  const inputRef = useRef(null);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await vault.openSaveFile(file);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="open-save-panel bg-surface-2 border border-line-11 p-4 space-y-3">
      <div>
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-12 pb-1">
          Open a Save in Silt Strider
        </h4>
        <p className="text-[11px] text-fg-14 font-serif mt-1">
          Loads an OpenMW .omwsave into the Character Builder, Level Simulator, Equipped Loadouts
          and Journal. It stays in this browser; nothing is uploaded and no account is needed.
        </p>
      </div>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept=".omwsave,.json"
        onChange={handleChange}
        disabled={vault.actionBusy}
        aria-label="Open an OpenMW save"
      />
      <button
        type="button"
        className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-fg-5 hover:text-fg-2"
        onClick={() => inputRef.current?.click()}
        disabled={vault.actionBusy}
      >
        Open Save File…
      </button>
      <SaveImportNotice compact />
    </div>
  );
}
