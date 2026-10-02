export default function CompatibilityNotice({ onConfigure } = {}) {
  return (
    <p className="compatibility-notice text-xs leading-relaxed text-fg-7 border-l-2 border-accent pl-3 my-3">
      <strong className="text-accent">OpenMW only.</strong>{" "}
      Tested with vanilla Morrowind, Tamriel Rebuilt (TR), and TR + ARCE.
      Other mods are untested; imported data and calculations may be incomplete or inaccurate.
      Original Morrowind <code>.ess</code> saves are not supported.
      {" "}You can still enter your race, class, birthsign and skills manually in the Character Builder.
      {onConfigure && <>{" "}<button type="button" className="mw-btn px-2 py-1" onClick={onConfigure}>Enter a character manually</button></>}
    </p>
  );
}
