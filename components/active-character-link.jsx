"use client";
import { characterName } from "../lib/character-name.mjs";
import { useActiveCharacter } from "./character-context";
import { useShell } from "./shell-context";

/**
 * SITE-4: every tool uses the one active character, and it is changed in the Character
 * Builder, so wherever a tool names it, the name is a link there. A plain click stays in
 * the page; a modified or middle click opens the Builder as any link would.
 */
export default function ActiveCharacterLink({ build: given = null, className = "" }) {
  const shell = useShell();
  const { build: current } = useActiveCharacter();
  const build = given || current;
  const open = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof shell?.navigate !== "function") return;
    event.preventDefault();
    shell.navigate("builder");
  };
  return (
    <a
      href="/builder"
      onClick={open}
      title="Change this character in the Character Builder"
      className={`active-character-link inline-flex flex-wrap items-baseline gap-x-1 min-h-6 group ${className}`}
      // Inline, since the legacy `a { text-decoration: underline }` in globals.css beats a
      // utility class; the name carries its own dotted underline.
      style={{ textDecoration: "none" }}
    >
      <span className="font-bold text-fg-2 underline decoration-dotted underline-offset-4 group-hover:text-accent">
        {characterName(build)}
      </span>{" "}
      <span className="text-accent font-serif whitespace-nowrap group-hover:underline underline-offset-4">
        · change<span className="sr-only"> in the Character Builder</span>
      </span>
    </a>
  );
}
