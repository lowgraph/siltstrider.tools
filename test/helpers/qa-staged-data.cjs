const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../public/game-data');
// Skip only an absent pointer. Once staged, malformed or incomplete bundles
// must still reach the loader and fail their integrity/behaviour assertions.
exports.staged = (options = {}, dataRoot = root) => {
  try {
    fs.statSync(path.join(dataRoot, 'current.json'));
    return {...options};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return {...options, skip: 'no staged game bundle (run npm run data:stage)'};
  }
};
exports.loader = async (dataRoot = root) => {
  const {createBundleLoader} = await import('../../lib/bundle-loader.mjs');
  return createBundleLoader({baseUrl:'http://qa.invalid/game-data/',cacheStorage:null,
    fetcher:async url => new Response(fs.readFileSync(path.join(dataRoot,new URL(url).pathname.replace('/game-data/',''))))});
};
exports.todo = id => process.env.QA_UNMARK_TODOS === '1' ? {} : {todo:`${id} not fixed yet`};
exports.save = () => {
  const skills = ['Block','Armorer','MediumArmor','HeavyArmor','BluntWeapon','LongBlade','Axe','Spear','Athletics','Enchant','Destruction','Alteration','Illusion','Conjuration','Mysticism','Restoration','Alchemy','Unarmored','Security','Sneak','Acrobatics','LightArmor','ShortBlade','Marksman','Mercantile','Speechcraft','HandToHand'];
  const attrs = ['Strength','Intelligence','Willpower','Agility','Speed','Endurance','Personality','Luck'];
  return {formatVersion:37,contentFiles:['Morrowind.esm','Tribunal.esm','Bloodmoon.esm'],
    identity:{name:'QA Traveller',race:'Breton',gender:'Male',birthsign:'The Lady',level:3,cell:'Seyda Neen',class:{id:'mage',name:null,custom:false,specialization:null,favoredAttributes:[]}},
    vitals:{health:{current:45,max:45},magicka:{current:40,max:40},fatigue:{current:100,max:100},gold:50,reputation:0,bounty:0,timePlayedSeconds:1234},
    build:{skillKindSource:null,attributes:attrs.map((id,index)=>({id,index,base:40,modifier:0,damage:0,value:40})),skills:skills.map((id,index)=>({id,index,base:40,modifier:0,damage:0,value:40,progress:0,kind:'Misc'}))},
    progress:{quests:[],otherJournalIds:[],factions:[{id:'Mages Guild',rank:0,reputation:0,expelled:false}]},
    stuff:{inventory:[{id:'sc_divineintervention',count:1,soul:null,equipped:false,slot:null}],spells:['almsivi intervention']},warnings:[]};
};
