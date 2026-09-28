const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('retired runtime, bridges and test API cannot ship again',()=>{
 for(const file of ['index.html','archive/legacy','cloudflare/test-route.mjs'])assert.equal(fs.existsSync(file),false,file);
 function inspect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);if(entry.isDirectory()){inspect(file);continue;}
  if(!/\.(jsx?|mjs|cjs)$/.test(file))continue;
  const text=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(text,/(?:from\s*|require\()["'][^"']*archive\/legacy/,file);
  assert.doesNotMatch(text,/window\.(?:siltCharacters|siltShell|siltAlchemyRuntime|makeBuildProfile|optimizeGear)\b/,file);
 }}
 for(const dir of ['components','lib','scripts','cloudflare'])inspect(dir);
 assert.equal(require('../package.json').scripts['dev:legacy'],undefined);
});
test('version 1 site saves are rejected by both current cloud readers',async()=>{
 const c=await import('../lib/cloud-save-codec.mjs');
 const packed=c.packCloudSave(c.SAVE_TYPES.CHARACTER_BUILD,{version:1,world:'vanilla',arce:false,maj:[],min:[]}).packed;
 const old=packed.slice();old[4]=1;
 assert.equal(c.FORMAT_VERSION,2);
 assert.throws(()=>c.unpackCloudSave(old),/Unsupported SLT1 format version/);
 await assert.rejects(c.unpackCloudSaveAsync(old),/Unsupported SLT1 format version/);
});
test('full current build snapshots are required, not optional extensions',async()=>{
 const c=await import('../lib/cloud-save-codec.mjs');const bytes=c.serializeCharacterBuild({version:1,maj:[],min:[]});
 for(const missing of [1,2,4])assert.throws(()=>c.deserializeCharacterBuild(bytes.subarray(0,bytes.length-missing)));
});

test('prototype retirement removes only an empty table and refuses populated databases',()=>{
 const {execFileSync}=require('node:child_process');
 const script=String.raw`
import sqlite3, pathlib, json
root=pathlib.Path('cloudflare/migrations')
for populated in (False, True):
    con=sqlite3.connect(':memory:')
    for p in sorted(root.glob('*.sql')):
        if p.name.startswith('0006'): continue
        con.executescript(p.read_text(encoding='utf-8-sig'))
    if populated:
        con.execute("INSERT INTO saved_characters(id,clerk_user_id,name,character_json,created_at,updated_at) VALUES(?,?,?,?,?,?)",('test','owner','Test',json.dumps({'version':1}),'now','now'))
        con.commit()
    try:
        con.executescript((root/'0006_remove_empty_prototype.sql').read_text(encoding='utf-8-sig'))
        assert not populated
    except sqlite3.IntegrityError:
        assert populated
        assert con.execute('SELECT count(*) FROM saved_characters').fetchone()[0]==1
    if not populated:
        assert con.execute("SELECT count(*) FROM sqlite_master WHERE name IN ('saved_characters','_prototype_retirement_guard')").fetchone()[0]==0
    assert con.execute("SELECT count(*) FROM sqlite_master WHERE name='cloud_saves'").fetchone()[0]==1
print('OK')
`;
 assert.match(execFileSync('python',['-c',script],{encoding:'utf8'}),/OK/);
});
