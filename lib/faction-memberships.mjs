export function saveMemberships(progress) {
 return (progress?.factions || []).filter(f=>f.rank>=0 || f.expelled).map(f=>({...f,id:String(f.id).toLowerCase()}));
}
export function updateMembership(memberships,updated) {
 const id=String(updated.id).toLowerCase();
 return [...memberships.filter(f=>f.id.toLowerCase()!==id),{...updated,id}];
}
