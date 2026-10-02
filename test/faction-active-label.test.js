const {test}=require('node:test');const assert=require('node:assert/strict');const {React,load,mount}=require('./helpers/launch-render.cjs');
const factions=[{key:'fighters guild',name:'Fighters Guild',ranks:[]},{key:'ashlanders',name:'Ashlanders',ranks:[]}];
async function fixture(check,initial=factions){
  let roster;
  const Journal=(await load('components/journal-factions/journal-factions-root.jsx',{
    '../shell-context':{useShell:()=>({profile:'vanilla',ready:true})},
    '../character-context':{useActiveCharacter:()=>({sheet:null,build:{},updateField(){}})},
    '../use-game-data':{useGameData:()=>({status:'ready',data:{catalogs:{Factions:factions}}})},
    '../use-search-intent':{useSearchIntent:()=>null},
    './faction-roster':{__esModule:true,default:p=>{roster=p;return null;}},
    './faction-detail-view':{__esModule:true,default:()=>null},
    '../active-character-link':require('./helpers/active-character-link.cjs')
  })).default;
  await mount(Journal,root=>check(()=>roster,root,Journal),{initialFactions:initial});
}
const label=()=>document.querySelector('.faction-active-label');
test('SS-08 initial active label is outside the scrolling details and announces changes',()=>fixture(async()=>{
  assert.equal(label().textContent,'Viewing Fighters Guild');assert.equal(label().getAttribute('role'),'status');assert.equal(label().getAttribute('aria-atomic'),'true');
}));
test('SS-08 search cannot hide the active identity; changing selection updates it',()=>fixture(async(roster)=>{
  await React.act(async()=>roster().onSearchChange('no match'));assert.equal(label().textContent,'Viewing Fighters Guild');
  await React.act(async()=>roster().onSelectFaction('ashlanders'));assert.equal(label().textContent,'Viewing Ashlanders');
}));
test('SS-08 a changed catalog or empty roster displays its actual details selection',()=>fixture(async(roster,root,Journal)=>{
  await React.act(async()=>root.render(React.createElement(Journal,{initialFactions:[factions[1]]})));assert.equal(label().textContent,'Viewing Ashlanders');
  await React.act(async()=>root.render(React.createElement(Journal,{initialFactions:[]})));assert.match(label().textContent,/Select a faction/);
}));
