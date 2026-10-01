const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {createHash} = require('node:crypto');
const {staged, loader} = require('./helpers/qa-staged-data.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'silt-qa-portability-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const write = (file, value) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
  };
  return {root, write};
}

test('QA portability skips only missing staged pointers and retains TODO metadata', t => {
  const {root} = fixture(t), options = {todo:'QA-11 not fixed yet', timeout:1000};
  assert.match(staged(options, root).skip, /no staged game bundle/);
  assert.equal(staged(options, root).todo, options.todo);
  assert.equal(staged(options, root).timeout, 1000);
  assert.deepEqual(options, {todo:'QA-11 not fixed yet', timeout:1000});
  assert.match(staged({}, path.join(root, 'no-data-directory')).skip, /no staged game bundle/);
});

test('QA portability never skips a malformed staged pointer', async t => {
  const {root, write} = fixture(t);
  write('current.json', '{broken');
  assert.deepEqual(staged({}, root), {});
  await assert.rejects((await loader(root)).loadCatalog('vanilla', 'Factions'), SyntaxError);
});

test('QA portability never skips a pointer whose manifest is missing', async t => {
  const {root, write} = fixture(t);
  write('current.json', {bundleId:'abcdef', snapshotId:'qa', manifest:'abcdef/manifest.json'});
  assert.equal(staged({}, root).skip, undefined);
  await assert.rejects((await loader(root)).loadCatalog('vanilla', 'Factions'), {code:'ENOENT'});
});

test('QA portability runs staged checks and rejects missing or corrupted catalog payloads', async t => {
  const {root, write} = fixture(t), bundleId = 'abcdef', snapshotId = 'qa';
  const profile = {id:'vanilla', world:'vanilla', version:'1', arce:false};
  const payload = {schemaVersion:'1.0.0', snapshotId, profile, catalog:'Factions', kind:'full', records:[{key:'qa', name:'QA – Fixture'}]};
  const body = JSON.stringify(payload);
  write('current.json', {bundleId, snapshotId, manifest:bundleId+'/manifest.json'});
  write(bundleId+'/manifest.json', {schemaVersion:'1.0.0', bundleId, snapshotId, catalogs:['Factions'], profiles:[{
    ...profile, base:null, inherits:[], files:{Factions:{path:'vanilla/Factions.json', bytes:Buffer.byteLength(body), sha256:createHash('sha256').update(body).digest('hex'), records:1, kind:'full'}}
  }]});
  assert.deepEqual(staged({}, root), {});
  await assert.rejects((await loader(root)).loadCatalog('vanilla', 'Factions'), {code:'ENOENT'});
  write(bundleId+'/vanilla/Factions.json', body);
  assert.deepEqual(await (await loader(root)).loadCatalog('vanilla', 'Factions'), payload.records);
  write(bundleId+'/vanilla/Factions.json', body.replace('Fixture', 'Corrupt'));
  assert.equal(staged({}, root).skip, undefined);
  await assert.rejects((await loader(root)).loadCatalog('vanilla', 'Factions'), /hash mismatch/);
});
