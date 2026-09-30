/** The character's name as Home and every tool show it: its own name, or race and class. */
export function characterName(build = {}) {
  const named = typeof build?.name === "string" && build.name.trim();
  return named ? build.name.trim() : `${build?.race || "Dark Elf"} ${build?.className || "Custom"}`;
}
