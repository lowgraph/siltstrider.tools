export function saveMemberships(progress) {
 return (progress?.factions || []).filter(f=>f.rank>=0 || f.expelled).map(f=>({...f,id:String(f.id).toLowerCase()}));
}
export function updateMembership(memberships,updated) {
 const id=String(updated.id).toLowerCase();
 const alreadyJoined=memberships.some(f=>f.id.toLowerCase()===id&&(f.rank>=0||f.expelled));
 if(!alreadyJoined&&(updated.rank>=0||updated.expelled)&&membershipConflict(id,memberships))return memberships;
 return [...memberships.filter(f=>f.id.toLowerCase()!==id),{...updated,id}];
}
import {getMutualExclusionConflict} from './faction-math.mjs';

export function membershipConflict(id, memberships = []) {
 if(typeof id!=='string'||!id.trim())return null;
 const joined=(Array.isArray(memberships)?memberships:[]).filter(f=>typeof f?.id==='string'&&(f.rank>=0||f.expelled));
 return getMutualExclusionConflict(id,joined.map(f=>f.id));
}


export function toggleMembership(memberships, id) {
 if(typeof id!=='string'||!id.trim())return memberships;
 const key=id.toLowerCase();
 if(memberships.some(f=>f.id.toLowerCase()===key))return memberships.filter(f=>f.id.toLowerCase()!==key);
 return updateMembership(memberships,{id:key,rank:0,reputation:0,expelled:false});
}
