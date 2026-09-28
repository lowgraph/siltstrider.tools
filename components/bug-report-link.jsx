const reportBody = [
  "Tool/page:",
  "Profile (Vanilla / TR / TR + ARCE):",
  "OpenMW version and other mods, if relevant:",
  "Steps to reproduce:",
  "Expected result:",
  "Actual result / error reference:",
  "When it happened (include time zone):",
  "Browser and device:",
  "",
  "Please leave out passwords, session tokens, payment details, and private save files.",
].join("\n");

// No browser state, share-link payload, or character data is attached automatically.
const reportHref = `mailto:tmarcalferreira@gmail.com?subject=${encodeURIComponent("Silt Strider bug report")}&body=${encodeURIComponent(reportBody)}`;

export default function BugReportLink({ className }) {
  return <a href={reportHref} className={className}>Report a bug</a>;
}
