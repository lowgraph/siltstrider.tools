"use client";
import { useActiveCharacter } from "../character-context";
import { useSaveClearConfirmation } from "./use-save-clear-confirmation";

const PROFILE_LABELS = { vanilla: "Morrowind", tr: "Tamriel Rebuilt", tr_arce: "Tamriel Rebuilt + ARCE" };

/**
 * What the loaded .omwsave became, and everything it could not carry across: build
 * fields and worn items the profile's data does not have, and values where the save's
 * mods disagree with the site's rules. Renders nothing when no save is loaded.
 */
export default function SaveImportNotice({ compact = false }) {
  const { activeSave, clearSave } = useActiveCharacter();
  const { requestClear, dialog } = useSaveClearConfirmation(activeSave, clearSave);
  if (!activeSave) return null;

  const identity = activeSave.save?.identity || {};
  const unresolved = activeSave.unresolved || [];
  const unworn = activeSave.unworn || [];
  const differences = activeSave.rules?.differences || [];
  const unchecked = activeSave.rules?.unchecked || [];
  const issues = unresolved.length + unworn.length + differences.length;

  return (
    <div className="save-import-notice bg-surface-2 border border-line-11 p-3 mb-4 text-xs font-serif text-fg-5" role="status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-accent">{identity.name || "Save"}</strong>
          {`, level ${identity.level ?? 1}`}
          {activeSave.className ? ` ${activeSave.className}` : ""}
          {` · loaded from a save as ${PROFILE_LABELS[activeSave.profile] || activeSave.profile}`}
          {activeSave.contentFileCount ? ` · the save loads ${activeSave.contentFileCount} content files` : ""}
          {" · kept in this browser until you clear it"}
        </span>
        <button type="button" className="mw-btn px-2 py-1 text-[11px] font-bold" onClick={requestClear}>
          Clear save
        </button>
      </div>
      {activeSave.contentFileCount > 0 && <p className="content-files-help mt-2 text-fg-7">
        Content files are the game, expansion and mod files recorded by this save, not extra save files to upload.
      </p>}
      {!compact && issues > 0 && <p className="save-difference-help mt-2 text-fg-7">
        These are differences between your save and the site’s published data, not damage to your save.
        The site uses the kept values below or its own rules where something cannot be matched;
        results for those fields may differ in your game. Check the selected world and any extra mods.
        Your original file is unchanged. You can adjust the build manually or clear this loaded copy.
      </p>}
      {!compact && issues > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-fg-2">
            {issues} thing{issues === 1 ? "" : "s"} the site could not carry across exactly
          </summary>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            {unresolved.map((u) => (
              <li key={`field-${u.field}`}>
                {u.field}: {String(u.value ?? "not recorded")} ({u.why}); kept {String(u.kept ?? "the current value")}
              </li>
            ))}
            {unworn.map((u) => (
              <li key={`worn-${u.slot}`}>
                Worn {u.slot}: {u.id}, which this profile's data does not include
              </li>
            ))}
            {differences.length > 0 && (
              <li>
                Where the save's mods differ from the site's rules (save, then site):{" "}
                {differences.map((d) => `${d.what} ${d.save} vs ${d.rules}`).join("; ")}
              </li>
            )}
          </ul>
        </details>
      )}
      {dialog}
      {!compact && unchecked.map((line) => (
        <p key={line} className="mt-1 text-fg-14">{line}</p>
      ))}
    </div>
  );
}
