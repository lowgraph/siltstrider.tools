/** Copy an already-built bundle into public assets. Never runs an extractor. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {sameBundleManifest} from '../lib/bundle-manifest.mjs';
import {createBundleLoader} from '../lib/bundle-loader.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2] || 'A:/Cache/OpenMWFoundation/app-bundle');
const target=path.join(project,'public/game-data');
const origin='https://local-bundle.invalid/';
const loader=createBundleLoader({baseUrl:origin,crypto:webcrypto,cacheStorage:null,fetcher:async url=>{
 const relative=decodeURIComponent(new URL(url).pathname).slice(1),file=path.resolve(source,relative);
 if(!file.startsWith(source+path.sep))throw new Error('Bundle path escaped source');
 return new Response(await fs.readFile(file));
}});
const manifest=await loader.manifest();
// Validate identities, every hash, and delta reconstruction before publishing.
for(const p of manifest.profiles)for(const name of manifest.catalogs)await loader.loadCatalog(p.id,name);
await fs.mkdir(target,{recursive:true});
const destination=path.join(target,manifest.bundleId);
try{await fs.access(destination);}catch{
 const stage=await fs.mkdtemp(path.join(target,'.staging-'));
 try{
  for(const p of manifest.profiles)for(const entry of Object.values(p.files)){
   const dest=path.join(stage,entry.path);await fs.mkdir(path.dirname(dest),{recursive:true});
   await fs.copyFile(path.join(source,manifest.bundleId,entry.path),dest);
  }
  await fs.writeFile(path.join(stage,'manifest.json'),JSON.stringify(manifest));
  await fs.rename(stage,destination);
 }catch(error){await fs.rm(stage,{recursive:true,force:true});throw error;}
}
// Confirm any existing destination is complete too before switching the pointer.
for(const p of manifest.profiles)for(const f of Object.values(p.files)){
 const data=await fs.readFile(path.join(destination,f.path));
 const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',data)).toString('hex');
 if(data.length!==f.bytes||hash!==f.sha256)throw new Error('Existing staged bundle differs: '+f.path);
}
const stagedManifest=JSON.parse(await fs.readFile(path.join(destination,'manifest.json'),'utf8'));
if(!sameBundleManifest(stagedManifest,manifest))throw new Error('Existing manifest differs');
const pointer={bundleId:manifest.bundleId,snapshotId:manifest.snapshotId,manifest:manifest.bundleId+'/manifest.json'};
const temporary=path.join(target,'.current-'+process.pid+'.tmp');
await fs.writeFile(temporary,JSON.stringify(pointer));await fs.rename(temporary,path.join(target,'current.json'));
console.log('Validated and staged bundle '+manifest.bundleId+' ('+manifest.profiles.map(p=>p.id).join(', ')+')');
