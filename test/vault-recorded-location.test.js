const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load}=require('./helpers/launch-render.cjs');const {renderToStaticMarkup}=require('react-dom/server');
for(const location of ['Balmora, Guild of Mages','Mournhold, Royal Palace','Old Ebonheart'])test(`F-12: card consumes the API's recorded ${location} and saved class name`,async()=>{
  const {packCloudSave,extractCloudSaveMetadata}=await import('../lib/cloud-save-codec.mjs');const raw=require('./helpers/qa-staged-data.cjs').save();
  raw.identity.cell=location;raw.identity.class={id:'qa-class',name:'QA – Saved Mage',custom:true};
  const packed=packCloudSave('openmw_save',raw);const record=extractCloudSaveMetadata('openmw_save',raw,packed.packed);
  assert.equal(record.cell,location);assert.equal(record.cell_name,undefined);
  const Card=(await load('components/character-vault/cloud-vault-card.jsx',{'../confirmation-dialog':()=>null,'../use-game-data':{getGameDataLoader(){}}})).default;
  const html=renderToStaticMarkup(React.createElement(Card,{save:{...record,id:'qa-record'}}));
  assert.ok(html.includes(location));assert.ok(html.includes('QA – Saved Mage'));assert.ok(!html.includes('Vvardenfell'));
});
test('F-12: API cell takes precedence, legacy aliases work, and missing or malformed locations are not invented',async()=>{
  const Card=(await load('components/character-vault/cloud-vault-card.jsx',{'../confirmation-dialog':()=>null,'../use-game-data':{getGameDataLoader(){}}})).default;
  for(const [data,expected] of [[{cell:'Mournhold',cell_name:'Wrong legacy value'},'Mournhold'],[{cell_name:'Balmora'},'Balmora'],[{cell:''},'Not recorded'],[{cell:null},'Not recorded'],[{cell:{},cell_name:7},'Not recorded'],[{cell:'  '},'Not recorded']]){
    const html=renderToStaticMarkup(React.createElement(Card,{save:{id:'qa-record',save_type:'character_build',...data}}));
    assert.ok(html.includes(expected));assert.ok(!html.includes('Vvardenfell'));assert.ok(!html.includes('Wrong legacy value'));
  }
});
