const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');
const {renderToString}=require('react-dom/server');const {hydrateRoot}=require('react-dom/client');const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');const {todo,loader,save}=require('./helpers/qa-staged-data.cjs');
const ui=require('./helpers/qa-render.cjs');
let api=()=>({});
let unavailableCatalogs=false;
const originalFetch=global.fetch;
global.fetch=async (url,options={})=>{
  const pathname=new URL(String(url),'http://localhost').pathname;
  if(unavailableCatalogs && /\/(tr|tr_arce)\//.test(pathname)) throw Error('QA catalog unavailable');
  if(pathname.startsWith('/game-data/')) return new Response(fs.readFileSync(path.join(__dirname,'../public',pathname)));
  return Response.json(await api(pathname,options));
};
const e=React.createElement;
async function mount(child,{url='http://localhost/builder',storage={},sessionStorage={},signedIn=false,account=false,initialBuild=null}={}) {
  delete global.window;delete global.document;
  const tree=()=>{let node=e(ui.ShellProvider,null,e(ui.CharacterProvider,{initialBuild},child));if(account)node=e(ui.AccountProvider,null,e(ui.AccountSettingsProvider,null,node));return node;};
  const html=renderToString(tree()),dom=new JSDOM('<div id="root">'+html+'</div>',{url});
  Object.assign(global,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,Event:dom.window.Event,CustomEvent:dom.window.CustomEvent,IS_REACT_ACT_ENVIRONMENT:true});
  Object.defineProperty(global,'navigator',{configurable:true,value:dom.window.navigator});
  for(const [key,value] of Object.entries(storage))window.localStorage.setItem(key,value);
  for(const [key,value] of Object.entries(sessionStorage))window.sessionStorage.setItem(key,value);
  let copied='',listeners=[];
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});
  const user={id:'user_qa_reproduction',fullName:'QA – Reproduction'},session={getToken:async()=> 'qa-synthetic-token'};
  window.Clerk={loaded:true,user:signedIn?user:null,session:signedIn?session:null,addListener(fn){listeners.push(fn);fn({user:this.user,session:this.session});return()=>{listeners=listeners.filter(f=>f!==fn);};},async signOut(){}};
  if(signedIn)document.cookie='__client_uat=1';
  let root;const errors=[];
  await React.act(async()=>{root=hydrateRoot(document.getElementById('root'),tree(),{onRecoverableError:error=>errors.push(String(error))});});
  return {dom,errors,copied:()=>copied,async wait(predicate){for(let i=0;i<100;i++){if(predicate())return;await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});}assert.ok(predicate(),'QA fixture settled');},async close(){await React.act(async()=>root.unmount());dom.window.close();}};
}
const build={world:'tr',arce:true,name:'QA – Cathay-raht',race:'Khajiit (Cathay-raht)',gender:'Female',className:'Mage',sign:'The Tower',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};

test('QA-21 unavailable catalogs fail the Vault load without clearing the current character',async()=>{
  let character,shell,vault;
  api=pathname=>pathname==='/api/saves/qa-build'?{save:{id:'qa-build',name:build.name,save_type:'character_build',data:build}}:{};
  function Probe(){character=ui.useActiveCharacter();shell=ui.useShell();vault=ui.useCloudVault({onApplyBuild:character.loadBuild});return null;}
  const mounted=await mount(e(Probe),{signedIn:true});
  try {
    await mounted.wait(()=>shell.ready&&character.catalogs);
    const before=character.build;
    unavailableCatalogs=true;
    let result;await React.act(async()=>{result=await vault.loadSaveIntoSession('qa-build');});
    assert.equal(result.success,false);
    assert.match(result.error,/QA catalog unavailable/);
    assert.equal(shell.profile,'vanilla');
    assert.deepEqual(character.build,before);
  } finally {unavailableCatalogs=false;await mounted.close();}
});

test('QA-21 Vault load applies the stored build world like a shared link',async()=>{
  let character,shell,vault;api=pathname=>pathname==='/api/saves/qa-build'?{save:{id:'qa-build',name:build.name,save_type:'character_build',data:build}}:{};
  function Probe(){character=ui.useActiveCharacter();shell=ui.useShell();vault=ui.useCloudVault({onApplyBuild:character.loadBuild});return null;}
  const mounted=await mount(e(Probe),{signedIn:true});
  try {await mounted.wait(()=>shell.ready);await React.act(async()=>{const result=await vault.loadSaveIntoSession('qa-build');assert.equal(result.success,true);});assert.deepEqual(mounted.errors,[]);assert.deepEqual([shell.world,shell.arce],['tr',true],'Vault load activates the build profile');}
  finally {await mounted.close();}
});

