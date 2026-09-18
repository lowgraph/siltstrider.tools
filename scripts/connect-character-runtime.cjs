const fs=require('node:fs');const path=require('node:path');
module.exports=function connect(runtime){
 function replace(from,to){if(!runtime.includes(from))throw Error('Character integration anchor missing: '+from.slice(0,70));runtime=runtime.replace(from,to);}
 runtime=runtime.replace(/\bSKILLS\b/g,'characterSkills()').replace('const characterSkills() =','const LEGACY_SKILLS =');
 runtime=runtime.replace(/\bSPEC_SKILLS\b/g,'characterSpecs()').replace('const characterSpecs() =','const LEGACY_SPEC_SKILLS =');
 runtime=runtime.replace(/\bSIGNS\b/g,'characterSigns()');
 replace('function raceTable() {','function raceTable() {\n      if(window.siltCharacters?.active)return window.siltCharacters.active.races;');
 replace('function classTable() {','function classTable() {\n      if(window.siltCharacters?.active)return window.siltCharacters.active.classes;');
 replace('const races = b.arce ? Object.assign({}, RACES, ARCE_RACES) : RACES;','const races = window.siltCharacters?.peek(b.arce ? "tr_arce" : b.world)?.races || (b.arce ? Object.assign({}, RACES, ARCE_RACES) : RACES);');
 replace('const classes = b.arce ? Object.assign({}, VANILLA_CLASS, ARCE_CLASS) : VANILLA_CLASS;','const classes = window.siltCharacters?.peek(b.arce ? "tr_arce" : b.world)?.classes || (b.arce ? Object.assign({}, VANILLA_CLASS, ARCE_CLASS) : VANILLA_CLASS);');
 replace('function normalizeCharacter(b) {','function normalizeCharacter(b) {\n      b = characterLabels(b);');
 replace('RACE_SPELLS[b.race]','(window.siltCharacters?.active?.raceSpells || RACE_SPELLS)[b.race]');
 // SIGN_SPELLS is read inside the starting-spells result.
 runtime=runtime.replace(/SIGN_SPELLS\[b.sign\]/g,'(window.siltCharacters?.active?.signSpells || SIGN_SPELLS)[b.sign]');
 replace('window.addEventListener("hashchange", readShareHash);','window.addEventListener("hashchange", () => { Promise.resolve(readShareHash()).catch(() => {}); });');
 replace('action("load", () => {','action("load", async () => {');
 replace('loadCharacter(record.character);','await loadCharacter(record.character);');
 const helpers=`
function characterSkills(){return window.siltCharacters?.active?.skills || LEGACY_SKILLS;}
function characterSpecs(){return window.siltCharacters?.active?.specSkills || LEGACY_SPEC_SKILLS;}
function characterSigns(){return window.siltCharacters?.active?.signs || SIGNS;}
function characterLabels(b){
 if(!b || typeof b!=='object')return b;
 const data=window.siltCharacters?.peek(b.arce?'tr_arce':b.world);if(!data)return b;
 return {...b,race:data.labelFor('races',b.race),className:b.className==='Custom'?'Custom':data.labelFor('classes',b.className),sign:data.labelFor('signs',b.sign),maj:Array.isArray(b.maj)?b.maj.map(s=>data.labelFor('skills',s)):b.maj,min:Array.isArray(b.min)?b.min.map(s=>data.labelFor('skills',s)):b.min};
}
`;
 return helpers+runtime;
};
