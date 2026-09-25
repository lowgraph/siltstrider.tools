const attributes = ['Strength','Intelligence','Willpower','Agility','Speed','Endurance','Personality','Luck'];
export function distinctFavored(build, previous = {}) {
 if (!build || build.fav1 !== build.fav2 || !attributes.includes(build.fav1)) return build;
 const changedFirst = build.fav1 !== previous.fav1;
 const other = changedFirst ? 'fav2' : 'fav1';
 const replacement = previous[changedFirst ? 'fav1' : 'fav2'];
 return {...build, [other]: attributes.includes(replacement) && replacement !== build.fav1 ? replacement : attributes.find(a=>a!==build.fav1)};
}
