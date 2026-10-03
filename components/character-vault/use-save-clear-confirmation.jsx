"use client";
import { useEffect, useRef, useState } from "react";
import ConfirmationDialog from "../confirmation-dialog";

/** Confirm only the loaded copy the player saw, retaining the provider's clear operation. */
export function useSaveClearConfirmation(activeSave, onClear) {
  const [pendingSave, setPendingSave] = useState(null);
  const returnArea = useRef(null);
  const cleared = useRef(false);
  useEffect(() => {
    if (pendingSave && pendingSave !== activeSave) setPendingSave(null);
    if (!activeSave && cleared.current) {
      cleared.current = false;
      const target = returnArea.current?.querySelector('[data-open-save-file]:not([disabled])')
        || document.getElementById("main-content");
      target?.focus();
    }
  }, [activeSave, pendingSave]);

  const requestClear = event => {
    if (!activeSave || typeof onClear !== "function") return;
    returnArea.current = event.currentTarget.closest(".open-save-panel, .home-save");
    setPendingSave(activeSave);
  };
  const confirm = () => {
    if (!pendingSave || pendingSave !== activeSave) return;
    cleared.current = true;
    setPendingSave(null);
    onClear();
  };
  const dialog = <ConfirmationDialog open={Boolean(pendingSave && pendingSave === activeSave)}
    title="Clear loaded save?"
    description={`Clear “${pendingSave?.save?.identity?.name || "this save"}” from this browser? Your original save file is unchanged and can be opened again.`}
    confirmLabel="Clear save" onConfirm={confirm} onCancel={() => setPendingSave(null)} />;
  return { requestClear, dialog };
}
