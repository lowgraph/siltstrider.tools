const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const React=require('react'),{JSDOM}=require('jsdom');
for(const tool of ['alchemy','enchanting','spellmaking']) test(tool+' uses loaded and saved attributes, including zero',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let character={build:{},sheet:null};
 const fakeData={status:'ready',data:{profile:'vanilla',catalogs:{Attributes:[],Skills:[],MagicEffects:[],EffectRules:[],Ingredients:[],Apparatus:[],GameSettings:[]}}};
 const deps={'../../character-context':{useActiveCharacter:()=>character},'../../shell-context':{useShell:()=>({profile:'vanilla',world:'vanilla'})},'../../use-game-data':{useGameData:()=>fakeData},'../../use-search-intent':{useSearchIntent:()=>null}};
 if(tool==='alchemy') deps['../../../lib/alchemy-catalogs.mjs']={adaptAlchemy:()=>({ingredients:[],apparatus:{mortar:[],alembic:[],retort:[],calcinator:[]},settings:{}})};
 const file=path.resolve('components/calculators/'+tool+'/'+tool+'-workstation.jsx');
 const code=require('esbuild').transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code;
 for(const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) if(!deps[match[1]])deps[match[1]]=await import(require('node:url').pathToFileURL(path.resolve(path.dirname(file),match[1])));
 const m=new Module(file,module);m.paths=module.paths;m.require=id=>deps[id]||require(id);m._compile(code,file);
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 const render=()=>React.act(async()=>root.render(React.createElement(m.exports.default)));
 try{
  await render();
  character={build:{},sheet:{attrs:{Intelligence:{v:73},Willpower:{v:31},Luck:{v:0}},skills:{}}};await render();
  assert.match(document.body.textContent,tool==='spellmaking'?/WIL: 31/:/INT: 73/);assert.match(document.body.textContent,/LUK: 0/);
  character={...character,activeSave:{sheet:{attrs:{Intelligence:{v:91},Willpower:{v:82},Luck:{v:67}},skills:{}}}};await render();
  assert.match(document.body.textContent,tool==='spellmaking'?/WIL: 82/:/INT: 91/);assert.match(document.body.textContent,/LUK: 67/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
