const {spawnSync}=require('node:child_process');
const key=process.env.SILT_PRODUCTION_CLERK_PUBLISHABLE_KEY || '';
if(key && !/^pk_live_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Production requires a Clerk live publishable key');
// Do not bake the localhost Clerk development instance into the public release.
const env={...process.env,SILT_STATIC_EXPORT:'1',CLERK_PUBLISHABLE_KEY:key,NEXT_TELEMETRY_DISABLED:'1'};
for(const args of [['scripts/extract-legacy.cjs'],['node_modules/next/dist/bin/next','build']]) {
  const result=spawnSync(process.execPath,args,{stdio:'inherit',env});
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status || 1);
}
