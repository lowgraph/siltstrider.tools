const {test}=require('node:test');
const assert=require('node:assert/strict');
const math=()=>import('../lib/travel-map-labels.mjs');
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const label=(name,point,w=100,h=19)=>({name,point,w,h,lines:[name]});
function check(layout,width) {
  for(const l of layout.stops){assert.ok(l.box.x>=0&&l.box.x+l.box.w<=width);assert.ok(l.box.y>=0&&l.box.y+l.box.h<=layout.height);}
  for(let i=0;i<layout.stops.length;i++)for(let j=i+1;j<layout.stops.length;j++)assert.equal(hit(layout.stops[i].box,layout.stops[j].box),false);
}
test('QA-50: labels at either horizontal edge stay inside the map',async()=>{
  const {placeMapLabels}=await math();const points=[[1,40],[249,80]];
  const result=placeMapLabels(points.map((p,i)=>label(String(i),p,224)),points,250,150);
  check(result,250);assert.equal(result.stops.length,2);
});
test('QA-50: coincident arrival and departure stops get separate labels',async()=>{
  const {placeMapLabels}=await math();const points=Array.from({length:8},()=>[125,70]);
  const result=placeMapLabels(points.map((p,i)=>label(String(i),p,180)),points,250,150);
  check(result,250);assert.equal(result.stops.length,8);assert.ok(result.stops.some(s=>s.leader));
});
test('QA-50: a map filled with dots reserves callout rows instead of colliding',async()=>{
  const {placeMapLabels}=await math();const dots=[];for(let x=0;x<250;x+=10)for(let y=0;y<100;y+=10)dots.push([x,y]);
  const result=placeMapLabels([label('first',[10,10]),label('second',[20,20])],dots,250,100);
  check(result,250);assert.ok(result.height>100);assert.ok(result.stops.every(s=>s.box.y>=100&&s.leader));
});
test('QA-50: long place names wrap without dropping words or exceeding the width',async()=>{
  const {wrapMapLabel}=await math();const text='Vivec, Foreign Quarter · Boat arrival';const measure=s=>s.length*7;
  const lines=wrapMapLabel(text,100,measure);assert.ok(lines.length>1);assert.equal(lines.join(' '),text);
  assert.ok(lines.every(s=>measure(s)<=100));
});
test('QA-50: an oversized token wraps and every character remains',async()=>{
  const {wrapMapLabel}=await math();const text='unusuallylongunbrokenplace';const measure=s=>s.length*10;
  const lines=wrapMapLabel(text,50,measure);assert.equal(lines.join(''),text);assert.ok(lines.every(s=>measure(s)<=50));
});
test('QA-50: layout is deterministic, leaves inputs alone and supports no route labels',async()=>{
  const {placeMapLabels}=await math();const records=[label('a',[30,30])],dots=[[30,30]],before=structuredClone({records,dots});
  assert.deepEqual(placeMapLabels(records,dots,250,100),placeMapLabels(records,dots,250,100));assert.deepEqual({records,dots},before);
  assert.deepEqual(placeMapLabels([],[],250,100),{stops:[],boxes:[],height:100});
});
