// Runs after the verified classic runtime. One snapshot feeds all React tools.
(function () {
  const listeners = new Set();
  const views = {home:'home',challenge:'challenge',build:'builder',leveler:'leveler',about:'about',changelog:'changelog',enchant:'enchanting',spell:'spellmaking',alchemy:'alchemy',travel:'travel'};
  let snapshot, depth=0;
  function publish() {
    const panel=document.querySelector('.panel.show');
    const view=views[panel?.id.replace('panel-','')] || 'home';
    const next={ready:true,world:worldMode,arce:!!arceOn,profile:worldMode==='tr'?(arceOn?'tr_arce':'tr'):'vanilla',view};
    if(snapshot && Object.keys(next).every(key=>next[key]===snapshot[key])) return;
    snapshot=Object.freeze(next);
    listeners.forEach(listener=>listener());
    window.dispatchEvent(new Event('silt-shell-change'));
  }
  function wrap(fn){return function(...args){depth++;try{return fn.apply(this,args);}finally{if(--depth===0)publish();}};}
  showView=wrap(showView);
  setWorld=wrap(setWorld);
  setArce=wrap(setArce);
  loadCharacter=wrap(loadCharacter);
  loadChallengeRun=wrap(loadChallengeRun);
  readShareHash=wrap(readShareHash);
  window.siltShell=Object.freeze({
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    navigate(view){if(!Object.values(views).includes(view))throw new Error('Unknown view');showView(view);},
    setProfile(profile){
      if(!['vanilla','tr','tr_arce'].includes(profile))throw new Error('Unknown profile');
      const apply=()=>{depth++;try{setWorld(profile==='vanilla'?'vanilla':'tr');setArce(profile==='tr_arce');}finally{if(--depth===0)publish();}};
      return window.siltCharacterTransition?window.siltCharacterTransition(profile,apply):apply();
    }
  });
  publish();
})();
