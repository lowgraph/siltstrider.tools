"use client";
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { focusableIn, useModalDialog } from './use-modal-dialog';

export default function ConfirmationDialog({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel, busy = false, error }) {
  const ref = useRef(null);
  const id = useId();
  useModalDialog(open, ref, () => { if (!busy) onCancel(); });
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (busy) dialog.focus();
    else if (!dialog.contains(document.activeElement) || document.activeElement === dialog) (focusableIn(dialog)[0] || dialog).focus();
  }, [open, busy, error]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} tabIndex={-1}
    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
    <div className="w-full max-w-sm p-5 border border-line-4 bg-surface-3 text-fg-2 space-y-4">
      <h2 id={`${id}-title`} className="text-lg font-serif font-bold text-accent">{title}</h2>
      <p id={`${id}-description`} className="text-sm">{description}</p>
      {error && <p role="alert" className="text-sm text-danger-7">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="mw-btn min-h-11 px-4 py-2 whitespace-nowrap" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="mw-btn min-h-11 px-4 py-2 whitespace-nowrap text-danger-7" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button>
      </div>
    </div>
  </div>, document.body);
}
