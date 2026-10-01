const {test}=require('node:test');const assert=require('node:assert/strict');
const {loader,staged}=require('./helpers/qa-staged-data.cjs');
for(const field of ['race','gender','sign','spec','fav1','maj','bitterCup']) test(`QA-05 edited premade labels its source after ${field}`,async()=>{
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {characterName}=await import('../lib/character-name.mjs');
  const build=premadeToBuild(BUILDS[0]);assert.equal(characterName(build),build.name);
  const values={race:'Breton',gender:'Male',sign:'The Tower',spec:'Combat',fav1:'Luck',maj:[...build.maj].reverse(),bitterCup:true};
  assert.notDeepEqual(values[field],build[field],'test actually edits the choice');
  assert.equal(characterName({...build,[field]:values[field]}),`Based on ${build.name}`);
  assert.equal(characterName({...build,[field]:values[field],name:'QA Player'}),'QA Player');
});
test('QA-05 premade source survives build links, sanitizing and cloud snapshots',async()=>{
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {generateBuildShareUrl,sanitizeBuild}=await import('../lib/character-vault.mjs');
  const {decodeShareUrl}=await import('../lib/permalink-codec.mjs');const {characterName}=await import('../lib/character-name.mjs');
  const c=await import('../lib/cloud-save-codec.mjs');
  const build={...premadeToBuild(BUILDS[0],{world:'tr',arce:true}),race:'Breton',gender:'Female',sign:'The Tower'};
  const link=sanitizeBuild(decodeShareUrl(generateBuildShareUrl(build),'http://qa.invalid').build);
  assert.equal(link.premadeSource,build.premadeSource);assert.equal(characterName(link),`Based on ${build.name}`);
  const saved=c.unpackCloudSave(c.packCloudSave(c.SAVE_TYPES.CHARACTER_BUILD,build).packed).data;
  assert.deepEqual(saved,build);assert.equal(characterName(sanitizeBuild(saved)),characterName(build));
});
test('QA-05 malformed source markers and legacy player names stay names',async()=>{
  const {characterName}=await import('../lib/character-name.mjs');const {sanitizeBuild}=await import('../lib/character-vault.mjs');
  const build={name:'Imperial Agent',race:'Breton',gender:'Female',sign:'The Tower'};
  for(const premadeSource of [undefined,null,42,{},'Unknown premade','<script>']) {
    assert.equal(characterName({...build,premadeSource}),build.name);
    assert.equal(Object.hasOwn(sanitizeBuild({...build,premadeSource}),'premadeSource'),false);
  }
});
for(const [profile,race,sign,gender] of [['vanilla','Breton','The Tower','Female'],['tr','Nord','The Mage','Male'],['tr_arce','Khajiit (Cathay-raht)','The Thief','Female']]) test(`QA-05 sheet identity survives normalization and progression in ${profile}`,staged(),async()=>{
  const l=await loader();const {adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs');
  const catalogs=adaptCharacterCatalogs(await l.loadFeature(profile,'character'),await l.loadCatalog(profile,'Spells'));
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {computeSheet}=await import('../lib/character-math.mjs');
  const {normalizeCharacterState,simulateProgression}=await import('../lib/level-math.mjs');
  const build={...premadeToBuild(BUILDS[0]),race,sign,gender,className:'QA Class',spec:'Stealth',fav1:'Speed',fav2:'Luck'};
  const sheet=computeSheet(build,catalogs);assert.ok(sheet);
  const normalized=normalizeCharacterState(sheet,catalogs);
  for(const state of [normalized,normalizeCharacterState(normalized,catalogs),simulateProgression(normalized,{catalogs,targetLevel:3,mode:'stats_only'}).finalState]) {
    assert.deepEqual([state.race,state.gender,state.sign,state.className,state.spec,state.fav1,state.fav2],[race,gender,sign,'QA Class','Stealth','Speed','Luck']);
  }
});
