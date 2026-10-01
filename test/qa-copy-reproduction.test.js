require('./helpers/pending-game-data.cjs');
const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const {renderToString}=require('react-dom/server');
const {loader,todo}=require('./helpers/qa-staged-data.cjs');const {About,Premades,Roster,Faction}=require('./helpers/qa-render.cjs');
const text=html=>new (require('jsdom').JSDOM)(html).window.document.body.textContent;
test('QA-12 premades describe playstyle, a trade-off, Major and Minor skills',todo('QA-12'),()=>{
  const rendered=text(renderToString(React.createElement(Premades,{activeProfile:'vanilla',onSelectBuild:()=>{}})));
  assert.match(rendered,/plays like/i);assert.match(rendered,/trade.off/i);assert.doesNotMatch(rendered,/\bMaj:|\bMin:/);
});
test('QA-15 About attributes open-source code, AGPL and LowGraph with repository link',todo('QA-15'),()=>{
  const html=renderToString(React.createElement(About)),rendered=text(html);
  assert.match(rendered,/open source/i);assert.match(rendered,/AGPL-3.0/);assert.match(rendered,/LowGraph/);assert.match(html,/https:\/\/github.com\/lowgraph\/siltstrider.tools/);
});
test('QA-15 claim scan permits describing the code as open source',()=>{
  const source=require('fs').readFileSync(require('path').join(__dirname,'site-claims.test.js'),'utf8');
  const patterns=source.match(/const REMOVED = \[([\s\S]*?)\];/)[1];
  assert.equal(Function('return ['+patterns+']')().some(p=>p.test('The code is open source under AGPL-3.0.')),false);
});
test('QA-11 roster omits deprecated TR factions',todo('QA-11'),async()=>{
  const l=await loader(),factions=await l.loadCatalog('tr','Factions');
  const html=renderToString(React.createElement(Roster,{factions,searchQuery:'',activeCategory:'all',character:{},joinedFactions:[]}));assert.doesNotMatch(text(html),/<Deprecated>/);
});
test('QA-11 relation display resolves IDs through published faction names',todo('QA-11'),async()=>{
  const l=await loader(),factions=await l.loadCatalog('tr','Factions');
  const faction=factions.find(f=>f.reactions?.some(r=>r.faction==='t_cyr_fightersguild'));
  assert.ok(faction,'actual published reaction record');
  const html=renderToString(React.createElement(Faction,{faction,factions,character:{attributes:{},skills:{}}}));assert.match(text(html),/Cyrodiil Fighters Guild/);assert.doesNotMatch(text(html),/T_cyr_fightersguild/i);
});
test('QA-20 Vanilla Fighters/Mages rank requirements displayed directly from catalog',async()=>{
  const l=await loader(),factions=await l.loadCatalog('vanilla','Factions');
  for(const key of ['fighters guild','mages guild']) {
    const faction=factions.find(f=>f.key===key);assert.ok(faction);
    const {solvePromotionGaps}=await import('../lib/faction-math.mjs');
    for(const rank of faction.ranks) {const result=solvePromotionGaps(faction,-1,{attributes:{},skills:{},reputation:0},rank.index);assert.deepEqual(result.targetRank,rank);assert.equal(result.reputation.required,rank.reputation);assert.deepEqual(result.attributes.map(a=>a.required),[rank.attribute1,rank.attribute2]);assert.equal(result.skills.primary.required,rank.primarySkill);assert.ok(result.skills.favoured.every(s=>s.required===rank.favouredSkill));}
  }
});
