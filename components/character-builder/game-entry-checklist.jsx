export default function GameEntryChecklist({ build = {} }) {
  const skills = list => Array.isArray(list) && list.length ? list.join(', ') : 'choose five different skills';
  return (
    <details className="game-entry-checklist p-3 border border-line-11 bg-surface-5 text-sm font-serif text-fg-5">
      <summary className="cursor-pointer font-bold text-accent">Enter this character in Morrowind</summary>
      <p className="mt-2">This is a plan; the site does not edit your game or save file. During character creation:</p>
      <ol className="mt-2 list-decimal pl-5 space-y-1">
        <li>Choose {build.gender || 'your sex'} and {build.race || 'your race'}.</li>
        <li>{build.className && build.className !== 'Custom' ? `Select the ${build.className} preset class.` : 'Choose Create Class and enter your custom class name.'}</li>
        <li>For a custom class, select {build.spec || 'your specialization'} and favor {build.fav1 || 'one attribute'} and {build.fav2 || 'a different attribute'}.</li>
        <li>Major skills: {skills(build.maj)}. Minor skills: {skills(build.min)}.</li>
        <li>Choose the birthsign {build.sign || 'you planned'} and compare your starting numbers with the Sheet.</li>
      </ol>
    </details>
  );
}
