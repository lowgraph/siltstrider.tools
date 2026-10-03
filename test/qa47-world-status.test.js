const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load,React}=require('./helpers/launch-render.cjs');
const {renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');

async function status(tool,profile,catalogProfile=profile) {
  const data={profile:catalogProfile,catalogs:{EffectRules:[],GameSettings:[],Enchanters:[],Spellmakers:[],Factions:[],Quests:[]}};
  const before=JSON.stringify(data);
  const character={build:{},sheet:{},updateField(){}};
  const context={useActiveCharacter:()=>character};
  const shell={useShell:()=>({world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',profile,ready:true})};
  const game={useGameData:()=>({status:'ready',data})};
  const link=require('./helpers/active-character-link.cjs');
  let Component;
  if(tool==='factions')Component=(await load('components/journal-factions/journal-factions-root.jsx',{
    '../character-context':context,'../shell-context':shell,'../use-game-data':game,
    '../use-search-intent':{useSearchIntent:()=>null},'../active-character-link':link,
    './faction-roster':{__esModule:true,default:()=>null},'./faction-detail-view':{__esModule:true,default:()=>null},
  })).default;
  else Component=(await load(`components/calculators/${tool}/${tool}-workstation.jsx`,{
    '../../character-context':context,'../../shell-context':shell,'../../use-game-data':game,'../../active-character-link':link,
  })).default;
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component)));
  const badge=[...dom.window.document.querySelectorAll('span')].find(s=>/Live:/.test(s.textContent));
  assert.ok(badge,'Live catalog status is present');
  const text=badge.textContent;dom.window.close();assert.equal(JSON.stringify(data),before,'Rendering does not alter the catalog');
  return text;
}

for(const tool of ['enchanting','spellmaking','factions'])for(const [profile,label] of [['vanilla','Vanilla'],['tr','Tamriel Rebuilt'],['tr_arce','TR + ARCE']])test(`QA-47: ${tool} status names ${label} without exposing ${profile}`,async()=>{
  const text=await status(tool,profile);assert.ok(text.includes(`(${label})`),text);assert.doesNotMatch(text,/TR_ARCE|\(TR\)|\(VANILLA\)/);
});
for(const tool of ['enchanting','spellmaking'])test(`QA-47: ${tool} status uses the selected world when the catalog profile is absent`,async()=>{
  assert.match(await status(tool,'tr_arce',null),/\(TR \+ ARCE\)/);
});
