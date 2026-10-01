require('./helpers/pending-game-data.cjs');
const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const{renderToString}=require('react-dom/server');const{JSDOM}=require('jsdom');
const{Roster,Faction,Journal}=require('./helpers/qa-render.cjs');const{loader,staged}=require('./helpers/qa-staged-data.cjs');
const text=node=>{const d=new JSDOM(renderToString(node));const out=d.window.document.body.textContent;d.window.close();return out;};
const e=React.createElement;
test('QA-11 deprecated and malformed roster records stay hidden without dropping saved memberships',()=>{
 const factions=Object.freeze([null,{key:42},{key:'legacy',name:' <DEPRECATED> '},Object.freeze({key:'fighters guild',name:'Fighters Guild',ranks:[],skills:[],favouredAttributes:[]})]);
 const joined=Object.freeze([Object.freeze({id:'legacy',rank:2}),Object.freeze({id:'fighters guild',rank:0})]),before=JSON.stringify(joined);
 for(const category of ['all','joined']){const out=text(e(Roster,{factions,activeCategory:category,joinedFactions:joined,character:{}}));assert.match(out,/Fighters Guild/);assert.doesNotMatch(out,/deprecated/i);assert.match(out,/My Memberships \(1\)/);}
 assert.equal(JSON.stringify(joined),before);
});
test('QA-11 published labels preserve case, punctuation and friendly/hostile values on frozen input',()=>{
 const factions=Object.freeze([{key:'T_CYR_FIGHTERSGUILD',name:'Cyrodiil Fighters Guild'},{key:'t_mw_imperialnavy',name:'East Navy'},{key:'old',name:'<Deprecated>'}]);
 const faction=Object.freeze({key:'local',name:'Local',reactions:Object.freeze([{faction:'t_cyr_fightersguild',adjustment:2},{faction:'T_MW_IMPERIALNAVY',adjustment:-3},{faction:'old',adjustment:1}].map(Object.freeze))}),before=JSON.stringify(faction);
 const out=text(e(Faction,{faction,factions,character:{}}));assert.match(out,/Cyrodiil Fighters Guild: \+2/);assert.match(out,/East Navy: -3/);assert.doesNotMatch(out,/T_cyr|T_mw|Deprecated/i);assert.equal(JSON.stringify(faction),before);
});
test('QA-11 unknown internal IDs are labelled unknown; fallback human names and null input are safe',async()=>{
 const{factionLabel}=await import('../lib/faction-display.mjs');assert.equal(factionLabel('unlisted_mod_id',[]),'Unknown faction');assert.equal(factionLabel(null,[{}]),'Unknown faction');assert.equal(factionLabel('fighters guild',null),'Fighters Guild');
 const out=text(e(Faction,{faction:{key:'local',name:'Local',reactions:[{faction:'unlisted_mod_id',adjustment:1},null]},character:{}}));assert.match(out,/Unknown faction: \+1/);assert.doesNotMatch(out,/unlisted_mod_id/);
});
for(const profile of ['vanilla','tr','tr_arce'])test(`QA-11 Journal catalog integration and visible count: ${profile}`,staged(),async()=>{
 const l=await loader(),factions=await l.loadCatalog(profile,'Factions'),before=JSON.stringify(factions),{isDisplayFaction}=await import('../lib/faction-display.mjs');
 const out=text(e(Journal,{initialFactions:factions,initialQuests:[]}));assert.doesNotMatch(out,/<Deprecated>/i);assert.match(out,new RegExp('Live: '+factions.filter(isDisplayFaction).length+' Factions'));
 if(profile!=='vanilla'){const source=factions.find(f=>f.reactions?.some(r=>r.faction==='t_cyr_fightersguild'));const detail=text(e(Faction,{faction:source,factions,character:{}}));assert.match(detail,/Cyrodiil Fighters Guild/);assert.doesNotMatch(detail,/t_cyr_fightersguild/i);}
 assert.equal(JSON.stringify(factions),before);
});
