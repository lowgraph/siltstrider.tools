const {test}=require('node:test');const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const {Faction}=require('./helpers/qa-render.cjs');
for(const count of [0,1,10])test(`QA-38: faction detail correctly labels ${count} ranks`,()=>{
  const ranks=Array.from({length:count},(_,index)=>Object.freeze({index,name:'Member'}));
  const faction=Object.freeze({key:'qa',name:'QA faction',ranks:Object.freeze(ranks),skills:[],favouredAttributes:[],reactions:[]});
  const out=renderToStaticMarkup(React.createElement(Faction,{faction,character:{attributes:{},skills:{}}}));
  if(count===0)assert.match(out,/Non-Joinable/);else assert.match(out,new RegExp(`>${count} ${count===1?'rank':'ranks'}<`));
  assert.doesNotMatch(out,/>1 ranks</);
});
