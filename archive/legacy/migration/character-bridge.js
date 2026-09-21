// Catalog transitions stay asynchronous at the UI boundary; calculators stay synchronous.
(function(){
 if(!window.siltCharacters)return;
 let generation=0;
 function announce(state){window.dispatchEvent(new CustomEvent('silt-character-status',{detail:state}));}
 function activate(profile){
  window.siltCharacters.activate(profile);
  for(const p of ['c','r']){
   const select=document.getElementById(p+'-sign'),keep=select.value;
   fillSelect(select,Object.keys(characterSigns()));if(characterSigns()[keep])select.value=keep;
  }
  for(const id of SKILL_IDS.concat(RAND_SKILL_IDS))fillSkillSelect(document.getElementById(id));
 }
 window.siltCharacterTransition=function(profile,action,validate){
  const ticket=++generation;
  const finish=()=>{if(ticket!==generation)return;if(validate){try{validate();}catch(error){announce({status:'ready'});throw error;}}activate(profile);const result=action();announce({status:'ready'});return result;};
  if(window.siltCharacters.peek(profile))return finish();
  announce({status:'loading'});
  return window.siltCharacters.prepare(profile).then(finish,error=>{if(ticket===generation)announce({status:'error',message:error.message,retry:()=>window.siltCharacterTransition(profile,action,validate)});throw error;});
 };
 const originalLoad=loadCharacter;
 loadCharacter=function(character,panel){
  if(!character||!['vanilla','tr'].includes(character.world)||typeof character.arce!=='boolean'||(character.arce&&character.world!=='tr'))return originalLoad(character,panel);
  const profile=character.arce?'tr_arce':character.world;
  // Validate before switching live data or controls; use catalogue labels once loaded.
  return window.siltCharacterTransition(profile,()=>originalLoad(character,panel),()=>{if(panel!==undefined&&panel!=='c'&&panel!=='r')throw Error('Unknown character panel');normalizeCharacter(character);});
 };
 const originalRun=loadChallengeRun;
 loadChallengeRun=function(run){
  const c=run?.character;
  if(!c||!['vanilla','tr'].includes(c.world)||typeof c.arce!=='boolean'||(c.arce&&c.world!=='tr'))return originalRun(run);
  return window.siltCharacterTransition(c.arce?'tr_arce':c.world,()=>originalRun(run),()=>normalizeChallengeRun(run));
 };
 const originalRead=readShareHash;
 readShareHash=function(){const profile=window.siltCharacters.profileFromLocation();return window.siltCharacterTransition(profile,originalRead);};
})();
