const {test}=require('node:test');const assert=require('node:assert/strict');
const {load,React}=require('./helpers/launch-render.cjs');
const {renderToStaticMarkup}=require('react-dom/server');const {JSDOM}=require('jsdom');
const factions=Object.freeze([Object.freeze({key:'fighters guild',name:'Fighters Guild',ranks:[],skills:[],favouredAttributes:[]})]);

for(const [scenario,props] of [
  ['empty catalog',{factions:[]}],
  ['unmatched search',{factions,searchQuery:'not-a-faction'}],
  ['empty memberships',{factions,activeCategory:'joined',joinedFactions:[]}],
])test(`QA-43: ${scenario} announces an empty roster without an invalid listbox`,async()=>{
  const Roster=(await load('components/journal-factions/faction-roster.jsx')).default;
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Roster,{activeCategory:'all',...props})));
  try {
    const status=dom.window.document.querySelector('[aria-label="Factions List"]');
    assert.equal(status.getAttribute('role'),'status');assert.match(status.textContent,/No factions found/);
    assert.equal(status.querySelector('[role=option]'),null);
    assert.equal(dom.window.document.querySelector('[role=listbox]'),null);
  } finally {dom.window.close();}
});

test('QA-43: a populated roster retains its selectable options and original input',async()=>{
  const Roster=(await load('components/journal-factions/faction-roster.jsx')).default,before=JSON.stringify(factions);
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Roster,{factions,activeCategory:'all',selectedFactionKey:'fighters guild'})));
  try {
    const option=dom.window.document.querySelector('[role=listbox] [role=option]');
    assert.equal(option.getAttribute('aria-selected'),'true');assert.match(option.textContent,/Fighters Guild/);
    assert.equal(dom.window.document.querySelector('[aria-label="Factions List"]').getAttribute('role'),'listbox');
    assert.equal(JSON.stringify(factions),before);
  } finally {dom.window.close();}
});
