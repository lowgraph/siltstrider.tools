const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
test('QA-36: map tracks the actual narrow panel width instead of scaling a 280 px minimum',async()=>{
  const Map=(await load('components/calculators/travel/transit-map.jsx')).default;
  let resize;global.ResizeObserver=class{constructor(fn){resize=fn}observe(){}disconnect(){}};
  try{await mount(Map,async()=>{
    for(const width of [210,275,390]){await React.act(async()=>resize([{contentRect:{width}}]));assert.equal(document.querySelector('svg[role="img"]').getAttribute('viewBox').split(' ')[2],String(width));}
  },{positions:{a:[0,0],b:[10,10]},edges:[]});}finally{delete global.ResizeObserver;}
});
test('QA-36: edge-region names reserve letter spacing and stay inside the map',async()=>{
  const Map=(await load('components/calculators/travel/transit-map.jsx')).default;
  await mount(Map,async()=>{
    const svg=document.querySelector('svg[role="img"]'),width=Number(svg.getAttribute('viewBox').split(' ')[2]);
    for(const t of svg.querySelectorAll('text[letter-spacing]')){const x=Number(t.getAttribute('x')),size=Number(t.getAttribute('font-size')),w=t.textContent.length*size*.7+t.textContent.length-1;assert.ok(x-w/2>=0&&x+w/2<=width);assert.ok(size>=12);}
    assert.match(svg.textContent,/AZURA'S COAST/);
  },{positions:{a:[0,0],b:[10,10]},edges:[],regions:[{key:'azura',name:"Azura's Coast",x:12,y:5}]});
});
test('QA-36: an empty map renders safely and one location uses a singular count',async()=>{
  const Map=(await load('components/calculators/travel/transit-map.jsx')).default;
  await mount(Map,async()=>assert.equal(document.querySelector('.transit-map'),null),{positions:{},edges:[]});
  await mount(Map,async()=>assert.match(document.querySelector('.transit-map-count').textContent,/1 mapped location · 0 connections/),{positions:{a:[0,0]},edges:[]});
});
