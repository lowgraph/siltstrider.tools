/* Explicit browser evidence wrapper: run the Chrome qa suite first, then pass its
 * report with QA_BROWSER_REPORT. Kept out of npm test because it needs a server.
 * QA-08 is enforced; QA_UNMARK_TODOS=1 exposes the remaining QA-09 failures. */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {todo}=require('./helpers/qa-staged-data.cjs');
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
for(let index=0;index<5;index++) test(`QA-09 Configure popover ${index+1} within phone viewport`,index===0?{}:todo('QA-09'),()=>{
  const samples=report.observations.filter(o=>o.id==='QA-09'&&o.index===index);assert.equal(samples.length,4,'375/390, both themes');
  for(const s of samples) assert.ok(s.box.x>=0&&s.box.y>=0&&s.box.right<=s.width+1&&s.box.bottom<=Math.min(s.height,s.barTop??s.height),JSON.stringify(s));
});
