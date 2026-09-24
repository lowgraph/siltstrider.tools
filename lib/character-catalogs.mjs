/** Convert catalog facts to the verified calculator's display-name contract. */
const raceLabels={
 't_els_cathay':'Khajiit (Cathay)','t_els_cathay-raht':'Khajiit (Cathay-raht)',
 't_els_dagi-raht':'Khajiit (Dagi-raht)','t_els_ohmes':'Khajiit (Ohmes)',
 't_els_ohmes-raht':'Khajiit (Ohmes-raht)','t_els_suthay':'Khajiit (Suthay)','t_els_tojay':'Khajiit (Tojay)'
};
const title=s=>s.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
const skillLabel=s=>s==='hand_to_hand'?'Hand-to-hand':title(s);
function table(rows,label){
 const out=Object.create(null);
 for(const row of rows){const name=label(row);if(!name||out[name])throw Error('Ambiguous character label: '+name);out[name]=row;}
 return out;
}
export function adaptCharacterCatalogs(bundle,spells){
 const {Races,Classes,Birthsigns,Skills,Attributes}=bundle.catalogs;
 const skills=Skills.slice().sort((a,b)=>Number(a.id)-Number(b.id));
 const skillNames=Object.fromEntries(skills.map(s=>[s.skill,skillLabel(s.skill)]));
 const attrs=Object.fromEntries(Attributes.map(a=>[a.id,a.name]));
 const spellMap=new Map(spells.map(s=>[s.key,s]));
 const resolveSpells=row=>row.spellIds.map(id=>{const s=spellMap.get(id.toLowerCase());if(!s)throw Error('Missing character spell '+id);return s;});
 function bonus(row){
  let mag=0;const fortified={};
  const linked=resolveSpells(row);
  for(const spell of linked.filter(s=>s.type==='ability'))for(const effect of spell.effects){
   if(effect.effectId!==84&&effect.effectId!==79)continue;
   if(effect.magnitude.min!==effect.magnitude.max)throw Error('Variable starting bonus on '+row.id);
   if(effect.effectId===84)mag+=effect.magnitude.min/10;
   else {const name=attrs[effect.attribute];if(!name)throw Error('Unknown ability attribute');fortified[name]=(fortified[name]||0)+effect.magnitude.min;}
  }
  return {mag,attrs:fortified,linked};
 }
 const raceRows=table(Races.filter(r=>r.playable),r=>raceLabels[r.key]||r.name);
 const classRows=table(Classes.filter(c=>c.playable),r=>r.name);
 const signRows=table(Birthsigns,r=>r.name);
 const races=Object.fromEntries(Object.entries(raceRows).map(([name,r])=>{
  const b=bonus(r);const stats=sex=>Object.fromEntries(Object.entries(r.attributes).map(([id,v])=>{if(!attrs[id])throw Error('Unknown attribute '+id);return [attrs[id],v[sex]];}));
  return [name,{key:r.key,M:stats('male'),F:stats('female'),skills:Object.fromEntries(r.skillBonuses.map(s=>{if(!skillNames[s.skill])throw Error('Unknown skill '+s.skill);return [skillNames[s.skill],s.bonus];})),mag:b.mag,abilities:b.linked.map(s=>s.name).join('; '),tip:r.description,beast:r.beast,source:r}];
 }));
 const classes=Object.fromEntries(Object.entries(classRows).map(([name,c])=>[name,{key:c.key,spec:title(c.specialization),fav:c.favoredAttributes.map(id=>attrs[id]),maj:c.majorSkills.map(id=>skillNames[id]),min:c.minorSkills.map(id=>skillNames[id]),source:c}]));
 const signs=Object.fromEntries(Object.entries(signRows).map(([name,s])=>{const b=bonus(s);return [name,{key:s.key,mag:b.mag,attrs:b.attrs,tip:s.description,abil:b.linked.map(s=>s.name).join('; '),source:s}];}));
 const specSkills={Combat:[],Magic:[],Stealth:[]};for(const s of skills){if(!specSkills[title(s.specialization)])throw Error('Invalid skill specialization');specSkills[title(s.specialization)].push(skillNames[s.skill]);}
 const raceMagic=Object.fromEntries(Object.entries(raceRows).map(([n,r])=>[n,resolveSpells(r)]));
 const raceSpells=Object.fromEntries(Object.entries(raceRows).map(([n,r])=>[n,resolveSpells(r).filter(s=>s.type==='spell').map(s=>s.name)]));
 const signSpells=Object.fromEntries(Object.entries(signRows).map(([n,r])=>[n,resolveSpells(r).filter(s=>s.type==='spell').map(s=>s.name)]));
 const identity={races:raceRows,classes:classRows,signs:signRows,skills:table(skills,s=>skillNames[s.skill])};
 function labelFor(kind,value){const entries=Object.entries(identity[kind]||{});if(identity[kind]?.[value])return value;const matches=entries.filter(([,r])=>r.key===value||r.id===value);if(matches.length!==1)throw Error('Unknown or ambiguous '+kind+' choice: '+value);return matches[0][0];}
 return {profile:bundle.profile,bundleId:bundle.bundleId,snapshotId:bundle.snapshotId,races,classes,signs,skills:skills.map(s=>skillNames[s.skill]),specSkills,raceSpells,raceMagic,signSpells,identity,labelFor};
}
export function profileFromLocation(hash,storage){
 const h=(hash||'').replace(/[?&#](run|build)=[^&]*/gi,'').toLowerCase();
 const world=h.match(/(?:^|[&#])world=(vanilla|tr)(?:&|$)/),arce=h.match(/(?:^|[&#])arce=([01])(?:&|$)/);
 let tr=world?world[1]==='tr':/(?:^|[&#])tr(?:&|$)|tamriel|(?:^|[&#])arce(?:&|$)/.test(h);
 let extra=arce?arce[1]==='1':/(?:^|[&#])arce(?:&|$)/.test(h);
 if(!hash||hash==='#')try{tr=storage?.getItem('mw-world')==='tr';extra=storage?.getItem('mw-arce')==='1';}catch{}
 return tr?(extra?'tr_arce':'tr'):'vanilla';
}
export function createCharacterCatalogService(loader){
 const ready=new Map(),pending=new Map();
 const service={active:null,peek:profile=>ready.get(profile),async prepare(profile){
  if(ready.has(profile))return ready.get(profile);
  if(!pending.has(profile))pending.set(profile,Promise.all([loader.loadFeature(profile,'character'),loader.loadCatalog(profile,'Spells')]).then(([bundle,spells])=>{const data=adaptCharacterCatalogs(bundle,spells);ready.set(profile,data);return data;}).finally(()=>pending.delete(profile)));
  return pending.get(profile);
 },activate(profile){const data=ready.get(profile);if(!data)throw Error('Character profile not loaded');service.active=data;return data;}};
 return service;
}
