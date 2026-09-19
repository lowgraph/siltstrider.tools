"use client";

function SkillGroup({ title, skills, skillData = {} }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="skill-group my-2.5">
      <h4 className="text-xs sm:text-sm uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#2a2318] pb-1 mb-2">
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {skills.map((sk, idx) => {
          const item = skillData[sk] || { v: 5, parts: [] };
          const bonusParts = (item.parts || []).filter((p) => p !== "5 base");
          const bonusTip = bonusParts.length > 0 ? bonusParts.join(" · ") : "";
          const isAlt = Math.floor(idx / 2) % 2 === 1;

          return (
            <div
              key={sk}
              className={`skill-row flex items-center justify-between px-2.5 py-1 min-h-[28px] text-sm transition-colors ${
                isAlt ? "bg-[#18130c]" : "bg-[#100d08]"
              } hover:bg-[#251e14] border border-[#201910]`}
              title={bonusTip ? `${sk}: ${bonusTip}` : sk}
            >
              <span className="font-serif text-[#f3e6c8] truncate pr-2">{sk}</span>
              <span className="font-mono font-bold text-[#d4b06a]">{item.v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SkillDisplayGrid({ maj = [], min = [], skills = {} }) {
  const allSkillNames = Object.keys(skills).sort();
  const otherSkills = allSkillNames.filter(
    (sk) => !maj.includes(sk) && !min.includes(sk)
  );

  return (
    <div className="skill-display-grid space-y-3 py-1">
      <SkillGroup title="Major Skills" skills={maj} skillData={skills} />
      <SkillGroup title="Minor Skills" skills={min} skillData={skills} />
      {otherSkills.length > 0 && (
        <SkillGroup title="Miscellaneous Skills" skills={otherSkills} skillData={skills} />
      )}
    </div>
  );
}
