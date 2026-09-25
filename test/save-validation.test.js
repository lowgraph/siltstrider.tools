const {test}=require('node:test'); const assert=require('node:assert/strict');
const base=()=>({identity:{level:2},stuff:{inventory:[]}});
test('reject malformed faction collection',async()=>{const {validateSave}=await import('../lib/omwsave-import.mjs'); assert.throws(()=>validateSave({...base(),progress:{factions:{}}}),/factions/);});
test('reject null inventory entries and nonfinite stats',async()=>{const {validateSave}=await import('../lib/omwsave-import.mjs'); assert.throws(()=>validateSave({...base(),stuff:{inventory:[null]}})); assert.throws(()=>validateSave({...base(),build:{attributes:[{base:Infinity}]}}));});
test('preserve valid modded data',async()=>{const {validateSave}=await import('../lib/omwsave-import.mjs');const s={...base(),progress:{factions:[{id:'mod',rank:0}]}}; assert.equal(validateSave(s),s);});
