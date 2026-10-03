const {test}=require('node:test');const assert=require('node:assert/strict');
const {load,React,mount}=require('./helpers/launch-render.cjs');
const {renderToStaticMarkup}=require('react-dom/server');const {JSDOM}=require('jsdom');
const faction={key:'redoran',name:'Great House Redoran',favouredAttributes:['strength','endurance'],skills:['long_blade'],ranks:[{index:0,name:'Hireling',attribute1:30,attribute2:30,primarySkill:0,favouredSkill:0,reputation:0}]};
const qualified={attributes:{strength:40,endurance:40},skills:{long_blade:40}};

async function roster(props={}) {
  const Roster=(await load('components/journal-factions/faction-roster.jsx')).default;
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Roster,{factions:[faction],activeCategory:'all',character:qualified,...props})));
  const text=dom.window.document.querySelector('.faction-roster-item').textContent;dom.window.close();return text;
}
for(const key of ['redoran','telvanni','hlaalu'])test(`QA-45: eligible ${key} with a rival displays only the membership restriction`,async()=>{
  const rival=key==='hlaalu'?'redoran':'hlaalu';
  const text=await roster({factions:[{...faction,key}],joinedFactions:[{id:rival,rank:0}]});
  assert.match(text,/Rival Joined/);assert.doesNotMatch(text,/Eligible to Join|Unqualified/);
});
test('QA-45: an unqualified rival still displays the restriction rather than conflicting status badges',async()=>{
  const text=await roster({character:{},joinedFactions:[{id:'HLAALU',rank:0}]});
  assert.match(text,/Rival Joined/);assert.doesNotMatch(text,/Eligible to Join|Unqualified/);
});
test('QA-45: imported conflicting memberships retain their member badge without a new restriction',async()=>{
  const joined=Object.freeze([{id:'hlaalu',rank:0},{id:'redoran',rank:0}].map(Object.freeze)),before=JSON.stringify(joined);
  const text=await roster({joinedFactions:joined});assert.match(text,/Member · Hireling/);assert.doesNotMatch(text,/Rival Joined|Eligible to Join/);assert.equal(JSON.stringify(joined),before);
});
test('QA-45: an unrelated guild leaves ordinary eligible and unqualified House status available',async()=>{
  const props={joinedFactions:[{id:'mages guild',rank:0}]};
  assert.match(await roster(props),/Eligible to Join/);assert.match(await roster({...props,character:{}}),/Unqualified/);
});

for(const [profile,label] of [['vanilla','Vanilla'],['tr','Tamriel Rebuilt'],['tr_arce','TR + ARCE']])test(`QA-45: Alchemy displays ${label} without changing ${profile}'s catalog identity`,async()=>{
  const data={profile,catalogs:{Attributes:[],Skills:[],Ingredients:[],Apparatus:[],MagicEffects:[],EffectRules:[],GameSettings:['fPotionStrengthMult','iAlchemyMod','fPotionT1MagMult','fPotionT1DurMult'].map(key=>({key:key.toLowerCase(),value:1}))}};
  const before=JSON.stringify(data);
  const Alchemy=(await load('components/calculators/alchemy/alchemy-workstation.jsx',{
    '../../character-context':{useActiveCharacter:()=>({build:{},sheet:{}})},'../../shell-context':{useShell:()=>({profile})},
    '../../use-game-data':{useGameData:()=>({status:'ready',data})},'../../use-search-intent':{useSearchIntent:()=>null},
    '../../active-character-link':require('./helpers/active-character-link.cjs'),
    './ingredient-combobox':require('./helpers/ingredient-combobox.cjs'),'./reverse-alchemy':require('./helpers/reverse-alchemy.cjs'),
    './ingredient-sources':{__esModule:true,default:()=>null},
  })).default;
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Alchemy)));
  const badge=[...dom.window.document.querySelectorAll('span')].find(s=>s.textContent.startsWith('Live:')).textContent;
  assert.ok(badge.includes(`(${label})`),badge);assert.doesNotMatch(badge,/TR_ARCE/);assert.equal(JSON.stringify(data),before);dom.window.close();
});

test('QA-45: pair-order help defines shared extra effects and combined base value beside results',async()=>{
  const Reverse=require('./helpers/reverse-alchemy.cjs').default;
  const ingredients=Object.freeze(['a','b'].map((id,i)=>Object.freeze({id,n:id,v:i+1,effects:[{id:'75',n:'Restore Health'}]})));
  await mount(Reverse,async()=>{
    await React.act(async()=>{
      const input=document.getElementById('reverse-alchemy-search');
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Restore Health');
      input.dispatchEvent(new window.Event('input',{bubbles:true}));
    });
    await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Restore Health').click());
    const help=document.querySelector('.reverse-alchemy-order-help')?.textContent||'';
    assert.match(help,/Additional effects are other potion effects shared by both ingredients/);
    assert.match(help,/Ingredient value is their combined base gold value.*not a shop price/s);
    assert.match(help,/fewer additional effects come first/);assert.equal(document.querySelectorAll('.reverse-alchemy-pair').length,1);
  },{ingredients,onUsePair(){}});
});

test('QA-45: Gear Advisor calls its current skill-based match the closest archetype',async()=>{
  const {GearAdvisorView}=await load('components/character-builder/gear-advisor.jsx',{
    '../account-settings-context':{useAccountSettings:()=>({ready:false})},'../shell-context':{useShell:()=>({profile:'vanilla'})},
    '../use-game-data':{useGameData:()=>({status:'idle'})},'./gear-sources':{GearSourcesView:()=>null},'./best-in-slot-view':{BestInSlotView:()=>null},
  });
  const build={race:'Nord',spec:'Combat',maj:['Heavy Armor','Long Blade'],min:['Block']};
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(GearAdvisorView,{build,result:{status:'idle'},bisResult:{status:'idle'}})));
  const header=dom.window.document.querySelector('#gear-advisor > div > div > p').textContent;
  assert.match(header,/closest archetype: Melee Tank \/ Warrior/);assert.doesNotMatch(header,/\(Melee Tank \/ Warrior archetype\)/);dom.window.close();
});
