const {test}=require('node:test');const assert=require('node:assert/strict');
const {load,React}=require('./helpers/launch-render.cjs');const {renderToStaticMarkup}=require('react-dom/server');
async function render(positions,extra={}){
  const Map=(await load('components/calculators/travel/transit-map.jsx')).default;
  return renderToStaticMarkup(React.createElement(Map,{positions,edges:[],...extra}));
}
test('UI-05 one town is one mapped location even when routing stops are grouped',async()=>{
  const html=await render({Balmora:[0,0]});assert.match(html,/1 mapped location · 0 connections/);assert.match(html,/group stops in the same town/);assert.doesNotMatch(html,/1 stops/);
});
test('UI-05 selected route points add map locations without claiming more routing stops',async()=>{
  const positions={Balmora:[0,0],'place:room':[1,1]};
  const html=await render(positions,{unplaced:['Missing position']});assert.match(html,/2 mapped locations/);assert.match(html,/routing stops without a map position/);assert.match(html,/Not on the map: Missing position/);assert.deepEqual(Object.keys(positions),['Balmora','place:room']);
});
test('UI-05 no positioned locations produces no fabricated map count',async()=>{
  assert.equal(await render({}, {unplaced:['Missing']}),'');
});
