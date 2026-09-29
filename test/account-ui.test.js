const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const {act}=React;const {createRoot}=require('react-dom/client');const {JSDOM}=require('jsdom');const Module=require('node:module');
test('profile saves numeric icon and username, and clears on account switch',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://site.test/#account'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let listener,stored={username:'OldName',iconId:0},writes=0;window.Clerk={loaded:true,session:{getToken:async()=> 'token'},addListener:fn=>{listener=fn;fn({user:{id:'one'},session:{}});return()=>{};}};
 const previous=global.fetch;global.fetch=async(url,options)=>{if(options.method==='PUT'){stored=JSON.parse(options.body);writes++;}return Response.json(stored);};
 const output=require('esbuild').buildSync({stdin:{contents:"export {AccountProvider,useAccount} from './components/account-context.jsx'; export {default as ProfileIcon} from './components/profile-icon.jsx';",resolveDir:process.cwd(),loader:'jsx'},jsx:'automatic',bundle:true,write:false,platform:'node',format:'cjs',external:['react']});const m=new Module(__filename,module);m.paths=module.paths;m._compile(output.outputFiles[0].text,__filename);const {AccountProvider,useAccount,ProfileIcon}=m.exports;let account;
 function View(){account=useAccount();return React.createElement(ProfileIcon,{id:account.profile?.iconId});}
 const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(AccountProvider,null,React.createElement(View))));assert.equal(account.profile.username,'OldName');await act(async()=>account.save({username:'NewName',iconId:1}));assert.equal(writes,1);assert.equal(account.profile.username,'NewName');assert.equal(document.querySelector('svg').getAttribute('aria-label'),'Silt Strider');await act(async()=>listener({user:null,session:null}));assert.equal(account.profile,null);assert.equal(account.user,null);}finally{await act(async()=>root.unmount());global.fetch=previous;dom.window.close();}
});
test('a signed-out visitor loads no Clerk until they sign in, then the account attaches',async()=>{
 const dom=new JSDOM('<meta name="clerk-publishable-key" content="pk_live_Y2xlcmsuc2lsdHN0cmlkZXIudG9vbHMk"><div id="root"></div>',{url:'https://siltstrider.tools/account'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let injected=0;document.head.appendChild=el=>{injected++;return el;};
 const previous=global.fetch;let requests=0;global.fetch=async()=>{requests++;return Response.json({username:'Tester',iconId:2});};
 const output=require('esbuild').buildSync({stdin:{contents:"export {AccountProvider,useAccount} from './components/account-context.jsx';",resolveDir:process.cwd(),loader:'jsx'},jsx:'automatic',bundle:true,write:false,platform:'node',format:'cjs',external:['react']});const m=new Module(__filename,module);m.paths=module.paths;m._compile(output.outputFiles[0].text,__filename);const {AccountProvider,useAccount}=m.exports;let account;
 function View(){account=useAccount();return null;}
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(AccountProvider,null,React.createElement(View))));
  assert.equal(injected,0,'no Clerk script for a visitor who has not signed in');
  assert.equal(account.loading,false,'the account page offers Sign in instead of waiting');
  assert.equal(account.user,null);assert.equal(requests,0);
  // The Sign in button loads Clerk; its ready event attaches the account.
  window.Clerk={loaded:true,session:{getToken:async()=>'token'},addListener:fn=>{fn({user:{id:'one'},session:{}});return()=>{};}};
  await act(async()=>window.dispatchEvent(new window.Event('silt-auth-ready')));
  assert.equal(account.user.id,'one');assert.equal(account.profile.username,'Tester');assert.equal(requests,1);
  await act(async()=>window.dispatchEvent(new window.Event('silt-auth-ready')));
  assert.equal(requests,1,'a second ready event does not attach twice');
 }finally{await act(async()=>root.unmount());global.fetch=previous;dom.window.close();}
});
