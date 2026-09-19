/** Canonical catalog -> existing alchemy UI. Formula rules remain authored. */
export function adaptAlchemy(data,legacyEffects=[]){
  const c=data.catalogs;
  const attrs=new Map(c.Attributes.map(r=>[r.id,r.name]));
  const skills=new Map(c.Skills.map(r=>[r.skill,r.name]));
  const effects=Object.fromEntries(c.MagicEffects.map(r=>{
    const rule=legacyEffects.find(e=>e.n===r.name);
    return [r.key,{...rule,n:r.name,b:r.baseCost,supported:!!rule&&Number.isFinite(r.baseCost)&&r.baseCost>0,source:r}];
  }));
  const counts=new Map();for(const r of c.Ingredients)counts.set(r.name,(counts.get(r.name)||0)+1);
  const ingredients=c.Ingredients.map(r=>{
    const ordered=Array(4).fill(null);
    for(const e of r.effects){
      if(!Number.isInteger(e.slot)||e.slot<0||e.slot>3||ordered[e.slot])throw Error('Invalid ingredient effect slot: '+r.key);
      const effect=effects[String(e.effectId)];if(!effect)throw Error('Missing effect '+e.effectId);
      const arg=e.attribute!=null?attrs.get(e.attribute):e.skill!=null?skills.get(e.skill):'';
      if(arg===undefined)throw Error('Unknown effect target: '+r.key);
      ordered[e.slot]={id:String(e.effectId),n:effect.n,arg};
    }
    return {id:r.key,n:counts.get(r.name)>1?`${r.name} [${r.key}]`:r.name,v:r.value,w:r.weight,effects:ordered,source:r};
  }).sort((a,b)=>a.n.localeCompare(b.n)||a.id.localeCompare(b.id));
  const apparatus={mortar:[],alembic:[],calcinator:[],retort:[]};
  for(const r of c.Apparatus){
    const type=r.type==='mortar_and_pestle'?'mortar':r.type;
    if(!apparatus[type])throw Error('Unknown apparatus type '+r.type);
    apparatus[type].push({id:r.key,n:r.name,q:r.quality,w:r.weight,v:r.value,source:r});
  }
  const settings={};
  for(const name of ['fPotionStrengthMult','iAlchemyMod','fPotionT1MagMult','fPotionT1DurMult']){
    const r=c.GameSettings.find(r=>r.key===name.toLowerCase());
    if(!r||!Number.isFinite(r.value)||r.value<=0)throw Error('Invalid alchemy setting '+name);
    settings[name]=r.value;
  }
  return {...data,ingredients,apparatus,effects,settings};
}
