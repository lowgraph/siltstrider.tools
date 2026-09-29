"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Another layer opened over the dialog (Clerk's sign-in, the search palette) owns the
// keyboard while it is up: the Cloud Vault opens sign-in from inside itself.
const LAYER = '[role="dialog"], [aria-modal="true"], [class^="cl-"], [class*=" cl-"]';

/** Focusable controls inside `root`, in tab order; the visible ones when layout is known. */
export function focusableIn(root) {
  const all = [...root.querySelectorAll(FOCUSABLE)].filter(el => !el.closest("[inert]"));
  const shown = all.filter(el => el.getClientRects().length > 0);
  return shown.length ? shown : all;
}

/**
 * The keyboard contract of a modal dialog rendered inside the page: focus moves in
 * when it opens, Tab and Shift+Tab wrap inside it, focus that strays outside is
 * brought back, Escape closes it, and focus returns to whatever opened it. A layer
 * opened on top of it keeps the keyboard until it closes.
 * `ref` is the element with role="dialog"; give it tabIndex={-1} as a last resort
 * for focus when it holds no controls.
 */
export function useModalDialog(open, ref, onClose) {
  const close = useRef(onClose);
  close.current = onClose;
  // Note what had focus in the render that opens the dialog: an autoFocus inside it
  // moves focus during the commit, before an effect could see the opener.
  const opener = useRef(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") opener.current = document.activeElement;
  wasOpen.current = open;

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return undefined;
    const returnTo = opener.current;
    const enter = () => (focusableIn(dialog)[0] || dialog).focus();
    const elsewhere = el => Boolean(el && el !== document.body && !dialog.contains(el) && el.closest(LAYER));
    if (!dialog.contains(document.activeElement)) enter();

    const onKeyDown = e => {
      if (elsewhere(document.activeElement)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const pool = focusableIn(dialog);
      if (!pool.length) { e.preventDefault(); dialog.focus(); return; }
      const first = pool[0], last = pool[pool.length - 1];
      const inside = dialog.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
    };
    const onFocusIn = e => { if (!dialog.contains(e.target) && !elsewhere(e.target)) enter(); };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      if (returnTo && typeof returnTo.focus === "function" && document.contains(returnTo)) returnTo.focus();
    };
  }, [open, ref]);
}
