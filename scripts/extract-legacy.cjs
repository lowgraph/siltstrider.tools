const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const acorn = require('acorn');
const ROOT = path.resolve(__dirname, '..');
const digest = value => crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
function literal(node) {
  if (!node) return true;
  if (node.type === 'Literal') return !node.regex;
  if (node.type === 'UnaryExpression') return ['-','+','!','~'].includes(node.operator) && literal(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.every(literal);
  if (node.type === 'ObjectExpression') return node.properties.every(p => p.type === 'Property' && !p.computed && !p.method && !p.shorthand && p.kind === 'init' && literal(p.value));
  return false;
}
function extract(html) {
  const assets = new Map();
  const replaced = html.replace(/data:((?:font|image|application)\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)/g, (uri, mime, encoded) => {
    const extensions = {'font/ttf':'ttf','font/woff':'woff','font/woff2':'woff2','application/font-woff':'woff','image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'};
    if (!extensions[mime]) throw new Error('Unrecognized embedded asset: '+mime);
    const bytes = Buffer.from(encoded,'base64');
    const name = digest(bytes)+'.'+extensions[mime];
    assets.set(name,bytes);
    return '/legacy/assets/'+name;
  });
  const scripts = [...replaced.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const styles = [...replaced.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  if (scripts.length!==1 || scripts[0][1].trim()) throw new Error('Expected one inline classic script');
  const source=scripts[0][2];
  const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'});
  const declarations=ast.body.filter(n=>n.type==='VariableDeclaration' && n.declarations.every(d=>d.id.type==='Identifier' && d.init && literal(d.init)) && n.end-n.start>=1000);
  let runtime=source;
  for (const n of [...declarations].reverse()) runtime=runtime.slice(0,n.start)+'\n/* Literal data moved to legacy-data.js. */\n'+runtime.slice(n.end);
  const data=declarations.map(n=>source.slice(n.start,n.end)).join('\n\n');
  let body=replaced.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  if (!body) throw new Error('Missing body');
  // Header controls are now React-owned. Legacy lookups retain null guards.
  const {JSDOM}=require('jsdom');
  const dom=new JSDOM(body);
  const topbar=dom.window.document.querySelector('header .topbar');
  if(!topbar) throw new Error('Expected legacy topbar');
  const slot=dom.window.document.createElement('div');slot.id='react-header-slot';
  topbar.replaceWith(slot);
  const warn=dom.window.document.createElement('p');warn.id='world-warn';warn.className='muted';warn.hidden=true;slot.after(warn);
  body=dom.window.document.body.innerHTML;dom.window.close();
  for(const id of ['btn-world-vanilla','btn-world-tr','btn-arce']) {
    const lookup='document.getElementById("'+id+'").addEventListener';
    if(!runtime.includes(lookup))throw new Error('Missing profile listener '+id);
    runtime=runtime.replace(lookup,'document.getElementById("'+id+'")?.addEventListener');
  }
  runtime=require('./connect-character-runtime.cjs')(runtime);
  runtime+='\n'+fs.readFileSync(path.join(ROOT,'migration/shell-bridge.js'),'utf8');
  runtime+='\n'+fs.readFileSync(path.join(ROOT,'migration/character-bridge.js'),'utf8');
  const css=styles.map(s=>s[1]).join('\n').replaceAll('#btn-world-tr','#react-world-tr').replaceAll('#btn-arce','#react-arce').replaceAll('#btn-challenge','#react-nav-challenge').replaceAll('#btn-build','#react-nav-build');
  return {body,runtime,data,css,assets,
    manifest:{sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),revision:crypto.createHash('sha256').update(body+runtime+data+css).digest('hex'),tables:declarations.flatMap(n=>n.declarations.map(d=>d.id.name)),assetCount:assets.size}};
}
function write() {
  const result=extract(fs.readFileSync(path.join(ROOT,'index.html'),'utf8'));
  const dir=path.join(ROOT,'public/legacy');
  fs.mkdirSync(path.join(dir,'assets'),{recursive:true});
  fs.mkdirSync(path.join(ROOT,'migration/generated'),{recursive:true});
  fs.writeFileSync(path.join(dir,'legacy-data.js'),result.data);
  fs.writeFileSync(path.join(dir,'legacy-runtime.js'),result.runtime);
  fs.writeFileSync(path.join(dir,'legacy.css'),result.css);
  for(const [name,bytes] of result.assets) fs.writeFileSync(path.join(dir,'assets',name),bytes);
  fs.writeFileSync(path.join(ROOT,'migration/generated/body.json'),JSON.stringify(result.body));
  fs.writeFileSync(path.join(ROOT,'migration/generated/manifest.json'),JSON.stringify(result.manifest,null,2));
  console.log(JSON.stringify({...result.manifest,bodyBytes:Buffer.byteLength(result.body),dataBytes:Buffer.byteLength(result.data),runtimeBytes:Buffer.byteLength(result.runtime)},null,2));
}
if(require.main===module) write();
module.exports={extract};