test('QA-22 imported-save permalink describes the resolved save, including world and gender',todo('QA-22'),async()=>{
  const raw=save();raw.identity.name='QA – Imported Cathay-raht';raw.identity.race='T_Els_Cathay-raht';raw.identity.gender='Female';raw.identity.birthsign='Hara';raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm','ARCE - All Races and Classes Enabled.esp');
  const l=await loader(),{adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs'),{buildFromSave}=await import('../lib/omwsave-import.mjs'),{decodeShareUrl}=await import('../lib/permalink-codec.mjs');
  const catalogs=adaptCharacterCatalogs(await l.loadFeature('tr_arce','character'),await l.loadCatalog('tr_arce','Spells'));
  const resolved=buildFromSave(raw,catalogs,{profile:'tr_arce'}).build;let vault;
  function Probe(){vault=ui.useCloudVault();return null;}
  const mounted=await mount(e(Probe));
  try {let result;await React.act(async()=>{result=await vault.shareBuildLink({id:'qa-save',save_type:'openmw_save',race:raw.identity.race,class_name:'mage',birthsign:'Hara',data:raw});});assert.equal(result.success,true);const decoded=decodeShareUrl(result.url);assert.deepEqual({world:decoded.world,arce:decoded.arce,race:decoded.build.race,gender:decoded.build.gender,className:decoded.build.className,maj:decoded.build.maj,min:decoded.build.min},{world:'tr',arce:true,race:resolved.race,gender:'Female',className:resolved.className,maj:resolved.maj,min:resolved.min});}
  finally {await mounted.close();}
});

test('QA-22 challenge permalink keeps the rolled world after the visitor changes world',todo('QA-22'),async()=>{
  const {formatRunSeed,generateSeededRun}=await import('../lib/challenge-engine.mjs'),{decodeShareUrl}=await import('../lib/permalink-codec.mjs');
  const seed=formatRunSeed({code:'QA222',profile:'vanilla',allowedBands:{Easy:true},restrictionCount:1,objectiveCount:1});
  const run=generateSeededRun(seed,{world:'vanilla'}).run;let challenge;
  function Probe(){challenge=ui.useChallengeRun();return e(ui.Challenge);}
  const mounted=await mount(e(ui.ChallengeRunProvider,null,e(Probe)),{url:'http://localhost/challenge',storage:{'mw-world':'tr'}});
  try {await React.act(async()=>challenge.setRun(run));const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Copy Permalink');assert.ok(button,'real copy control');await React.act(async()=>button.click());const decoded=decodeShareUrl(mounted.copied());assert.equal(decoded.run.seed,seed);assert.equal(decoded.world,'vanilla','run profile wins over visitor TR');}
  finally {await mounted.close();}
});

test('QA-23 hydrated sign-in hand-off keeps browser world until an account chooses it',async()=>{
  const {defaultAccountSettings}=await import('../lib/account-settings.mjs'),{HANDOFF_KEY}=await import('../lib/sign-in-handoff.mjs');
  let finishSettings,shell,character;api=pathname=>pathname==='/api/settings'?new Promise(resolve=>{finishSettings=resolve;}):{username:'QA_Reproduction',iconId:0};
  function Probe(){shell=ui.useShell();character=ui.useActiveCharacter();return null;}
  const mounted=await mount(e(Probe),{account:true,signedIn:true,storage:{'mw-world':'tr','mw-arce':'1'},sessionStorage:{[HANDOFF_KEY]:JSON.stringify({at:Date.now(),build})}});
  try {await mounted.wait(()=>finishSettings&&shell.ready);assert.equal(shell.profile,'tr_arce','browser world before the account response');assert.equal(character.build.name,build.name,'actual sign-in hand-off restored');await React.act(async()=>{finishSettings({settings:defaultAccountSettings(),revision:0});});assert.deepEqual(mounted.errors,[],'no hydration mismatch');assert.equal(shell.profile,'tr_arce','an untouched account must not override the browser');}
  finally {await mounted.close();}
});

test('QA-23 restored ARCE save keeps its identity when untouched account settings arrive late',async()=>{
  const {defaultAccountSettings}=await import('../lib/account-settings.mjs');
  const {rememberSave}=await import('../lib/active-save-store.mjs');
  const raw=save();raw.identity.name='QA – Sign-in save';raw.identity.race='T_Els_Cathay-raht';raw.identity.gender='Female';
  raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm','ARCE - All Races and Classes Enabled.esp');
  const storage={'mw-world':'tr','mw-arce':'1'};await rememberSave(raw,{setItem:(key,value)=>storage[key]=value});
  let finishSettings,character,shell;
  api=pathname=>pathname==='/api/settings'?new Promise(resolve=>{finishSettings=resolve;}):{username:'QA_Reproduction',iconId:0};
  function Probe(){character=ui.useActiveCharacter();shell=ui.useShell();return null;}
  const mounted=await mount(e(Probe),{account:true,signedIn:true,storage});
  try {
    await mounted.wait(()=>finishSettings&&character.activeSave&&character.sheet);
    await React.act(async()=>finishSettings({settings:defaultAccountSettings(),revision:0}));
    assert.equal(shell.profile,'tr_arce');assert.equal(character.build.race,build.race);
    assert.equal(character.build.gender,'Female');assert.equal(character.build.name,raw.identity.name);
    assert.ok(character.sheet);assert.deepEqual(mounted.errors,[]);
  } finally {await mounted.close();}
});

test('QA-24 sign-out preserves an unsaved character before Clerk navigation',async()=>{
  const {SIGN_OUT_HANDOFF_KEY}=await import('../lib/sign-in-handoff.mjs'),{defaultAccountSettings}=await import('../lib/account-settings.mjs');
  api=pathname=>pathname==='/api/settings'?{settings:defaultAccountSettings(),revision:0}:{username:'QA_Reproduction',iconId:0};
  const mounted=await mount(e(ui.AccountPage),{url:'http://localhost/account',account:true,signedIn:true,initialBuild:{...build,world:'vanilla',arce:false,race:'Breton'}});
  try {await mounted.wait(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Sign out'));let kept;window.Clerk.signOut=async()=>{kept=JSON.parse(window.sessionStorage.getItem(SIGN_OUT_HANDOFF_KEY)||'null');};await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Sign out').click());assert.equal(kept?.build?.name,build.name,'unsaved character is kept before the redirect');}
  finally {await mounted.close();}
});

test('QA-24 hydrated sign-out return preserves ARCE identity and loadouts over a Vanilla guest world', async () => {
  const { SIGN_OUT_HANDOFF_KEY, keepCharacterForSignOut } = await import('../lib/sign-in-handoff.mjs');
  const kept = { ...build, loadouts: [{ name: 'QA – Equipped', slots: { cuirass: 'QA_cuirass' } }] };
  const values = {};
  keepCharacterForSignOut(kept, { storage: { setItem: (key, value) => { values[key] = value; } } });
  let character, shell;
  function Probe() { character = ui.useActiveCharacter(); shell = ui.useShell(); return e('p', null, character.build.race); }
  const mounted = await mount(e(Probe), { url: 'http://localhost/', sessionStorage: values });
  try {
    await mounted.wait(() => shell.ready && shell.profile === 'tr_arce');
    assert.deepEqual(mounted.errors, [], 'server and first render still agree');
    assert.equal(character.build.name, kept.name);
    assert.equal(character.build.race, kept.race);
    assert.equal(character.build.gender, 'Female');
    assert.equal(character.build.sign, 'The Tower');
    assert.deepEqual(character.build.maj, kept.maj);
    assert.deepEqual(character.build.loadouts, kept.loadouts);
    assert.equal(window.sessionStorage.getItem(SIGN_OUT_HANDOFF_KEY), null);
  } finally { await mounted.close(); }
  const fresh = await mount(e(Probe), { url: 'http://localhost/' });
  try { assert.notEqual(character.build.name, kept.name, 'a later ordinary reload does not restore it again'); }
  finally { await fresh.close(); }
});

test('QA-24 shared build links win over a sign-out return marker', async () => {
  const { SIGN_OUT_HANDOFF_KEY } = await import('../lib/sign-in-handoff.mjs');
  const { encodeShareUrl } = await import('../lib/permalink-codec.mjs');
  const shared = { ...build, name: 'QA – Shared Nord', race: 'Nord', world: 'vanilla', arce: false };
  let character, shell;
  function Probe() { character = ui.useActiveCharacter(); shell = ui.useShell(); return null; }
  const mounted = await mount(e(Probe), { url: new URL(encodeShareUrl({ view: 'builder', world: 'vanilla', build: shared }), 'http://localhost').href,
    sessionStorage: { [SIGN_OUT_HANDOFF_KEY]: JSON.stringify({ at: Date.now(), build }) } });
  try {
    await mounted.wait(() => shell.ready);
    assert.equal(character.build.name, shared.name);
    assert.equal(character.build.race, 'Nord');
    assert.equal(shell.profile, 'vanilla');
    assert.equal(window.sessionStorage.getItem(SIGN_OUT_HANDOFF_KEY), null);
    assert.deepEqual(mounted.errors, []);
  } finally { await mounted.close(); }
});

test('QA-24 a failed Clerk sign-out removes the marker and keeps the current character', async () => {
  const { SIGN_OUT_HANDOFF_KEY } = await import('../lib/sign-in-handoff.mjs');
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  api = pathname => pathname === '/api/settings' ? { settings: defaultAccountSettings(), revision: 0 } : { username: 'QA_Reproduction', iconId: 0 };
  const mounted = await mount(e(ui.AccountPage), { url: 'http://localhost/account', account: true, signedIn: true,
    initialBuild: { ...build, world: 'vanilla', arce: false, race: 'Breton' } });
  try {
    await mounted.wait(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Sign out'));
    window.Clerk.signOut = async () => { throw Error('QA sign-out failed'); };
    await React.act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Sign out').click());
    assert.equal(window.sessionStorage.getItem(SIGN_OUT_HANDOFF_KEY), null);
    assert.ok(document.body.textContent.includes('QA sign-out failed'));
    assert.deepEqual(mounted.errors, []);
  } finally { await mounted.close(); }
});

test('QA-24 loaded saves skip the unsaved sign-out marker and remain restorable', async () => {
  const { SIGN_OUT_EVENT, SIGN_OUT_HANDOFF_KEY } = await import('../lib/sign-in-handoff.mjs');
  const { rememberSave } = await import('../lib/active-save-store.mjs');
  let character;
  function Probe() { character = ui.useActiveCharacter(); return null; }
  const mounted = await mount(e(Probe));
  const raw = save(); raw.identity.name = 'QA – Loaded sign-out control';
  let values;
  try {
    await React.act(async () => { await character.loadSave(raw); });
    await rememberSave(raw);
    await React.act(async () => window.dispatchEvent(new Event(SIGN_OUT_EVENT)));
    assert.equal(window.sessionStorage.getItem(SIGN_OUT_HANDOFF_KEY), null);
    values = Object.fromEntries(Object.keys(window.localStorage).map(key => [key, window.localStorage.getItem(key)]));
  } finally { await mounted.close(); }
  const returned = await mount(e(Probe), { storage: values });
  try {
    await returned.wait(() => character.activeSave);
    assert.equal(character.activeSave.save.identity.name, raw.identity.name);
    assert.equal(character.build.name, raw.identity.name);
    assert.deepEqual(returned.errors, []);
  } finally { await returned.close(); }
});

test('QA-25 loaded save cannot override an explicit Travel starting point',todo('QA-25'),async()=>{
  const {rememberSave}=await import('../lib/active-save-store.mjs');const storage={};const raw=save();raw.identity.name='QA – Route Traveller';await rememberSave(raw,{setItem:(key,value)=>storage[key]=value});
  api=()=>({});let character;function Probe(){character=ui.useActiveCharacter();return e(ui.Travel);}
  const mounted=await mount(e(Probe),{url:'http://localhost/travel?from=Balmora&to=Ald-ruhn&plan=time',storage});
  try {await mounted.wait(()=>character.activeSave&&document.querySelector('#travel-origin')?.value&&document.querySelector('#travel-network-status')?.textContent.includes('stops'));await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,100));});assert.equal(new URL(window.location.href).searchParams.get('plan'),'time');assert.equal(document.querySelector('#travel-origin').value,'Balmora','explicit link wins after asynchronous save restoration');}
  finally {await mounted.close();}
});

