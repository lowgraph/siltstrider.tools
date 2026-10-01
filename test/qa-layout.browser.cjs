/* Explicit browser evidence wrapper: run the Chrome qa suite first, then pass its
 * report with QA_BROWSER_REPORT. Kept out of npm test because it needs a server.
 * QA-08 and QA-09 are enforced regressions. */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
if(!process.env.QA_BROWSER_REPORT) throw Error('Set QA_BROWSER_REPORT to the newly generated Chrome qa report.json');
const report=JSON.parse(fs.readFileSync(process.env.QA_BROWSER_REPORT,'utf8'));
for(const phase of ['Early','Late']) for(const width of [375,390,1366]) test(`QA-08 ${phase} at ${width}: readable sources, runner-ups and table layout`,()=>{
  const samples=report.observations.filter(o=>o.id==='QA-08'&&o.phase===phase&&o.width===width);assert.equal(samples.length,6,'three worlds in both themes measured');
  assert.equal(new Set(samples.map(s=>s.profile+'/'+s.theme)).size,6,'distinct world/theme combinations');
  for(const sample of samples) {
    assert.ok(sample.tables.length);
    if(phase==='Late')assert.ok(sample.tables.some(t=>t.rows.some(r=>r.runnerUp)),'runner-ups measured');
    for(const t of sample.tables) {
      assert.ok(t.box.x>=0&&t.box.right<=width+1);assert.deepEqual(t.brokenWords,[]);assert.deepEqual(t.overflowWords,[]);
      assert.ok(t.rows.length);assert.ok(t.rows.every(r=>width<=640?r.stacked:r.columns));
      if(width<=640)assert.ok(t.rows.every(r=>r.sourceLabel.includes(phase==='Early'?'Where':'Acquisition & Location')));
      assert.ok(sample.accessibleTables.includes(t.name),'table semantics preserved');
    }
  }
});
for(let index=0;index<5;index++) test(`QA-09 Configure popover ${index+1}: bounds, resize, pointer and keyboard`,()=>{
  const samples=report.observations.filter(o=>o.id==='QA-09'&&o.index===index);assert.equal(samples.length,6,'375/390/1366, both themes');
  assert.equal(new Set(samples.map(s=>s.width+'/'+s.theme)).size,6);
  for(const s of samples){assert.equal(s.positions.length,6);for(const p of s.positions){const v=p.visible;assert.ok(p.linked);assert.ok(p.box.x>=v.left&&p.box.y>=v.top&&p.box.right<=v.right+1&&p.box.bottom<=v.bottom,JSON.stringify(p));}}
});
