const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load,React}=require('./helpers/launch-render.cjs');
const {renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');

async function render(positions,extra={}) {
  const Map=(await load('components/calculators/travel/transit-map.jsx')).default;
  return new JSDOM(renderToStaticMarkup(React.createElement(Map,{positions,edges:[],...extra}))).window.document;
}

test('QA-42: a north–south gap is explained outside map labels without moving route stops',async()=>{
  const positions={Balmora:[0,0],Thirsk:[0,78]};
  const d=await render(positions,{route:{isValid:true,path:['Balmora','Thirsk']},origin:'Balmora',destination:'Thirsk'});
  assert.doesNotMatch(d.querySelector('svg[role=img]').textContent,/≈78 cells/);
  assert.match(d.querySelector('.transit-map-gaps').textContent,/≈78 cells north–south/);
  assert.match(d.querySelector('svg[role=img]').getAttribute('aria-label'),/Balmora to Thirsk/);
  assert.deepEqual(positions,{Balmora:[0,0],Thirsk:[0,78]});
});

test('QA-42: horizontal and multiple compressed gaps remain individually described',async()=>{
  const d=await render({A:[0,0],B:[78,0],C:[160,100]});
  assert.doesNotMatch(d.querySelector('svg[role=img]').textContent,/≈\d+ cells/);
  const text=d.querySelector('.transit-map-gaps').textContent;
  assert.match(text,/≈78 cells east–west/);
  assert.match(text,/≈82 cells east–west/);
  assert.match(text,/≈100 cells north–south/);
});

test('QA-42: ordinary and empty networks never invent a compressed gap',async()=>{
  for(const positions of [{},{A:[0,0]},{A:[0,0],B:[24,24]}]) {
    const d=await render(positions);
    assert.equal(d.querySelector('.transit-map-gaps'),null);
  }
});