test('QA-21 legacy builds retain the current world and valid equipment; bad skills use defaults', async()=>{
  let character,shell;
  api=()=>({});
  function Probe(){character=ui.useActiveCharacter();shell=ui.useShell();return null;}
  const mounted=await mount(e(Probe),{storage:{'mw-world':'tr','mw-arce':'1'}});
  try {
    await mounted.wait(()=>shell.profile==='tr_arce'&&character.catalogs?.profile==='tr_arce');
    const legacy={...build,maj:'invalid',min:[],loadouts:[{id:'early',name:'QA – Equipment',items:[]}]};
    delete legacy.world;delete legacy.arce;
    await React.act(async()=>character.loadBuild(legacy));
    assert.equal(shell.profile,'tr_arce');
    assert.equal(character.build.race,build.race);
    assert.equal(character.build.maj.length,5);
    assert.equal(character.build.min.length,5);
    assert.deepEqual(character.build.loadouts,legacy.loadouts);
    assert.ok(character.sheet);
    assert.deepEqual(mounted.errors,[]);
  } finally {await mounted.close();}
});

test('QA-21 invalid world, unreadable build and missing race leave the loaded save intact',async()=>{
  let character,shell;
  api=()=>({});
  function Probe(){character=ui.useActiveCharacter();shell=ui.useShell();return null;}
  const mounted=await mount(e(Probe));
  try {
    await mounted.wait(()=>shell.ready&&character.catalogs);
    await React.act(async()=>character.loadSave(save()));
    const before=character.build,active=character.activeSave,profile=shell.profile;
    for(const input of [null,{...build,world:'other'},{...build,arce:'false'},{...build,race:'Missing QA race'}]) {
      await React.act(async()=>assert.rejects(()=>character.loadBuild(input)));
      assert.deepEqual(character.build,before);
      assert.equal(character.activeSave,active);
      assert.equal(shell.profile,profile);
    }
  } finally {await mounted.close();}
});

test.after(()=>{global.fetch=originalFetch;});
