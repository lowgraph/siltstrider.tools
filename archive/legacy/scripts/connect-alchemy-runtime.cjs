const acorn=require('acorn');
module.exports=function connectAlchemy(runtime){
 const begin=runtime.indexOf('(function setupAlchemy() {'),end=runtime.indexOf('(function setupTravel()',begin);
 if(begin<0||end<0)throw Error('Alchemy boundary missing');
 let source=runtime.slice(begin,end).replaceAll('\r\n','\n');
 const ast=acorn.parse(source,{ecmaVersion:'latest'});
 const body=ast.body[0].expression.callee.body.body;
 for(const n of [...body].reverse())if(n.type==='VariableDeclaration'&&['INGREDIENTS','INGREDIENTS_TR','APPA'].includes(n.declarations[0].id.name))source=source.slice(0,n.start)+source.slice(n.end);
 function replace(from,to){if(!source.includes(from))throw Error('Alchemy integration anchor missing: '+from.slice(0,60));source=source.replace(from,to);}
 replace('(function setupAlchemy() {','(function setupAlchemy() {\n      let catalog=null;\n      const APPA={mortar:[],alembic:[],calcinator:[],retort:[]};\n      const escapeAlchemy=s=>String(s).replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;", "\'":"&#39;"}[c]));');
 for(const n of ['fPotionStrengthMult','iAlchemyMod','fPotionT1MagMult','fPotionT1DurMult'])replace('const '+n+' =','let '+n+' =');
 replace('o.value = String(t.q);','o.value = String(t.q); o.dataset.itemId=t.id;');
 replace('function effectMeta(name) {','function effectMeta(key) {\n        return catalog.effects[key.id];\n      }\n      function unusedLegacyEffectMeta(name) {');
 replace('return String(eff.n) + "\\0" + String(eff.arg || "");','return String(eff.id) + "\\0" + String(eff.arg || "");');
 replace('return { n: e.n, arg: e.arg || "" };','return { id:e.id,n: e.n, arg: e.arg || "" };');
 replace('if (!out) return;','if (!out) return;\n        if(!catalog){out.textContent="Loading alchemy data...";return;}');
 replace('const e = effectMeta(key.n);','const e = effectMeta(key);\n          if(!e?.supported){lines.push(key.n+": calculation rule unavailable");return;}');
 replace('lines.join("<br>")','lines.map(escapeAlchemy).join("<br>")');
 replace('return ing.effects.map((e) => "- " + effectLine(e)).join("<br>");','return ing.effects.filter(Boolean).map((e) => "- " + escapeAlchemy(effectLine(e))).join("<br>");');
 replace('return trWorldOn() ? INGREDIENTS.concat(INGREDIENTS_TR) : INGREDIENTS;','return catalog?.ingredients || [];');
 replace('const keys = (a.effects || []).map(effectKey);','const keys = (a.effects || []).filter(Boolean).map(effectKey);');
 replace('return (ing.effects || []).some((e) => keys.indexOf(effectKey(e)) >= 0);','return (ing.effects || []).filter(Boolean).some((e) => keys.indexOf(effectKey(e)) >= 0);');
 const marker='      window.__alcOnWorldChange = function () {';
 const start=source.indexOf(marker),stop=source.indexOf('      fillSlots();\n      updatePotion();\n    })();',start);
 if(start<0||stop<0)throw Error('Alchemy lifecycle missing');
 source=source.slice(0,start)+`
      function clearCatalog(){
        catalog=null;
        document.getElementById('alc-slots')?.replaceChildren();
        for(const id of ['alc-mortar','alc-alembic','alc-calcinator','alc-retort','alc-match-first']){const el=document.getElementById(id);if(el)el.disabled=true;}
        updatePotion();
      }
      window.siltAlchemyRuntime={clear:clearCatalog,install(data){
        const selected={};
        for(const type of Object.keys(APPA)){const el=document.getElementById('alc-'+type);selected[type]=el?.selectedOptions[0]?.dataset.itemId || '';}
        catalog=data;
        for(let i=0;i<slots.length;i++)slots[i]=data.ingredients.find(r=>r.id===slots[i]?.id)||null;
        for(const type of Object.keys(APPA)){
          fillAppa('alc-'+type,data.apparatus[type],type==='mortar',selected[type]||(type==='mortar'?'apparatus_j_mortar_01':''));
          document.getElementById('alc-'+type).disabled=false;
        }
        document.getElementById('alc-match-first').disabled=false;
        ({fPotionStrengthMult,iAlchemyMod,fPotionT1MagMult,fPotionT1DurMult}=data.settings);
        fillSlots();updatePotion();
      }};
      window.__alcOnWorldChange=()=>{const profile=trWorldOn()?(arceOn?'tr_arce':'tr'):'vanilla';if(catalog?.profile!==profile)clearCatalog();};
      clearCatalog();
    })();
    `;
 const obsolete=acorn.parse(source,{ecmaVersion:'latest'}).body[0].expression.callee.body.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='unusedLegacyEffectMeta');
 if(obsolete)source=source.slice(0,obsolete.start)+source.slice(obsolete.end);
 return runtime.slice(0,begin)+source+runtime.slice(end);
};
